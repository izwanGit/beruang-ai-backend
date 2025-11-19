const util = require('util');

// --- CRITICAL FIX FOR NODE v23+ ---
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);

const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 1234;

app.use(express.json());

const MODEL_PATH = 'file://' + path.resolve('./model/model.json');
const METADATA_PATH = path.resolve('./model/metadata.json');

let model;
let metadata;
let validWords = [];

// --- Levenshtein Distance (Fuzzy Matching) ---
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// --- Auto-Correct Logic ---
function autoCorrect(tokens, wordIndex) {
  return tokens.map(word => {
    // If word exists in vocab, keep it
    if (wordIndex[word]) return word;
    // Don't correct short words or numbers
    if (word.length < 4) return word; 

    // Find closest match
    let bestMatch = word;
    let minDist = Infinity;

    // Only check words that start with the same letter to speed up
    const candidates = validWords.filter(w => w.startsWith(word[0]));

    for (const candidate of candidates) {
      const dist = levenshtein(word, candidate);
      // Allow 1 error for words < 6 chars, 2 errors for longer
      const threshold = word.length > 6 ? 2 : 1;
      
      if (dist <= threshold && dist < minDist) {
        minDist = dist;
        bestMatch = candidate;
      }
    }
    return bestMatch;
  });
}

async function loadModel() {
  try {
    console.log('Loading model...');
    model = await tf.loadLayersModel(MODEL_PATH);
    metadata = await fs.readJson(METADATA_PATH);
    
    // Cache valid words for auto-correct
    validWords = Object.keys(metadata.wordIndex);
    
    console.log('✓ Model and metadata loaded successfully!');
  } catch (error) {
    console.error('FATAL: Could not load model:', error);
  }
}

function preprocess(text, wordIndex, maxLen, maxVocabSize) {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  let tokens = cleanText.split(' ').filter(t => t.trim() !== '');
  
  // 1. Apply Auto-Correct
  const correctedTokens = autoCorrect(tokens, wordIndex);
  console.log(`Original: "${tokens.join(' ')}" -> Corrected: "${correctedTokens.join(' ')}"`);

  // 2. Convert to Sequence
  const sequence = correctedTokens.map(word => {
    const index = wordIndex[word];
    return (index && index < maxVocabSize) ? index : 1; // 1 is <UNK>
  });

  // 3. Pad
  if (sequence.length > maxLen) {
    return sequence.slice(0, maxLen);
  }
  const pad = new Array(maxLen - sequence.length).fill(0);
  return [...pad, ...sequence];
}

app.post('/predict', async (req, res) => {
  try {
    if (!model || !metadata) return res.status(503).json({ error: 'Model loading...' });

    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'No description provided' });

    const { wordIndex, maxLen, maxVocabSize, categoryIndex, subcategoryIndex } = metadata;
    
    // Preprocess (includes Auto-Correct)
    const sequence = preprocess(description, wordIndex, maxLen, maxVocabSize);
    
    // --- FALLBACK LOGIC: "If I know nothing, go WANTS/OTHERS" ---
    // Count how many valid words (not 0 padding, not 1 UNK) we found
    const validTokenCount = sequence.filter(t => t > 1).length;
    
    if (validTokenCount === 0) {
      console.log("Unknown input detected. Defaulting to WANTS -> Others");
      return res.json({
        input: description,
        prediction: {
          category: "WANTS",
          subcategory: "Others",
          confidence: { category: "0.00%", subcategory: "0.00%" },
          note: "Fallback triggered (Unknown words)"
        }
      });
    }

    const inputTensor = tf.tensor2d([sequence], [1, maxLen], 'int32');
    const predictions = model.predict(inputTensor);
    
    const catPred = Array.isArray(predictions) ? predictions[0] : predictions;
    const subPred = Array.isArray(predictions) ? predictions[1] : null;

    const catData = catPred.dataSync();
    const subData = subPred.dataSync();

    const catIdx = catData.indexOf(Math.max(...catData));
    const subIdx = subData.indexOf(Math.max(...subData));

    const category = categoryIndex[String(catIdx)] || categoryIndex[catIdx] || 'Unknown';
    const subcategory = subcategoryIndex[String(subIdx)] || subcategoryIndex[subIdx] || 'Unknown';
    
    const catConf = (catData[catIdx] * 100).toFixed(2);
    const subConf = (subData[subIdx] * 100).toFixed(2);

    inputTensor.dispose();
    catPred.dispose();
    subPred.dispose();

    res.json({
      input: description,
      prediction: {
        category: category.toUpperCase(),
        subcategory: subcategory,
        confidence: {
          category: `${catConf}%`,
          subcategory: `${subConf}%`
        }
      }
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Prediction failed', details: error.message });
  }
});

app.listen(PORT, async () => {
  await loadModel();
  console.log(`Server running on http://localhost:${PORT}`);
});
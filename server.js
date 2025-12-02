const util = require('util');
// Fix for Node v23+ compatibility
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);

const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 1234;

app.use(express.json());

// --- CONFIGURATION ---
const TRANS_MODEL_PATH = 'file://' + path.resolve('./model_transaction/model.json');
const TRANS_METADATA_PATH = path.resolve('./model_transaction/metadata.json');

const INTENT_MODEL_PATH = 'file://' + path.resolve('./model_intent/model.json');
const INTENT_METADATA_PATH = path.resolve('./model_intent/metadata.json');

// --- GLOBAL VARIABLES ---
let transModel, transMetadata;
let intentModel, intentMetadata;

// --- HELPER: Levenshtein Distance (Fuzzy Matching) ---
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
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// --- HELPER: Auto-Correct Logic ---
function autoCorrect(tokens, wordIndex) {
  const validWords = Object.keys(wordIndex);
  return tokens.map(word => {
    if (wordIndex[word]) return word;
    if (word.length < 4) return word; 

    let bestMatch = word;
    let minDist = Infinity;
    const candidates = validWords.filter(w => w.startsWith(word[0]));

    for (const candidate of candidates) {
      const dist = levenshtein(word, candidate);
      const threshold = word.length > 6 ? 2 : 1;
      
      if (dist <= threshold && dist < minDist) {
        minDist = dist;
        bestMatch = candidate;
      }
    }
    return bestMatch;
  });
}

// --- HELPER: Text Preprocessing ---
function preprocess(text, metadata) {
  const { wordIndex, maxLen, maxVocabSize } = metadata;
  
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  let tokens = cleanText.split(' ').filter(t => t.trim() !== '');
  
  // Apply Auto-Correct
  const correctedTokens = autoCorrect(tokens, wordIndex);
  
  // Convert to Sequence
  const sequence = correctedTokens.map(word => {
    const index = wordIndex[word];
    return (index && index < maxVocabSize) ? index : 1; // 1 is <UNK>
  });

  // Pad
  if (sequence.length > maxLen) {
    return sequence.slice(0, maxLen);
  }
  const pad = new Array(maxLen - sequence.length).fill(0);
  return [...pad, ...sequence];
}

// ★★★ NEW: Multi-Layer OOD Detection System ★★★
function detectOOD(message, sequence, predictions, metadata) {
  const reasons = [];
  
  // Layer 1: Input Quality Check
  const validTokens = sequence.filter(t => t > 1).length; // Non-padding, non-UNK
  if (validTokens === 0) {
    reasons.push('No recognized words');
    return { isOOD: true, reasons, confidence: 0 };
  }
  
  const unkRatio = sequence.filter(t => t === 1).length / sequence.filter(t => t > 0).length;
  if (unkRatio > 0.6) {
    reasons.push(`${(unkRatio * 100).toFixed(0)}% unknown words`);
  }
  
  // Layer 2: Length Check
  const tokens = message.toLowerCase().split(' ').filter(t => t.trim() !== '');
  if (tokens.length > 15) {
    reasons.push('Query too long (complex)');
  }
  
  // Layer 3: Prediction Confidence Analysis
  const predData = predictions.dataSync();
  const maxConf = Math.max(...predData);
  const maxIdx = predData.indexOf(maxConf);
  
  // Get predicted intent name
  const intentIndexReverse = metadata.intentIndex;
  const predictedIntent = intentIndexReverse[String(maxIdx)] || intentIndexReverse[maxIdx];
  
  // Layer 4: Per-Class Threshold Check
  const thresholds = metadata.confidenceThresholds || {};
  const classThreshold = thresholds[predictedIntent] || metadata.globalThreshold || 0.80;
  
  if (maxConf < classThreshold) {
    reasons.push(`Confidence ${(maxConf * 100).toFixed(1)}% < threshold ${(classThreshold * 100).toFixed(1)}%`);
  }
  
  // Layer 5: Entropy Check (measures uncertainty)
  const entropy = -predData.reduce((sum, p) => {
    return sum + (p > 0 ? p * Math.log(p) : 0);
  }, 0);
  const maxEntropy = Math.log(predData.length);
  const normalizedEntropy = entropy / maxEntropy;
  
  if (normalizedEntropy > 0.7) {
    reasons.push(`High uncertainty (entropy: ${normalizedEntropy.toFixed(2)})`);
  }
  
  // Layer 6: Second-Best Gap Check
  const sorted = [...predData].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  
  if (gap < 0.15) {
    reasons.push(`Low confidence gap (${(gap * 100).toFixed(1)}%)`);
  }
  
  // Decision: Is it OOD?
  const isOOD = reasons.length >= 2 || maxConf < classThreshold;
  
  return { 
    isOOD, 
    reasons, 
    confidence: maxConf,
    entropy: normalizedEntropy,
    gap: gap,
    predictedIntent: predictedIntent
  };
}

// --- MODEL LOADER ---
async function loadModels() {
  try {
    console.log('------------------------------------------------');
    console.log('🤖 INITIALIZING BERUANG AI BRAIN...');
    
    // Load Transaction Model
    if (fs.existsSync(TRANS_METADATA_PATH)) {
      transModel = await tf.loadLayersModel(TRANS_MODEL_PATH);
      transMetadata = await fs.readJson(TRANS_METADATA_PATH);
      console.log('✅ Transaction Model Loaded (Ready to categorize expenses)');
    } else {
      console.warn('⚠ Transaction Model MISSING. Run: npm run train:transaction');
    }

    // Load Intent Model
    if (fs.existsSync(INTENT_METADATA_PATH)) {
      intentModel = await tf.loadLayersModel(INTENT_MODEL_PATH);
      intentMetadata = await fs.readJson(INTENT_METADATA_PATH);
      console.log('✅ Intent Model Loaded (Ready to chat)');
      console.log(`   - Loaded ${Object.keys(intentMetadata.intentIndex).length} intents`);
      console.log(`   - Global threshold: ${(intentMetadata.globalThreshold * 100).toFixed(0)}%`);
    } else {
      console.warn('⚠ Intent Model MISSING. Run: npm run gen:intent && npm run train:intent');
    }
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('FATAL: Model loading error:', error);
  }
}

// ==========================================
// ROUTE 1: PREDICT TRANSACTION
// ==========================================
app.post('/predict-transaction', async (req, res) => {
  try {
    if (!transModel || !transMetadata) return res.status(503).json({ error: 'Transaction Model not loaded' });

    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'No description provided' });

    const { categoryIndex, subcategoryIndex, maxLen } = transMetadata;
    const sequence = preprocess(description, transMetadata);
    
    // Fallback Check: If input is garbage or unknown
    const validTokenCount = sequence.filter(t => t > 1).length;
    if (validTokenCount === 0) {
      console.log(`[Transaction] Fallback triggered for: "${description}"`);
      return res.json({
        input: description,
        prediction: {
          category: "WANTS",
          subcategory: "Others",
          confidence: { category: "0.00%", subcategory: "0.00%" },
          note: "Fallback triggered"
        }
      });
    }

    const inputTensor = tf.tensor2d([sequence], [1, maxLen], 'int32');
    const predictions = transModel.predict(inputTensor);
    
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
    if(subPred) subPred.dispose();

    console.log(`[Transaction] "${description}" -> ${category}/${subcategory} (${catConf}%)`);

    res.json({
      input: description,
      prediction: {
        category: category.toUpperCase(),
        subcategory: subcategory,
        confidence: { category: `${catConf}%`, subcategory: `${subConf}%` }
      }
    });

  } catch (error) {
    console.error('Trans Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROUTE 2: PREDICT INTENT (ENHANCED WITH OOD)
// ==========================================
app.post('/predict-intent', async (req, res) => {
  try {
    if (!intentModel || !intentMetadata) {
      return res.status(503).json({ error: 'Intent Model not loaded' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // ★★★ SAFETY LAYER 1: KEYWORD GUARDRAILS (Pre-Model Filter) ★★★
    const RED_FLAGS = [
      'invest', 'crypto', 'stock', 'debt', 'loan', 'buy', 'sell', 
      'salary', 'finance', 'money', 'budget', 'save for', 'afford',
      'survive', 'bank', 'insurance', 'tax', 'profit', 'loss', 'worth',
      'bitcoin', 'gold', 'property', 'car', 'house', 'wedding',
      'unrealistic', 'opinion', 'thoughts', 'compare', 'pros and cons'
    ];
    
    // Check for question starters + red flags
    const COMPLEX_STARTERS = ['why', 'how', 'what if', 'should i', 'can i', 'explain', 'tell me about'];
    const lowerMsg = message.toLowerCase();
    const hasComplexStarter = COMPLEX_STARTERS.some(s => lowerMsg.startsWith(s));
    const hasRedFlag = RED_FLAGS.some(flag => lowerMsg.includes(flag));

    if ((hasComplexStarter && hasRedFlag) || (hasRedFlag && lowerMsg.split(' ').length > 5)) {
      console.log(`[Intent] 🛡️ PRE-FILTER: Red flag combo detected in "${message}". → GROK`);
      return res.json({
        input: message,
        prediction: {
          intent: 'COMPLEX_ADVICE',
          confidence: '100.00%',
          reason: 'Pre-filter: Complex query detected',
          debug: { trigger: 'keyword_guard' }
        }
      });
    }

    // ★★★ SAFETY LAYER 2: MODEL PREDICTION + OOD DETECTION ★★★
    const { maxLen } = intentMetadata;
    const sequence = preprocess(message, intentMetadata);

    const inputTensor = tf.tensor2d([sequence], [1, maxLen], 'int32');
    const prediction = intentModel.predict(inputTensor);
    
    // Analyze prediction with OOD detector
    const oodAnalysis = detectOOD(message, sequence, prediction, intentMetadata);
    
    const predData = prediction.dataSync();
    const maxIdx = predData.indexOf(Math.max(...predData));
    const { intentIndex } = intentMetadata;
    const predictedIntent = intentIndex[String(maxIdx)] || intentIndex[maxIdx] || 'UNKNOWN';
    const confidence = (predData[maxIdx] * 100).toFixed(2);

    inputTensor.dispose();
    prediction.dispose();

    // ★★★ DECISION LOGIC ★★★
    let finalIntent = predictedIntent;
    let logMsg = `[Intent] "${message}" -> ${predictedIntent} (${confidence}%)`;

    if (oodAnalysis.isOOD) {
      finalIntent = 'COMPLEX_ADVICE';
      logMsg += ` -> 🚫 OOD DETECTED: ${oodAnalysis.reasons.join(', ')} → GROK`;
    } else {
      logMsg += ` -> ✅ LOCAL REPLY (passed OOD checks)`;
    }
    
    console.log(logMsg);

    res.json({
      input: message,
      prediction: {
        intent: finalIntent,
        original_intent: predictedIntent,
        confidence: `${confidence}%`,
        ood_analysis: {
          is_ood: oodAnalysis.isOOD,
          reasons: oodAnalysis.reasons,
          entropy: oodAnalysis.entropy?.toFixed(3),
          gap: oodAnalysis.gap?.toFixed(3)
        }
      }
    });

  } catch (error) {
    console.error('Intent Error:', error);
    // Safe fallback
    res.json({ 
      prediction: { 
        intent: 'COMPLEX_ADVICE',
        reason: 'Error occurred, routing to Grok for safety'
      } 
    });
  }
});

// ==========================================
// ROUTE 3: HEALTH CHECK
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    models: {
      transaction: !!transModel,
      intent: !!intentModel
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  await loadModels();
  console.log(`🚀 Unified AI Server running on http://localhost:${PORT}`);
  console.log(`   - POST /predict-transaction`);
  console.log(`   - POST /predict-intent (with OOD detection)`);
  console.log(`   - GET  /health`);
});
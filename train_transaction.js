const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
util.isArray = Array.isArray;

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

// --- CONFIG ---
const DATASET_PATH = './dataset.csv';
// CRITICAL: Must save to 'model_transaction' so server.js can find it
const MODEL_SAVE_PATH = 'file://./model_transaction';
const METADATA_SAVE_PATH = './model_transaction/metadata.json';

const MAX_VOCAB_SIZE = 5000; 
const MAX_LEN = 30; 
const VALIDATION_SPLIT = 0.2;

// --- GLOBALS ---
const data = [];
const wordIndex = { '<UNK>': 1 };
let wordCounter = 2;
let validWords = []; // For auto-correct reference

const categoryIndex = {};
const subcategoryIndex = {};

// --- UTILS: LEVENSHTEIN & AUTOCORRECT (Robustness you requested) ---
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

function autoCorrect(tokens) {
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

// --- DATA LOADING ---
async function loadData() {
  console.log('Loading Transaction Dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATASET_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const description = row.description?.toLowerCase().replace(/[^a-z0-9\s]/g, '') || '';
        const category = row.category ? row.category.trim() : '';
        const subcategory = row.subcategory ? row.subcategory.trim() : '';

        if (!description || !category || !subcategory) return;

        data.push({ description, category, subcategory });

        description.split(' ').forEach((word) => {
          if (word && !wordIndex[word] && wordCounter < MAX_VOCAB_SIZE) {
               wordIndex[word] = wordCounter++;
          }
        });
      })
      .on('end', () => {
        if (data.length < 2) return reject(new Error('Dataset too small.'));

        [...new Set(data.map(r => r.category))].sort().forEach((c, i) => categoryIndex[c] = i);
        [...new Set(data.map(r => r.subcategory))].sort().forEach((s, i) => subcategoryIndex[s] = i);
        
        validWords = Object.keys(wordIndex);

        console.log(`Dataset loaded. Samples: ${data.length}, Vocab: ${wordCounter}`);
        resolve();
      })
      .on('error', reject);
  });
}

// --- VECTORIZATION ---
function buildOneHotTensor(indices, depth) {
  const buffer = tf.buffer([indices.length, depth], 'float32');
  indices.forEach((c, i) => buffer.set(1, i, c));
  return buffer.toTensor();
}

function vectorizeSamples(samples) {
  const sequences = samples.map(row => {
    // Apply robust logic during training vectorization
    let tokens = row.description.split(' ');
    // tokens = autoCorrect(tokens); // Uncomment if you want to force correction during training
    return tokens.map(w => wordIndex[w] || 1).slice(0, MAX_LEN);
  });

  const padded = sequences.map(seq => {
    const pad = new Array(MAX_LEN - seq.length).fill(0);
    return [...pad, ...seq];
  });

  return {
    x: tf.tensor2d(padded, [samples.length, MAX_LEN], 'int32'),
    yCategory: buildOneHotTensor(samples.map(r => categoryIndex[r.category]), Object.keys(categoryIndex).length),
    ySubcategory: buildOneHotTensor(samples.map(r => subcategoryIndex[r.subcategory]), Object.keys(subcategoryIndex).length)
  };
}

// --- METRICS ---
function getAccuracies(model, xTensor, yCategoryTensor, ySubcategoryTensor) {
  const predictions = model.predict(xTensor);
  const categoryPred = predictions[0];
  const subcategoryPred = predictions[1];

  const categoryAccuracyTensor = tf.metrics.categoricalAccuracy(yCategoryTensor, categoryPred).mean();
  const subcategoryAccuracyTensor = tf.metrics.categoricalAccuracy(ySubcategoryTensor, subcategoryPred).mean();

  const catAcc = categoryAccuracyTensor.dataSync()[0];
  const subAcc = subcategoryAccuracyTensor.dataSync()[0];

  categoryPred.dispose();
  subcategoryPred.dispose();
  categoryAccuracyTensor.dispose();
  subcategoryAccuracyTensor.dispose();

  return { catAcc, subAcc };
}

// --- MODEL DEFINITION ---
function createModel() {
  const input = tf.input({ shape: [MAX_LEN] });
  let x = tf.layers.embedding({ inputDim: MAX_VOCAB_SIZE, outputDim: 128, inputLength: MAX_LEN }).apply(input);
  
  // Robust Bidirectional LSTM
  x = tf.layers.bidirectional({ layer: tf.layers.lstm({ units: 64, returnSequences: false }) }).apply(x);
  
  x = tf.layers.dropout({ rate: 0.4 }).apply(x);
  x = tf.layers.dense({ units: 64, activation: 'relu', kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }) }).apply(x);
  x = tf.layers.dropout({ rate: 0.3 }).apply(x);
  
  const catOut = tf.layers.dense({ units: Object.keys(categoryIndex).length, activation: 'softmax', name: 'category_output' }).apply(x);
  const subOut = tf.layers.dense({ units: Object.keys(subcategoryIndex).length, activation: 'softmax', name: 'subcategory_output' }).apply(x);

  const model = tf.model({ inputs: input, outputs: [catOut, subOut] });
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: ['categoricalCrossentropy', 'categoricalCrossentropy'],
    lossWeights: [0.1, 0.9],
    metrics: ['accuracy']
  });
  return model;
}

// --- EVALUATION (Verbose) ---
function evaluateModel(model, trainData, valData) {
  console.log('\n--- Final Evaluation ---');
  const xAll = tf.concat([trainData.x, valData.x], 0);
  const yCategoryAll = tf.concat([trainData.yCategory, valData.yCategory], 0);
  const ySubcategoryAll = tf.concat([trainData.ySubcategory, valData.ySubcategory], 0);

  const { catAcc, subAcc } = getAccuracies(model, xAll, yCategoryAll, ySubcategoryAll);

  console.log(`Overall Category Accuracy: ${(catAcc * 100).toFixed(2)}%`);
  console.log(`Overall Subcategory Accuracy: ${(subAcc * 100).toFixed(2)}%`);

  xAll.dispose();
  yCategoryAll.dispose();
  ySubcategoryAll.dispose();
}

// --- MAIN LOOP ---
async function main() {
  await loadData();
  tf.util.shuffle(data);
  const splitIdx = Math.floor(data.length * VALIDATION_SPLIT);
  const trainData = vectorizeSamples(data.slice(splitIdx));
  const valData = vectorizeSamples(data.slice(0, splitIdx));

  const model = createModel();
  
  console.log('\nStarting Training (Verbose Mode)...');
  
  let bestValSubAcc = 0;
  let patience = 0;
  let bestWeights = null;

  await model.fit(trainData.x, [trainData.yCategory, trainData.ySubcategory], {
    epochs: 50, 
    batchSize: 64,
    validationData: [valData.x, [valData.yCategory, valData.ySubcategory]],
    shuffle: true,
    verbose: 0, // We use custom logging below
    callbacks: {
        onEpochEnd: async (epoch, logs) => {
            const { catAcc, subAcc } = getAccuracies(model, valData.x, valData.yCategory, valData.ySubcategory);
            
            // FULL VERBOSE LOGGING RESTORED
            console.log(
                `Epoch ${String(epoch + 1).padStart(2, '0')} | ` +
                `Loss: ${logs.loss.toFixed(4)} | ` +
                `Train Acc: ${(logs['subcategory_output_accuracy']*100).toFixed(1)}% | ` +
                `Val Acc: ${(subAcc*100).toFixed(1)}%`
            );

            if (subAcc > bestValSubAcc) {
                bestValSubAcc = subAcc;
                patience = 0;
                if (bestWeights) bestWeights.forEach(w => w.dispose());
                bestWeights = model.getWeights().map(w => w.clone());
                console.log(`   ★ New Best Accuracy!`);
            } else {
                patience++;
                if (patience >= 8) {
                    console.log(`   ⚠ Early Stopping triggered.`);
                    model.stopTraining = true;
                }
            }
        }
    }
  });

  if (bestWeights) {
      console.log('Restoring best weights...');
      model.setWeights(bestWeights);
  }

  evaluateModel(model, trainData, valData);

  // ENSURE DIRS EXIST
  await fs.ensureDir('./model_transaction');
  
  await model.save(MODEL_SAVE_PATH);
  
  // SAVE METADATA
  await fs.writeJson(METADATA_SAVE_PATH, { 
    wordIndex, maxLen: MAX_LEN, maxVocabSize: MAX_VOCAB_SIZE, 
    categoryIndex: Object.fromEntries(Object.entries(categoryIndex).map(([k, v]) => [v, k])),
    subcategoryIndex: Object.fromEntries(Object.entries(subcategoryIndex).map(([k, v]) => [v, k]))
  });
  console.log('✅ Transaction Model Saved successfully to ./model_transaction');
}

main();
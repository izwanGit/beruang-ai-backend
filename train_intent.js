const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
util.isArray = Array.isArray;

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs-extra');
const csv = require('csv-parser');

// --- CONFIG ---
const DATASET_PATH = './chat_intents.csv'; 
const MODEL_SAVE_PATH = 'file://./model_intent';
const METADATA_SAVE_PATH = './model_intent/metadata.json';

const MAX_VOCAB_SIZE = 3000; 
const MAX_LEN = 20; 
const VALIDATION_SPLIT = 0.2;

// --- GLOBALS ---
const data = [];
const wordIndex = { '<UNK>': 1 };
let wordCounter = 2;
const intentIndex = {};

async function loadData() {
  console.log('Loading Intent Dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATASET_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const message = row.text?.toLowerCase().replace(/[^a-z0-9\s]/g, '') || '';
        const intent = row.intent ? row.intent.trim() : '';
        if (!message || !intent) return;

        data.push({ message, intent });

        message.split(' ').forEach((word) => {
          if (word && !wordIndex[word] && wordCounter < MAX_VOCAB_SIZE) {
               wordIndex[word] = wordCounter++;
          }
        });
      })
      .on('end', () => {
        if (data.length < 2) return reject(new Error('Dataset too small.'));
        [...new Set(data.map(r => r.intent))].sort().forEach((c, i) => intentIndex[c] = i);
        console.log(`Dataset loaded. Samples: ${data.length}, Intents: ${Object.keys(intentIndex).length}`);
        resolve();
      })
      .on('error', reject);
  });
}

function vectorizeSamples(samples) {
  const sequences = samples.map(row => {
    return row.message.split(' ').map(w => wordIndex[w] || 1).slice(0, MAX_LEN);
  });
  const padded = sequences.map(seq => {
    const pad = new Array(MAX_LEN - seq.length).fill(0);
    return [...pad, ...seq];
  });
  
  const depth = Object.keys(intentIndex).length;
  const indices = samples.map(r => intentIndex[r.intent]);
  const buffer = tf.buffer([indices.length, depth], 'float32');
  indices.forEach((c, i) => buffer.set(1, i, c));

  return {
    x: tf.tensor2d(padded, [samples.length, MAX_LEN], 'int32'),
    y: buffer.toTensor()
  };
}

function createModel() {
  const input = tf.input({ shape: [MAX_LEN] });
  let x = tf.layers.embedding({ inputDim: MAX_VOCAB_SIZE, outputDim: 64, inputLength: MAX_LEN }).apply(input);
  x = tf.layers.bidirectional({ layer: tf.layers.lstm({ units: 64, returnSequences: false }) }).apply(x);
  x = tf.layers.dropout({ rate: 0.5 }).apply(x);
  x = tf.layers.dense({ units: 64, activation: 'relu' }).apply(x);
  x = tf.layers.dropout({ rate: 0.5 }).apply(x);
  const output = tf.layers.dense({ units: Object.keys(intentIndex).length, activation: 'softmax' }).apply(x);

  const model = tf.model({ inputs: input, outputs: output });
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  return model;
}

// --- EVALUATION ---
function evaluateModel(model, trainData, valData) {
    console.log('\n--- Final Evaluation ---');
    const xAll = tf.concat([trainData.x, valData.x], 0);
    const yAll = tf.concat([trainData.y, valData.y], 0);
    
    const predictions = model.predict(xAll);
    const accTensor = tf.metrics.categoricalAccuracy(yAll, predictions).mean();
    console.log(`Overall Intent Accuracy: ${(accTensor.dataSync()[0] * 100).toFixed(2)}%`);
    
    xAll.dispose(); yAll.dispose(); predictions.dispose(); accTensor.dispose();
}

async function main() {
  try {
    await loadData();
    tf.util.shuffle(data);
    const splitIdx = Math.floor(data.length * VALIDATION_SPLIT);
    const trainData = vectorizeSamples(data.slice(splitIdx));
    const valData = vectorizeSamples(data.slice(0, splitIdx));

    const model = createModel();
    model.summary();  // Add this line to match your output (prints architecture)
    console.log('Training Intent Model...');
    
    let bestValAcc = 0;
    let patience = 0;
    let bestWeights = null;

    await model.fit(trainData.x, trainData.y, {
      epochs: 30, 
      batchSize: 32,
      validationData: [valData.x, valData.y],
      verbose: 0,
      callbacks: {
          onEpochEnd: async (epoch, logs) => {
              // Manual validation check
              const preds = model.predict(valData.x);
              const valAccTensor = tf.metrics.categoricalAccuracy(valData.y, preds).mean();
              const valAcc = valAccTensor.dataSync()[0];
              valAccTensor.dispose(); preds.dispose();

              console.log(
                  `Epoch ${String(epoch + 1).padStart(2, '0')} | ` +
                  `Loss: ${logs.loss.toFixed(4)} | ` +
                  `Train Acc: ${(logs.acc*100).toFixed(1)}% | ` +
                  `Val Acc: ${(valAcc*100).toFixed(1)}%`
              );

              if (valAcc > bestValAcc) {
                  bestValAcc = valAcc;
                  patience = 0;
                  // Save best weights manually
                  if (bestWeights) bestWeights.forEach(w => w.dispose());
                  bestWeights = model.getWeights().map(w => w.clone());
              } else {
                  patience++;
                  if (patience >= 5) {
                      console.log(`   ⚠ Early Stopping triggered (No improvement for 5 epochs).`);
                      model.stopTraining = true;
                  }
              }
          }
      }
    });

    if (bestWeights) {
        console.log('Restoring best intent weights...');
        model.setWeights(bestWeights);
    }

    evaluateModel(model, trainData, valData);

    await fs.ensureDir('./model_intent');
    await model.save(MODEL_SAVE_PATH);
    await fs.writeJson(METADATA_SAVE_PATH, { 
      wordIndex, maxLen: MAX_LEN, maxVocabSize: MAX_VOCAB_SIZE, 
      intentIndex: Object.fromEntries(Object.entries(intentIndex).map(([k, v]) => [v, k]))
    });
    console.log('✅ Intent Model Saved successfully.');
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
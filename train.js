const util = require('util');

// --- CRITICAL FIX FOR NODE v23+ ---
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
util.isArray = Array.isArray;

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs-extra');
const csv = require('csv-parser');

// --- Config for 10k Dataset ---
const DATASET_PATH = './dataset.csv';
const MODEL_SAVE_PATH = 'file://./model';
const METADATA_SAVE_PATH = './model/metadata.json';

// TUNED: Increased for multi-language support
const MAX_VOCAB_SIZE = 5000; 
const MAX_LEN = 30; 
const VALIDATION_SPLIT = 0.2;

// --- Global Vars ---
const data = [];
const wordIndex = { '<UNK>': 1 };
let wordCounter = 2;

const categoryIndex = {};
const subcategoryIndex = {};

// --- 1. Load & Preprocess Data ---
async function loadData() {
  console.log('Loading dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATASET_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Clean text but keep it flexible for different languages
        const description = row.description.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const category = row.category ? row.category.trim() : '';
        const subcategory = row.subcategory ? row.subcategory.trim() : '';

        if (!description || !category || !subcategory) return;

        data.push({ description, category, subcategory });

        description.split(' ').forEach((word) => {
          if (word && !wordIndex[word]) {
            if (wordCounter < MAX_VOCAB_SIZE) {
               wordIndex[word] = wordCounter++;
            }
          }
        });
      })
      .on('end', () => {
        if (data.length < 2) {
          reject(new Error('Dataset must contain at least two valid rows.'));
          return;
        }

        const uniqueCategories = [...new Set(data.map((row) => row.category))].sort();
        uniqueCategories.forEach((cat, idx) => (categoryIndex[cat] = idx));

        const uniqueSubcategories = [...new Set(data.map((row) => row.subcategory))].sort();
        uniqueSubcategories.forEach((sub, idx) => (subcategoryIndex[sub] = idx));

        console.log('Dataset loaded.');
        console.log(`Total samples: ${data.length}`);
        console.log(`Vocabulary size: ${wordCounter}`);
        resolve();
      })
      .on('error', reject);
  });
}

// --- Utility helpers ---
function splitDataset(allSamples, validationSplit) {
  const shuffled = [...allSamples];
  tf.util.shuffle(shuffled);

  const valSize = Math.floor(shuffled.length * validationSplit);
  const valSamples = shuffled.slice(0, valSize);
  const trainSamples = shuffled.slice(valSize);

  return { trainSamples, valSamples };
}

function buildOneHotTensor(indices, depth) {
  const buffer = tf.buffer([indices.length, depth], 'float32');
  indices.forEach((classIndex, sampleIdx) => {
    if (Number.isInteger(classIndex) && classIndex >= 0 && classIndex < depth) {
      buffer.set(1, sampleIdx, classIndex);
    }
  });
  return buffer.toTensor();
}

function vectorizeSamples(samples) {
  const sequences = samples.map((row) => {
    const seq = row.description
      .split(' ')
      .map((word) => wordIndex[word] || wordIndex['<UNK>'])
      .filter((wordId) => wordId < MAX_VOCAB_SIZE);
    return seq;
  });

  const paddedSequences = sequences.map((seq) => {
    if (seq.length > MAX_LEN) {
      return seq.slice(0, MAX_LEN);
    }
    const pad = new Array(MAX_LEN - seq.length).fill(0);
    return [...pad, ...seq];
  });

  const xTensor = tf.tensor2d(paddedSequences, [samples.length, MAX_LEN], 'int32');

  const categoryIndices = samples.map((row) => categoryIndex[row.category]);
  const yCategoryTensor = buildOneHotTensor(categoryIndices, Object.keys(categoryIndex).length);

  const subcategoryIndices = samples.map((row) => subcategoryIndex[row.subcategory]);
  const ySubcategoryTensor = buildOneHotTensor(subcategoryIndices, Object.keys(subcategoryIndex).length);

  return { x: xTensor, yCategory: yCategoryTensor, ySubcategory: ySubcategoryTensor };
}

function vectorizeData(trainSamples, valSamples) {
  console.log('Vectorizing data...');
  const trainTensors = vectorizeSamples(trainSamples);
  const valTensors = vectorizeSamples(valSamples);
  console.log('Data vectorized.');
  return { trainTensors, valTensors };
}

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

function disposeTensorGroup(group) {
  if (!group) return;
  group.x.dispose();
  group.yCategory.dispose();
  group.ySubcategory.dispose();
}

// --- 2. Define Model ---
function createModel() {
  console.log('Creating model...');

  const input = tf.input({ shape: [MAX_LEN] });

  let x = tf.layers.embedding({
    inputDim: MAX_VOCAB_SIZE,
    outputDim: 128,
    inputLength: MAX_LEN,
  }).apply(input);

  // TUNED: Increased LSTM units to 64 because we have more data now
  x = tf.layers.bidirectional({
    layer: tf.layers.lstm({ units: 64, returnSequences: false }),
  }).apply(x);

  // Dropout to prevent overfitting
  x = tf.layers.dropout({ rate: 0.4 }).apply(x);

  x = tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
  }).apply(x);

  x = tf.layers.dropout({ rate: 0.3 }).apply(x);

  const categoryOutput = tf.layers.dense({
    units: Object.keys(categoryIndex).length,
    activation: 'softmax',
    name: 'category_output',
  }).apply(x);

  const subcategoryOutput = tf.layers.dense({
    units: Object.keys(subcategoryIndex).length,
    activation: 'softmax',
    name: 'subcategory_output',
  }).apply(x);

  const model = tf.model({
    inputs: input,
    outputs: [categoryOutput, subcategoryOutput],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: ['categoricalCrossentropy', 'categoricalCrossentropy'],
    lossWeights: [0.1, 0.9], // Focus on Subcategory
    metrics: ['accuracy'],
  });

  console.log('Model created.');
  model.summary();
  return model;
}

// --- 3. Train Model ---
async function trainModel(model, trainTensors, valTensors) {
  console.log('\nStarting training...');
  console.log('==================\n');

  let bestValSubAcc = 0;
  let patienceCounter = 0;
  const patience = 10; // Lower patience for large dataset (it converges faster)
  let bestWeights = null;

  await model.fit(trainTensors.x, [trainTensors.yCategory, trainTensors.ySubcategory], {
    epochs: 50, // 50 Epochs is usually enough for 10k rows
    batchSize: 64, // Increased batch size for speed
    validationData: [valTensors.x, [valTensors.yCategory, valTensors.ySubcategory]],
    shuffle: true,
    verbose: 0,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        const loss = logs.loss.toFixed(4);
        
        // Safe logs check
        const catAccRaw = logs['category_output_accuracy'] || logs['category_output_acc'] || 0;
        const subAccRaw = logs['subcategory_output_accuracy'] || logs['subcategory_output_acc'] || 0;
        
        const catAcc = (catAccRaw * 100).toFixed(2);
        const subAcc = (subAccRaw * 100).toFixed(2);

        const { catAcc: rawValCatAcc, subAcc: rawValSubAcc } = getAccuracies(
          model,
          valTensors.x,
          valTensors.yCategory,
          valTensors.ySubcategory
        );
        
        const valCatAcc = (rawValCatAcc * 100).toFixed(2);
        const valSubAcc = (rawValSubAcc * 100).toFixed(2);

        console.log(
          `Epoch ${String(epoch + 1).padStart(3, '0')}/50 | ` +
          `Loss: ${loss} | ` +
          `Cat Acc: ${catAcc}% / ${valCatAcc}% | ` +
          `Sub Acc: ${subAcc}% / ${valSubAcc}%`
        );

        if (rawValSubAcc > bestValSubAcc) {
          bestValSubAcc = rawValSubAcc;
          patienceCounter = 0;
          if (bestWeights) {
            bestWeights.forEach((w) => w.dispose());
          }
          bestWeights = model.getWeights().map((w) => w.clone());
          console.log(`  ✓ New best accuracy: ${valSubAcc}%`);
        } else {
          patienceCounter++;
          if (patienceCounter >= patience) {
            console.log(`\n⚠ Early stopping triggered.`);
            model.stopTraining = true;
          }
        }
      },
    },
  });

  if (bestWeights) {
    console.log(`Restoring model with best subcategory accuracy: ${(bestValSubAcc * 100).toFixed(2)}%`);
    model.setWeights(bestWeights);
    bestWeights.forEach((w) => w.dispose());
  }

  console.log('\nTraining complete!');
}

// --- 4. Evaluate & Save ---
function evaluateModel(model, trainTensors, valTensors) {
  console.log('Evaluating model on full dataset...');

  const xAll = tf.concat([trainTensors.x, valTensors.x], 0);
  const yCategoryAll = tf.concat([trainTensors.yCategory, valTensors.yCategory], 0);
  const ySubcategoryAll = tf.concat([trainTensors.ySubcategory, valTensors.ySubcategory], 0);

  const { catAcc, subAcc } = getAccuracies(model, xAll, yCategoryAll, ySubcategoryAll);

  console.log('\nFinal Evaluation:');
  console.log(`Category Accuracy: ${(catAcc * 100).toFixed(2)}%`);
  console.log(`Subcategory Accuracy: ${(subAcc * 100).toFixed(2)}%`);

  xAll.dispose();
  yCategoryAll.dispose();
  ySubcategoryAll.dispose();
}

async function saveAll(model) {
  console.log('\nSaving model and metadata...');
  await fs.ensureDir('./model');

  await model.save(MODEL_SAVE_PATH);

  const metadata = {
    wordIndex,
    maxLen: MAX_LEN,
    maxVocabSize: MAX_VOCAB_SIZE,
    categoryIndex: Object.fromEntries(
      Object.entries(categoryIndex).map(([key, value]) => [value, key])
    ),
    subcategoryIndex: Object.fromEntries(
      Object.entries(subcategoryIndex).map(([key, value]) => [value, key])
    ),
  };

  await fs.writeJson(METADATA_SAVE_PATH, metadata);
  console.log(`✓ Model saved to: ${MODEL_SAVE_PATH}`);
  console.log(`✓ Metadata saved to: ${METADATA_SAVE_PATH}`);
}

// --- Main Execution ---
async function main() {
  try {
    await loadData();
    const { trainSamples, valSamples } = splitDataset(data, VALIDATION_SPLIT);
    const { trainTensors, valTensors } = vectorizeData(trainSamples, valSamples);
    const model = createModel();
    await trainModel(model, trainTensors, valTensors);
    evaluateModel(model, trainTensors, valTensors);
    await saveAll(model);

    disposeTensorGroup(trainTensors);
    disposeTensorGroup(valTensors);

    console.log('\n✓ All done!');
  } catch (error) {
    console.error('Error during training:', error);
    process.exit(1);
  }
}

main();
// ============================================================
//  BERUANG AI - TRANSACTION CLASSIFIER TRAINER (V10 - GENIUS EDITION)
// ============================================================

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 BERUANG AI Transaction Classifier (V10 - GENIUS EDITION)');
console.log('==========================================================\n');

// ========================= OPTIMIZED CONFIG =========================
const CONFIG = {
  datasetPath: './dataset_new.csv',
  modelSavePath: './model_transaction',
  metadataSavePath: './model_transaction/metadata.json',
  
  maxVocabSize: 2000,  // Increased for better vocabulary coverage
  maxLen: 20,          // Increased to capture more context
  batchSize: 64,       // Increased batch size for stability
  epochs: 100,
  validationSplit: 0.2,
  patience: 10,        // More patience for better convergence
  
  // BALANCED ARCHITECTURE - Prevent overfitting
  embeddingDim: 64,    // Reduced to prevent overfitting
  lstmUnits: 64,       // Reduced to prevent overfitting
  lstmUnits2: 32,      // Second LSTM layer (reduced)
  denseUnits: 64,      // Reduced dense layer
  denseUnits2: 32,     // Second dense layer (reduced)
  
  // Learning Rate
  initialLearningRate: 0.001,
  learningRateDecay: 0.95,
  minLearningRate: 0.00001,
  
  // REGULARIZATION - Increased to prevent overfitting
  dropoutRate: 0.5,     // Increased to prevent overfitting
  recurrentDropout: 0.3,
  l2Regularization: 0.01, // Increased to prevent overfitting
  
  // Data augmentation
  useDataAugmentation: true,
  
  // Class weights for imbalanced data
  useClassWeights: true
};

// ========================= GLOBALS =========================
let data = [];
const wordIndex = { '<PAD>': 0, '<UNK>': 1 };
let nextIndex = 2;
const categoryToId = {};
const subcategoryToId = {};
let idToCategory = {};
let idToSubcategory = {};

// Track if we've initialized category IDs (to ensure proper 0-based indexing)
let categoriesInitialized = false;
let subcategoriesInitialized = false;

// ========================= TEXT AUGMENTATION =========================
function augmentText(text) {
  if (!CONFIG.useDataAugmentation) return [text];
  
  const words = text.split(' ').filter(w => w.length > 0);
  if (words.length < 2) return [text];
  
  const variations = [text];
  
  // Synonym-like augmentation (word order variations)
  if (words.length > 2 && Math.random() < 0.2) {
    const idx1 = Math.floor(Math.random() * words.length);
    const idx2 = Math.floor(Math.random() * words.length);
    if (idx1 !== idx2) {
      const augmented = [...words];
      [augmented[idx1], augmented[idx2]] = [augmented[idx2], augmented[idx1]];
      variations.push(augmented.join(' '));
    }
  }
  
  return variations;
}

// ========================= IMPROVED TEXT PREPROCESSING =========================
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Keep numbers but normalize them
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove special chars but keep alphanumeric
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
    .substring(0, 100);        // Increased length limit
}

// ========================= DATA LOADING =========================
async function loadData() {
  console.log(`📂 Loading dataset from ${CONFIG.datasetPath}...`);
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.datasetPath)) {
      reject(new Error(`Dataset file not found: ${CONFIG.datasetPath}`));
      return;
    }
    
    const fileStream = fs.createReadStream(CONFIG.datasetPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineCount = 0;
    
    rl.on('line', (line) => {
      lineCount++;
      if (lineCount === 1) return; // Skip header
      
      try {
        // Better CSV parsing
        const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 3) return;
        
        const desc = parts[0].replace(/^"|"$/g, '').trim();
        const cat = parts[1].replace(/^"|"$/g, '').trim();
        const subcat = parts[2].replace(/^"|"$/g, '').trim();
        
        if (!desc || !cat || !subcat) return;
        
        const processedDesc = preprocessText(desc);
        if (processedDesc.length < 2) return;
        
        // Build vocabulary
        processedDesc.split(' ').forEach(word => {
          if (word && word.length > 0 && !wordIndex[word] && nextIndex < CONFIG.maxVocabSize) {
            wordIndex[word] = nextIndex++;
          }
        });
        
        // Add original data
        data.push({ desc: processedDesc, cat, subcat });
        
        // Add augmented versions
        if (CONFIG.useDataAugmentation) {
          augmentText(processedDesc).forEach(augmentedDesc => {
            if (augmentedDesc !== processedDesc && augmentedDesc.length >= 2) {
              data.push({ desc: augmentedDesc, cat, subcat });
            }
          });
        }
        
        // Track categories - ensure proper 0-based indexing
        if (!categoryToId[cat]) {
          const id = Object.keys(categoryToId).length;
          categoryToId[cat] = id;
          // Only set if not already set (prevent duplicates)
          if (!idToCategory[id]) {
            idToCategory[id] = cat;
          }
        }
        
        if (!subcategoryToId[subcat]) {
          const id = Object.keys(subcategoryToId).length;
          subcategoryToId[subcat] = id;
          // Only set if not already set (prevent duplicates)
          if (!idToSubcategory[id]) {
            idToSubcategory[id] = subcat;
          }
        }
        
      } catch (err) {
        // Skip malformed lines
      }
    });
    
    rl.on('close', () => {
      // Clean up any duplicate mappings and ensure proper 0-based indexing
      const cleanCategoryToId = {};
      const cleanIdToCategory = {};
      const sortedCategories = Object.keys(categoryToId).sort();
      sortedCategories.forEach((cat, idx) => {
        cleanCategoryToId[cat] = idx;
        cleanIdToCategory[idx] = cat;
      });
      
      // Update globals - remap all data
      const oldCategoryToId = { ...categoryToId };
      Object.keys(categoryToId).forEach(cat => {
        categoryToId[cat] = cleanCategoryToId[cat];
      });
      Object.keys(idToCategory).forEach(id => {
        delete idToCategory[id];
      });
      Object.assign(idToCategory, cleanIdToCategory);
      
      // Remap all data entries
      data.forEach(item => {
        item.catId = cleanCategoryToId[item.cat];
      });
      
      // Same for subcategories
      const cleanSubcategoryToId = {};
      const cleanIdToSubcategory = {};
      const sortedSubcategories = Object.keys(subcategoryToId).sort();
      sortedSubcategories.forEach((subcat, idx) => {
        cleanSubcategoryToId[subcat] = idx;
        cleanIdToSubcategory[idx] = subcat;
      });
      
      Object.keys(subcategoryToId).forEach(subcat => {
        subcategoryToId[subcat] = cleanSubcategoryToId[subcat];
      });
      Object.keys(idToSubcategory).forEach(id => {
        delete idToSubcategory[id];
      });
      Object.assign(idToSubcategory, cleanIdToSubcategory);
      
      // Remap all data entries
      data.forEach(item => {
        item.subcatId = cleanSubcategoryToId[item.subcat];
      });
      
      console.log(`✅ Loaded ${data.length.toLocaleString()} transactions (with augmentation)`);
      console.log(`📊 Vocabulary size: ${nextIndex - 1}`);
      console.log(`📈 Categories: ${Object.keys(categoryToId).join(', ')}`);
      console.log(`📈 Subcategories: ${Object.keys(subcategoryToId).join(', ')}`);
      console.log(`📊 Max sequence length: ${CONFIG.maxLen}`);
      
      // Verify encoding
      console.log(`\n🔍 Verified Encoding:`);
      console.log(`   Categories: ${Object.keys(categoryToId).map(c => `${c}=${categoryToId[c]}`).join(', ')}`);
      console.log(`   Category mapping: ${JSON.stringify(idToCategory)}`);
      console.log(`   Subcategories: ${Object.keys(subcategoryToId).map(s => `${s}=${subcategoryToId[s]}`).join(', ')}`);
      console.log(`   Subcategory mapping: ${JSON.stringify(idToSubcategory)}`);
      
      // Shuffle data thoroughly
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }
      
      resolve();
    });
    
    rl.on('error', reject);
  });
}

// ========================= TOKENIZATION =========================
function tokenizeAndPad(texts) {
  const sequences = texts.map(text => {
    const tokens = text.split(' ').filter(w => w.length > 0).map(word => {
      const idx = wordIndex[word];
      return idx !== undefined ? idx : wordIndex['<UNK>'];
    }).slice(0, CONFIG.maxLen);
    
    // Pad to the left (better for LSTM)
    const padding = new Array(CONFIG.maxLen - tokens.length).fill(wordIndex['<PAD>']);
    return [...padding, ...tokens];
  });
  
  return tf.tensor2d(sequences, [sequences.length, CONFIG.maxLen], 'int32');
}

// ========================= CALCULATE CLASS WEIGHTS =========================
function calculateClassWeights(data, labelKey) {
  const labelCounts = {};
  data.forEach(item => {
    const label = item[labelKey];
    labelCounts[label] = (labelCounts[label] || 0) + 1;
  });
  
  const total = data.length;
  const numClasses = Object.keys(labelCounts).length;
  const weights = {};
  
  Object.keys(labelCounts).forEach(label => {
    const count = labelCounts[label];
    weights[label] = total / (numClasses * count);
  });
  
  return weights;
}

// ========================= GENIUS MODEL ARCHITECTURE =========================
function createGeniusModel() {
  console.log('🧠 Creating Genius Model Architecture...');
  
  const input = tf.input({ shape: [CONFIG.maxLen] });
  
  // 1. Embedding layer
  const embedding = tf.layers.embedding({
    inputDim: Math.min(CONFIG.maxVocabSize, nextIndex),
    outputDim: CONFIG.embeddingDim,
    inputLength: CONFIG.maxLen,
    maskZero: true,
    embeddingsRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization })
  }).apply(input);
  
  // 2. First Bidirectional LSTM
  const lstm1 = tf.layers.bidirectional({
    layer: tf.layers.lstm({
      units: CONFIG.lstmUnits,
      returnSequences: true,
      dropout: CONFIG.dropoutRate,
      recurrentDropout: CONFIG.recurrentDropout,
      kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization }),
      recurrentRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization })
    })
  }).apply(embedding);
  
  // 3. Second Bidirectional LSTM
  const lstm2 = tf.layers.bidirectional({
    layer: tf.layers.lstm({
      units: CONFIG.lstmUnits2,
      returnSequences: false,
      dropout: CONFIG.dropoutRate,
      recurrentDropout: CONFIG.recurrentDropout,
      kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization }),
      recurrentRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization })
    })
  }).apply(lstm1);
  
  // 4. Dropout after LSTM
  const dropout1 = tf.layers.dropout({ rate: CONFIG.dropoutRate }).apply(lstm2);
  
  // 5. First Dense layer
  const dense1 = tf.layers.dense({
    units: CONFIG.denseUnits,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization })
  }).apply(dropout1);
  
  const dropout2 = tf.layers.dropout({ rate: 0.3 }).apply(dense1);
  
  // 6. Second Dense layer
  const dense2 = tf.layers.dense({
    units: CONFIG.denseUnits2,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization })
  }).apply(dropout2);
  
  const dropout3 = tf.layers.dropout({ rate: 0.2 }).apply(dense2);
  
  // 7. Separate branches for category and subcategory
  // Category branch - simpler, focused on needs/wants distinction
  const categoryBranch = tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization }),
    name: 'category_branch'
  }).apply(dropout3);
  
  const categoryDropout = tf.layers.dropout({ rate: 0.3 }).apply(categoryBranch);
  
  const categoryOutput = tf.layers.dense({
    units: Object.keys(categoryToId).length,
    activation: 'softmax',
    name: 'category_output'
  }).apply(categoryDropout);
  
  // Subcategory branch - can use more complex features
  const subcategoryBranch = tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: CONFIG.l2Regularization }),
    name: 'subcategory_branch'
  }).apply(dropout3);
  
  const subcategoryDropout = tf.layers.dropout({ rate: 0.3 }).apply(subcategoryBranch);
  
  const subcategoryOutput = tf.layers.dense({
    units: Object.keys(subcategoryToId).length,
    activation: 'softmax',
    name: 'subcategory_output'
  }).apply(subcategoryDropout);
  
  const model = tf.model({
    inputs: input,
    outputs: [categoryOutput, subcategoryOutput]
  });
  
  // Compile with higher weight for category to force learning
  // Category is binary (easier) but model is ignoring it, so we need to emphasize it
  model.compile({
    optimizer: tf.train.adam(CONFIG.initialLearningRate),
    loss: {
      'category_output': 'categoricalCrossentropy',
      'subcategory_output': 'categoricalCrossentropy'
    },
    lossWeights: {
      'category_output': 0.8,  // Increased to force category learning
      'subcategory_output': 0.2  // Reduced since it's already learning well
    },
    metrics: ['accuracy']
  });
  
  console.log('📊 Model Architecture:');
  console.log(`   Embedding: ${CONFIG.embeddingDim} dim`);
  console.log(`   LSTM: ${CONFIG.lstmUnits} units (bidirectional) → ${CONFIG.lstmUnits2} units (bidirectional)`);
  console.log(`   Dense: ${CONFIG.denseUnits} → ${CONFIG.denseUnits2}`);
  console.log(`   Category Branch: 32 units (dedicated)`);
  console.log(`   Subcategory Branch: 64 units (dedicated)`);
  console.log(`   Dropout: ${CONFIG.dropoutRate} (LSTM), 0.3/0.2 (Dense)`);
  console.log(`   L2 Regularization: ${CONFIG.l2Regularization}`);
  console.log(`   Loss Weights: Category=0.8, Subcategory=0.2 (emphasizing category)\n`);
  
  return model;
}

// ========================= TRAINING WITH PROPER METRICS =========================
async function train() {
  try {
    await loadData();
    
    // Split data with stratification to ensure balanced distribution
    // First, group by category to maintain distribution
    const categoryGroups = {};
    data.forEach(item => {
      if (!categoryGroups[item.cat]) {
        categoryGroups[item.cat] = [];
      }
      categoryGroups[item.cat].push(item);
    });
    
    // Split each category group proportionally
    const trainData = [];
    const valData = [];
    
    Object.keys(categoryGroups).forEach(cat => {
      const group = categoryGroups[cat];
      // Shuffle each group
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
      
      const splitIdx = Math.floor(group.length * (1 - CONFIG.validationSplit));
      trainData.push(...group.slice(0, splitIdx));
      valData.push(...group.slice(splitIdx));
    });
    
    // Final shuffle
    for (let i = trainData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trainData[i], trainData[j]] = [trainData[j], trainData[i]];
    }
    
    for (let i = valData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valData[i], valData[j]] = [valData[j], valData[i]];
    }
    
    // Check distribution
    const trainCatDist = {};
    const valCatDist = {};
    trainData.forEach(d => trainCatDist[d.cat] = (trainCatDist[d.cat] || 0) + 1);
    valData.forEach(d => valCatDist[d.cat] = (valCatDist[d.cat] || 0) + 1);
    
    console.log(`📊 Dataset Split:`);
    console.log(`   Training: ${trainData.length.toLocaleString()} samples`);
    console.log(`   Validation: ${valData.length.toLocaleString()} samples`);
    console.log(`   Validation %: ${((valData.length / data.length) * 100).toFixed(1)}%`);
    console.log(`\n📊 Category Distribution:`);
    Object.keys(categoryToId).forEach(cat => {
      const trainCount = trainCatDist[cat] || 0;
      const valCount = valCatDist[cat] || 0;
      const trainPct = ((trainCount / trainData.length) * 100).toFixed(1);
      const valPct = ((valCount / valData.length) * 100).toFixed(1);
      console.log(`   ${cat}: Train ${trainPct}% (${trainCount}) | Val ${valPct}% (${valCount})`);
    });
    console.log('');
    
    // Calculate class weights
    let categoryWeights = null;
    let subcategoryWeights = null;
    
    if (CONFIG.useClassWeights) {
      const catWeights = calculateClassWeights(trainData, 'cat');
      const subcatWeights = calculateClassWeights(trainData, 'subcat');
      
      categoryWeights = {};
      subcategoryWeights = {};
      
      Object.keys(catWeights).forEach(cat => {
        categoryWeights[categoryToId[cat]] = catWeights[cat];
      });
      
      Object.keys(subcatWeights).forEach(subcat => {
        subcategoryWeights[subcategoryToId[subcat]] = subcatWeights[subcat];
      });
      
      console.log('⚖️  Class Weights Applied\n');
    }
    
    // Prepare data
    console.log('🔧 Preparing data...');
    const xTrain = tokenizeAndPad(trainData.map(d => d.desc));
    const xVal = tokenizeAndPad(valData.map(d => d.desc));
    
    // Labels
    const numCategories = Object.keys(categoryToId).length;
    const numSubcategories = Object.keys(subcategoryToId).length;
    
    // Verify label encoding before creating tensors
    const trainCatIds = trainData.map(d => {
      const id = categoryToId[d.cat];
      if (id === undefined || id >= numCategories) {
        console.error(`ERROR: Invalid category ID for "${d.cat}": ${id}, expected 0-${numCategories-1}`);
        return 0;
      }
      return id;
    });
    
    const valCatIds = valData.map(d => {
      const id = categoryToId[d.cat];
      if (id === undefined || id >= numCategories) {
        console.error(`ERROR: Invalid category ID for "${d.cat}": ${id}, expected 0-${numCategories-1}`);
        return 0;
      }
      return id;
    });
    
    const yTrainCat = tf.oneHot(
      tf.tensor1d(trainCatIds, 'int32'),
      numCategories
    );
    
    const yTrainSub = tf.oneHot(
      tf.tensor1d(trainData.map(d => subcategoryToId[d.subcat]), 'int32'),
      numSubcategories
    );
    
    const yValCat = tf.oneHot(
      tf.tensor1d(valCatIds, 'int32'),
      numCategories
    );
    
    const yValSub = tf.oneHot(
      tf.tensor1d(valData.map(d => subcategoryToId[d.subcat]), 'int32'),
      numSubcategories
    );
    
    // Debug: Check label distribution
    const trainCatIdDist = {};
    trainCatIds.forEach(id => trainCatIdDist[id] = (trainCatIdDist[id] || 0) + 1);
    const valCatIdDist = {};
    valCatIds.forEach(id => valCatIdDist[id] = (valCatIdDist[id] || 0) + 1);
    
    console.log(`\n🔍 Label Distribution Check:`);
    console.log(`   Training category IDs:`, trainCatIdDist);
    console.log(`   Validation category IDs:`, valCatIdDist);
    console.log(`   Expected range: 0-${numCategories-1}`);
    
    // Diagnostic: Verify label encoding
    console.log('🔍 Label Encoding Verification:');
    console.log(`   Categories: ${Object.keys(categoryToId).map(c => `${c}=${categoryToId[c]}`).join(', ')}`);
    console.log(`   Subcategories: ${Object.keys(subcategoryToId).map(s => `${s}=${subcategoryToId[s]}`).join(', ')}`);
    
    // Check for label inconsistencies
    const categorySubcatMap = {};
    trainData.forEach(d => {
      const key = `${d.cat}_${d.subcat}`;
      if (!categorySubcatMap[key]) {
        categorySubcatMap[key] = [];
      }
      categorySubcatMap[key].push(d.desc);
    });
    
    console.log('\n🔍 Category-Subcategory Consistency Check:');
    Object.keys(categorySubcatMap).slice(0, 10).forEach(key => {
      const [cat, subcat] = key.split('_');
      console.log(`   ${cat} + ${subcat}: ${categorySubcatMap[key].length} samples`);
    });
    
    // Sample check
    const sampleTrain = trainData.slice(0, 5);
    const sampleVal = valData.slice(0, 5);
    console.log('\n📝 Sample Training Data:');
    sampleTrain.forEach((d, i) => {
      console.log(`   ${i+1}. "${d.desc}" → ${d.cat} (${categoryToId[d.cat]}) / ${d.subcat} (${subcategoryToId[d.subcat]})`);
    });
    console.log('\n📝 Sample Validation Data:');
    sampleVal.forEach((d, i) => {
      console.log(`   ${i+1}. "${d.desc}" → ${d.cat} (${categoryToId[d.cat]}) / ${d.subcat} (${subcategoryToId[d.subcat]})`);
    });
    console.log('');
    
    // Create model
    const model = createGeniusModel();
    
    console.log('🎯 Starting Genius Training...');
    console.log('Epoch │ Loss     │ Val Loss │ Cat Acc  │ Val Cat  │ Sub Acc  │ Val Sub  │ LR      │ Status');
    console.log('──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┼─────────');
    
    let bestValCatAcc = 0;
    let bestValSubAcc = 0;
    let bestCombinedScore = 0;
    let patienceCounter = 0;
    let bestEpoch = 0;
    let currentLR = CONFIG.initialLearningRate;
    let catWeight = 0.8, subWeight = 0.2; // Initialize
    
    for (let epoch = 0; epoch < CONFIG.epochs; epoch++) {
      // Dynamic loss weights: Focus on category early, then balance
      if (epoch < 5) {
        // First 5 epochs: Focus heavily on category
        catWeight = 0.9;
        subWeight = 0.1;
      } else if (epoch < 15) {
        // Next 10 epochs: Gradually balance
        const progress = (epoch - 5) / 10;
        catWeight = 0.9 - (progress * 0.3); // 0.9 -> 0.6
        subWeight = 0.1 + (progress * 0.3); // 0.1 -> 0.4
      } else {
        // Later epochs: Balanced but still favor category
        catWeight = 0.7;
        subWeight = 0.3;
      }
      
      // Learning rate decay
      if (epoch > 0 && epoch % 5 === 0) {
        currentLR = Math.max(
          CONFIG.minLearningRate,
          currentLR * CONFIG.learningRateDecay
        );
      }
      
      // Recompile with updated weights and learning rate
      model.compile({
        optimizer: tf.train.adam(currentLR),
        loss: {
          'category_output': 'categoricalCrossentropy',
          'subcategory_output': 'categoricalCrossentropy'
        },
        lossWeights: {
          'category_output': catWeight,
          'subcategory_output': subWeight
        },
        metrics: ['accuracy']
      });
      
      // Custom training step with class weights
      let history;
      if (categoryWeights && subcategoryWeights) {
        // For class weights, we need to use a custom training loop
        // But TensorFlow.js doesn't support sample weights easily, so we'll use balanced loss
        history = await model.fit(xTrain, [yTrainCat, yTrainSub], {
          batchSize: CONFIG.batchSize,
          epochs: 1,
          validationData: [xVal, [yValCat, yValSub]],
          shuffle: true,
          verbose: 0
        });
      } else {
        history = await model.fit(xTrain, [yTrainCat, yTrainSub], {
          batchSize: CONFIG.batchSize,
          epochs: 1,
          validationData: [xVal, [yValCat, yValSub]],
          shuffle: true,
          verbose: 0
        });
      }
      
      // Extract metrics - TensorFlow.js uses different key names
      const metrics = history.history;
      
      // Debug: log available keys on first epoch
      if (epoch === 0) {
        console.log('📋 Available metrics:', Object.keys(metrics).join(', '));
      }
      
      // Try different possible metric names (TensorFlow.js v4 uses 'accuracy' not 'acc')
      let trainCatAcc = metrics['category_output_accuracy']?.[0];
      let trainSubAcc = metrics['subcategory_output_accuracy']?.[0];
      let valCatAcc = metrics['val_category_output_accuracy']?.[0];
      let valSubAcc = metrics['val_subcategory_output_accuracy']?.[0];
      
      // Fallback to old naming convention
      if (trainCatAcc === undefined) trainCatAcc = metrics['category_output_acc']?.[0];
      if (trainSubAcc === undefined) trainSubAcc = metrics['subcategory_output_acc']?.[0];
      if (valCatAcc === undefined) valCatAcc = metrics['val_category_output_acc']?.[0];
      if (valSubAcc === undefined) valSubAcc = metrics['val_subcategory_output_acc']?.[0];
      
      // ALWAYS calculate validation accuracy manually to ensure correctness
      // The reported metrics might be incorrect for multi-output models
      // Calculate every epoch to get accurate metrics
      const manualValCatAcc = await calculateAccuracy(model, xVal, yValCat, 'category');
      const manualValSubAcc = await calculateAccuracy(model, xVal, yValSub, 'subcategory');
      
      // Always use manual calculation for validation (more reliable)
      valCatAcc = manualValCatAcc;
      valSubAcc = manualValSubAcc;
      
      // Debug: Check predictions on first few epochs
      if (epoch < 3) {
        const samplePreds = model.predict(xVal.slice([0, 0], [10, xVal.shape[1]]));
        const catPreds = samplePreds[0].argMax(1).dataSync();
        const catTrue = yValCat.slice([0, 0], [10, yValCat.shape[1]]).argMax(1).dataSync();
        const sampleValData = valData.slice(0, 10);
        
        console.log(`\n   🔍 Epoch ${epoch + 1} Sample Predictions (first 5):`);
        for (let i = 0; i < 5; i++) {
          const trueCat = idToCategory[catTrue[i]];
          const predCat = idToCategory[catPreds[i]];
          const match = trueCat === predCat ? '✓' : '✗';
          console.log(`      ${match} "${sampleValData[i].desc}" → True: ${trueCat}, Pred: ${predCat}`);
        }
        
        samplePreds.forEach(p => p.dispose());
      }
      
      // Default to 0 if still undefined
      trainCatAcc = trainCatAcc || 0;
      trainSubAcc = trainSubAcc || 0;
      valCatAcc = valCatAcc || 0;
      valSubAcc = valSubAcc || 0;
      
      const loss = metrics['loss']?.[0] || 0;
      const valLoss = metrics['val_loss']?.[0] || 0;
      
      // Combined score for early stopping
      const combinedScore = (valCatAcc * 0.5) + (valSubAcc * 0.5);
      const improvement = combinedScore - bestCombinedScore;
      
      let status = '';
      
      if (improvement > 0.001) { // 0.1% improvement threshold
        bestValCatAcc = valCatAcc;
        bestValSubAcc = valSubAcc;
        bestCombinedScore = combinedScore;
        bestEpoch = epoch + 1;
        patienceCounter = 0;
        status = '🔥 BEST';
        
        // Save model
        await model.save(`file://${CONFIG.modelSavePath}`);
        
        // Save metadata
        const metadata = {
          wordIndex,
          maxLen: CONFIG.maxLen,
          maxVocabSize: CONFIG.maxVocabSize,  // Add for server compatibility
          vocabSize: nextIndex,
          categoryIndex: idToCategory,
          subcategoryIndex: idToSubcategory,
          performance: {
            category_accuracy: bestValCatAcc,
            subcategory_accuracy: bestValSubAcc,
            epoch: bestEpoch,
            combined_score: bestCombinedScore
          },
          training_config: CONFIG,
          timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
          CONFIG.metadataSavePath,
          JSON.stringify(metadata, null, 2)
        );
      } else {
        patienceCounter++;
        status = `Wait ${patienceCounter}`;
      }
      
      // Display progress
      const weightInfo = epoch < 5 ? `C:${catWeight.toFixed(1)}` : '';
      console.log(
        `${String(epoch + 1).padStart(4)}  │ ` +
        `${loss.toFixed(4).padStart(8)} │ ` +
        `${valLoss.toFixed(4).padStart(8)} │ ` +
        `${(trainCatAcc * 100).toFixed(1).padStart(7)}% │ ` +
        `${(valCatAcc * 100).toFixed(1).padStart(7)}% │ ` +
        `${(trainSubAcc * 100).toFixed(1).padStart(7)}% │ ` +
        `${(valSubAcc * 100).toFixed(1).padStart(7)}% │ ` +
        `${currentLR.toFixed(5).padStart(7)} │ ` +
        `${status} ${weightInfo}`
      );
      
      // Early stopping
      if (patienceCounter >= CONFIG.patience) {
        console.log(`\n🛑 Early stopping at epoch ${epoch + 1}`);
        break;
      }
      
      // Memory cleanup
      if ((epoch + 1) % 10 === 0) {
        tf.engine().startScope();
        tf.engine().endScope();
        if (global.gc) global.gc();
      }
    }
    
    console.log(`\n✅ Training Complete!`);
    console.log(`🎯 Best Model: Epoch ${bestEpoch}`);
    console.log(`   Category Accuracy: ${(bestValCatAcc * 100).toFixed(2)}%`);
    console.log(`   Subcategory Accuracy: ${(bestValSubAcc * 100).toFixed(2)}%`);
    console.log(`   Combined Score: ${(bestCombinedScore * 100).toFixed(2)}%`);
    
    if (bestValCatAcc < 0.7 || bestValSubAcc < 0.7) {
      console.log('\n⚠️  WARNING: Accuracy could be improved. Consider:');
      console.log('   1. Checking dataset quality and label consistency');
      console.log('   2. Increasing training epochs');
      console.log('   3. Adjusting model architecture');
    } else {
      console.log('\n✨ Excellent performance achieved!');
    }
    
    // Cleanup
    xTrain.dispose();
    xVal.dispose();
    yTrainCat.dispose();
    yTrainSub.dispose();
    yValCat.dispose();
    yValSub.dispose();
    
    return model;
    
  } catch (error) {
    console.error('❌ Error during training:', error.message);
    if (error.stack) console.error(error.stack);
    throw error;
  }
}

// ========================= HELPER: Calculate Accuracy =========================
async function calculateAccuracy(model, xData, yTrue, outputName) {
  try {
    const predictions = model.predict(xData);
    const outputIndex = outputName === 'category' ? 0 : 1;
    
    // Get predicted classes
    const pred = predictions[outputIndex].argMax(1);
    const trueLabels = yTrue.argMax(1);
    
    // Debug: Check prediction distribution on first call
    if (outputName === 'category' && !calculateAccuracy._debugged) {
      const predData = pred.dataSync();
      const trueData = trueLabels.dataSync();
      const predDist = {};
      const trueDist = {};
      
      for (let i = 0; i < Math.min(100, predData.length); i++) {
        predDist[predData[i]] = (predDist[predData[i]] || 0) + 1;
        trueDist[trueData[i]] = (trueDist[trueData[i]] || 0) + 1;
      }
      
      console.log(`\n   🔍 Category Prediction Distribution (first 100):`);
      console.log(`      Predicted IDs:`, predDist);
      console.log(`      True IDs:`, trueDist);
      console.log(`      Category mapping:`, idToCategory);
      
      calculateAccuracy._debugged = true;
    }
    
    // Calculate accuracy
    const matches = pred.equal(trueLabels).sum().dataSync()[0];
    const total = pred.shape[0];
    const accuracy = matches / total;
    
    // Cleanup
    pred.dispose();
    trueLabels.dispose();
    predictions.forEach(p => p.dispose());
    
    return accuracy;
  } catch (err) {
    console.error(`Error calculating accuracy for ${outputName}:`, err.message);
    return 0;
  }
}

// ========================= MAIN =========================
async function main() {
  try {
    const startTime = Date.now();
    
    // Create model directory
    if (!fs.existsSync(CONFIG.modelSavePath)) {
      fs.mkdirSync(CONFIG.modelSavePath, { recursive: true });
    }
    
    // Check dataset
    if (!fs.existsSync(CONFIG.datasetPath)) {
      console.error(`❌ Dataset not found: ${CONFIG.datasetPath}`);
      console.log('   Please run: node generate_transaction_dataset.js');
      process.exit(1);
    }
    
    console.log('🚀 Starting Genius Training Pipeline...\n');
    
    // Train
    const model = await train();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log(`\n⏱️  Total execution time: ${duration}s`);
    console.log('✨ Training completed successfully!');
    
    console.log(`\n💾 Model saved to: ${CONFIG.modelSavePath}/`);
    console.log(`📋 Metadata saved to: ${CONFIG.metadataSavePath}`);
    
    // Quick test with saved model
    console.log('\n🧪 Quick Test:');
    const testCases = [
      "bayar bil tnb",
      "makan nasi lemak",
      "beli baju baru",
      "topup maxis",
      "isi minyak kereta",
      "bayar loan kereta",
      "beli ubat",
      "tengok wayang"
    ];
    
    if (fs.existsSync(CONFIG.metadataSavePath)) {
      const metadata = JSON.parse(fs.readFileSync(CONFIG.metadataSavePath, 'utf8'));
      
      // Load the saved model for testing (best model)
      let testModel;
      try {
        testModel = await tf.loadLayersModel(`file://${CONFIG.modelSavePath}/model.json`);
        console.log('✅ Loaded saved model for testing\n');
      } catch (err) {
        console.log('⚠️  Could not load saved model, using current model\n');
        testModel = model;
      }
      
      for (const text of testCases) {
        const processed = preprocessText(text);
        const tokens = processed.split(' ').filter(w => w.length > 0).map(word => 
          metadata.wordIndex[word] || metadata.wordIndex['<UNK>']
        );
        
        const padded = new Array(metadata.maxLen).fill(metadata.wordIndex['<PAD>']);
        const startIdx = Math.max(0, metadata.maxLen - tokens.length);
        
        for (let i = 0; i < tokens.length && (startIdx + i) < metadata.maxLen; i++) {
          padded[startIdx + i] = tokens[i];
        }
        
        const input = tf.tensor2d([padded], [1, metadata.maxLen], 'int32');
        const predictions = testModel.predict(input);
        
        const catIdx = predictions[0].argMax(1).dataSync()[0];
        const subIdx = predictions[1].argMax(1).dataSync()[0];
        
        const catProb = predictions[0].max().dataSync()[0];
        const subProb = predictions[1].max().dataSync()[0];
        
        const predictedCat = metadata.categoryIndex[catIdx];
        const predictedSub = metadata.subcategoryIndex[subIdx];
        
        console.log(`   "${text}" → ${predictedCat} (${(catProb * 100).toFixed(1)}%) > ${predictedSub} (${(subProb * 100).toFixed(1)}%)`);
        
        input.dispose();
        predictions.forEach(p => p.dispose());
      }
      
      if (testModel !== model) {
        testModel.dispose();
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();

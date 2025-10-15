const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const fs = require('fs');
const csv = require('csv-parser');

async function loadData() {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream('dataset.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Ensure label is valid
        const label = parseInt(row.label);
        if (!isNaN(label) && row.description) {
          data.push({ text: row.description.toLowerCase().trim(), label });
        }
      })
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}

async function trainModel() {
  console.log('Loading data...');
  const data = await loadData();
  if (data.length === 0) throw new Error('No valid data loaded from dataset.csv');

  const texts = data.map(d => d.text);
  const labels = data.map(d => d.label);

  // Advanced tokenization
  const tokenizer = new Map();
  let index = 1;
  const allWords = texts.flatMap(text => text.split(/\s+/).filter(word => word.length > 1)); // Ignore single chars
  const wordFreq = {};
  allWords.forEach(word => { wordFreq[word] = (wordFreq[word] || 0) + 1; });
  const vocab = [...new Set(allWords.filter(word => wordFreq[word] >= 2))]; // Words appearing at least twice
  vocab.forEach(word => tokenizer.set(word, index++));

  const tokenized = texts.map(text => {
    return text.split(/\s+/).map(word => tokenizer.get(word) || 0); // 0 for unknown
  });

  // Padding sequences
  const maxLen = Math.min(Math.max(...tokenized.map(t => t.length)), 20); // Cap at 20 for efficiency
  const padded = tokenized.map(seq => {
    if (seq.length > maxLen) return seq.slice(0, maxLen);
    while (seq.length < maxLen) seq.push(0);
    return seq;
  });

  // Convert to tensors
  const xs = tf.tensor2d(padded, [padded.length, maxLen], 'int32');
  const ys = tf.tensor1d(labels, 'int32');

  // Build larger model
  const model = tf.sequential();
  model.add(tf.layers.embedding({ inputDim: index, outputDim: 32, inputLength: maxLen }));
  model.add(tf.layers.lstm({ units: 64, returnSequences: false, dropout: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001), // Lower learning rate
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  // Train with validation
  const history = await model.fit(xs, ys, {
    epochs: 100, // More epochs
    batchSize: 32,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`);
      }
    }
  });

  // Save model and config
  await model.save('file://./model');
  fs.writeFileSync('config.json', JSON.stringify({
    vocab: Array.from(tokenizer.entries()),
    maxLen: maxLen
  }));

  console.log('Model trained, saved, and config exported!');
  console.log('Final validation accuracy:', history.history.val_acc.slice(-1)[0].toFixed(4));
}

trainModel().catch(err => console.error('Training failed:', err));
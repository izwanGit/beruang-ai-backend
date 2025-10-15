const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

let model;
async function loadModel() {
  model = await tf.loadLayersModel('file://./model/model.json');
  console.log('Model loaded');
}
loadModel();

const config = JSON.parse(fs.readFileSync('config.json'));
const tokenizer = new Map(config.vocab);
const maxLen = config.maxLen;

app.post('/classify', async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Missing description' });

  const texts = [description.toLowerCase()];
  const tokenized = texts.map(text => text.split(' ').map(word => tokenizer.get(word) || 0)); // 0 for unknown
  const padded = tokenized.map(seq => {
    while (seq.length < maxLen) seq.push(0);
    if (seq.length > maxLen) seq = seq.slice(0, maxLen);
    return seq;
  });

  const input = tf.tensor2d(padded);
  const prediction = model.predict(input);
  const score = (await prediction.data())[0];
  const category = score < 0.5 ? 'needs' : 'wants';

  res.json({ category });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
const fs = require('fs-extra');
const csv = require('csv-parser');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@xenova/transformers');

// --- CONFIGURATION ---
const CONFIG = {
    datasetPath: './chat_intents.csv',
    modelDir: './model_intent',
    epochs: 25,
    batchSize: 64, 
    embeddingDim: 384,
    splitRatio: 0.8
};

async function main() {
    console.log('\n[1/6] 📂 Loading dataset...');
    const rawData = [];
    await new Promise((resolve) => {
        fs.createReadStream(CONFIG.datasetPath)
            .pipe(csv())
            .on('data', (row) => { if(row.text && row.intent) rawData.push(row); })
            .on('end', resolve);
    });

    const uniqueIntents = [...new Set(rawData.map(r => r.intent))].sort();
    const intentMap = {}; 
    const labelMap = {};
    uniqueIntents.forEach((intent, i) => { intentMap[intent] = i; labelMap[i] = intent; });

    console.log(`      > Loaded ${rawData.length} samples.`);
    console.log(`      > Found ${uniqueIntents.length} distinct intents.`);

    console.log('\n[2/6] 🧠 Loading MiniLM...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log('\n[3/6] ⚡ Generating Embeddings (Large batch)...');
    tf.util.shuffle(rawData);
    
    const features = [];
    const labels = [];
    const total = rawData.length;
    
    for (let i = 0; i < total; i++) {
        const output = await extractor(rawData[i].text, { pooling: 'mean', normalize: true });
        features.push(Array.from(output.data));
        labels.push(intentMap[rawData[i].intent]);
        if ((i + 1) % 1000 === 0) process.stdout.write(`      > ${i + 1}/${total} done...\r`);
    }
    console.log(`\n      > Done.`);

    const splitIdx = Math.floor(features.length * CONFIG.splitRatio);
    const xs = tf.tensor2d(features);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), uniqueIntents.length);

    const xTrain = xs.slice([0, 0], [splitIdx, -1]);
    const yTrain = ys.slice([0, 0], [splitIdx, -1]);
    const xVal = xs.slice([splitIdx, 0], [-1, -1]);
    const yVal = ys.slice([splitIdx, 0], [-1, -1]);

    console.log('\n[4/6] 🏗️  Training Neural Network...');
    const model = tf.sequential();
    // Larger network for more complex decision boundaries
    model.add(tf.layers.dense({ inputShape: [CONFIG.embeddingDim], units: 256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 })); // Increased dropout for generalization
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: uniqueIntents.length, activation: 'softmax' }));

    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

    await model.fit(xTrain, yTrain, {
        epochs: CONFIG.epochs,
        batchSize: CONFIG.batchSize,
        validationData: [xVal, yVal],
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`      Epoch ${String(epoch + 1).padStart(2)} | Loss: ${logs.loss.toFixed(4)} | Acc: ${(logs.acc*100).toFixed(1)}% | Val: ${(logs.val_acc*100).toFixed(1)}%`);
            }
        }
    });

    console.log('\n[6/6] 📊 Classification Report (Validation Set):');
    const valPreds = model.predict(xVal).argMax(-1).dataSync();
    const valTrues = yVal.argMax(-1).dataSync();
    
    const stats = {};
    Object.values(labelMap).forEach(c => stats[c] = { tp:0, fp:0, fn:0, count:0 });

    for(let i=0; i<valTrues.length; i++) {
        const t = labelMap[valTrues[i]];
        const p = labelMap[valPreds[i]];
        if(stats[t]) {
            stats[t].count++;
            if(t===p) stats[t].tp++;
            else { stats[p].fp++; stats[t].fn++; }
        }
    }

    console.log('--------------------------------------------------------------------------------');
    console.log('Intent'.padEnd(30) + '| Precision | Recall  | F1-Score | Samples');
    console.log('--------------------------------------------------------------------------------');
    Object.keys(stats).sort().forEach(c => {
        const s = stats[c];
        if(s.count === 0) return;
        const prec = s.tp / (s.tp + s.fp) || 0;
        const rec = s.tp / (s.tp + s.fn) || 0;
        const f1 = 2 * ((prec*rec)/(prec+rec)) || 0;
        console.log(c.padEnd(30) + `|   ${(prec*100).toFixed(0)}%    ` + `|   ${(rec*100).toFixed(0)}%   ` + `|   ${f1.toFixed(2)}   ` + `|   ${s.count}`);
    });
    console.log('--------------------------------------------------------------------------------');

    await fs.ensureDir(CONFIG.modelDir);
    await model.save(`file://${CONFIG.modelDir}`);
    await fs.writeJson(`${CONFIG.modelDir}/metadata.json`, { labelMap });
    console.log('✅ Model Saved.');
}

main().catch(console.error);
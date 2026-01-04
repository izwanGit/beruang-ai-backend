const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
const fs = require('fs-extra');
const csv = require('csv-parser');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@xenova/transformers');

// ============================================================================
// 🐻 BERUANG INTENT TRAINER V2 - FYP VISUALIZATION EDITION
// ============================================================================
// Exports training curves and metrics for FYP report visualizations
// ============================================================================

const CONFIG = {
    datasetPath: './chat_intents.csv',
    modelDir: './model_intent',
    outputDir: './visualizations',
    epochs: 25,
    batchSize: 64,
    embeddingDim: 384,
    splitRatio: 0.8
};

// Training history storage
const trainingHistory = {
    epochs: [],
    trainLoss: [],
    trainAcc: [],
    valLoss: [],
    valAcc: []
};

async function main() {
    console.log('============================================================');
    console.log('   🐻 BERUANG INTENT TRAINER V2 - FYP EDITION');
    console.log('============================================================\n');

    // Ensure output directory exists
    await fs.ensureDir(CONFIG.outputDir);

    console.log('[1/7] 📂 Loading dataset...');
    const rawData = [];
    await new Promise((resolve) => {
        fs.createReadStream(CONFIG.datasetPath)
            .pipe(csv())
            .on('data', (row) => { if (row.text && row.intent) rawData.push(row); })
            .on('end', resolve);
    });

    const uniqueIntents = [...new Set(rawData.map(r => r.intent))].sort();
    const intentMap = {};
    const labelMap = {};
    uniqueIntents.forEach((intent, i) => { intentMap[intent] = i; labelMap[i] = intent; });

    console.log(`      > Loaded ${rawData.length.toLocaleString()} samples.`);
    console.log(`      > Found ${uniqueIntents.length} distinct intents.`);

    // Save intent distribution for visualization
    const intentCounts = {};
    rawData.forEach(r => {
        intentCounts[r.intent] = (intentCounts[r.intent] || 0) + 1;
    });
    await fs.writeJson(`${CONFIG.outputDir}/training_intent_counts.json`, intentCounts, { spaces: 2 });

    console.log('\n[2/7] 🧠 Loading MiniLM Sentence Transformer...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log('\n[3/7] ⚡ Generating Embeddings...');
    tf.util.shuffle(rawData);

    const features = [];
    const labels = [];
    const total = rawData.length;
    const startTime = Date.now();

    for (let i = 0; i < total; i++) {
        const output = await extractor(rawData[i].text, { pooling: 'mean', normalize: true });
        features.push(Array.from(output.data));
        labels.push(intentMap[rawData[i].intent]);

        if ((i + 1) % 2000 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = (i + 1) / elapsed;
            const remaining = ((total - i - 1) / rate / 60).toFixed(1);
            process.stdout.write(`      > ${i + 1}/${total} (${remaining} min remaining)...\r`);
        }
    }
    console.log(`\n      > Embedding complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    const splitIdx = Math.floor(features.length * CONFIG.splitRatio);
    const xs = tf.tensor2d(features);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), uniqueIntents.length);

    const xTrain = xs.slice([0, 0], [splitIdx, -1]);
    const yTrain = ys.slice([0, 0], [splitIdx, -1]);
    const xVal = xs.slice([splitIdx, 0], [-1, -1]);
    const yVal = ys.slice([splitIdx, 0], [-1, -1]);

    console.log(`\n      > Training set: ${splitIdx.toLocaleString()} samples`);
    console.log(`      > Validation set: ${(features.length - splitIdx).toLocaleString()} samples`);

    console.log('\n[4/7] 🏗️  Building Neural Network...');
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [CONFIG.embeddingDim], units: 256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.4 }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: uniqueIntents.length, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    console.log('\n[5/7] 🏃 Training Model...');
    console.log('─'.repeat(70));
    console.log('Epoch'.padEnd(8) + '| Train Loss | Train Acc | Val Loss | Val Acc');
    console.log('─'.repeat(70));

    await model.fit(xTrain, yTrain, {
        epochs: CONFIG.epochs,
        batchSize: CONFIG.batchSize,
        validationData: [xVal, yVal],
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                // Store history for visualization
                trainingHistory.epochs.push(epoch + 1);
                trainingHistory.trainLoss.push(logs.loss);
                trainingHistory.trainAcc.push(logs.acc);
                trainingHistory.valLoss.push(logs.val_loss);
                trainingHistory.valAcc.push(logs.val_acc);

                // Console output
                const epochStr = String(epoch + 1).padStart(2);
                const lossStr = logs.loss.toFixed(4).padStart(8);
                const accStr = (logs.acc * 100).toFixed(1).padStart(6) + '%';
                const valLossStr = logs.val_loss.toFixed(4).padStart(8);
                const valAccStr = (logs.val_acc * 100).toFixed(1).padStart(6) + '%';

                console.log(`  ${epochStr}   |   ${lossStr} |   ${accStr}  |  ${valLossStr} |  ${valAccStr}`);
            }
        }
    });
    console.log('─'.repeat(70));

    // Save training history for visualization
    await fs.writeJson(`${CONFIG.outputDir}/training_history.json`, trainingHistory, { spaces: 2 });
    console.log(`\n      > Training history saved to ${CONFIG.outputDir}/training_history.json`);

    console.log('\n[6/7] 📊 Generating Classification Report...');
    const valPreds = model.predict(xVal).argMax(-1).dataSync();
    const valTrues = yVal.argMax(-1).dataSync();

    // Confusion matrix data
    const confusionMatrix = {};
    const stats = {};
    Object.values(labelMap).forEach(c => stats[c] = { tp: 0, fp: 0, fn: 0, count: 0 });

    for (let i = 0; i < valTrues.length; i++) {
        const t = labelMap[valTrues[i]];
        const p = labelMap[valPreds[i]];

        // Confusion matrix
        if (!confusionMatrix[t]) confusionMatrix[t] = {};
        confusionMatrix[t][p] = (confusionMatrix[t][p] || 0) + 1;

        // Stats
        if (stats[t]) {
            stats[t].count++;
            if (t === p) stats[t].tp++;
            else { stats[p].fp++; stats[t].fn++; }
        }
    }

    // Save confusion matrix
    await fs.writeJson(`${CONFIG.outputDir}/confusion_matrix.json`, confusionMatrix, { spaces: 2 });

    // Classification report
    const classificationReport = [];
    console.log('─'.repeat(80));
    console.log('Intent'.padEnd(30) + '| Precision | Recall  | F1-Score | Samples');
    console.log('─'.repeat(80));

    let totalF1 = 0;
    let validClasses = 0;

    Object.keys(stats).sort().forEach(c => {
        const s = stats[c];
        if (s.count === 0) return;

        const prec = s.tp / (s.tp + s.fp) || 0;
        const rec = s.tp / (s.tp + s.fn) || 0;
        const f1 = 2 * ((prec * rec) / (prec + rec)) || 0;

        classificationReport.push({
            intent: c,
            precision: prec,
            recall: rec,
            f1Score: f1,
            samples: s.count
        });

        totalF1 += f1;
        validClasses++;

        const precStr = (prec * 100).toFixed(0) + '%';
        const recStr = (rec * 100).toFixed(0) + '%';
        const f1Str = f1.toFixed(2);

        console.log(c.padEnd(30) + `|   ${precStr.padStart(5)}   |   ${recStr.padStart(4)}  |   ${f1Str.padStart(4)}   |   ${s.count}`);
    });
    console.log('─'.repeat(80));

    const macroF1 = totalF1 / validClasses;
    console.log(`\nMacro F1 Score: ${macroF1.toFixed(4)}`);

    // Save classification report
    classificationReport.push({ intent: 'MACRO_AVERAGE', f1Score: macroF1, samples: valTrues.length });
    await fs.writeJson(`${CONFIG.outputDir}/classification_report.json`, classificationReport, { spaces: 2 });

    // Calculate overall accuracy
    let correct = 0;
    for (let i = 0; i < valTrues.length; i++) {
        if (valTrues[i] === valPreds[i]) correct++;
    }
    const accuracy = correct / valTrues.length;
    console.log(`Overall Accuracy: ${(accuracy * 100).toFixed(2)}%`);

    // Save final metrics
    const finalMetrics = {
        accuracy: accuracy,
        macroF1: macroF1,
        totalSamples: rawData.length,
        trainingSamples: splitIdx,
        validationSamples: features.length - splitIdx,
        intentCount: uniqueIntents.length,
        epochs: CONFIG.epochs,
        finalTrainLoss: trainingHistory.trainLoss[CONFIG.epochs - 1],
        finalValLoss: trainingHistory.valLoss[CONFIG.epochs - 1],
        finalTrainAcc: trainingHistory.trainAcc[CONFIG.epochs - 1],
        finalValAcc: trainingHistory.valAcc[CONFIG.epochs - 1]
    };
    await fs.writeJson(`${CONFIG.outputDir}/final_metrics.json`, finalMetrics, { spaces: 2 });

    console.log('\n[7/7] 💾 Saving Model...');
    await fs.ensureDir(CONFIG.modelDir);
    await model.save(`file://${CONFIG.modelDir}`);
    await fs.writeJson(`${CONFIG.modelDir}/metadata.json`, { labelMap });

    console.log('\n============================================================');
    console.log('   ✅ TRAINING COMPLETE!');
    console.log('============================================================');
    console.log(`\n📁 Model saved to: ${CONFIG.modelDir}`);
    console.log(`📊 Visualizations saved to: ${CONFIG.outputDir}`);
    console.log(`   • training_history.json (Loss/Accuracy curves)`);
    console.log(`   • confusion_matrix.json (Heatmap data)`);
    console.log(`   • classification_report.json (Per-intent metrics)`);
    console.log(`   • final_metrics.json (Summary statistics)`);
    console.log('============================================================');
}

main().catch(console.error);
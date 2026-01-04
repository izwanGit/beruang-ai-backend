const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================================
// 📊 BERUANG DATASET VISUALIZER - FYP REPORT EDITION
// ============================================================================
// Generates comprehensive statistics and exports data for visualization
// Output formats: JSON (for charts), CSV (for tables), TXT (console report)
// ============================================================================

const DATASET_PATH = './chat_intents.csv';
const OUTPUT_DIR = './visualizations';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function analyzeDataset() {
    console.log('=========================================================');
    console.log('   📊 BERUANG DATASET ANALYZER - FYP STATISTICS');
    console.log('=========================================================\n');

    const fileStream = fs.createReadStream(DATASET_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    const intentCounts = {};
    const intentSamples = {};  // Store sample texts per intent
    const textLengths = [];
    const wordCounts = [];
    const uniqueTexts = new Set();
    const duplicateTexts = [];

    // Word frequency for word cloud
    const wordFrequency = {};
    const wordFrequencyByIntent = {};

    rl.on('line', (line) => {
        lineCount++;
        if (lineCount === 1) return; // Skip header

        try {
            // Parse CSV line (handle quoted strings)
            const match = line.match(/^"(.*)","?([^"]+)"?$/) || line.match(/^"(.*)"\s*,\s*(.+)$/);
            if (!match) return;

            const text = match[1].replace(/""/g, '"').trim();
            const intent = match[2].trim();

            if (!text || !intent) return;

            // Count intents
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;

            // Store sample texts (first 5 per intent)
            if (!intentSamples[intent]) intentSamples[intent] = [];
            if (intentSamples[intent].length < 5) {
                intentSamples[intent].push(text);
            }

            // Text length stats
            textLengths.push(text.length);
            wordCounts.push(text.split(/\s+/).length);

            // Duplicates check
            if (uniqueTexts.has(text)) {
                duplicateTexts.push(text);
            } else {
                uniqueTexts.add(text);
            }

            // Word frequency
            const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            words.forEach(word => {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;

                if (!wordFrequencyByIntent[intent]) wordFrequencyByIntent[intent] = {};
                wordFrequencyByIntent[intent][word] = (wordFrequencyByIntent[intent][word] || 0) + 1;
            });

        } catch (err) {
            // Skip malformed lines
        }
    });

    await new Promise(resolve => rl.on('close', resolve));

    const total = lineCount - 1;

    // ========================================================================
    // CALCULATE STATISTICS
    // ========================================================================

    // Intent distribution
    const sortedIntents = Object.entries(intentCounts)
        .sort((a, b) => b[1] - a[1]);

    // Category grouping
    const categories = {
        'GROK (Complex/Analysis)': 0,
        'Local (App Help)': 0,
        'Garbage': 0
    };

    sortedIntents.forEach(([intent, count]) => {
        if (intent === 'COMPLEX_ADVICE') {
            categories['GROK (Complex/Analysis)'] += count;
        } else if (intent === 'GARBAGE') {
            categories['Garbage'] += count;
        } else {
            categories['Local (App Help)'] += count;
        }
    });

    // Text length statistics
    textLengths.sort((a, b) => a - b);
    const avgLength = textLengths.reduce((a, b) => a + b, 0) / textLengths.length;
    const medianLength = textLengths[Math.floor(textLengths.length / 2)];
    const minLength = textLengths[0];
    const maxLength = textLengths[textLengths.length - 1];

    // Word count statistics
    wordCounts.sort((a, b) => a - b);
    const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const medianWordCount = wordCounts[Math.floor(wordCounts.length / 2)];

    // Top words for word cloud
    const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);

    // ========================================================================
    // CONSOLE OUTPUT
    // ========================================================================

    console.log('📈 DATASET OVERVIEW');
    console.log('─'.repeat(60));
    console.log(`Total Samples:      ${total.toLocaleString()}`);
    console.log(`Unique Texts:       ${uniqueTexts.size.toLocaleString()}`);
    console.log(`Duplicate Texts:    ${duplicateTexts.length.toLocaleString()} (${(duplicateTexts.length / total * 100).toFixed(2)}%)`);
    console.log(`Total Intents:      ${Object.keys(intentCounts).length}`);
    console.log('');

    console.log('📊 CATEGORY DISTRIBUTION (For Pie Chart)');
    console.log('─'.repeat(60));
    Object.entries(categories).forEach(([cat, count]) => {
        const pct = (count / total * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(pct / 2));
        console.log(`${cat.padEnd(25)} ${count.toString().padStart(8)} (${pct.padStart(5)}%) ${bar}`);
    });
    console.log('');

    console.log('📋 INTENT DISTRIBUTION (For Bar Chart)');
    console.log('─'.repeat(60));
    sortedIntents.forEach(([intent, count]) => {
        const pct = (count / total * 100).toFixed(1);
        console.log(`${intent.padEnd(30)} ${count.toString().padStart(8)} (${pct.padStart(5)}%)`);
    });
    console.log('');

    console.log('📏 TEXT LENGTH STATISTICS (For Histogram)');
    console.log('─'.repeat(60));
    console.log(`Average Length:     ${avgLength.toFixed(1)} characters`);
    console.log(`Median Length:      ${medianLength} characters`);
    console.log(`Min Length:         ${minLength} characters`);
    console.log(`Max Length:         ${maxLength} characters`);
    console.log(`Average Word Count: ${avgWordCount.toFixed(1)} words`);
    console.log(`Median Word Count:  ${medianWordCount} words`);
    console.log('');

    console.log('🔤 TOP 20 WORDS (For Word Cloud)');
    console.log('─'.repeat(60));
    topWords.slice(0, 20).forEach(([word, count], i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${word.padEnd(20)} ${count}`);
    });
    console.log('');

    // ========================================================================
    // EXPORT DATA FOR VISUALIZATION
    // ========================================================================

    // 1. Intent Distribution (Bar Chart)
    const intentDistribution = sortedIntents.map(([intent, count]) => ({
        intent,
        count,
        percentage: (count / total * 100).toFixed(2)
    }));
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'intent_distribution.json'),
        JSON.stringify(intentDistribution, null, 2)
    );

    // 2. Category Distribution (Pie Chart)
    const categoryDistribution = Object.entries(categories).map(([category, count]) => ({
        category,
        count,
        percentage: (count / total * 100).toFixed(2)
    }));
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'category_distribution.json'),
        JSON.stringify(categoryDistribution, null, 2)
    );

    // 3. Text Length Histogram Data
    const lengthBuckets = {};
    const bucketSize = 10;
    textLengths.forEach(len => {
        const bucket = Math.floor(len / bucketSize) * bucketSize;
        const key = `${bucket}-${bucket + bucketSize - 1}`;
        lengthBuckets[key] = (lengthBuckets[key] || 0) + 1;
    });
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'text_length_histogram.json'),
        JSON.stringify(lengthBuckets, null, 2)
    );

    // 4. Word Cloud Data
    const wordCloudData = topWords.map(([word, count]) => ({
        text: word,
        value: count
    }));
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'word_cloud_data.json'),
        JSON.stringify(wordCloudData, null, 2)
    );

    // 5. Sample Texts per Intent
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'intent_samples.json'),
        JSON.stringify(intentSamples, null, 2)
    );

    // 6. Summary Statistics
    const summary = {
        totalSamples: total,
        uniqueTexts: uniqueTexts.size,
        duplicateCount: duplicateTexts.length,
        duplicatePercentage: (duplicateTexts.length / total * 100).toFixed(2),
        intentCount: Object.keys(intentCounts).length,
        textLengthStats: {
            average: avgLength.toFixed(1),
            median: medianLength,
            min: minLength,
            max: maxLength
        },
        wordCountStats: {
            average: avgWordCount.toFixed(1),
            median: medianWordCount
        },
        categoryBreakdown: categories,
        generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'dataset_summary.json'),
        JSON.stringify(summary, null, 2)
    );

    // 7. CSV Export for Excel/Sheets
    let csvContent = 'Intent,Count,Percentage\n';
    sortedIntents.forEach(([intent, count]) => {
        csvContent += `${intent},${count},${(count / total * 100).toFixed(2)}\n`;
    });
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'intent_distribution.csv'),
        csvContent
    );

    // ========================================================================
    // QUALITY CHECKS
    // ========================================================================

    console.log('✅ QUALITY CHECKS');
    console.log('─'.repeat(60));

    // Check for GROK routing coverage
    const grokCount = intentCounts['COMPLEX_ADVICE'] || 0;
    const grokPct = (grokCount / total * 100).toFixed(1);
    if (grokPct < 30) {
        console.log(`⚠️  COMPLEX_ADVICE coverage low: ${grokPct}% (target: >30%)`);
    } else {
        console.log(`✅ COMPLEX_ADVICE coverage: ${grokPct}% (good for Grok routing)`);
    }

    // Check for imbalanced intents
    const avgPerIntent = total / Object.keys(intentCounts).length;
    const imbalanced = sortedIntents.filter(([_, count]) => count < avgPerIntent * 0.1);
    if (imbalanced.length > 0) {
        console.log(`⚠️  ${imbalanced.length} intents have low representation (<10% of average)`);
        imbalanced.slice(0, 5).forEach(([intent, count]) => {
            console.log(`     - ${intent}: ${count} samples`);
        });
    } else {
        console.log('✅ No severely imbalanced intents');
    }

    // Duplicate check
    if (duplicateTexts.length > total * 0.1) {
        console.log(`⚠️  High duplicate rate: ${(duplicateTexts.length / total * 100).toFixed(1)}%`);
    } else {
        console.log(`✅ Duplicate rate acceptable: ${(duplicateTexts.length / total * 100).toFixed(1)}%`);
    }

    console.log('');
    console.log('=========================================================');
    console.log(`📁 Visualization data exported to: ${path.resolve(OUTPUT_DIR)}`);
    console.log('   • intent_distribution.json (Bar Chart)');
    console.log('   • category_distribution.json (Pie Chart)');
    console.log('   • text_length_histogram.json (Histogram)');
    console.log('   • word_cloud_data.json (Word Cloud)');
    console.log('   • intent_samples.json (Sample Texts)');
    console.log('   • dataset_summary.json (Statistics)');
    console.log('   • intent_distribution.csv (Excel Export)');
    console.log('=========================================================');
}

analyzeDataset().catch(console.error);

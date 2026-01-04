const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
const fs = require('fs-extra');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@xenova/transformers');

// ============================================================================
// 🐻 BERUANG INTENT TESTER V2 - LOGIC ERROR PROOF EDITION
// ============================================================================
// Tests the trained model against critical test cases
// Focuses on the problem cases that were previously misclassified
// ============================================================================

const MODEL_PATH = 'file://./model_intent/model.json';
const METADATA_PATH = './model_intent/metadata.json';
const OUTPUT_PATH = './visualizations/test_results.json';

// ============================================================================
// CRITICAL TEST CASES - Must be correct!
// ============================================================================

const CRITICAL_TESTS = [
    // GROUP A: TRANSACTION QUERIES → MUST GO TO GROK
    { text: "what did i do yesterday", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "what i did yesterday", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "what did i spend today", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "how much did i spend this week", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "my spending last month", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "show me my expenses for december", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "where did my money go", expected: "COMPLEX_ADVICE", category: "Transaction Query" },
    { text: "spending analysis", expected: "COMPLEX_ADVICE", category: "Transaction Query" },

    // GROUP B: BALANCE QUERIES → MUST GO TO GROK
    { text: "check my balance", expected: "COMPLEX_ADVICE", category: "Balance Query" },
    { text: "what's my balance", expected: "COMPLEX_ADVICE", category: "Balance Query" },
    { text: "how much money do i have", expected: "COMPLEX_ADVICE", category: "Balance Query" },
    { text: "remaining budget", expected: "COMPLEX_ADVICE", category: "Balance Query" },
    { text: "how much can i spend", expected: "COMPLEX_ADVICE", category: "Balance Query" },

    // GROUP C: NAVIGATION → MUST STAY LOCAL (Action verbs)
    { text: "go to expenses", expected: "NAV_EXPENSES", category: "Navigation" },
    { text: "show expenses screen", expected: "NAV_EXPENSES", category: "Navigation" },
    { text: "open expenses tab", expected: "NAV_EXPENSES", category: "Navigation" },
    { text: "go to home", expected: "NAV_HOME", category: "Navigation" },
    { text: "back to dashboard", expected: "NAV_HOME", category: "Navigation" },
    { text: "go to profile", expected: "NAV_PROFILE", category: "Navigation" },
    { text: "open chat", expected: "NAV_CHATBOT", category: "Navigation" },

    // GROUP D: APP HELP → MUST STAY LOCAL
    { text: "how to add expense", expected: "HELP_ADD_TRANSACTION", category: "App Help" },
    { text: "how to add income", expected: "HELP_ADD_INCOME", category: "App Help" },
    { text: "how to save", expected: "HELP_SAVINGS_SCREEN", category: "App Help" },
    { text: "how to get xp", expected: "HELP_GAMIFICATION_XP", category: "App Help" },
    { text: "evolution stages", expected: "HELP_GAMIFICATION_LEVELS", category: "App Help" },
    { text: "can i withdraw", expected: "HELP_WITHDRAW_SAVINGS", category: "App Help" },
    { text: "scan receipt", expected: "HELP_RECEIPT_SCAN", category: "App Help" },
    { text: "how does categorization work", expected: "HELP_AI_CATEGORIZATION", category: "App Help" },

    // GROUP E: DEFINITIONS → MUST STAY LOCAL
    { text: "what is 50/30/20", expected: "DEF_50_30_20", category: "Definition" },
    { text: "what are needs", expected: "DEF_NEEDS", category: "Definition" },
    { text: "what are wants", expected: "DEF_WANTS", category: "Definition" },
    { text: "what is emergency fund", expected: "DEF_EMERGENCY_FUND", category: "Definition" },
    { text: "what is inflation", expected: "DEF_INFLATION", category: "Definition" },
    { text: "what is kwsp", expected: "DEF_KWSP", category: "Definition" },

    // GROUP F: SOCIAL → MUST STAY LOCAL
    { text: "hello", expected: "GREETING", category: "Social" },
    { text: "thanks", expected: "THANK_YOU", category: "Social" },
    { text: "bye", expected: "BYE", category: "Social" },
    { text: "tell me a joke", expected: "JOKE", category: "Social" },
    { text: "who are you", expected: "WHO_ARE_YOU", category: "Social" },

    // GROUP G: COMPLEX ADVICE → MUST GO TO GROK
    { text: "should i invest in crypto", expected: "COMPLEX_ADVICE", category: "Complex Advice" },
    { text: "how to buy a house", expected: "COMPLEX_ADVICE", category: "Complex Advice" },
    { text: "is it worth getting a new car", expected: "COMPLEX_ADVICE", category: "Complex Advice" },
    { text: "what is the inflation rate in malaysia", expected: "COMPLEX_ADVICE", category: "Complex Advice" },
    { text: "idk", expected: "COMPLEX_ADVICE", category: "Uncertain" },
    { text: "not sure", expected: "COMPLEX_ADVICE", category: "Uncertain" },

    // GROUP H: GARBAGE → MUST BE FILTERED
    { text: "asdfgh", expected: "GARBAGE", category: "Garbage" },
    { text: "qwerty123", expected: "GARBAGE", category: "Garbage" },
    { text: "zzzzzz", expected: "GARBAGE", category: "Garbage" },

    // GROUP I: TESTING → MUST STAY LOCAL
    { text: "testing", expected: "TESTING", category: "System Check" },
    { text: "test", expected: "TESTING", category: "System Check" },
    { text: "is this working", expected: "TESTING", category: "System Check" },
];

async function main() {
    console.log('============================================================');
    console.log('   🐻 BERUANG INTENT TESTER V2 - LOGIC ERROR PROOF');
    console.log('============================================================\n');

    // Load model
    console.log('Loading model...');
    const metadata = await fs.readJson(METADATA_PATH);
    const labelMap = metadata.labelMap;
    const model = await tf.loadLayersModel(MODEL_PATH);
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded.\n');

    // Run tests
    console.log('Running critical test cases...\n');
    console.log('─'.repeat(90));
    console.log('Query'.padEnd(45) + ' | ' + 'Expected'.padEnd(20) + ' | ' + 'Predicted'.padEnd(20) + ' | Result');
    console.log('─'.repeat(90));

    const results = {
        total: CRITICAL_TESTS.length,
        passed: 0,
        failed: 0,
        byCategory: {},
        failures: []
    };

    for (const test of CRITICAL_TESTS) {
        // Initialize category stats
        if (!results.byCategory[test.category]) {
            results.byCategory[test.category] = { total: 0, passed: 0, failed: 0 };
        }
        results.byCategory[test.category].total++;

        // Get prediction
        const output = await extractor(test.text, { pooling: 'mean', normalize: true });
        const embedding = tf.tensor2d([Array.from(output.data)]);
        const prediction = model.predict(embedding);
        const probs = prediction.dataSync();
        const maxProb = Math.max(...probs);
        const intentIndex = probs.indexOf(maxProb);
        const predictedIntent = labelMap[intentIndex] || "UNKNOWN";
        const confidence = (maxProb * 100).toFixed(1);

        // Check result
        const passed = predictedIntent === test.expected;

        if (passed) {
            results.passed++;
            results.byCategory[test.category].passed++;
        } else {
            results.failed++;
            results.byCategory[test.category].failed++;
            results.failures.push({
                text: test.text,
                expected: test.expected,
                predicted: predictedIntent,
                confidence: confidence,
                category: test.category
            });
        }

        // Color output
        const color = passed ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        const status = passed ? '✅ PASS' : '❌ FAIL';

        console.log(
            test.text.padEnd(45).slice(0, 45) + ' | ' +
            test.expected.padEnd(20) + ' | ' +
            color + predictedIntent.padEnd(20) + reset + ' | ' +
            color + status + reset + ` (${confidence}%)`
        );

        embedding.dispose();
        prediction.dispose();
    }

    console.log('─'.repeat(90));

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('─'.repeat(50));
    console.log(`Total Tests:  ${results.total}`);
    console.log(`Passed:       \x1b[32m${results.passed}\x1b[0m (${(results.passed / results.total * 100).toFixed(1)}%)`);
    console.log(`Failed:       \x1b[31m${results.failed}\x1b[0m (${(results.failed / results.total * 100).toFixed(1)}%)`);

    console.log('\n📋 BY CATEGORY');
    console.log('─'.repeat(50));
    Object.entries(results.byCategory).forEach(([cat, stats]) => {
        const pct = (stats.passed / stats.total * 100).toFixed(0);
        const color = stats.failed === 0 ? '\x1b[32m' : '\x1b[33m';
        console.log(`${cat.padEnd(20)} ${color}${stats.passed}/${stats.total} (${pct}%)\x1b[0m`);
    });

    if (results.failures.length > 0) {
        console.log('\n❌ FAILURES TO FIX');
        console.log('─'.repeat(50));
        results.failures.forEach(f => {
            console.log(`  "${f.text}"`);
            console.log(`    Expected: ${f.expected}, Got: ${f.predicted} (${f.confidence}%)`);
        });
    }

    // Save results for visualization
    await fs.writeJson(OUTPUT_PATH, results, { spaces: 2 });
    console.log(`\n📁 Results saved to: ${OUTPUT_PATH}`);

    console.log('\n============================================================');
    if (results.failed === 0) {
        console.log('   🎉 ALL TESTS PASSED! NO LOGIC ERRORS DETECTED!');
    } else {
        console.log(`   ⚠️  ${results.failed} TESTS FAILED - REVIEW NEEDED`);
    }
    console.log('============================================================');
}

main().catch(console.error);
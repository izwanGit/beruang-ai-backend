const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || ((value) => value === null || value === undefined);
const fs = require('fs-extra');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@xenova/transformers');

const MODEL_PATH = 'file://./model_intent/model.json';
const METADATA_PATH = './model_intent/metadata.json';

const TEST_CASES = [
    // --- GROUP A: LOCAL APP HELP ---
    "Hey Beruang", "Who created you?", "Why is your name Beruang?",
    "Does this app work offline?", "Can I connect my Maybank account?",
    "How do I add my salary?", "I got a scholarship for 6 months, how to allocate?",
    "Can I withdraw from my savings?", "What is the 50/30/20 rule?",
    "Is netflix a want or need?", "I spent too much money today",
    "Tell me a joke", "Change avatar", "Go to profile", "Where is chat?",

    // --- GROUP B: COMPLEX ADVICE (GROK) ---
    "How to start investing in crypto?", "Should I buy a new Honda City?",
    "Is it better to pay off PTPTN or invest?", "I want to quit my job and freelance",
    "What is the inflation rate in Malaysia?", "How to file income tax lhdn",
    "Should I buy gold or bitcoin?", "Is it a good time to buy a house?",
    "How to invest in stocks for beginners", "Strategies for retirement planning",
    "Pros and cons of credit cards", "Outlook for technology sector",
    "idk", "nothing", "not sure",
    
    // --- GROUP C: GENERAL CHAT (GROK) - KEY FIX ---
    "I like coffee", "What is my name?", "Tell me a story",
    "Do you like humans?", "What time is it?", "I am bored",
    
    // --- GROUP D: GARBAGE (IGNORE) ---
    "asdf ghjkl", "system error undefined", "bla bla bla",
    "1234567890", "qwertyuiop", "random text here"
];

async function main() {
    const metadata = await fs.readJson(METADATA_PATH);
    const labelMap = metadata.labelMap;

    console.log("Loading Brain...");
    const model = await tf.loadLayersModel(MODEL_PATH);
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log("\n💬 Inference Results:\n");
    console.log("Query".padEnd(45) + " | " + "Predicted Intent".padEnd(25) + " | " + "Target");
    console.log("-".repeat(90));

    let localCount = 0;
    let grokCount = 0;
    let ignoreCount = 0;

    for (const text of TEST_CASES) {
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        const embedding = tf.tensor2d([Array.from(output.data)]);
        
        const prediction = model.predict(embedding);
        const probs = prediction.dataSync();
        const maxProb = Math.max(...probs);
        const intentIndex = probs.indexOf(maxProb);
        
        const intent = labelMap[intentIndex] || "UNKNOWN";
        const conf = (maxProb * 100).toFixed(1) + "%";

        let target = "";
        let color = "\x1b[37m"; 

        if (intent === "COMPLEX_ADVICE") {
            target = "🤖 GROK API";
            color = "\x1b[36m"; // Cyan
            grokCount++;
        } else if (intent === "GARBAGE") {
            target = "🗑️  IGNORE";
            color = "\x1b[31m"; // Red
            ignoreCount++;
        } else {
            target = "✅ LOCAL DB";
            color = "\x1b[32m"; // Green
            localCount++;
        }

        console.log(
            text.padEnd(45).slice(0, 45) + " | " + 
            color + intent.padEnd(25) + "\x1b[0m | " + 
            color + target + ` (${conf})` + "\x1b[0m"
        );
        
        embedding.dispose();
        prediction.dispose();
    }
}

main().catch(console.error);
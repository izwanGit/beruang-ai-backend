const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. CONFIGURATION
// ============================================================================
const INPUT_JSON_FILE = './responses.json';
const OUTPUT_CSV_FILE = './chat_intents.csv';

// VOLUME SETTINGS: We need MASSIVE data for Complex Advice to outweigh local overconfidence
const SAMPLES_PER_COMPLEX_TOPIC = 2500; // 2500 * 5 categories = 12,500 Complex Rows
const SAMPLES_PER_GARBAGE = 2000;       
const JSON_AUGMENTATION_FACTOR = 100;   // 100 variations per local JSON pattern

const COMPLEX_LABEL = "COMPLEX_ADVICE";
const GARBAGE_LABEL = "GARBAGE";

// ============================================================================
// 2. "GROK" TOPICS (Things we want Grok to handle)
// ============================================================================

const COMPLEX_TOPICS = {
    // A. DEEP FINANCE
    INVESTMENT: [
        "invest", "crypto", "bitcoin", "stocks", "bursa", "gold", "unit trust", "asb", 
        "tabung haji", "forex", "trading", "dividend", "roi", "portfolio", "robot advisor",
        "wahed", "stashaway", "luno", "binance", "ethereum", "dogecoin", "nft", "sukuk"
    ],
    // B. CAREER & LIFE
    CAREER: [
        "salary", "job", "career", "raise", "bonus", "promotion", "resign", "quit", 
        "interview", "resume", "side hustle", "freelance", "gig economy", "business", 
        "startup", "entrepreneur", "minimum wage", "internship", "work life balance"
    ],
    // C. BIG PURCHASES
    PURCHASES: [
        "buy house", "property", "mortgage", "loan", "car", "myvi", "honda", "superbike",
        "iphone", "ps5", "gaming pc", "laptop", "expensive", "afford", "installment",
        "credit card", "buy now pay later", "bnpl", "shopee pay", "e-wallet"
    ],
    // D. MACRO ECONOMICS (Real-time data)
    FINANCE_DATA: [
        "inflation rate", "unemployment rate", "exchange rate", "GDP", "economic growth",
        "OPR rate", "interest rate", "tax relief", "budget 2025"
    ],
    // E. GENERAL CONVERSATION & USER QUERIES (CRITICAL FIX)
    // We teach the model that "Random Chat" = GROK
    GENERAL_CHAT: [
        "I like coffee", "What is the weather?", "Tell me a story", "Are you stupid?",
        "What is my name?", "Do you know me?", "What do you know about me?",
        "My profile", "My details", "I am bored", "Sing a song", "What time is it?",
        "Do you like humans?", "What is 2+2?", "History of Malaysia", "Who is the prime minister?"
    ]
};

const COMPLEX_STARTERS = [
    "should i", "how do i", "is it worth", "tell me about", "advice on", 
    "what is the best way to", "pros and cons of", "thoughts on", "help me with", 
    "do you think", "can you explain", "give me tips for", "guide me on",
    "is it a good idea to", "how to start", "opinion on", "recommendation for",
    "strategies for", "analysis of", "outlook for", "prediction for",
    "idk", "nothing", "not sure", "maybe", "i guess", "just wondering"
];

// Explicit "Rate" questions starter
const RATE_STARTERS = ["what is the", "current", "tell me the", "latest", "rate of"];

const MODIFIERS = [
    "right now", "in malaysia", "for beginners", "given my income", "at my age", 
    "with low risk", "for the future", "in 2025", "for students", "with small capital",
    "safely", "fast", "with no experience", "as a fresh grad", "urgently",
    "currently", "latest", "rate", "statistics"
];

const GARBAGE_INPUTS = [
    "asdf", "qwerty", "zzzz", "v6ff7w", "aaaaa", "...", "x", "!!", "?!", 
    "bla bla", "12345", "undefined", "null", "[object Object]", "system error", 
    "fsdfsdf", "hgfd", "jklo", "mnbv", "poiu", "trewq", "yuiop", "lzxcv", "b nm"
];

// ============================================================================
// 3. GENERATORS
// ============================================================================

function randomChoice(arr) { 
    return arr[Math.floor(Math.random() * arr.length)]; 
}

function introduceTypo(text) {
    if (Math.random() > 0.4) return text; 
    const chars = text.split('');
    if (chars.length < 3) return text; 
    const idx = Math.floor(Math.random() * (chars.length - 2));
    const type = Math.random();
    if (type < 0.33) { const temp = chars[idx]; chars[idx] = chars[idx+1]; chars[idx+1] = temp; }
    else if (type < 0.66) { chars.splice(idx, 1); }
    else { chars.splice(idx, 0, chars[idx]); }
    return chars.join('');
}

// 1. Generate "Complex" Data
function generateComplexData() {
    const rows = [];
    console.log(`\n🔹 Generating Complex Advice Data (Target: GROK)...`);
    
    // PART A: Topic Combinations
    for (const [category, keywords] of Object.entries(COMPLEX_TOPICS)) {
        console.log(`   ➜ Generating ${SAMPLES_PER_COMPLEX_TOPIC} rows for ${category}...`);
        for (let i = 0; i < SAMPLES_PER_COMPLEX_TOPIC; i++) {
            
            // Special handling for GENERAL_CHAT (Don't always use complex starters)
            if (category === "GENERAL_CHAT") {
                const topic = randomChoice(keywords);
                // 50% chance to use starter, 50% raw topic
                let text = Math.random() > 0.5 ? `${randomChoice(COMPLEX_STARTERS)} ${topic}` : topic;
                rows.push(`"${introduceTypo(text)}",${COMPLEX_LABEL}`);
                continue;
            }

            const starter = randomChoice(COMPLEX_STARTERS);
            let text = "";
            
            // Handle filler words (idk, nothing) specially
            if (["idk", "nothing", "not sure", "maybe"].includes(starter)) {
                text = starter; 
            } else {
                const topic = randomChoice(keywords);
                text = `${starter} ${topic}`;
                if (Math.random() > 0.5) text += ` ${randomChoice(MODIFIERS)}`;
            }
            rows.push(`"${introduceTypo(text)}",${COMPLEX_LABEL}`);
        }
    }

    // PART B: Explicit "Rate" questions (Fix for Inflation issue)
    const RATE_METRICS = ["inflation", "unemployment", "interest", "OPR", "exchange", "poverty", "tax"];
    for(let i=0; i<2000; i++) {
        const metric = randomChoice(RATE_METRICS);
        const starter = randomChoice(RATE_STARTERS);
        const text = `${starter} ${metric} rate`; 
        rows.push(`"${introduceTypo(text)}",${COMPLEX_LABEL}`);
    }

    return rows;
}

// 2. Generate "Local" Data
function generateLocalData() {
    const rows = [];
    console.log(`\n🔹 Processing Local Intents from responses.json...`);
    
    try {
        const rawContent = fs.readFileSync(INPUT_JSON_FILE, 'utf8');
        let json = JSON.parse(rawContent);
        if (json.intents) json = json.intents; 
        
        json.forEach(item => {
            const tag = item.tag;
            const patterns = item.patterns || [];
            
            patterns.forEach(pattern => {
                rows.push(`"${pattern.replace(/"/g, '""')}",${tag}`);
                rows.push(`"${pattern.toLowerCase().replace(/"/g, '""')}",${tag}`);
                for (let i = 0; i < JSON_AUGMENTATION_FACTOR; i++) {
                    const variant = introduceTypo(pattern.toLowerCase());
                    rows.push(`"${variant.replace(/"/g, '""')}",${tag}`);
                }
            });
        });
        
    } catch (error) {
        console.error("!!! Error reading responses.json:", error.message);
    }
    return rows;
}

// 3. Generate Garbage
function generateGarbage() {
    const rows = [];
    for (let i = 0; i < SAMPLES_PER_GARBAGE; i++) {
        const base = randomChoice(GARBAGE_INPUTS);
        rows.push(`"${introduceTypo(base)}",${GARBAGE_LABEL}`);
    }
    return rows;
}

// ============================================================================
// 4. MAIN
// ============================================================================
function main() {
    console.log("=========================================");
    console.log("   🚀 BERUANG SUPER-GENERATOR V6 🚀");
    console.log("=========================================");
    
    const complexRows = generateComplexData();
    const localRows = generateLocalData();
    const garbageRows = generateGarbage();
    
    const allRows = [...complexRows, ...localRows, ...garbageRows];
    
    // Shuffle
    for (let i = allRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRows[i], allRows[j]] = [allRows[j], allRows[i]];
    }
    
    const csvContent = 'text,intent\n' + allRows.join('\n');
    fs.writeFileSync(OUTPUT_CSV_FILE, csvContent);
    
    console.log(`\n✅ COMPLETED SUCCESSFULLY!`);
    console.log(`   📁 Saved to: ${path.resolve(OUTPUT_CSV_FILE)}`);
    console.log(`   📊 Total Samples: ${allRows.length}`);
}

main();
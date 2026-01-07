const fs = require('fs');
const path = require('path');

// ============================================================================
// 🐻 BERUANG INTENT DATASET GENERATOR V7 - LOGIC-ERROR-PROOF EDITION
// ============================================================================
// Key Fixes:
// 1. Transaction queries (what did i do yesterday) → GROK
// 2. Balance queries (check my balance) → GROK  
// 3. Temporal modifiers force GROK
// 4. NAV_* intents use strict ACTION verbs only
// 5. Removed GARBAGE/TESTING conflicts
// ============================================================================

const INPUT_JSON_FILE = './responses.json';
const OUTPUT_CSV_FILE = './chat_intents.csv';

// VOLUME SETTINGS - TARGET: 80,000+ SAMPLES
const SAMPLES_PER_COMPLEX_TOPIC = 3000;     // 3000 * 6 categories = 18,000
const SAMPLES_PER_GROK_QUERY = 2500;         // Transaction/Balance queries
const SAMPLES_PER_GARBAGE = 3000;
const JSON_AUGMENTATION_FACTOR = 150;        // 150 variations per local pattern
const TEMPORAL_SAMPLES = 3000;               // Date-based queries

const COMPLEX_LABEL = "COMPLEX_ADVICE";
const GARBAGE_LABEL = "GARBAGE";

// ============================================================================
// 0. EXPLICIT TYPO MAPPINGS (High-confidence typos for common intents)
// ============================================================================

const EXPLICIT_TYPOS = {
    GREETING: [
        "helli", "helllo", "heloo", "helo", "hii", "hai", "hiii", "hellooo",
        "heyy", "heey", "heyyo", "heya", "hllo", "helo", "hellp", "helol",
        "holla", "ello", "elo", "hyy", "hoi", "helo there", "helloo",
        "gud morning", "gd morning", "mornin", "morningg"
    ],
    BYE: [
        "byee", "bey", "byeee", "goodby", "gudbye", "gdbye", "laterr",
        "ltr", "laterz", "bb", "seeyou", "see ya", "c ya", "gn", "gdnight"
    ],
    THANK_YOU: [
        "thnx", "thnks", "thankss", "ty", "tyvm", "tanks", "thanku",
        "tq", "tkss", "thank u", "thx bear", "tysm"
    ],
    HELP_SAVINGS_SCREEN: [
        "savigns", "savins", "savinsg", "svings", "savng", "how savigns",
        "savingss", "go to svings", "savings scrn"
    ],
    HELP_ADD_TRANSACTION: [
        "transction", "transation", "trnsaction", "transacton",
        "add transction", "add transation", "new transction"
    ]
};

// SINGLE-WORD AMBIGUOUS PATTERNS → These need clarification, route to GROK
const AMBIGUOUS_SINGLE_WORDS = [
    "money", "help", "budget", "save", "spend", "tips", "advice",
    "finance", "bank", "loan", "debt", "income", "salary", "invest"
];

// ============================================================================
// 1. GROK QUERY PATTERNS (These MUST go to Grok for analysis)
// ============================================================================

const GROK_QUERIES = {
    // A. TRANSACTION ANALYSIS (User wants to know their spending)
    TRANSACTION_ANALYSIS: [
        "what did i do yesterday",
        "what did i spend today",
        "how much did i spend this week",
        "show me my spending last month",
        "what were my expenses",
        "analyze my transactions",
        "summarize my spending",
        "give me a breakdown of my expenses",
        "what did i buy",
        "my purchase history",
        "calculate my total spending",
        "spending analysis",
        "expense breakdown",
        "where did my money go",
        "what happened to my budget",
        "track my spending",
        "spending report",
        "monthly spending",
        "weekly expenses",
        "daily transactions"
    ],

    // B. BALANCE QUERIES (User wants current balance info)
    BALANCE_CHECK: [
        "check my balance",
        "what's my balance",
        "how much money do i have",
        "what's my budget status",
        "remaining budget",
        "wallet balance",
        "how much can i spend",
        "available balance",
        "budget remaining",
        "money left",
        "funds available",
        "how much is left",
        "check my budget",
        "budget check",
        "current balance",
        "account balance",
        "show my balance",
        "tell me my balance"
    ],

    // C. SAVINGS QUERIES (User wants savings analysis)
    SAVINGS_ANALYSIS: [
        "how much did i save",
        "my savings progress",
        "savings status",
        "am i on track to save",
        "saving goal progress",
        "how are my savings",
        "savings summary",
        "total saved",
        "savings this month",
        "savings analysis"
    ],

    // D. LOCATION QUERIES (Restaurant/Hotel/Place recommendations → Must use web search)
    LOCATION_QUERIES: [
        "makanan sedap", "makan best", "makan sedap", "restaurant best",
        "kedai makan best", "cafe sedap", "warung best", "kedai kopi sedap",
        "hotel murah", "hotel best", "hostel murah", "homestay best",
        "penginapan murah", "resort best", "tempat best", "place to visit",
        "makanan sedap kat", "makan best dekat", "hotel murah di",
        "restoran sedap near", "cafe best around", "tempat makan",
        "recommend food", "recommend restaurant", "recommend hotel",
        "food recommendation", "restaurant recommendation", "where to eat",
        "where to stay", "best place to eat", "best place to stay"
    ]
};

// LOCATION NAMES - These combined with food/hotel keywords → GROK
const LOCATION_NAMES = [
    "tapah", "ipoh", "kl", "kuala lumpur", "penang", "johor", "melaka",
    "selangor", "perak", "kedah", "kelantan", "terengganu", "pahang",
    "ttdi", "kepala batas", "pangkor", "putrajaya", "kampung baru",
    "tambun", "cameron", "genting", "langkawi", "sabah", "sarawak",
    "petaling jaya", "shah alam", "subang", "bangsar", "mont kiara",
    "cheras", "ampang", "kajang", "klang", "setapak", "sentul",
    "taiping", "teluk intan", "lumut", "sitiawan", "batu gajah",
    "bukit merah", "sungai petani", "alor setar", "kangar", "kota bharu",
    "kuantan", "temerloh", "bentong", "raub", "kuala terengganu",
    "dungun", "marang", "besut", "setiu", "jerteh", "kuala besut",
    "tapah road", "jalan baldwin", "pekan tapah", "bidor", "slim river"
];

// FOLLOW-UP PATTERNS - Short queries that need conversation history
const FOLLOWUP_PATTERNS = [
    "if hotel?", "kalau hotel?", "yang halal?", "yang murah?",
    "nak yang halal", "nak yang murah", "yang dekat?", "dekat mana?",
    "yang best?", "yang sedap?", "yang confirmed?", "yang cheap?",
    "kalau dekat situ?", "kalau kat sana?", "yang recommend?",
    "ada lagi?", "yang lain?", "option lain?", "lagi suggestion?",
    "yang baru?", "yang popular?", "yang trending?", "yang viral?",
    "macam mana nak order?", "macam mana nak book?", "how to order?",
    "how to book?", "bukak dekat mana?", "bukak pukul berapa?",
    "tutup pukul berapa?", "ada delivery?", "boleh takeaway?"
];

// MALAY SLANG / INFORMAL - Should NOT trigger GREETING or other wrong intents
const MALAY_SLANG_GROK = [
    "aku melayu", "aku islam", "aku cina", "aku india", "aku kristian",
    "aku hindu", "aku buddha", "saya melayu", "saya islam",
    "tolong aku", "help aku", "bro tolong", "tolong la bro",
    "aku nak", "saya nak", "gua nak", "aku mau",
    "aku perlukan", "saya perlukan", "gua perlukan"
];

// TEMPORAL KEYWORDS - Any query with these should route to GROK
const TEMPORAL_KEYWORDS = [
    "yesterday", "today", "last week", "this week", "last month", "this month",
    "december", "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "last year", "this year", "past week", "recent", "lately"
];

// TEMPORAL QUERY STARTERS - Combined with temporal keywords
const TEMPORAL_STARTERS = [
    "what did i",
    "how much did i spend",
    "my spending",
    "my expenses",
    "transactions for",
    "expenses on",
    "spending on",
    "what happened",
    "summary for",
    "breakdown for"
];

// ============================================================================
// 2. COMPLEX ADVICE TOPICS (Original Grok-bound topics)
// ============================================================================

const COMPLEX_TOPICS = {
    // A. DEEP FINANCE
    INVESTMENT: [
        "invest", "crypto", "bitcoin", "stocks", "bursa", "gold", "unit trust", "asb",
        "tabung haji", "forex", "trading", "dividend", "roi", "portfolio", "robot advisor",
        "wahed", "stashaway", "luno", "binance", "ethereum", "dogecoin", "nft", "sukuk",
        "bonds", "mutual fund", "reits", "amanah saham"
    ],
    // B. CAREER & LIFE
    CAREER: [
        "salary negotiation", "job offer", "career change", "raise", "bonus", "promotion",
        "resign", "quit job", "interview tips", "resume advice", "side hustle ideas",
        "freelance", "gig economy", "start business", "startup", "entrepreneur",
        "minimum wage", "internship", "work life balance", "passive income"
    ],
    // C. BIG PURCHASES
    PURCHASES: [
        "buy house", "property investment", "mortgage rates", "car loan", "myvi price",
        "honda city", "proton saga", "superbike", "iphone", "ps5", "gaming pc", "laptop",
        "expensive purchase", "afford", "installment plan", "credit card debt",
        "buy now pay later", "bnpl", "shopee pay later", "atome", "grab pay later"
    ],
    // D. MACRO ECONOMICS
    FINANCE_DATA: [
        "inflation rate malaysia", "unemployment rate", "exchange rate rm", "gdp growth",
        "opr rate", "interest rate bnm", "tax relief 2025", "budget 2025", "cost of living",
        "income tax", "lhdn", "epf dividend", "socso", "perkeso"
    ],
    // E. LIFE PLANNING
    LIFE_ADVICE: [
        "should i get married", "wedding budget", "baby expenses", "education fund",
        "retirement planning", "financial independence", "fire movement", "early retirement",
        "insurance coverage", "takaful", "life insurance", "medical card"
    ],
    // F. GENERAL CHAT (Random stuff → GROK)
    GENERAL_CHAT: [
        "i like coffee", "what is the weather", "tell me a story", "are you stupid",
        "what is my name", "do you know me", "what do you know about me",
        "my profile", "my details", "i am bored", "sing a song", "what time is it",
        "do you like humans", "what is 2+2", "history of malaysia", "who is the prime minister",
        "tell me something interesting", "random fact", "meaning of life"
    ]
};

const COMPLEX_STARTERS = [
    "should i", "how do i", "is it worth", "tell me about", "advice on",
    "what is the best way to", "pros and cons of", "thoughts on", "help me with",
    "do you think", "can you explain", "give me tips for", "guide me on",
    "is it a good idea to", "how to start", "opinion on", "recommendation for",
    "strategies for", "analysis of", "outlook for", "prediction for",
    "compare", "which is better", "what about"
];

const MODIFIERS = [
    "right now", "in malaysia", "for beginners", "given my income", "at my age",
    "with low risk", "for the future", "in 2025", "in 2026", "for students",
    "with small capital", "safely", "fast", "with no experience", "as a fresh grad",
    "currently", "with my salary", "for my situation"
];

// ============================================================================
// 3. GARBAGE PATTERNS (Pure nonsense - NO conflicting patterns)
// ============================================================================

const GARBAGE_INPUTS = [
    "asdf", "qwerty", "zzzz", "aaaaa", "...", "x", "!!", "?!",
    "bla bla", "12345", "undefined", "null", "[object Object]",
    "fsdfsdf", "hgfd", "jklo", "mnbv", "poiu", "trewq", "yuiop", "lzxcv",
    "v6ff7w", "xxxxxx", "aaaaaa", "zxcvbnm", "qazwsx", "1234567890",
    "//", "##", "$$", "***", "+++", "---", "___", "<<<", ">>>",
    "abc123xyz", "randomrandom", "typotypo", "fjdkslfjdks", "owiejfow"
];
// REMOVED: "testing", "idk", "nothing", "not sure" - These are valid queries!

// ============================================================================
// 4. FILLER / UNCERTAIN RESPONSES → GROK (Not garbage!)
// ============================================================================

const UNCERTAIN_INPUTS = [
    "idk", "i dont know", "not sure", "maybe", "i guess", "hmm", "umm",
    "nothing really", "just browsing", "just looking", "never mind",
    "forget it", "whatever", "dunno", "no idea", "confused"
];

// ============================================================================
// 5. GENERATOR FUNCTIONS
// ============================================================================

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function introduceTypo(text) {
    if (Math.random() > 0.35) return text;  // 65% clean, 35% typo
    const chars = text.split('');
    if (chars.length < 3) return text;

    const type = Math.random();
    const idx = Math.floor(Math.random() * (chars.length - 2)) + 1;

    if (type < 0.25) {
        // Swap adjacent chars
        const temp = chars[idx];
        chars[idx] = chars[idx + 1];
        chars[idx + 1] = temp;
    } else if (type < 0.5) {
        // Delete char
        chars.splice(idx, 1);
    } else if (type < 0.75) {
        // Duplicate char
        chars.splice(idx, 0, chars[idx]);
    } else {
        // Replace with adjacent key (simplified)
        const adjacentKeys = {
            'a': 's', 's': 'a', 'd': 'f', 'f': 'd', 'e': 'r', 'r': 'e',
            'i': 'o', 'o': 'i', 'n': 'm', 'm': 'n', 't': 'y', 'y': 't'
        };
        if (adjacentKeys[chars[idx]]) {
            chars[idx] = adjacentKeys[chars[idx]];
        }
    }
    return chars.join('');
}

function generateWithCase(text) {
    const variants = [
        text,
        text.toLowerCase(),
        text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    ];
    return randomChoice(variants);
}

// 1. Generate GROK QUERY Data (Transaction/Balance/Savings Analysis)
function generateGrokQueryData() {
    const rows = [];
    console.log(`\n🔹 Generating GROK Query Data (Transaction/Balance Analysis)...`);

    for (const [category, queries] of Object.entries(GROK_QUERIES)) {
        console.log(`   ➜ Generating ${SAMPLES_PER_GROK_QUERY} rows for ${category}...`);

        for (let i = 0; i < SAMPLES_PER_GROK_QUERY; i++) {
            const query = randomChoice(queries);
            let text = generateWithCase(query);

            // 50% chance to add temporal modifier
            if (Math.random() > 0.5) {
                text += ` ${randomChoice(TEMPORAL_KEYWORDS)}`;
            }

            rows.push(`"${introduceTypo(text)}",${COMPLEX_LABEL}`);
        }
    }

    return rows;
}

// 2. Generate TEMPORAL Query Data
function generateTemporalData() {
    const rows = [];
    console.log(`\n🔹 Generating Temporal Query Data (Date-based → GROK)...`);

    for (let i = 0; i < TEMPORAL_SAMPLES; i++) {
        const starter = randomChoice(TEMPORAL_STARTERS);
        const temporal = randomChoice(TEMPORAL_KEYWORDS);
        let text = `${starter} ${temporal}`;

        // Add variety
        if (Math.random() > 0.7) {
            text = `${temporal} ${starter}`.trim();
        }

        rows.push(`"${introduceTypo(generateWithCase(text))}",${COMPLEX_LABEL}`);
    }

    return rows;
}

// 3. Generate Complex Topic Data (Investment, Career, etc.)
function generateComplexTopicData() {
    const rows = [];
    console.log(`\n🔹 Generating Complex Advice Data (Investment/Career/Purchases)...`);

    for (const [category, keywords] of Object.entries(COMPLEX_TOPICS)) {
        console.log(`   ➜ Generating ${SAMPLES_PER_COMPLEX_TOPIC} rows for ${category}...`);

        for (let i = 0; i < SAMPLES_PER_COMPLEX_TOPIC; i++) {
            if (category === "GENERAL_CHAT") {
                // For general chat, sometimes use raw topic
                const topic = randomChoice(keywords);
                let text = Math.random() > 0.4
                    ? `${randomChoice(COMPLEX_STARTERS)} ${topic}`
                    : topic;
                rows.push(`"${introduceTypo(generateWithCase(text))}",${COMPLEX_LABEL}`);
                continue;
            }

            const starter = randomChoice(COMPLEX_STARTERS);
            const topic = randomChoice(keywords);
            let text = `${starter} ${topic}`;

            if (Math.random() > 0.5) {
                text += ` ${randomChoice(MODIFIERS)}`;
            }

            rows.push(`"${introduceTypo(generateWithCase(text))}",${COMPLEX_LABEL}`);
        }
    }

    return rows;
}

// 4. Generate Uncertain Input Data → GROK (Not garbage!)
function generateUncertainData() {
    const rows = [];
    console.log(`\n🔹 Generating Uncertain Input Data (idk, not sure → GROK)...`);

    for (let i = 0; i < 1500; i++) {
        const text = randomChoice(UNCERTAIN_INPUTS);
        rows.push(`"${introduceTypo(generateWithCase(text))}",${COMPLEX_LABEL}`);
    }

    return rows;
}

// 5. Generate Local Intent Data from responses.json
function generateLocalData() {
    const rows = [];
    console.log(`\n🔹 Processing Local Intents from responses.json...`);

    try {
        const rawContent = fs.readFileSync(INPUT_JSON_FILE, 'utf8');
        let json = JSON.parse(rawContent);
        if (json.intents) json = json.intents;

        // Count intents
        const intentCounts = {};

        json.forEach(item => {
            const tag = item.tag;
            const patterns = item.patterns || [];

            // Skip GARBAGE - we generate our own clean garbage
            if (tag === 'GARBAGE') return;

            // Skip if no patterns
            if (patterns.length === 0) return;

            intentCounts[tag] = (intentCounts[tag] || 0) + patterns.length;

            patterns.forEach(pattern => {
                // Original
                rows.push(`"${pattern.replace(/"/g, '""')}",${tag}`);
                // Lowercase
                rows.push(`"${pattern.toLowerCase().replace(/"/g, '""')}",${tag}`);

                // Generate augmented variants
                for (let i = 0; i < JSON_AUGMENTATION_FACTOR; i++) {
                    const variant = introduceTypo(generateWithCase(pattern));
                    rows.push(`"${variant.replace(/"/g, '""')}",${tag}`);
                }
            });
        });

        console.log(`   ➜ Loaded ${Object.keys(intentCounts).length} intent categories`);
        Object.entries(intentCounts).forEach(([tag, count]) => {
            console.log(`      ${tag}: ${count} base patterns → ${count * (JSON_AUGMENTATION_FACTOR + 2)} samples`);
        });

    } catch (error) {
        console.error("!!! Error reading responses.json:", error.message);
    }

    return rows;
}

// 6. Generate Garbage Data
function generateGarbage() {
    const rows = [];
    console.log(`\n🔹 Generating Garbage Data (Pure nonsense only)...`);

    for (let i = 0; i < SAMPLES_PER_GARBAGE; i++) {
        const base = randomChoice(GARBAGE_INPUTS);
        rows.push(`"${introduceTypo(base)}",${GARBAGE_LABEL}`);

        // Also generate random character sequences
        if (Math.random() > 0.7) {
            const randomChars = Array.from({ length: Math.floor(Math.random() * 8) + 3 },
                () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
            rows.push(`"${randomChars}",${GARBAGE_LABEL}`);
        }
    }

    return rows;
}

// 7. Generate Explicit Typo Data (High-confidence typos)
function generateExplicitTypos() {
    const rows = [];
    console.log(`\n🔹 Generating Explicit Typo Data (helli→GREETING, etc)...`);

    for (const [intent, typos] of Object.entries(EXPLICIT_TYPOS)) {
        console.log(`   ➜ Adding ${typos.length} explicit typos for ${intent}...`);

        for (const typo of typos) {
            // Add base typo and case variants
            rows.push(`"${typo}",${intent}`);
            rows.push(`"${typo.toLowerCase()}",${intent}`);
            rows.push(`"${typo.charAt(0).toUpperCase() + typo.slice(1).toLowerCase()}",${intent}`);

            // Add some augmented variants
            for (let i = 0; i < 50; i++) {
                rows.push(`"${generateWithCase(typo)}",${intent}`);
            }
        }
    }

    return rows;
}

// 8. Generate Ambiguous Single-Word Data → GROK
function generateAmbiguousSingleWords() {
    const rows = [];
    console.log(`\n🔹 Generating Ambiguous Single-Word Data (money→GROK)...`);

    for (const word of AMBIGUOUS_SINGLE_WORDS) {
        // Single words that need context should go to GROK for clarification
        for (let i = 0; i < 100; i++) {
            rows.push(`"${generateWithCase(word)}",${COMPLEX_LABEL}`);
            // Also with ? alone
            if (Math.random() > 0.5) {
                rows.push(`"${generateWithCase(word)}?",${COMPLEX_LABEL}`);
            }
        }
    }

    return rows;
}

// 9. Generate LOCATION QUERY Data (Food/Hotel + Location → GROK)
function generateLocationQueryData() {
    const rows = [];
    console.log(`\n🔹 Generating Location Query Data (makanan sedap kat tapah → GROK)...`);

    const foodQueries = GROK_QUERIES.LOCATION_QUERIES;
    const locationConnectors = ['kat', 'dekat', 'di', 'near', 'around', 'in', 'at'];

    // Generate combinations of food/hotel queries + locations
    for (const location of LOCATION_NAMES) {
        for (const query of foodQueries) {
            // Pattern: "{query} {connector} {location}"
            for (const connector of locationConnectors) {
                const text = `${query} ${connector} ${location}`;
                rows.push(`"${introduceTypo(generateWithCase(text))}",${COMPLEX_LABEL}`);
            }
        }

        // Also generate: "{location} ada apa best", "{location} food best"
        rows.push(`"${location} ada apa best",${COMPLEX_LABEL}`);
        rows.push(`"${location} ada apa sedap",${COMPLEX_LABEL}`);
        rows.push(`"${location} food best",${COMPLEX_LABEL}`);
        rows.push(`"tempat makan best ${location}",${COMPLEX_LABEL}`);
        rows.push(`"nak makan kat ${location}",${COMPLEX_LABEL}`);
        rows.push(`"recommend ${location}",${COMPLEX_LABEL}`);
    }

    // Add standalone location names (often misclassified)
    for (const location of LOCATION_NAMES) {
        for (let i = 0; i < 30; i++) {
            rows.push(`"${generateWithCase(location)}",${COMPLEX_LABEL}`);
            rows.push(`"${location} road",${COMPLEX_LABEL}`);
            rows.push(`"dekat ${location}",${COMPLEX_LABEL}`);
        }
    }

    console.log(`   ➜ Generated ${rows.length} location query samples`);
    return rows;
}

// 10. Generate FOLLOW-UP Pattern Data (Short context-dependent queries → GROK)
function generateFollowUpData() {
    const rows = [];
    console.log(`\n🔹 Generating Follow-Up Pattern Data (if hotel? → GROK)...`);

    for (const pattern of FOLLOWUP_PATTERNS) {
        // Generate many variants
        for (let i = 0; i < 100; i++) {
            rows.push(`"${introduceTypo(generateWithCase(pattern))}",${COMPLEX_LABEL}`);
        }
    }

    // Also generate short question patterns
    const shortQuestions = [
        "yang mana?", "which one?", "where?", "how?", "when?",
        "kat mana?", "bila?", "berapa?", "camne?", "mcm mana?"
    ];

    for (const q of shortQuestions) {
        for (let i = 0; i < 50; i++) {
            rows.push(`"${generateWithCase(q)}",${COMPLEX_LABEL}`);
        }
    }

    console.log(`   ➜ Generated ${rows.length} follow-up pattern samples`);
    return rows;
}

// 11. Generate MALAY SLANG Data (Avoid misclassification as GREETING)
function generateMalaySlangData() {
    const rows = [];
    console.log(`\n🔹 Generating Malay Slang Data (aku melayu → GROK, NOT GREETING)...`);

    for (const slang of MALAY_SLANG_GROK) {
        for (let i = 0; i < 80; i++) {
            rows.push(`"${introduceTypo(generateWithCase(slang))}",${COMPLEX_LABEL}`);
        }
    }

    // Add vulgar word patterns that should NOT trigger friendly intents
    const vulgarPatterns = [
        "bro help la", "tolong bro", "aku perlukan bantuan",
        "saya nak tanya", "gua nak tanya", "aku ada soalan",
        "boleh tolong ke", "tolong saya please"
    ];

    for (const pattern of vulgarPatterns) {
        for (let i = 0; i < 50; i++) {
            rows.push(`"${introduceTypo(generateWithCase(pattern))}",${COMPLEX_LABEL}`);
        }
    }

    console.log(`   ➜ Generated ${rows.length} Malay slang samples`);
    return rows;
}

// ============================================================================
// 6. MAIN EXECUTION
// ============================================================================

function main() {
    console.log("=========================================================");
    console.log("   🐻 BERUANG SUPER-GENERATOR V9 - ANTI-HALLUCINATION 🐻");
    console.log("=========================================================");
    console.log("");
    console.log("Key Improvements:");
    console.log("  ✅ Transaction queries → GROK (what did i do yesterday)");
    console.log("  ✅ Balance queries → GROK (check my balance)");
    console.log("  ✅ Temporal modifiers → GROK (yesterday, last week)");
    console.log("  ✅ Uncertain inputs → GROK (idk, not sure)");
    console.log("  ✅ NAV_* uses action verbs only");
    console.log("  ✅ GARBAGE has no conflicting patterns");
    console.log("  ✅ Explicit typo mappings (helli→GREETING)");
    console.log("  ✅ Ambiguous single words → GROK");
    console.log("  ✅ NEW: Location queries → GROK (makanan sedap kat tapah)");
    console.log("  ✅ NEW: Follow-up patterns → GROK (if hotel?, yang halal?)");
    console.log("  ✅ NEW: Malay slang → GROK (aku melayu, bro tolong)");
    console.log("");

    const grokQueryRows = generateGrokQueryData();
    const temporalRows = generateTemporalData();
    const complexRows = generateComplexTopicData();
    const uncertainRows = generateUncertainData();
    const localRows = generateLocalData();
    const garbageRows = generateGarbage();
    const explicitTypoRows = generateExplicitTypos();
    const ambiguousRows = generateAmbiguousSingleWords();
    const locationRows = generateLocationQueryData();
    const followUpRows = generateFollowUpData();
    const slangRows = generateMalaySlangData();

    const allRows = [
        ...grokQueryRows,
        ...temporalRows,
        ...complexRows,
        ...uncertainRows,
        ...localRows,
        ...garbageRows,
        ...explicitTypoRows,
        ...ambiguousRows,
        ...locationRows,
        ...followUpRows,
        ...slangRows
    ];

    // Shuffle
    console.log(`\n🔀 Shuffling ${allRows.length} samples...`);
    for (let i = allRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRows[i], allRows[j]] = [allRows[j], allRows[i]];
    }

    // Write to file
    const csvContent = 'text,intent\n' + allRows.join('\n');
    fs.writeFileSync(OUTPUT_CSV_FILE, csvContent);

    // Summary statistics
    console.log(`\n=========================================================`);
    console.log(`✅ DATASET GENERATION COMPLETE!`);
    console.log(`=========================================================`);
    console.log(`📁 Output: ${path.resolve(OUTPUT_CSV_FILE)}`);
    console.log(`📊 Total Samples: ${allRows.length.toLocaleString()}`);
    console.log(``);
    console.log(`Distribution:`);
    console.log(`  • GROK Queries (Transaction/Balance): ${grokQueryRows.length.toLocaleString()}`);
    console.log(`  • Temporal Queries: ${temporalRows.length.toLocaleString()}`);
    console.log(`  • Complex Topics: ${complexRows.length.toLocaleString()}`);
    console.log(`  • Uncertain Inputs: ${uncertainRows.length.toLocaleString()}`);
    console.log(`  • Local Intents: ${localRows.length.toLocaleString()}`);
    console.log(`  • Garbage: ${garbageRows.length.toLocaleString()}`);
    console.log(`  • Explicit Typos: ${explicitTypoRows.length.toLocaleString()}`);
    console.log(`  • Ambiguous Words: ${ambiguousRows.length.toLocaleString()}`);
    console.log(`  • Location Queries: ${locationRows.length.toLocaleString()}`);
    console.log(`  • Follow-up Patterns: ${followUpRows.length.toLocaleString()}`);
    console.log(`  • Malay Slang: ${slangRows.length.toLocaleString()}`);
    console.log(`=========================================================`);
}

main();
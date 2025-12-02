const fs = require('fs');

// --- 1. TYPO GENERATOR ---
function introduceTypo(text) {
  if (Math.random() > 0.30) return text;
  
  const chars = text.split('');
  const idx = Math.floor(Math.random() * (chars.length - 1));
  const typoType = Math.random();
  
  if (typoType < 0.33) {
    const temp = chars[idx]; chars[idx] = chars[idx + 1]; chars[idx + 1] = temp;
  } else if (typoType < 0.66) {
    chars.splice(idx, 1);
  } else {
    chars.splice(idx, 0, chars[idx]);
  }
  return chars.join('');
}

// --- 2. LOCAL INTENTS (Expanded with more variations) ---

const GREETING_TEMPLATES = [
  ["hi", "hello", "hey", "yo", "sup", "greetings", "hiya", "howdy"],
  ["good morning", "good afternoon", "good evening", "good day"],
  ["hey bear", "hi bear", "hello beruang", "yo bear"],
  ["what's up", "whats up", "wassup", "how's it going"],
  ["hi there", "hey there", "hello there"]
];

const DEF_SAVINGS_TEMPLATES = [
  ["what is savings", "define savings", "definition of savings", "meaning of savings"],
  ["explain savings", "tell me about savings", "savings definition"],
  ["what does savings mean", "savings meaning"]
];

const DEF_RULE_TEMPLATES = [
  ["what is 50 30 20", "explain 50/30/20", "50/30/20 rule", "what does 50 30 20 mean"],
  ["how does 50/30/20 work", "50/30/20 explained", "what is the rule", "explain the budget rule"],
  ["50/30/20 meaning", "define 50/30/20", "whats the 50/30/20 rule"],
  ["what is the 50 30 20 rule", "tell me about 50/30/20"]
];

const APP_HELP_TEMPLATES = [
  ["how to add transaction", "add transaction", "how to track expenses", "track my expenses"],
  ["where to add money", "how to input money", "add income", "help me use app"],
  ["app tutorial", "guide me", "how does this work", "using the app"],
  ["how to delete transaction", "remove transaction", "cant find settings", "app not working"],
  ["help", "how to use", "app help"]
];

const DEF_NEEDS_TEMPLATES = [
  ["what are needs", "define needs", "needs definition", "examples of needs"],
  ["is food a need", "is rent a need", "explain needs category", "meaning of needs"],
  ["what goes into needs", "50 percent needs", "needs meaning"]
];

const DEF_WANTS_TEMPLATES = [
  ["what are wants", "define wants", "wants definition", "examples of wants"],
  ["is netflix a want", "is coffee a want", "explain wants category", "wants meaning"],
  ["what goes into wants", "30 percent wants"]
];

const TIP_GENERAL_TEMPLATES = [
  ["give me a money tip", "financial tip", "money hack"],
  ["spending advice", "frugal tip", "smart money tip", "money wisdom"],
  ["tell me a tip", "saving hack"]
];

const MOTIVATION_TEMPLATES = [
  ["i am broke", "i have no money", "i feel poor", "money is tight"],
  ["motivate me", "give me motivation", "financial stress", "im struggling with money"],
  ["it is hard to save", "cheer me up", "i spent too much", "i feel guilty spending"],
  ["encourage me", "need motivation"]
];

const WHO_ARE_YOU_TEMPLATES = [
  ["who are you", "what is your name", "what is beruang"],
  ["tell me about yourself", "introduce yourself", "are you ai", "are you human"],
  ["what are you", "who is beruang"]
];

const JOKE_TEMPLATES = [
  ["tell me a joke", "money joke", "finance joke", "funny money quote"],
  ["joke about debt", "do you know any jokes", "say something funny"],
  ["make me laugh"]
];

const THANK_YOU_TEMPLATES = [
  ["thank you", "thanks", "thanks bear", "thanks a lot"],
  ["terima kasih", "thanks bro", "good bot", "great job"],
  ["appreciate it", "thx"]
];

const COMPLAINT_TEMPLATES = [
  ["you suck", "bad bot", "stupid bot", "you are wrong"],
  ["that is incorrect", "not helpful", "i hate this", "annoying"],
  ["useless", "terrible"]
];

const BYE_TEMPLATES = [
  ["bye", "goodbye", "see ya", "later", "bye bye"],
  ["gotta go", "logging off", "have a good day", "goodnight"],
  ["see you", "talk later"]
];

// --- 3. MASSIVELY EXPANDED COMPLEX_ADVICE BUCKET ---
// ★★★ KEY CHANGE: 10x more diverse complex examples ★★★

const FINANCIAL_TOPICS = [
  "invest", "crypto", "stock", "bitcoin", "ethereum", "trading", "forex",
  "property", "house", "car", "wedding", "vacation", "travel",
  "debt", "loan", "mortgage", "credit card", "bankruptcy",
  "salary", "income", "raise", "bonus", "tax", "insurance",
  "retirement", "epf", "kwsp", "fund", "unit trust",
  "business", "startup", "side hustle", "freelance",
  "gold", "commodity", "bond", "fixed deposit",
  "laptop", "iphone", "gadget", "gaming pc"
];

const COMPLEX_STARTERS = [
  "why", "how", "what if", "should i", "can i", "do i", "explain",
  "is it true", "do you think", "would you", "help me with", "advice on",
  "tell me about", "what about", "thoughts on", "opinion on",
  "is it worth", "can you explain", "what's the best way to",
  "how do i", "what's your take on", "give me tips for",
  "compare", "which is better", "pros and cons of"
];

const COMPLEX_ENDINGS = [
  "for me", "in malaysia", "with my salary", "considering my situation",
  "given my income", "at my age", "for young adults", "right now",
  "this year", "in the long term", "for the future"
];

const EDGE_CASES = [
  "why is it unrealistic to buy a house",
  "explain why i shouldn't invest",
  "give me a reason not to buy crypto",
  "what's wrong with taking a loan",
  "why do people say save 20 percent",
  "how much should i save monthly",
  "is rm 3000 enough to survive",
  "can i afford a car with rm 2500 salary",
  "should i buy an iphone or save",
  "what's a good investment for beginners",
  "how to get out of debt fast",
  "tell me the best way to make money",
  "why housing is expensive in malaysia",
  "what to do if i lose my job",
  "how to negotiate salary",
  "is gold better than stocks",
  "should i quit my job to start business"
];

// --- GENERATORS ---

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createGenerator(templates, intent) {
  return () => {
    const templateGroup = randomChoice(templates);
    let text = randomChoice(templateGroup);
    if (Math.random() < 0.3) text = introduceTypo(text);
    return { text, intent };
  };
}

function generateComplexAdvice() {
  // 40% from edge cases (real-world tricky questions)
  if (Math.random() < 0.4 && EDGE_CASES.length > 0) {
    let text = randomChoice(EDGE_CASES);
    if (Math.random() < 0.3) text = introduceTypo(text);
    return { text, intent: "COMPLEX_ADVICE" };
  }

  // 60% generated combinations
  const starter = randomChoice(COMPLEX_STARTERS);
  const topic = randomChoice(FINANCIAL_TOPICS);
  
  let text = "";
  const pattern = Math.random();
  
  if (pattern < 0.3) {
    // Simple: "why crypto", "how invest"
    text = `${starter} ${topic}`;
  } else if (pattern < 0.6) {
    // Medium: "should i buy car for me"
    const ending = randomChoice(COMPLEX_ENDINGS);
    text = `${starter} ${topic} ${ending}`;
  } else {
    // Complex: "what's the best way to invest in malaysia"
    const filler = ["the best", "a good", "the right", "a better"][Math.floor(Math.random() * 4)];
    const ending = randomChoice(COMPLEX_ENDINGS);
    text = `${starter} ${filler} ${topic} ${ending}`;
  }

  if (Math.random() < 0.3) text = introduceTypo(text);
  return { text, intent: "COMPLEX_ADVICE" };
}

// ★★★ NEW: Generate "Garbage" Queries (OOD Detection Training) ★★★
function generateGarbage() {
  const patterns = [
    () => Math.random().toString(36).substring(7), // Random string
    () => "a".repeat(Math.floor(Math.random() * 20) + 5), // Repeated chars
    () => Array(5).fill().map(() => randomChoice(["!", "@", "#", "?", "..."])).join(""), // Symbols
    () => randomChoice(["asdf", "qwerty", "zzzz", "hmm", "uhhh", "errr"]),
    () => randomChoice(["", " ", "  ", "   "]).trim() || "x" // Near-empty
  ];
  
  const text = randomChoice(patterns)();
  return { text, intent: "COMPLEX_ADVICE" }; // Map garbage to complex (will be filtered later)
}

// --- MAIN DATASET BUILDER ---
function generateDataset(totalRows = 30000) {
  const localGenerators = [
    createGenerator(GREETING_TEMPLATES, "GREETING"),
    createGenerator(DEF_SAVINGS_TEMPLATES, "DEF_SAVINGS"),
    createGenerator(DEF_RULE_TEMPLATES, "DEF_RULE"),
    createGenerator(APP_HELP_TEMPLATES, "APP_HELP"),
    createGenerator(DEF_NEEDS_TEMPLATES, "DEF_NEEDS"),
    createGenerator(DEF_WANTS_TEMPLATES, "DEF_WANTS"),
    createGenerator(TIP_GENERAL_TEMPLATES, "TIP_GENERAL"),
    createGenerator(MOTIVATION_TEMPLATES, "MOTIVATION"),
    createGenerator(WHO_ARE_YOU_TEMPLATES, "WHO_ARE_YOU"),
    createGenerator(JOKE_TEMPLATES, "JOKE"),
    createGenerator(THANK_YOU_TEMPLATES, "THANK_YOU"),
    createGenerator(COMPLAINT_TEMPLATES, "COMPLAINT"),
    createGenerator(BYE_TEMPLATES, "BYE")
  ];

  // ★★★ CRITICAL CHANGE: 60% of dataset is COMPLEX_ADVICE ★★★
  const complexRows = Math.floor(totalRows * 0.6);
  const garbageRows = Math.floor(totalRows * 0.05); // 5% garbage
  const localRows = totalRows - complexRows - garbageRows;
  const rowsPerLocal = Math.floor(localRows / localGenerators.length);

  const data = [];

  // Generate local intents
  localGenerators.forEach(gen => {
    for (let i = 0; i < rowsPerLocal; i++) {
      data.push(gen());
    }
  });

  // Generate complex advice (majority)
  for (let i = 0; i < complexRows; i++) {
    data.push(generateComplexAdvice());
  }

  // Generate garbage
  for (let i = 0; i < garbageRows; i++) {
    data.push(generateGarbage());
  }

  // Fill remainder
  while (data.length < totalRows) {
    data.push(generateComplexAdvice());
  }

  // Shuffle
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }

  return data;
}

const rows = generateDataset(30000);
const header = 'text,intent\n';
const csvContent = header + rows.map(r => `"${r.text.replace(/"/g, '""')}",${r.intent}`).join('\n');

fs.writeFileSync('chat_intents.csv', csvContent);
console.log(`✓ Generated chat_intents.csv with ${rows.length} rows.`);
console.log(`  - Local Intents: ~${Math.floor(rows.length * 0.35)} rows`);
console.log(`  - Complex Advice: ~${Math.floor(rows.length * 0.6)} rows`);
console.log(`  - Garbage/OOD: ~${Math.floor(rows.length * 0.05)} rows`);
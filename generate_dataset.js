const fs = require('fs');

// --- CONFIGURATION ---
// Kita tambah 500 baris KHAS untuk Cuti/Holiday sahaja.
const TARGET_ROWS = 500; 
const OUTPUT_FILE = 'dataset.csv';

// --- DATA BANKS (ONLY VACATION / HOLIDAY) ---
// Focus: WANTS -> Others
const vacationTemplates = [
  { category: 'wants', subcategory: 'Others', texts: [
    // --- Standard Malay ---
    "pergi bercuti", "cuti cuti malaysia", "balik kampung",
    "tempah hotel", "tiket flight", "tiket kapal terbang",
    "tempah homestay", "sewa airbnb", "pakej percutian",
    "bawa famili jalan jalan", "roadtrip sekampung",
    "healing sampai pagi", "staycation kl", "cuti rehat minda",
    "tempah tiket bas", "sewa kereta bercuti",

    // --- English / Manglish ---
    "holiday trip", "vacation mode", "book flight tickets",
    "hotel booking", "travel expenses", "family trip",
    "honeymoon package", "short gateway", "roadtrip with friends",
    "healing trip", "booking agoda", "booking booking.com",
    "flight tickets", "airbnb deposit", "travel budget",

    // --- Mandarin (Pinyin/Simplified) ---
    "去旅行 (travel)", "订酒店 (book hotel)", "买机票 (flight ticket)",
    "放假 (holiday)", "带家人去玩 (family trip)", "去海边 (beach)",

    // --- Tamil ---
    "சுற்றுலா (tour)", "விடுமுறை (holiday)", "travel expense",
    "flight ticket booking",

    // --- Dialects / Slang ---
    "makan angin", "gi pusing pusing", "gi jalan jauh",
    "berekot (holiday)", "healing jiwa", "kasi reward diri travel",
    "gi jalan jalan", "pi jalan",

    // --- Specific Locations (Malaysia & International) ---
    "cuti cuti penang", "trip ke langkawi", "jalan jalan melaka",
    "naik genting highland", "mandi laut port dickson", 
    "cameron highlands trip", "panjat kinabalu", "pusing kuching",
    "trip ke hatyai", "travel ke krabi", "shopping bangkok",
    "cuti ke london", "vacation ke japan", "trip korea winter",
    "pusing pusing europe", "umrah ziarah", "trip bali", 
    "gi singapore jalan jalan", "aussie trip"
  ]}
];

// --- CHAOS ENGINE (Suffixes Only) ---
// Tak perlu typo teruk sangat untuk fasa ni, just variasi ayat.
const randomSuffixes = [
  " urgent", " next week", " next month", " deposit",
  " full payment", " for family", " with friends", " rm500",
  " rm1000", " rm2000", " budget", " mahal", " murah",
  " flight airasia", " flight mas", " by car", " by bus",
  " 2025", " hujung tahun", " semester break"
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function addNoise(text) {
  // 70% chance to add a suffix like " next week" or " rm500"
  if (Math.random() > 0.3) return text + getRandomItem(randomSuffixes);
  return text;
}

// --- GENERATOR LOGIC ---
console.log(`Generating ${TARGET_ROWS} VACATION rows and APPENDING to ${OUTPUT_FILE}...`);

// Check if file exists
const fileExists = fs.existsSync(OUTPUT_FILE);
// 'a' flag = APPEND (Sambung bawah)
const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' }); 

// Kalau file wujud, kita tambah 'newline' dulu takut data last takde 'enter'
if (fileExists) {
  stream.write('\n');
} else {
  stream.write('description,category,subcategory\n');
}

let count = 0;

for (let i = 0; i < TARGET_ROWS; i++) {
  const group = getRandomItem(vacationTemplates);
  let baseText = getRandomItem(group.texts);

  // Add variation
  let finalText = addNoise(baseText);

  // Clean text (buang koma kalau ada)
  finalText = finalText.replace(/,/g, '');

  stream.write(`${finalText},${group.category},${group.subcategory}\n`);
  count++;
}

stream.end(() => {
  console.log(`\n✅ Success! Appended ${count} 'Cuti/Holiday' rows.`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
  console.log(`\nLangkah Seterusnya:`);
  console.log(`1. Run 'node train.js' (Wajib train semula)`);
  console.log(`2. Run 'node server.js'`);
  console.log(`3. Test 'cuti cuti penang'`);
});
const fs = require('fs');

// ==========================================
// CONFIGURATION
// ==========================================
const TOTAL_ROWS_TARGET = 100000;
const SHORT_FORM_RATIO = 0.20;

// REBALANCED DISTRIBUTION
const TARGET_DISTRIBUTION = {
  'Food & Beverage': 0.30,
  'Shopping': 0.20,
  'Financial Services': 0.20,
  'Transportation': 0.15,
  'Others': 0.05,
  'Entertainment': 0.05,
  'Telecommunication': 0.05
};

// ==========================================
// 1. MASSIVE VOCABULARY (TEXT ONLY)
// ==========================================

const BASICS = {
  food: ['makan', 'minum', 'lunch', 'dinner', 'breakfast', 'supper', 'brunch', 'snack', 'lapar', 'food', 'drink', 'jus', 'apple', 'oren', 'teh', 'kopi', 'nasik', 'meal', 'tapau', 'bungkus'],
  shop: ['shopping', 'beli', 'buy', 'barang', 'shop', 'order', 'new', 'racun', 'baju', 'kasut', 'seluar', 'beg', 'tudung', 'groceries', 'market', 'pasar'],
  transport: ['minyak', 'petrol', 'diesel', 'fuel', 'gas', 'toll', 'tol', 'parking', 'park', 'grab', 'uber', 'lrt', 'mrt', 'bus', 'flight', 'ticket', 'balik kampung', 'jammed'],
  ent: ['movie', 'wayang', 'cinema', 'game', 'gaming', 'steam', 'netflix', 'spotify', 'lepak', 'dating', 'jalan', 'healing', 'vacation', 'holiday', 'outing', 'concert', 'match'],
  fin: ['transfer', 'trf', 'send', 'loan', 'hutang', 'pay', 'bayar', 'duitnow', 'withdraw', 'save', 'sedekah', 'infaq', 'donation', 'zakat', 'invest', 'depo', 'banking', 'bill', 'bil'],
  telco: ['topup', 'reload', 'data', 'internet', 'wifi', 'credit', 'prepaid']
};

const ADJECTIVES = ['sedap', 'best', 'padu', 'baru', 'new', 'lama', 'old', 'mahal', 'murah', 'cheap', 'expensive', 'quick', 'fast', 'slow', 'big', 'small', 'extra', 'pedas', 'manis', 'kurang manis', 'sejuk', 'panas', 'hangat', 'fresh', 'premium', 'sale', 'promo', 'discount', 'boring', 'happy', 'monthly', 'bulanan', 'annual', 'tahunan', 'pending', 'due'];
const TIMES = ['pagi', 'morning', 'petang', 'evening', 'malam', 'night', 'now', 'today', 'yesterday', 'tadi', 'daily', 'monthly', 'weekly', 'last night', 'this morning', 'afternoon', 'weekend', 'sunday', 'saturday', 'friday', 'lunch time', 'dinner time'];
const FEELINGS = ['craving', 'teringin', 'love', 'suka', 'tak suka', 'need', 'wajib', 'reward', 'treat', 'malas masak', 'lapar gila', 'haus', 'stress shopping', 'healing', 'broke', 'kaya'];
const PEOPLE = ['ali', 'abu', 'siti', 'ahmad', 'mom', 'dad', 'ibu', 'ayah', 'gf', 'bf', 'friend', 'kawan', 'family', 'boss', 'colleague', 'housemate', 'roommate', 'sister', 'brother', 'adik', 'abang', 'kakak', 'uncle', 'aunty', 'baby', 'kids', 'anak', 'tuan rumah', 'agent'];
const PLACES = ['kl', 'klcc', 'pavilion', 'midvalley', 'sunway', 'home', 'rumah', 'office', 'pejabat', 'school', 'uni', 'uitm', 'shop', 'kedai', 'mall', 'pasar', 'online', 'shopee', 'lazada', 'tiktok', 'cafe', 'mamak', 'stall', 'warung', 'bangi', 'shah alam', 'cyberjaya', 'jb', 'penang', 'ipoh', 'melaka', 'bank', 'kaunter'];

// --- DETAILED ITEMS ---
const FOOD_ITEMS = ['nasi lemak', 'nasi goreng', 'mee goreng', 'roti canai', 'ayam goreng', 'burger', 'pizza', 'spaghetti', 'pasta', 'sushi', 'ramen', 'kfc', 'mcd', 'starbucks', 'tealive', 'zus', 'kopi', 'teh tarik', 'milo', 'apple', 'orange', 'juice', 'jus', 'air', 'mineral water', 'cake', 'roti', 'biskut', 'coklat', 'gula', 'garam', 'maggi', 'telur', 'satay', 'cendol', 'laksa', 'tomyam', 'steak', 'chicken chop', 'fish n chips', 'pisang goreng', 'keropok'];
// Grocery items (NEEDS) - essential household items
const GROCERY_ITEMS = ['sayur', 'vegetable', 'bawang', 'onion', 'bawang putih', 'garlic', 'bawang merah', 'shallot', 'bawang holland', 'tomato', 'tomato', 'kentang', 'potato', 'telur', 'egg', 'ayam', 'chicken', 'daging', 'meat', 'ikan', 'fish', 'udang', 'prawn', 'sotong', 'squid', 'beras', 'rice', 'gula', 'sugar', 'garam', 'salt', 'minyak masak', 'cooking oil', 'sos', 'sauce', 'kicap', 'soy sauce', 'cili', 'chili', 'lada', 'pepper', 'rempah', 'spice', 'halia', 'ginger', 'kunyit', 'turmeric', 'santan', 'coconut milk', 'tepung', 'flour', 'roti', 'bread', 'susu', 'milk', 'keju', 'cheese', 'mentega', 'butter', 'margarine', 'biskut', 'biscuit', 'cereal', 'maggie', 'maggi', 'mee', 'noodle', 'grocery', 'groceries', 'pasar', 'market', 'runcit', 'mini market', 'aeon', 'tesco', 'giant', '99 speedmart'];

// Shopping items (WANTS) - non-essential items
const SHOP_ITEMS = ['baju', 'shirt', 'pants', 'seluar', 'shoes', 'kasut', 'bag', 'beg', 'wallet', 'purse', 'tudung', 'makeup', 'skincare', 'shampoo', 'soap', 'iphone', 'samsung', 'phone', 'charger', 'cable', 'laptop', 'mouse', 'book', 'buku', 'pen', 'lego', 'toy', 'gift', 'hadiah', 'tissue', 'mask', 'sanitizer', 'vitamin', 'panadol', 'perfume', 'jam', 'watch', 'monitor'];
const TRANSPORT_ITEMS = ['ron95', 'ron97', 'shell', 'petronas', 'caltex', 'touch n go', 'tng', 'rfid', 'service kereta', 'tayar', 'battery', 'workshop', 'grab car', 'airasia ride', 'train ticket', 'bus ticket', 'roadtax', 'insurans kereta', 'engine oil', 'wipers', 'brake pad'];
const ENT_ITEMS = ['gsc', 'tgv', 'popcorn', 'karaoke', 'bowling', 'badminton', 'futsal', 'gym', 'zoo', 'ticket', 'concert', 'match', 'bola', 'wayang', 'movie ticket', 'ps5', 'xbox', 'switch', 'genting', 'sunway lagoon', 'aquaria'];

// --- NEW: EXTENSIVE FINANCIAL VOCABULARY ---
const FIN_BILLS = ['tnb', 'water', 'air', 'electric', 'elektrik', 'syabas', 'iwk', 'indah water', 'sinking fund', 'maintenance fee', 'cuckoo', 'coway', 'astro', 'unifi', 'time internet', 'maxis bill', 'celcom bill', 'digi bill', 'umobile bill', 'postpaid'];
const FIN_LOANS = ['ptptn', 'mara', 'car loan', 'hire purchase', 'housing loan', 'mortgage', 'personal loan', 'aeon credit', 'loan kereta', 'loan rumah'];
const FIN_RENT = ['sewa rumah', 'rent house', 'sewa bilik', 'rent room', 'sewa apartment', 'rent apartment', 'sewa condo', 'rent condo', 'sewa office', 'rent office', 'sewa kedai', 'rent shop', 'bil sewa', 'rental', 'sewa', 'rent'];
const FIN_CARDS = ['credit card', 'kad kredit', 'visa', 'mastercard', 'amex', 'maybank card', 'cimb card', 'annual fee'];
const FIN_INSURANCE = ['insurance', 'insurans', 'takaful', 'aia', 'prudential', 'etiqa', 'great eastern', 'medical card', 'life insurance', 'roadtax'];
const FIN_INVEST = ['asb', 'asn', 'tabung haji', 'stashaway', 'wahed', 'raize', 'gold', 'emas', 'stocks', 'saham', 'deposit', 'savings'];
const FIN_TAX = ['lhdn', 'hasil', 'income tax', 'cukai', 'zakat', 'fitrah'];
const FIN_ACTIONS = ['bayar', 'pay', 'settle', 'clear', 'lunaskan', 'transfer', 'trf', 'invest', 'simpan', 'deposit'];

// New: Wants indicators for deterministic category assignment
const WANTS_INDICATORS = ['reward', 'treat', 'healing', 'craving', 'teringin', 'stress shopping', 'kaya', 'vacation', 'holiday', 'concert', 'match', 'gaming', 'netflix', 'spotify', 'lepak', 'dating', 'outing'];

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function maybe(prob) { return Math.random() < prob; }

function getContext() {
  const r = Math.random();
  if (r < 0.20) return ` ${rand(ADJECTIVES)}`;
  if (r < 0.35) return ` ${rand(TIMES)}`;
  if (r < 0.50) return ` with ${rand(PEOPLE)}`;
  if (r < 0.65) return ` dengan ${rand(PEOPLE)}`;
  if (r < 0.80) return ` at ${rand(PLACES)}`;
  if (r < 0.90) return ` di ${rand(PLACES)}`;
  if (r < 0.95) return ` for ${rand(PEOPLE)}`;
  return '';
}

// ==========================================
// 3. GENERATORS
// ==========================================

function generateFood(isShort) {
  if (isShort) return rand([...BASICS.food, ...FOOD_ITEMS]);
  const item = rand(FOOD_ITEMS);
  const pattern = Math.random();
  if (pattern < 0.3) return `${rand(FEELINGS)} ${item}${getContext()}`;
  if (pattern < 0.6) return `${rand(['beli', 'makan', 'minum', 'order', 'tapau'])} ${item}${getContext()}`;
  if (pattern < 0.8) return `${rand(BASICS.food)} ${item}`;
  return `${item}${getContext()}`;
}

function generateShopping(isShort) {
  // 60% grocery (needs), 40% shopping items (wants)
  const isGrocery = Math.random() < 0.6;
  const itemList = isGrocery ? GROCERY_ITEMS : SHOP_ITEMS;
  
  if (isShort) {
    const shortList = isGrocery ? [...GROCERY_ITEMS.filter(i => i.split(' ').length <= 2)] : [...BASICS.shop, ...SHOP_ITEMS];
    return rand(shortList.length > 0 ? shortList : itemList);
  }
  
  const item = rand(itemList);
  const action = maybe(0.4) ? rand(['beli', 'buy', 'new', 'baru', 'shopping', 'cari', 'survey', 'grocery']) + ' ' : '';
  return `${action}${item}${getContext()}`;
}

function generateTransport(isShort) {
  if (isShort) return rand([...BASICS.transport, ...TRANSPORT_ITEMS]);
  const item = rand(TRANSPORT_ITEMS);
  const action = maybe(0.3) ? rand(['isi', 'bayar', 'naik', 'tukar', 'service']) + ' ' : '';
  return `${action}${item}${getContext()}`;
}

function generateEntertainment(isShort) {
  if (isShort) return rand([...BASICS.ent, ...ENT_ITEMS]);
  const item = rand(ENT_ITEMS);
  const action = maybe(0.3) ? rand(['tengok', 'watch', 'main', 'play', 'book', 'pergi']) + ' ' : '';
  return `${action}${item}${getContext()}`;
}

function generateTelco(isShort) {
  if (isShort) return rand(BASICS.telco);
  const telco = rand(['maxis', 'celcom', 'digi', 'umobile', 'yes', 'hotlink', 'xox']);
  const type = rand(['topup', 'reload', 'internet', 'data', 'pass', 'prepaid']);
  return `${type} ${telco}${getContext()}`;
}

function generateOthers(isShort) {
  if (isShort) return rand(['fee', 'yuran', 'medicine', 'ubat', 'clinic', 'klinik', 'parking', 'tol']);
  
  if (maybe(0.6)) {
    return `${rand(['clinic', 'klinik', 'ubat', 'checkup', 'doctor', 'hospital', 'pharmacy', 'farmasi'])} ${maybe(0.4) ? rand(PLACES) : ''}`.trim();
  }
  if (maybe(0.5)) {
    return `${rand(['yuran', 'fee', 'duit'])} ${rand(['school', 'sekolah', 'class', 'kelas', 'tuition', 'tuisyen', 'course', 'kursus'])}${getContext()}`;
  }
  return `${rand(['parking', 'tol', 'toll', 'donation', 'sedekah'])}${getContext()}`;
}

function generateFinance(isShort) {
  if (isShort) return rand([...BASICS.fin, ...FIN_BILLS, ...FIN_LOANS, ...FIN_CARDS, ...FIN_RENT]);
  
  const category = Math.random();
  const action = rand(FIN_ACTIONS);

  if (category < 0.30) {
    const bill = rand(FIN_BILLS);
    return `${action} ${bill}${maybe(0.3) ? ' ' + rand(['bill', 'bil', 'acc', 'account']) : ''}${getContext()}`;
  }
  if (category < 0.50) {
    // Rent and housing payments
    const rentItem = rand(FIN_RENT);
    return `${maybe(0.5) ? rand(['bayar', 'pay', 'settle']) + ' ' : ''}${rentItem}${getContext()}`;
  }
  if (category < 0.70) {
    const item = rand([...FIN_LOANS, ...FIN_CARDS]);
    return `${action} ${item}${getContext()}`;
  }
  if (category < 0.85) {
    const item = rand([...FIN_INSURANCE, ...FIN_TAX]);
    return `${rand(['pay', 'bayar', 'renew', 'claim'])} ${item}${getContext()}`;
  }
  if (category < 0.95) {
    const item = rand(FIN_INVEST);
    return `${rand(['transfer', 'trf', 'deposit', 'topup', 'invest'])} ${item}${getContext()}`;
  }
  const person = rand(PEOPLE);
  return `${rand(['transfer', 'trf', 'duitnow', 'send', 'pay'])} to ${person}${maybe(0.3) ? ' for ' + rand(['lunch', 'dinner', 'hutang']) : ''}`;
}

function generateSentence(subcategory, isShort) {
  switch (subcategory) {
    case 'Food & Beverage': return generateFood(isShort);
    case 'Shopping': return generateShopping(isShort);
    case 'Transportation': return generateTransport(isShort);
    case 'Others': return generateOthers(isShort);
    case 'Entertainment': return generateEntertainment(isShort);
    case 'Financial Services': return generateFinance(isShort);
    case 'Telecommunication': return generateTelco(isShort);
    default: return '';
  }
}

// ==========================================
// 4. MAIN EXECUTION
// ==========================================
function generateDataset() {
  console.log('\n🚀 Generating High-Quality Malaysian Transaction Dataset...');
  console.log(`\n📝 Target: ${TOTAL_ROWS_TARGET.toLocaleString()} rows`);
  console.log(`📝 Strategy: Deterministic category based on keywords/subcat\n`);
  
  const rows = [['description', 'category', 'subcategory']];
  const uniqueRows = new Set();
  let shortFormCount = 0;
  let totalDuplicatesSkipped = 0;
  
  for (const [subcategory, ratio] of Object.entries(TARGET_DISTRIBUTION)) {
    const targetCount = Math.ceil(TOTAL_ROWS_TARGET * ratio);
    let generatedCount = 0;
    let duplicatesSkipped = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 100;
    
    while (generatedCount < targetCount && attempts < maxAttempts) {
      attempts++;
      
      // Deterministic category based on subcategory
      let category = 'needs';  // Default
      if (['Shopping', 'Entertainment'].includes(subcategory)) {
        category = 'wants';
      } else if (subcategory === 'Others' || subcategory === 'Transportation' || subcategory === 'Telecommunication') {
        category = 'needs';
      }
      
      const isShort = Math.random() < SHORT_FORM_RATIO;
      let desc = generateSentence(subcategory, isShort).toLowerCase().trim();
      desc = desc.replace(/\s+/g, ' '); 

      if (!desc || desc.length < 2) continue;
      
      // Override category deterministically based on keywords in desc
      const lowerDesc = desc.toLowerCase();
      const isWants = WANTS_INDICATORS.some(ind => lowerDesc.includes(ind));
      
      // Grocery items are always NEEDS
      const isGrocery = GROCERY_ITEMS.some(item => lowerDesc.includes(item.toLowerCase()));
      if (isGrocery) {
        category = 'needs';
      } else if (subcategory === 'Food & Beverage') {
        category = isWants ? 'wants' : 'needs';
      } else if (subcategory === 'Financial Services') {
        // Rent/housing payments are always NEEDS
        const isRent = FIN_RENT.some(item => lowerDesc.includes(item.toLowerCase()));
        if (isRent) {
          category = 'needs';
        } else if (lowerDesc.includes('invest') || lowerDesc.includes('gold') || lowerDesc.includes('emas') || lowerDesc.includes('stocks') || lowerDesc.includes('saham') || lowerDesc.includes('stashaway') || lowerDesc.includes('wahed') || (lowerDesc.includes('deposit') && !lowerDesc.includes('sewa')) || (lowerDesc.includes('savings') && !lowerDesc.includes('sewa')) || isWants) {
          category = 'wants';
        } else {
          category = 'needs';
        }
      } else if (subcategory === 'Shopping') {
        // Shopping can be needs (grocery) or wants (other items)
        // Already handled by isGrocery check above
        if (!isGrocery) {
          category = 'wants'; // Non-grocery shopping is wants
        }
      }
      
      const uniqueKey = `${desc}|${category}|${subcategory}`;
      if (uniqueRows.has(uniqueKey)) {
        duplicatesSkipped++;
        continue;
      }
      
      uniqueRows.add(uniqueKey);
      rows.push([desc, category, subcategory]);
      generatedCount++;
      
      if (desc.split(' ').length <= 2) shortFormCount++;
    }
    
    totalDuplicatesSkipped += duplicatesSkipped;
    console.log(`  ✅ ${subcategory}: ${generatedCount.toLocaleString()} unique rows`);
  }
  
  const header = rows.shift();
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  rows.unshift(header);
  
  const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync('dataset_new.csv', csvContent);
  
  console.log(`\n✅ SUCCESS: Generated ${(rows.length - 1).toLocaleString()} UNIQUE transactions`);
  console.log(`📁 File: dataset_new.csv`);
  
  console.log(`\n📊 Quality Metrics:`);
  console.log(`  • Total Unique: ${(rows.length - 1).toLocaleString()}`);
  console.log(`  • Short Forms: ${shortFormCount.toLocaleString()} (${((shortFormCount / (rows.length - 1)) * 100).toFixed(1)}%)`);
  console.log(`  • Duplicates Skipped: ${totalDuplicatesSkipped.toLocaleString()}`);
  
  console.log(`\n🎯 Model will now handle:`);
  console.log(`  • "bayar bil tnb" → Financial Services, needs`);
  console.log(`  • "pay credit card" → Financial Services, needs`);
  console.log(`  • "deposit asb" → Financial Services, wants`);
  console.log(`  • "transfer to ali" → Financial Services, needs`);
  console.log(`  • "topup maxis" → Telecommunication, needs`);
}

generateDataset();
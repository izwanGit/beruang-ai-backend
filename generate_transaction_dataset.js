const fs = require('fs');

// ==================================================================================
// BERUANG AI - ULTRA-COMPREHENSIVE TRANSACTION DATASET GENERATOR
// Target: 150,000 UNIQUE, LOGICALLY PERFECT MALAYSIAN TRANSACTIONS
// ==================================================================================

const TOTAL_ROWS_TARGET = 250000;

console.log('🚀 BERUANG AI Transaction Dataset Generator V13');
console.log('📊 Target: 250,000 unique, logically perfect rows');
console.log('🇲🇾 Malaysian finance-specific vocabulary');
console.log('✨ Includes single-words, plurals, typos, and 100+ new words\n');

// ==================================================================================
// SECTION 1: PEOPLE & NAMES (200+ Malaysian Names)
// ==================================================================================

const NAMES = [
  // Malay Male Names (100+)
  'ali', 'abu', 'ahmad', 'aiman', 'amin', 'amir', 'azhar', 'azman', 'azri', 'azwan',
  'faiz', 'fakhrul', 'fahmi', 'firdaus', 'hafiz', 'hakim', 'hamdan', 'hamzah', 'haris', 'haziq',
  'hilman', 'hisham', 'husaini', 'ibrahim', 'idris', 'ikram', 'iqbal', 'irfan', 'iskandar', 'ismail',
  'izwan', 'kamal', 'khairul', 'latif', 'mahathir', 'malek', 'muhamad', 'danish', 'najib', 'nizam',
  'omar', 'osman', 'othman', 'rais', 'rahim', 'rahman', 'razak', 'roslan', 'saiful', 'shah',
  'shamsul', 'syafiq', 'syahir', 'syukri', 'wan', 'yasin', 'yusof', 'zaidi', 'zakaria', 'zul',

  // Malay Female Names (50+)
  'aisyah', 'aminah', 'azlina', 'azura', 'farah', 'fazira', 'fatimah', 'hajar', 'hana', 'hayati',
  'hidayah', 'izzah', 'nadia', 'najwa', 'nasuha', 'nora', 'nurain', 'nurul', 'radziah', 'salmah',
  'sarah', 'siti', 'sofea', 'syirah', 'yati', 'zahra', 'zaitun',

  // Chinese Names (30+)
  'chan', 'chong', 'goh', 'heng', 'ho', 'koh', 'lai', 'lee', 'leong', 'liew',
  'lim', 'low', 'ng', 'ong', 'tan', 'tee', 'teoh', 'wong', 'yap', 'yeoh',
  'chin', 'fong', 'gan', 'kho', 'siew', 'soh', 'kua',

  // Indian Names (20+)
  'anand', 'devi', 'gopal', 'kishore', 'kumar', 'lakshmi', 'mala', 'muthu', 'priya', 'raju',
  'rani', 'saras', 'selvi', 'siva', 'usha', 'vikram', 'krishna', 'murugan', 'saravanan',

  // Common Relationships
  'mom', 'dad', 'mak', 'ayah', 'husband', 'wife', 'bini', 'gf', 'bf', 'anak',
  'boss', 'colleague', 'kawan', 'adik', 'abang', 'kakak', 'family', 'teammate', 'roommate',
  'neighbor', 'jiran', 'officemate', 'classmate', 'cousin', 'sepupu', 'nenek', 'atuk'
];

// ==================================================================================
// SECTION 2: TIME & CONTEXT MODIFIERS (50+ variations)
// ==================================================================================

const TIMES = [
  'pagi', 'pagi tadi', 'morning', 'malam', 'malam semalam', 'petang', 'afternoon',
  'lunch time', 'dinner time', 'breakfast time', 'now', 'semalam', 'yesterday',
  'esok', 'tomorrow', 'hari ni', 'today', 'weekend', 'hujung minggu',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'isnin', 'selasa', 'rabu', 'khamis', 'jumaat', 'sabtu', 'ahad',
  'sahur', 'berbuka', 'iftar', 'brunch', 'supper', 'tengah malam', 'midnight',
  '9am', '12pm', '5pm', '8pm', 'late night', 'early morning'
];

const MODIFIERS = [
  'urgent', 'bulanan', 'monthly', 'weekly', 'mingguan', 'daily', 'harian',
  'yearly', 'tahunan', 'seasonal', 'quarterly'
];

// ORDINALS & FREQUENCY (for uniqueness boost)
const ORDINALS = ['first', 'second', 'third', 'pertama', 'kedua', 'ketiga', '1st', '2nd', '3rd'];
const FREQUENCIES = ['weekly', 'biweekly', 'fortnightly', 'quarterly', '3 months', '6 months', 'annual'];
const DESCRIPTORS = ['regular', 'usual', 'scheduled', 'pending', 'overdue', 'upcoming', 'next'];

// ==================================================================================
// SECTION 3: FOOD & BEVERAGE VOCABULARY (250+ Malaysian items)
// ==================================================================================

// BASIC MALAYSIAN FOOD (150+ items) - NEEDS
const FOOD_BASIC = [
  // Rice dishes
  'nasi lemak', 'nasi goreng', 'nasi goreng kampung', 'nasi goreng pattaya', 'nasi kandar',
  'nasi ayam', 'nasi ayam hainan', 'nasi kerabu', 'nasi dagang', 'nasi campur', 'nasi berlauk',
  'nasi paprik', 'nasi tomato', 'nasi briyani', 'nasi hujan panas',

  // Noodles
  'mee goreng', 'mee goreng mamak', 'maggi goreng', 'kuey teow goreng', 'char kuey teow',
  'wantan mee', 'wonton mee', 'mee kari', 'curry mee', 'mee rebus', 'mee bandung',
  'laksa', 'asam laksa', 'curry laksa', 'lontong', 'mee soto', 'mee jawa',
  'hokkien mee', 'pan mee', 'chilli pan mee', 'bihun sup', 'bihun goreng',
  'kuey teow soup', 'prawn mee', 'beef noodle',

  // Breads
  'roti canai', 'roti telur', 'roti planta', 'roti boom', 'roti tissue', 'roti sardin',
  'roti bawang', 'roti bakar', 'roti kahwin', 'thosai', 'thosai masala', 'chapati',

  // Street food
  'satay', 'satay ayam', 'satay kambing', 'pisang goreng', 'keropok lekor', 'karipap',
  'curry puff', 'kuih', 'onde onde', 'kuih lapis', 'rempeyek', 'vadai',

  // Meat dishes
  'ayam goreng', 'ayam goreng berempah', 'ayam rendang', 'rendang daging', 'rendang',
  'sambal sotong', 'ikan bakar', 'ikan keli goreng', 'daging masak kicap',
  'ayam masak merah', 'kambing sup', 'sup tulang', 'sup ayam', 'tom yam',
  'ayam gepuk', 'ayam penyet', 'bebek goreng', 'bebek penyet', 'nasi ayam gepuk',
  'sambal penyet', 'ayam bakar', 'ikan goreng',

  // Vegetables & Others
  'sayur campur', 'telur mata', 'telur goreng', 'tahu goreng', 'tempe goreng',
  'sambal belacan', 'ulam', 'acar', 'kerabu', 'gado gado', 'rojak', 'cendol',
  'ais kacang', 'abc', 'bubur kacang', 'bubur lambuk',

  // Street Food & Snacks
  'apam balik', 'kuih bakar', 'kuih cara', 'goreng pisang cheese', 'pisang cheese',
  'roti john', 'murtabak', 'martabak', 'ramly burger', 'burger malaysia',
  'popiah basah', 'cucur udang', 'jemput-jemput', 'kuih keria',
  'cekodok', 'kuih kodok', 'vadai', 'murukku', 'putu mayam',

  // Malaysian Desserts
  'bubur cha cha', 'pengat', 'kolak', 'kuih lopes', 'seri muka',
  'pulut kuning', 'pulut panggang', 'kuih talam', 'kuih bingka',
  'dodol', 'wajik', 'lepat pisang', 'kuih kosui',

  // Breakfast Specials
  'roti telur bawang', 'roti pisang', 'roti sardin', 'roti bom cheese',
  'half boiled egg set', 'telur setengah masak', 'toast set'
];

// BASIC DRINKS (50+) - NEEDS
const DRINKS_BASIC = [
  'teh tarik', 'teh o', 'teh ais', 'teh o ais', 'teh halia', 'teh limau',
  'kopi', 'kopi o', 'kopi ais', 'kopi panas', 'kopi susu', 'white coffee',
  'nescafe', 'nescafe ais', 'milo', 'milo ais', 'milo dinosaur', 'horlicks',
  'sirap', 'sirap bandung', 'limau ais', 'limau nipis', 'air kosong', 'air suam',
  'mineral water', 'air kelapa', 'air tebu', 'air bandung', 'barley', 'chrysanthemum tea',
  'soya bean', 'soy milk', 'almond milk', 'neslo', 'cham', 'kopi jantan',
  'teh tarik kurang manis', 'kopi o kurang manis',
  // Malaysian Specials
  'sirap selasih', 'air mata kucing', 'teh c', 'kopi c', 'teh c special',
  'three layer tea', 'teh tarik gula melaka', 'teh o limau ais'
];

// BASIC FOOD PLACES - NEEDS
const PLACES_BASIC = [
  'mamak', 'mamak stall', 'warung', 'warung makan', 'gerai', 'food court',
  'medan selera', 'kopitiam', 'kantin', 'canteen', 'kedai makan', 'restoran',
  'restoran melayu', 'pasar malam', 'night market', 'bazaar ramadhan', 'stall',
  'kafe', 'cafeteria', 'pantry office', 'hawker center', 'roadside stall'
];

// FANCY/PREMIUM FOOD (100+) - WANTS
const FOOD_FANCY = [
  // Western
  'wagyu steak', 'ribeye steak', 'sirloin steak', 't-bone steak', 'beef wellington',
  'lamb chop', 'lamb rack', 'grilled salmon', 'salmon teriyaki', 'fish and chips',
  'beef burger', 'gourmet burger', 'cheese burger', 'chicken chop', 'pork chop',

  // Pasta
  'pasta carbonara', 'spaghetti aglio olio', 'spaghetti bolognese', 'lasagna',
  'fettuccine alfredo', 'penne arrabiata', 'marinara pasta', 'truffle pasta',
  'seafood pasta', 'mac and cheese',

  // Pizza
  'pizza margherita', 'pepperoni pizza', 'hawaiian pizza', 'meat lovers pizza',
  'seafood pizza', 'vegetarian pizza',

  // Asian Fusion
  'sushi', 'sashimi', 'sushi platter', 'california roll', 'salmon sushi', 'unagi don',
  'ramen', 'tonkotsu ramen', 'miso ramen', 'shoyu ramen', 'tempura', 'teriyaki chicken',
  'okonomiyaki', 'takoyaki', 'yakitori', 'gyoza', 'tonkatsu',

  // Korean
  'korean bbq', 'samgyeopsal', 'bulgogi', 'bibimbap', 'kimchi jjigae', 'tteokbokki',
  'korean fried chicken', 'japchae', 'sundubu jjigae',

  // Thai/Vietnamese
  'pad thai', 'green curry', 'tom yum kung', 'pho bo', 'bánh mì', 'spring rolls',

  // Chinese Dim Sum
  'dim sum', 'har gow', 'siu mai', 'char siu bao', 'egg tart', 'xiao long bao',

  // Desserts
  'tiramisu', 'cheesecake', 'chocolate lava cake', 'creme brulee', 'panna cotta',
  'gelato', 'ice cream', 'bingsu', 'french toast', 'waffle', 'pancake', 'crepe'
];

// FANCY DRINKS - WANTS
const DRINKS_FANCY = [
  'latte', 'cappuccino', 'flat white', 'espresso', 'macchiato', 'affogato',
  'mocha', 'caramel macchiato', 'vanilla latte', 'hazelnut latte', 'cold brew',
  'iced americano', 'frappuccino', 'frappuccino caramel', 'matcha latte', 'matcha frappe',
  'bubble tea', 'brown sugar milk tea', 'taro milk tea', 'thai milk tea',
  'smoothie', 'berry smoothie', 'mango smoothie', 'avocado smoothie',
  'fresh juice', 'orange juice', 'watermelon juice', 'mixed fruit juice'
];

// FANCY PLACES - WANTS
const PLACES_FANCY = [
  'starbucks', 'zus coffee', 'tealive', 'gong cha', 'chatime', 'koi cafe',
  'coffee bean', 'san francisco coffee', 'nandos', 'chilis', 'tonys roma',
  'sushi king', 'sakae sushi', 'sushi tei', 'seoul garden', 'kim gary',
  'secret recipe', 'kenny rogers', 'texas chicken', 'subway', 'dominos',
  'pizza hut', 'papa johns', 'mcd', 'mcdonalds', 'kfc', 'burger king', 'a&w', 'marrybrown',
  'pavilion kl', 'klcc dining', 'midvalley restaurant', 'sunway pyramid cafe',
  'bangsar cafe', 'damansara restaurant', 'publika cafe', 'ttdi bistro',
  'zus coffee', 'luckin coffee', 'kopi kenangan', 'flash coffee'
];

// ==================================================================================
// SECTION 4A: SINGLE-WORD VOCABULARY (Critical for model accuracy)
// ==================================================================================

// These single words MUST be explicitly trained to avoid fallback
const SINGLE_WORD_FOOD_NEEDS = [
  'groceries', 'grocery', 'breakfast', 'lunch', 'dinner', 'brunch', 'supper',
  'fruits', 'fruit', 'vegetables', 'veggies', 'snack', 'snacks',
  'rice', 'noodles', 'noodle', 'bread', 'milk', 'eggs', 'egg',
  'chicken', 'fish', 'beef', 'pork', 'meat', 'seafood',
  'coffee', 'tea', 'water', 'juice', 'drinks', 'drink',
  'kopi', 'teh', 'milo', 'nescafe', 'mamak', 'horlicks',
  // Added vegetables
  'lettuce', 'broccoli', 'peas', 'spinach', 'beans', 'corn', 'cabbage',
  'carrots', 'potatoes', 'onions', 'garlic', 'ginger', 'tomatoes', 'cucumber',
  // Added drinks
  'soda', 'pepsi', 'sprite', 'fanta', 'ovaltine', 'coke',
  // Added cooking basics
  'sugar', 'salt', 'flour', 'oil', 'butter', 'cheese'
];

const SINGLE_WORD_FOOD_WANTS = [
  'sushi', 'ramen', 'pizza', 'burger', 'steak', 'dessert', 'desserts',
  'boba', 'latte', 'cappuccino', 'frappe', 'smoothie', 'lamb',
  'starbucks', 'mcd', 'mcdonalds', 'kfc', 'subway', 'dominos',
  // Added alcohol (WANTS)
  'wine', 'beer', 'whiskey', 'vodka', 'alcohol', 'champagne', 'cocktail',
  // Added tobacco (WANTS)
  'cigarettes', 'tobacco', 'vape'
];

const SINGLE_WORD_TRANSPORT = [
  'grab', 'uber', 'taxi', 'bus', 'train', 'lrt', 'mrt', 'monorail',
  'petrol', 'diesel', 'fuel', 'toll', 'parking', 'car', 'motorcycle',
  'flight', 'flights', 'lyft',
  // Added petrol stations (NEEDS/Transport)
  'petronas', 'shell', 'caltex', 'bhp', 'petron',
  // Added convenience stores
  'familymart', 'seveneleven', '7eleven'
];

const SINGLE_WORD_SHOPPING = [
  'clothes', 'clothing', 'shoes', 'shoe', 'bag', 'bags', 'watch', 'watches',
  'phone', 'laptop', 'tablet', 'headphones', 'earbuds', 'gadget', 'gadgets',
  'book', 'books', 'toy', 'toys', 'gift', 'gifts'
];

const SINGLE_WORD_ENTERTAINMENT = [
  'movie', 'movies', 'cinema', 'concert', 'concerts', 'game', 'games', 'gaming',
  'netflix', 'spotify', 'youtube', 'gym', 'sports', 'sport',
  'karaoke', 'bowling', 'arcade'
];

const SINGLE_WORD_BILLS = [
  'electricity', 'electric', 'water', 'wifi', 'internet', 'rent', 'rental',
  'bill', 'bills', 'utilities', 'utility', 'astro', 'unifi',
  'insurance', 'loan', 'loans', 'mortgage',
  // Added financial
  'saham', 'stocks', 'bonds', 'investment', 'savings',
  'asb', 'epf', 'kwsp', 'socso', 'perkeso', 'tabunghaji',
  'crypto', 'bitcoin', 'ethereum', 'forex', 'trading',
  // Added banks
  'maybank', 'cimb', 'rhb', 'publicbank', 'hongoleong', 'ambank', 'bsn', 'affin', 'ocbc', 'hsbc',
  // Added e-wallets
  'touchngo', 'tng', 'boost', 'grabpay', 'shopeepay', 'duitnow', 'fpx',
  // Added telcos (should be Telecom but mapped to Financial for bills)
  'maxis', 'celcom', 'digi', 'umobile'
];

const SINGLE_WORD_OTHERS = [
  'doctor', 'doctors', 'dentist', 'dentists', 'clinic', 'hospital',
  'pharmacy', 'medicine', 'medicines', 'vitamin', 'vitamins',
  'haircut', 'salon', 'spa', 'massage', 'barber',
  'school', 'tuition', 'college', 'university', 'course',
  'donation', 'donations', 'charity', 'zakat',
  // Added medical
  'aspirin', 'panadol', 'bandage', 'xray', 'mri', 'ultrasound', 'epidural',
  'optician', 'glasses', 'contacts', 'hearing', 'vaccination', 'vaccine',
  'dentistry', 'scaling', 'filling', 'denture', 'braces',
  // Added baby
  'pampers', 'diapers', 'stroller', 'playpen', 'cot', 'confinement', 'pantang',
  // Added events
  'deepavali', 'diwali', 'angpow', 'funeral', 'pengebumian', 'flowers', 'florist',
  'balloon', 'baloon', 'videographer', 'photographer', 'henna', 'bakery',
  // Added work (fallback to Others)
  'salary', 'bonus', 'overtime', 'commission', 'freelance', 'gig',
  'interview', 'resume', 'cv', 'career', 'promotion', 'resign', 'retirement', 'pension',
  // Added misc
  'potong rambut', 'vacation', 'homework', 'project', 'meeting'
];

// COMMON TYPOS (for training robustness)
const TYPO_VARIANTS = {
  'lunch': ['lnuch', 'lunhc', 'lunc'],
  'dinner': ['dinne', 'diner', 'dineer'],
  'breakfast': ['breakfst', 'brekfast', 'brakfast'],
  'petrol': ['petorl', 'petro', 'petrole'],
  'coffee': ['cofee', 'coffe', 'cofffe'],
  'groceries': ['grocceries', 'grocerries', 'grocerys'],
  'electricity': ['electricty', 'elektrik', 'electriciti'],
  'internet': ['internett', 'inernet', 'intenet'],
  'shopping': ['shoping', 'shoppping', 'shoppng'],
  'transfer': ['tranfer', 'transffer', 'transfar']
};

// ==================================================================================
// SECTION 4: SHOPPING VOCABULARY (200+ items)
// ==================================================================================

// GROCERIES (Only buying to eat/use, not actually eating) - Actually goes to Food & Bev
const GROCERIES = [
  // Staples
  'beras', 'rice', 'minyak masak', 'cooking oil', 'gula', 'sugar', 'garam', 'salt',
  'roti gardenia', 'bread', 'telur', 'eggs', 'susu', 'milk', 'tepung', 'flour',
  'tepung gandum', 'wheat flour', 'tepung jagung', 'corn flour',

  // Fresh produce
  'bawang', 'onion', 'bawang putih', 'garlic', 'bawang merah', 'shallots',
  'sayur', 'vegetables', 'tomato', 'kubis', 'cabbage', 'sawi', 'bok choy',
  'bayam', 'spinach', 'kangkung', 'water spinach', 'timun', 'cucumber',
  'lobak merah', 'carrot', 'kentang', 'potato', 'ubi', 'yam',

  // Meat & Seafood
  'ayam', 'chicken', 'daging', 'beef', 'daging lembu', 'beef',
  'kambing', 'mutton', 'ikan', 'fish', 'ikan kembung', 'mackerel',
  'udang', 'prawn', 'sotong', 'squid', 'ketam', 'crab',

  // Malaysian Spices
  'kunyit', 'turmeric', 'lengkuas', 'galangal', 'halia', 'ginger',
  'serai', 'lemongrass', 'cili', 'chili', 'cili padi', 'bird\'s eye chili',
  'cili kering', 'dried chili', 'bunga lawang', 'star anise',
  'jintan manis', 'fennel', 'jintan putih', 'cumin', 'ketumbar', 'coriander',
  'kayu manis', 'cinnamon', 'bunga cengkeh', 'cloves',
  'halba', 'fenugreek', 'lada hitam', 'black pepper', 'lada putih', 'white pepper',

  // Herbs & Aromatics
  'daun kari', 'curry leaves', 'daun limau purut', 'kaffir lime leaves',
  'daun pandan', 'pandan leaves', 'daun ketumbar', 'cilantro',
  'daun sup', 'celery', 'daun bawang', 'spring onion',

  // Condiments & Pastes
  'belacan', 'shrimp paste', 'cencaluk', 'fermented shrimp',
  'asam jawa', 'tamarind', 'asam keping', 'dried tamarind',
  'santan', 'coconut milk', 'kelapa parut', 'grated coconut',
  'kicap manis', 'sweet soy sauce', 'kicap', 'soy sauce',
  'sos tiram', 'oyster sauce', 'sos cili', 'chili sauce',
  'sos tomato', 'tomato sauce', 'minyak bijan', 'sesame oil',
  'cuka', 'vinegar', 'rempah kari', 'curry powder',
  'rempah rendang', 'rendang paste', 'rempah', 'spice paste',

  // Packaged Foods
  'maggi', 'instant noodle', 'milo packet', 'milo powder',
  'nescafe packet', 'instant coffee', 'sardin tin', 'canned sardines',
  'tuna tin', 'canned tuna', 'sup bunjut', 'instant soup',
  'sos carbonara', 'carbonara sauce', 'sos pasta', 'pasta sauce',

  // Snacks & Misc
  'biscuit', 'cookies', 'biskut hup seng', 'crackers',
  'oat', 'oats', 'nestle', 'cereal', 'yogurt', 'cheese',
  'butter', 'margarine', 'kaya', 'coconut jam', 'jem', 'jam',
  'madu', 'honey', 'susu pekat', 'condensed milk',
  'krim', 'cream', 'mushroom tin', 'canned mushroom'
];

// GROCERY PLACES
const GROCERY_PLACES = [
  '99 speedmart', 'speedmart 99', 'lotus', 'lotuss', 'tesco', 'aeon', 'aeon big',
  'giant', 'jaya grocer', 'village grocer', 'cold storage', 'ben\'s', 'mydin',
  'econsave', 'family mart', 'kk mart', 'kk super mart', 'pasar borong', 'wet market',
  'pasar pagi', 'morning market', 'grocery store', 'kedai runcit', '7 eleven'
];

// FASHION & CLOTHING (100+) - WANTS
const FASHION = [
  // Traditional
  'baju kurung', 'baju melayu', 'sampin', 'kain pelikat', 'baju kebaya', 'batik shirt',

  // Tops
  't-shirt', 'shirt', 'polo shirt', 'blouse', 'kemeja', 'hoodie', 'sweater', 'cardigan',
  'jacket', 'blazer', 'vest', 'tank top', 'sleeveless top', 'crop top',

  // Bottoms
  'jeans', 'seluar jeans', 'pants', 'slacks', 'cargo pants', 'joggers', 'track pants',
  'shorts', 'skirt', 'mini skirt', 'maxi skirt', 'midi skirt', 'palazzo pants',

  // Dresses & Sets
  'dress', 'maxi dress', 'midi dress', 'evening gown', 'cocktail dress', 'jumpsuit',

  // Footwear
  'kasut', 'shoes', 'sneakers', 'running shoes', 'sports shoes', 'formal shoes',
  'leather shoes', 'boots', 'ankle boots', 'heels', 'high heels', 'wedges',
  'sandals', 'slippers', 'flip flops', 'crocs',

  // Accessories
  'handbag', 'sling bag', 'tote bag', 'clutch', 'backpack', 'laptop bag',
  'wallet', 'purse', 'belt', 'tie', 'bow tie', 'scarf', 'shawl', 'tudung',
  'hijab', 'cap', 'hat', 'beanie', 'sunglasses', 'watch', 'smartwatch',

  // Jewelry
  'necklace', 'rantai', 'pendant', 'earrings', 'anting', 'ring', 'cincin',
  'bracelet', 'gelang', 'bangle', 'brooch',

  // Undergarments & Others
  'socks', 'sport socks', 'stockings', 'underwear', 'bra', 'sports bra', 'singlet'
];

// TECH & GADGETS (80+) - WANTS
const TECH = [
  // Phones
  'iphone 15', 'iphone 14', 'iphone pro max', 'samsung galaxy s24', 'samsung galaxy a54',
  'samsung phone', 'xiaomi phone', 'redmi note', 'oppo phone', 'vivo phone',
  'realme phone', 'huawei phone', 'google pixel', 'oneplus phone',

  // Computers
  'laptop', 'macbook pro', 'macbook air', 'dell laptop', 'hp laptop', 'lenovo laptop',
  'asus laptop', 'acer laptop', 'gaming laptop', 'ultrabook', 'chromebook',
  'desktop pc', 'gaming pc', 'imac', 'mac mini',

  // Tablets
  'ipad', 'ipad air', 'ipad pro', 'ipad mini', 'samsung tablet', 'galaxy tab',
  'android tablet',

  // Accessories
  'airpods', 'airpods pro', 'earbuds', 'wireless earbuds', 'earphone', 'headphone',
  'headset gaming', 'bluetooth speaker', 'portable speaker', 'jbl speaker',
  'powerbank', 'powerbank 20000mah', 'charger', 'fast charger', '65w charger',
  'cable usb c', 'lightning cable', 'hdmi cable', 'adapter', 'type c adapter',

  // Peripherals
  'mouse', 'wireless mouse', 'gaming mouse', 'keyboard', 'mechanical keyboard',
  'gaming keyboard', 'monitor', 'gaming monitor', '4k monitor', 'webcam',

  // Storage
  'hard drive', 'external hard drive', '1tb hard drive', 'ssd', 'usb drive',
  'pendrive', 'sd card', 'microsd card',

  // Smart Devices
  'smartwatch', 'apple watch', 'samsung watch', 'mi band', 'fitness tracker',
  'smart home device', 'alexa', 'google home',

  // Gaming
  'playstation 5', 'ps5', 'xbox', 'nintendo switch', 'gaming controller'
];

const SHOPPING_PLACES = [
  'shopee', 'lazada', 'zalora', 'grab mart', 'foodpanda shops',
  'uniqlo', 'h&m', 'zara', 'padini', 'cotton on', 'brands outlet',
  'nike store', 'adidas official', 'puma store', 'new balance', 'skechers',
  'mr diy', 'ace hardware', 'ikea', 'courts', 'harvey norman',
  'machines', 'switch', 'senheng', 'best denki', 'apple store', 'samsung store',
  'low yat plaza', 'digital mall', 'plaza lowyat',
  'pavilion kl', 'klcc', 'mid valley', 'sunway pyramid', 'one utama',
  'the gardens mall', 'bangsar village', 'publika', 'ttdi plaza'
];

// ==================================================================================
// SECTION 5: FINANCIAL SERVICES (100+ items)
// ==================================================================================

// BILLS (50+) - NEEDS
const BILLS = [
  'tnb bill', 'tnb', 'electricity bill', 'elektrik', 'tenaga nasional',
  'water bill', 'syabas bill', 'air selangor', 'pengurusan air',
  'astro bill', 'astro', 'satellite tv', 'tv subscription',
  'unifi bill', 'unifi', 'tm unifi', 'internet bill', 'wifi bill',
  'maxis fibre', 'time fibre', 'streamyx', 'celcom home fibre',
  'indah water', 'iwk', 'sewerage bill', 'sewer bill',
  'cukai tanah', 'quit rent', 'cukai pintu', 'assessment',
  'condo maintenance', 'sinking fund', 'management fee', 'security fee',
  'parking fee', 'season parking', 'monthly parking'
];

// LOANS (30+) - NEEDS
const LOANS = [
  'car loan', 'auto loan', 'hire purchase', 'loan kereta',
  'housing loan', 'home loan', 'mortgage', 'loan rumah',
  'ptptn', 'ptptn loan', 'study loan', 'education loan',
  'personal loan', 'pinjaman peribadi',
  'credit card', 'kad kredit', 'credit card payment',
  'maybank credit card', 'cimb credit card', 'public bank card',
  'aeon credit', 'aeon card'
];

const BANKS = [
  'maybank', 'cimb', 'public bank', 'rhb bank', 'hong leong bank',
  'bank islam', 'ambank', 'bank rakyat', 'bsn', 'affin bank',
  'alliance bank', 'ocbc bank', 'hsbc', 'standard chartered',
  'citibank', 'uob bank', 'bank muamalat'
];

// ==================================================================================
// SECTION 6: TRANSPORTATION (80+ items)
// ==================================================================================

const FUEL = ['ron95', 'ron97', 'diesel', 'diesel euro5', 'petrol', 'minyak'];
const PETROL_STATIONS = [
  'petronas', 'shell', 'caltex', 'bhp', 'petron', 'esso', 'petrol station'
];

// DIGITAL SERVICES & PLATFORMS (100+ items) - Mixed
const FOOD_DELIVERY = [
  'foodpanda', 'grabfood', 'grab food', 'shopee food', 'shopeefood', 'lalamove food',
  'bungkusit', 'makan2u', 'delivereat', 'food delivery', 'delivery fee foodpanda',
  'delivery charge grabfood', 'rider tip', 'foodpanda rider tip'
];

const RIDE_HAILING = [
  'grab ride', 'grabcar', 'grab premium', 'grab6', 'grabshare', 'grabfamily',
  'mycarpremium', 'mycarbudget', 'airasia ride', 'airasia ridepremium',
  'indrive', 'indrive ride', 'maxim ride', 'socar hourly', 'gocar rental',
  'trevo rental', 'car rental'
];

const EWALLET_PLATFORMS = [
  'touch n go ewallet', 'tng reload', 'boost reload', 'boost wallet', 'mae wallet',
  'bigpay', 'bigpay reload', 'grab wallet reload', 'shopee pay', 'shopeepay',
  'lazada wallet', 'fave pay', 'razer pay', 'duitnow transfer', 'jompay'
];

const PARKING_TOLL = [
  'smart selangor parking', 'mbpj parking', 'dbkl parking', 'parking fee',
  'plus toll', 'plus highway', 'ldp toll', 'nkve toll', 'elite highway',
  'mex highway', 'kesas toll', 'akleh toll', 'besraya toll',
  'touch n go rfid reload', 'smarttag reload', 'toll reload'
];

const DELIVERY_COURIER = [
  'lalamove', 'lalamove delivery', 'grab express', 'grab parcel', 'mrSpeedy delivery',
  'j&t express', 'j&t cod', 'poslaju', 'pos laju', 'citylink express',
  'gdex', 'ninja van', 'dhl', 'fedex', 'aramex', 'abx express',
  'courier fee', 'parcel delivery', 'shipping fee'
];

const ONLINE_SERVICES = [
  'zoom premium', 'google workspace', 'microsoft teams', 'webex',
  'domain renewal', 'hosting fee', 'ssl certificate', 'web hosting',
  'cloudflare', 'aws', 'digitalocean', 'github pro', 'gitlab premium'
];

const BOOKING_PLATFORMS = [
  'agoda hotel', 'booking.com hotel', 'traveloka flight', 'airasia flight',
  'grab hotel', 'airbnb', 'trip.com', 'expedia', 'hotels.com',
  'malaysiaairlines', 'batik air', 'firefly', 'malindo air',
  'ktmb ticket', 'ets ticket online', 'bus ticket', 'express bus'
];

const PUBLIC_TRANSPORT = [
  'grab', 'grabcar', 'grab bike', 'maxim', 'airasia ride',
  'lrt', 'lrt kelana jaya', 'lrt ampang', 'mrt', 'mrt kajang', 'mrt putrajaya',
  'monorail', 'kl monorail', 'ktm', 'ktm komuter', 'ets', 'klia transit',
  'rapidkl', 'rapid bus', 'stage bus', 'express bus', 'bas ekspres',
  'uber', 'taxi', 'teksi'
];

const VEHICLE_EXPENSES = [
  'roadtax', 'road tax', 'cukai jalan', 'insurance', 'insurans kereta', 'takaful',
  'service kereta', 'car service', 'engine service', '5000km service', '10000km service',
  'oil change', 'engine oil', 'synthetic oil', 'tayar', 'tyre', 'michelin tyre',
  'battery', 'bateri kereta', 'amaron battery', 'brake pad', 'brake disc',
  'air filter', 'cabin filter', 'spark plug', 'timing belt', 'wiper blade',
  'alignment', 'balancing', 'wheel alignment', 'aircond service', 'aircond gas',
  'car wash', 'polish kereta', 'touch up paint', 'windscreen repair'
];

const EWALLET_TRANSPORT = ['touch n go', 'tng', 'tng ewallet', 'grab wallet', 'boost'];

// ==================================================================================
// SECTION 7: OTHERS - MEDICAL & EDUCATION (60+ items)
// ==================================================================================

const MEDICAL = [
  'ubat', 'medicine', 'ubat demam', 'panadol', 'panadol actifast', 'panadol soluble',
  'vitamin', 'vitamin c', 'vitamin d', 'multivitamin', 'supplement', 'omega 3',
  'protein powder', 'collagen', 'calcium', 'iron supplement',
  'ubat batuk', 'cough syrup', 'strepsils', 'lozenges',
  'ubat gatal', 'cream', 'ointment', 'plaster', 'bandage', 'gauze',
  'hand sanitizer', 'face mask', 'surgical mask', 'thermometer',
  'blood pressure monitor', 'glucose meter'
];

const MEDICAL_PLACES = [
  'pharmacy', 'farmasi', 'guardian', 'watson', 'caring pharmacy', 'alpro pharmacy',
  'klinik', 'clinic', 'klinik kesihatan', 'panel clinic', 'gp clinic',
  'hospital', 'hospital kerajaan', 'private hospital', 'hospital swasta',
  'dental clinic', 'klinik gigi'
];

const EDUCATION = [
  'school fee', 'yuran sekolah', 'tuition fee', 'yuran tuisyen', 'tuition center fee',
  'university fee', 'college fee', 'course fee', 'exam fee', 'registration fee',
  'buku teks', 'textbook', 'buku nota', 'notebook', 'exercise book',
  'stationery', 'alat tulis', 'pen', 'pencil', 'eraser', 'ruler', 'calculator',
  'uniform sekolah', 'school uniform', 'school shoes', 'kasut sekolah',
  'bag sekolah', 'school bag', 'water bottle'
];

//===================================================================================
// SECTION 8: ENTERTAINMENT & TELECOMMUNICATION (40+ items)
// ==================================================================================

const ENTERTAINMENT = [
  'movie ticket', 'cinema ticket', 'wayang', 'gsc ticket', 'tgv ticket',
  'concert ticket', 'music concert', 'festival pass',
  'theme park', 'sunway lagoon', 'genting theme park', 'legoland',
  'zoo negara', 'aquaria klcc', 'petrosains',
  'karaoke', 'karaoke session', 'red box', 'nway karaoke',
  'bowling', 'arcade', 'escape room', 'trampoline park',
  'badminton court', 'futsal', 'gym membership', 'fitness center'
];

const TELECOM = [
  'maxis postpaid', 'maxis bill', 'maxis prepaid', 'hotlink reload',
  'digi postpaid', 'digi prepaid', 'digi bill',
  'celcom postpaid', 'celcom prepaid', 'celcom blue', 'xpax reload',
  'umobile postpaid', 'unifi mobile', 'yes 4g'
];

// ==================================================================================
// SECTION 10: GAMING & DIGITAL (100+ items) - WANTS
// ==================================================================================

const GAMING = [
  'mobile legends diamond', 'ml diamond', 'mobile legends skin', 'pubg uc', 'pubg mobile uc',
  'free fire diamond', 'codm cp', 'call of duty points', 'genshin crystal', 'genshin impact',
  'valorant points', 'riot points', 'league of legends rp', 'steam wallet', 'steam credit',
  'playstation plus', 'ps plus', 'xbox game pass', 'nintendo eshop', 'roblox robux',
  'minecraft', 'among us', 'fifa points', 'apex legends coins', 'fortnite vbucks',
  'clash of clans gems', 'clash royale gems', 'brawl stars gems', 'ragnarok eternal love',
  'garena shells', 'razer gold', 'game credit', 'top up game', 'game diamond'
];

const SUBSCRIPTIONS = [
  'netflix', 'netflix premium', 'disney plus', 'disney+ hotstar', 'spotify premium',
  'youtube premium', 'apple music', 'amazon prime', 'hbo go', 'viu premium',
  'iqiyi', 'wetv', 'astro on demand', 'tonton', 'iflix',
  'microsoft 365', 'office 365', 'adobe creative cloud', 'photoshop subscription',
  'canva pro', 'grammarly premium', 'notion pro', 'evernote premium',
  'icloud storage', 'google one', 'dropbox plus', 'onedrive',
  'antivirus renewal', 'norton', 'mcafee', 'vpn subscription', 'expressvpn'
];

// ==================================================================================
// SECTION 11: HEALTH & BEAUTY (100+ items) - Mixed NEEDS/WANTS
// ==================================================================================

const BEAUTY_BASIC = [ // NEEDS
  'shampoo', 'conditioner', 'shower gel', 'sabun mandi', 'toothpaste', 'toothbrush',
  'facial wash', 'cleanser', 'moisturizer', 'sunscreen', 'body lotion',
  'hand soap', 'hand sanitizer', 'deodorant', 'perfume', 'cologne',
  'razor', 'shaving cream', 'cotton pads', 'tissue', 'wet wipes'
];

const BEAUTY_PREMIUM = [ // WANTS
  'sk-ii', 'estee lauder', 'lancome', 'clinique', 'shiseido', 'hada labo',
  'cosrx', 'innisfree', 'laneige', 'sulwhasoo', 'la mer',
  'foundation', 'cushion', 'lipstick', 'mascara', 'eyeliner', 'eyeshadow palette',
  'blush', 'highlighter', 'contour', 'makeup brush set', 'beauty blender',
  'hair treatment', 'hair mask', 'serum', 'essence', 'toner', 'ampoule',
  'face mask', 'sheet mask', 'clay mask', 'peel off mask',
  'nail polish', 'gel polish', 'manicure', 'pedicure',
  'hair dye', 'hair color', 'hair rebonding', 'hair perm'
];

const BEAUTY_SERVICES = [ // WANTS
  'haircut', 'hair salon', 'spa treatment', 'facial treatment', 'massage',
  'body scrub', 'waxing', 'threading', 'eyelash extension', 'nail art',
  'hair wash', 'hair styling', 'makeup service', 'bridal makeup'
];

const BEAUTY_PLACES = [
  'watson', 'guardian', 'sephora', 'sasa', 'watsons', 'caring pharmacy',
  'hair salon', 'saloon', 'spa', 'nail salon', 'beauty salon'
];

// ==================================================================================
// SECTION 12: HOME & LIFESTYLE (80+ items) - WANTS
// ==================================================================================

const HOME_ITEMS = [
  // Furniture
  'sofa', 'katil', 'bed frame', 'mattress', 'tilam', 'bantal', 'pillow',
  'comforter', 'bedsheet', 'cadar', 'curtain', 'langsir', 'carpet', 'permaidani',
  'table', 'meja', 'chair', 'kerusi', 'cabinet', 'almari', 'wardrobe',
  'bookshelf', 'rak buku', 'tv cabinet', 'coffee table', 'dining table',

  // Appliances
  'fan', 'kipas', 'air conditioner', 'aircond', 'water heater', 'pemanas air',
  'rice cooker', 'periuk nasi', 'microwave', 'oven', 'air fryer', 'blender',
  'kettle', 'cerek', 'iron', 'seterika', 'vacuum cleaner', 'pembersih habuk',
  'washing machine', 'mesin basuh', 'fridge', 'peti sejuk', 'freezer',

  // Kitchen Cookware & Utensils
  'periuk', 'pot', 'belanga', 'wok', 'kuali', 'frying pan', 'kukusan', 'steamer',
  'sudu', 'spoon', 'garpu', 'fork', 'pisau', 'knife', 'chopsticks', 'chopstick',
  'talenan', 'chopping board', 'mangkuk', 'bowl', 'pinggan', 'plate',
  'cawan', 'cup', 'gelas', 'glass', 'piring', 'dish', 'dulang', 'tray',
  'senduk', 'ladle', 'spatula', 'penjepit', 'tongs', 'parutan', 'grater',
  'pengisar', 'grinder', 'bekas', 'container', 'tupperware', 'flask', 'termos',

  // Household Textiles
  'tuala', 'towel', 'tuala mandi', 'bath towel', 'tuala muka', 'face towel',
  'kain pelikat', 'sarung', 'kain batik', 'batik cloth', 'kain buruk', 'rag',
  'sarung bantal', 'pillowcase', 'comforter cover', 'blanket', 'selimut',
  'alas kaki', 'doormat', 'kain lap', 'cloth', 'apron', 'apron masak',

  // Cleaning Supplies
  'penyapu', 'broom', 'mop', 'pengki', 'dustpan', 'baldi', 'bucket',
  'kain lantai', 'floor cloth', 'berus', 'brush', 'sabun basuh', 'detergent',
  'sabun cuci pinggan', 'dishwashing liquid', 'pencuci lantai', 'floor cleaner',
  'ubat nyamuk', 'mosquito repellent', 'racun lipas', 'insecticide',
  'pewangi', 'air freshener', 'softener', 'fabric softener',

  // Lighting & Decor
  'lamp', 'lampu', 'light bulb', 'mentol', 'smart bulb', 'led light',
  'picture frame', 'wall art', 'clock', 'jam dinding', 'mirror', 'cermin',
  'trash bin', 'tong sampah', 'laundry basket', 'bakul', 'hanger', 'penyidai baju',
  'clothesline', 'ampaian', 'peg', 'klip baju',

  // Storage & Organization
  'plastic container', 'bekas plastik', 'rak', 'rack', 'drawer organizer',
  'kotak', 'box', 'storage box', 'cable organizer', 'shoe rack', 'rak kasut'
];

const HOME_PLACES = [
  'ikea', 'mr diy', 'ace hardware', 'homepro', 'courts', 'harvey norman',
  'eco shop', 'daiso', 'mr diy mall', 'shopee home', 'lazada home'
];

//==================================================================================
// SECTION 13: PETS (40+ items) - NEEDS
// ==================================================================================

const PETS = [
  'cat food', 'makanan kucing', 'dog food', 'makanan anjing', 'pet food',
  'cat litter', 'pasir kucing', 'pet shampoo', 'flea treatment',
  'pet vitamin', 'pet medicine', 'vet checkup', 'vaccination', 'vaksin',
  'pet grooming', 'cat cage', 'dog leash', 'pet collar', 'pet toy',
  'fish food', 'makanan ikan', 'aquarium', 'hamster cage', 'bird seed'
];

// ==================================================================================
// SECTION 14: HOBBIES & SPORTS (60+ items) - WANTS
// ==================================================================================

const HOBBIES = [
  'camera', 'lens', 'tripod', 'gimbal', 'drone', 'gopro',
  'guitar', 'gitar', 'ukulele', 'keyboard', 'piano', 'drum set',
  'badminton racket', 'raket', 'shuttlecock', 'bola badminton',
  'football', 'bola sepak', 'futsal ball', 'basketball', 'netball',
  'yoga mat', 'dumbbell', 'kettlebell', 'resistance band', 'gym equipment',
  'running shoes', 'cycling jersey', 'basikal', 'bicycle', 'helmet',
  'fishing rod', 'pancing', 'bait', 'umpan', 'camping tent', 'khemah',
  'hiking boots', 'kasut mendaki', 'backpack hiking', 'sleeping bag',
  'skateboard', 'roller skates', 'scooter', 'golf club', 'tennis racket'
];

// ==================================================================================
// SECTION 15: INSURANCE & FINANCIAL PROTECTION (30+ items) - NEEDS
// ==================================================================================

const INSURANCE = [
  'takaful', 'life insurance', 'insurans hayat', 'health insurance', 'medical card',
  'car insurance', 'motor insurance', 'insurans kereta', 'motorcycle insurance',
  'travel insurance', 'house insurance', 'fire insurance', 'personal accident',
  'critical illness', 'hospital income', 'endowment', 'investment linked',
  'etiqa', 'prudential', 'great eastern', 'allianz', 'aia', 'zurich takaful'
];

// ==================================================================================
// SECTION 16: DONATIONS & CHARITY (20+ items) - Mixed
// ==================================================================================

const DONATIONS = [ // Can be NEEDS (religious obligation) or WANTS (voluntary)
  'zakat', 'zakat fitrah', 'zakat pendapatan', 'sedekah', 'derma',
  'donation', 'charity', 'wakaf', 'infaq', 'khairat kematian',
  'mosque donation', 'derma masjid', 'orphanage', 'rumah anak yatim',
  'flood relief', 'bantuan banjir', 'food bank', 'tabung masjid'
];

// ==================================================================================
// SECTION 17: BOOKS & MEDIA (40+ items) - WANTS
// ==================================================================================

const BOOKS_MEDIA = [
  'novel', 'book', 'buku', 'textbook', 'magazine', 'majalah', 'comic', 'komik',
  'manga', 'graphic novel', 'cookbook', 'self help book', 'biography',
  'quran', 'alquran', 'islamic book', 'buku agama', 'motivational book',
  'newspaper', 'surat khabar', 'kindle book', 'ebook', 'audiobook',
  'stationery', 'notebook', 'diary', 'planner', 'calendar', 'art supplies'
];

// ==================================================================================
// SECTION 18: EVENTS & OCCASIONS (30+ items) - WANTS
// ==================================================================================

const EVENTS = [
  'wedding gift', 'hadiah kahwin', 'birthday gift', 'hadiah birthday',
  'ang pow', 'duit raya', 'angpau', 'wedding', 'majlis kahwin',
  'engagement', 'tunang', 'aqiqah', 'cukur jambul', 'kenduri',
  'party decoration', 'birthday cake', 'kek birthday', 'catering',
  'wedding photographer', 'pelamin', 'dais', 'wedding card', 'kad jemputan',
  'door gift', 'bunga telur', 'hantaran', 'dowry'
];

// ==================================================================================
// SECTION 19: REGIONAL MALAYSIAN FOOD VARIATIONS (50+ items)
// ==================================================================================

const FOOD_REGIONAL = [
  // Penang
  'penang char kuey teow', 'penang laksa', 'penang nasi kandar', 'pasembur',
  'rojak penang', 'cendol penang', 'apom balik', 'lor bak',
  // Johor
  'johor laksa', 'mee bandung muar', 'otak otak', 'kacang pool',
  // Melaka
  'chicken rice ball', 'satay celup', 'cendol melaka',
  // Ipoh
  'ipoh hor fun', 'ipoh white coffee', 'nga choi kai', 'tauge ayam',
  'salt baked chicken', 'kai see hor fun',
  // Kelantan
  'nasi kerabu kelantan', 'nasi dagang', 'ayam percik', 'solok lada',
  // Terengganu
  'keropok lekor terengganu', 'nasi dagang terengganu', 'otak otak terengganu',
  // Sabah/Sarawak
  'tuaran mee', 'ngiu chap', 'kolo mee', 'sarawak laksa', 'manok pansoh',
  'bambangan', 'hinava', 'amplang'
];

// ==================================================================================
// SECTION 20: SENTENCE GENERATION PATTERNS (200+ unique patterns)
// ==================================================================================

function r(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function maybe(prob = 0.3) { return Math.random() < prob; }

const GENERATORS = {
  // FOOD & BEVERAGE (NEEDS) - 30,000 target
  food_needs: [
    () => `makan ${r(FOOD_BASIC)} at ${r(PLACES_BASIC)}`,
    () => `tapau ${r(FOOD_BASIC)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(FOOD_BASIC)} for lunch ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `${r(FOOD_BASIC)} for dinner`,
    () => `beli ${r(FOOD_BASIC)} at ${r(PLACES_BASIC)}`,
    () => `${r(FOOD_BASIC)} with ${r(NAMES)} ${maybe() ? r(TIMES) : ''}`,
    () => `order ${r(FOOD_BASIC)} ${maybe() ? 'at ' + r(PLACES_BASIC) : ''}`,
    () => `sarapan ${r(FOOD_BASIC)}`,
    () => `minum ${r(DRINKS_BASIC)} at ${r(PLACES_BASIC)}`,
    () => `${r(DRINKS_BASIC)} for ${r(NAMES)}`,
    () => `beli ${r(DRINKS_BASIC)} ${maybe() ? r(TIMES) : ''}`,
    () => `breakfast ${r(FOOD_BASIC)} ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `${r(FOOD_BASIC)} sahur`,
    () => `${r(FOOD_BASIC)} berbuka`,
    () => `lunch ${r(FOOD_BASIC)}`,
    () => `dinner ${r(FOOD_BASIC)} at ${r(PLACES_BASIC)}`,
    () => `supper ${r(FOOD_BASIC)}`,
    () => `makan ${r(FOOD_BASIC)} with ${r(NAMES)}`,
    () => `${r(DRINKS_BASIC)} ${r(TIMES)}`,
    () => `order ${r(DRINKS_BASIC)} at ${r(PLACES_BASIC)}`,
  ],

  // FOOD & BEVERAGE (WANTS) - 12,000 target
  food_wants: [
    () => `treat ${r(FOOD_FANCY)} at ${r(PLACES_FANCY)}`,
    () => `${r(FOOD_FANCY)} at ${r(PLACES_FANCY)}`,
    () => `celebrate ${r(FOOD_FANCY)} ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `dating at ${r(PLACES_FANCY)}`,
    () => `birthday ${r(FOOD_FANCY)}`,
    () => `reward ${r(DRINKS_FANCY)} ${maybe() ? 'at ' + r(PLACES_FANCY) : ''}`,
    () => `craving ${r(FOOD_FANCY)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(DRINKS_FANCY)} from ${r(PLACES_FANCY)}`,
    () => `anniversary ${r(FOOD_FANCY)}`,
    () => `${r(FOOD_FANCY)} weekend ${maybe() ? 'with ' + r(NAMES) : ''}`,
  ],

  // SHOPPING (WANTS) - 27,000 target
  shopping_wants: [
    () => `beli ${r(FASHION)} at ${r(SHOPPING_PLACES)}`,
    () => `${r(FASHION)} shopping ${maybe() ? r(TIMES) : ''}`,
    () => `buy ${r(TECH)} from ${r(SHOPPING_PLACES)}`,
    () => `upgrade ${r(TECH)}`,
    () => `${r(FASHION)} for ${r(NAMES)}`,
    () => `survey ${r(TECH)} ${maybe() ? 'at ' + r(SHOPPING_PLACES) : ''}`,
    () => `${r(TECH)} online`,
    () => `order ${r(FASHION)} ${maybe() ? 'for ' + r(NAMES) : ''}`,
    () => `shopping ${r(FASHION)} ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `${r(TECH)} ${r(SHOPPING_PLACES)}`,
  ],

  // FINANCIAL (NEEDS) - 33,000 target
  finance_needs: [
    () => `bayar ${r(BILLS)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `pay ${r(BILLS)}`,
    () => `settle ${r(LOANS)} at ${r(BANKS)}`,
    () => `${r(BILLS)} ${r(MODIFIERS)}`,
    () => `clear ${r(LOANS)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(LOANS)} payment`,
    () => `transfer ${r(BILLS)}`,
    () => `${r(BILLS)} for ${r(NAMES)}`,
    () => `${r(ORDINALS)} ${r(LOANS)} payment`,
    () => `${r(DESCRIPTORS)} ${r(BILLS)}`,
    () => `${r(BILLS)} ${r(FREQUENCIES)}`,
    () => `${r(LOANS)} ${r(ORDINALS)} installment`,
  ],

  // TRANSPORTATION (NEEDS) - 22,500 target
  transport_needs: [
    () => `isi ${r(FUEL)} at ${r(PETROL_STATIONS)}`,
    () => `${r(PUBLIC_TRANSPORT)} to work`,
    () => `grab to office ${maybe() ? r(TIMES) : ''}`,
    () => `bayar ${r(VEHICLE_EXPENSES)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `${r(PUBLIC_TRANSPORT)} for ${r(NAMES)}`,
    () => `${r(FUEL)} full tank`,
    () => `${r(VEHICLE_EXPENSES)} service`,
    () => `topup ${r(EWALLET_TRANSPORT)}`,
    () => `${r(ORDINALS)} ${r(FUEL)} topup`,
    () => `${r(DESCRIPTORS)} ${r(VEHICLE_EXPENSES)}`,
    () => `${r(PUBLIC_TRANSPORT)} ${r(FREQUENCIES)}`,
  ],

  // OTHERS (NEEDS) - 13,500 target
  others_needs: [
    () => `beli ${r(MEDICAL)} at ${r(MEDICAL_PLACES)}`,
    () => `${r(MEDICAL)} untuk ${r(NAMES)}`,
    () => `bayar ${r(EDUCATION)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `checkup at ${r(MEDICAL_PLACES)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(EDUCATION)} ${maybe() ? 'for ' + r(NAMES) : ''}`,
  ],

  // ENTERTAINMENT (WANTS) - 7,500 target
  entertainment_wants: [
    () => `tengok ${r(ENTERTAINMENT)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(ENTERTAINMENT)} with ${r(NAMES)}`,
    () => `${r(ENTERTAINMENT)} weekend`,
  ],

  // TELECOMMUNICATION (NEEDS) - 4,500 target
  telecom_needs: [
    () => `bayar ${r(TELECOM)} ${r(MODIFIERS)}`,
    () => `topup ${r(TELECOM)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(TELECOM)} ${r(MODIFIERS)}`,
  ],

  // NEW CATEGORIES TO HIT 150K

  // GAMING & DIGITAL (WANTS) - 15,000 target
  gaming_wants: [
    () => `topup ${r(GAMING)} ${maybe() ? r(TIMES) : ''}`,
    () => `beli ${r(GAMING)}`,
    () => `buy ${r(GAMING)} for ${r(NAMES)}`,
    () => `${r(GAMING)} ${maybe() ? 'for ' + r(NAMES) : ''}`,
    () => `subscribe ${r(SUBSCRIPTIONS)} ${r(MODIFIERS)}`,
    () => `bayar ${r(SUBSCRIPTIONS)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `renew ${r(SUBSCRIPTIONS)}`,
    () => `${r(SUBSCRIPTIONS)} subscription`,
  ],

  // BEAUTY (Mixed) - 10,000 target  
  beauty_mixed: [
    () => `beli ${r(BEAUTY_BASIC)} at ${r(BEAUTY_PLACES)}`,
    () => `${r(BEAUTY_BASIC)} untuk ${r(NAMES)}`,
    () => `buy ${r(BEAUTY_PREMIUM)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(BEAUTY_PREMIUM)} at ${r(BEAUTY_PLACES)}`,
    () => `${r(BEAUTY_SERVICES)} ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `${r(BEAUTY_SERVICES)} ${r(TIMES)}`,
  ],

  // HOME & LIFESTYLE (WANTS) - 8,000 target
  home_wants: [
    () => `beli ${r(HOME_ITEMS)} at ${r(HOME_PLACES)}`,
    () => `buy ${r(HOME_ITEMS)} ${maybe() ? 'from ' + r(HOME_PLACES) : ''}`,
    () => `${r(HOME_ITEMS)} for ${r(NAMES)}`,
    () => `${r(HOME_ITEMS)} shopping ${maybe() ? r(TIMES) : ''}`,
  ],

  // PETS (NEEDS) - 3,000 target
  pets_needs: [
    () => `beli ${r(PETS)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(PETS)} untuk ${r(NAMES)}`,
    () => `buy ${r(PETS)}`,
  ],

  // HOBBIES & SPORTS (WANTS) - 6,000 target
  hobbies_wants: [
    () => `beli ${r(HOBBIES)} ${maybe() ? 'at ' + r(SHOPPING_PLACES) : ''}`,
    () => `buy ${r(HOBBIES)} for ${r(NAMES)}`,
    () => `${r(HOBBIES)} ${maybe() ? r(TIMES) : ''}`,
  ],

  // INSURANCE (NEEDS) - 3,000 target
  insurance_needs: [
    () => `bayar ${r(INSURANCE)} ${r(MODIFIERS)}`,
    () => `renew ${r(INSURANCE)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(INSURANCE)} premium`,
  ],

  // DONATIONS (Mixed) - 2,000 target
  donations_mixed: [
    () => `bayar ${r(DONATIONS)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `derma ${r(DONATIONS)}`,
    () => `${r(DONATIONS)} ${maybe() ? 'for ' + r(NAMES) : ''}`,
  ],

  // BOOKS & MEDIA (WANTS) - 3,000 target
  books_wants: [
    () => `beli ${r(BOOKS_MEDIA)} ${maybe() ? r(TIMES) : ''}`,
    () => `buy ${r(BOOKS_MEDIA)} for ${r(NAMES)}`,
    () => `${r(BOOKS_MEDIA)} online`,
  ],

  // EVENTS (WANTS) - 2,500 target
  events_wants: [
    () => `beli ${r(EVENTS)} ${maybe() ? 'for ' + r(NAMES) : ''}`,
    () => `${r(EVENTS)} ${maybe() ? r(TIMES) : ''}`,
    () => `bayar ${r(EVENTS)}`,
  ],

  // REGIONAL FOOD (Mix into food categories)
  regional_food: [
    () => `makan ${r(FOOD_REGIONAL)} ${maybe() ? 'with ' + r(NAMES) : ''}`,
    () => `tapau ${r(FOOD_REGIONAL)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(FOOD_REGIONAL)} for ${maybe() ? 'lunch' : 'dinner'}`,
    () => `order ${r(FOOD_REGIONAL)}`,
  ],

  // DIGITAL PLATFORMS - NEW
  food_delivery: [
    () => `${r(FOOD_DELIVERY)} ${maybe() ? r(TIMES) : ''}`,
    () => `bayar ${r(FOOD_DELIVERY)}`,
    () => `order ${r(FOOD_BASIC)} ${r(FOOD_DELIVERY)}`,
    () => `${r(FOOD_DELIVERY)} for ${r(NAMES)}`,
  ],

  ride_services: [
    () => `${r(RIDE_HAILING)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(RIDE_HAILING)} to ${maybe() ? 'office' : 'home'}`,
    () => `bayar ${r(RIDE_HAILING)}`,
    () => `${r(RIDE_HAILING)} for ${r(NAMES)}`,
  ],

  ewallet_reload: [
    () => `topup ${r(EWALLET_PLATFORMS)} ${maybe() ? r(TIMES) : ''}`,
    () => `reload ${r(EWALLET_PLATFORMS)}`,
    () => `${r(EWALLET_PLATFORMS)} reload`,
  ],

  parking_toll: [
    () => `bayar ${r(PARKING_TOLL)} ${maybe() ? r(MODIFIERS) : ''}`,
    () => `${r(PARKING_TOLL)} ${maybe() ? r(TIMES) : ''}`,
    () => `topup ${r(PARKING_TOLL)}`,
  ],

  delivery_services: [
    () => `bayar ${r(DELIVERY_COURIER)}`,
    () => `${r(DELIVERY_COURIER)} ${maybe() ? r(TIMES) : ''}`,
    () => `${r(DELIVERY_COURIER)} fee`,
  ],

  online_services: [
    () => `bayar ${r(ONLINE_SERVICES)} ${r(MODIFIERS)}`,
    () => `subscribe ${r(ONLINE_SERVICES)}`,
    () => `renew ${r(ONLINE_SERVICES)}`,
  ],

  bookings: [
    () => `beli ${r(BOOKING_PLATFORMS)} ${maybe() ? r(TIMES) : ''}`,
    () => `book ${r(BOOKING_PLATFORMS)}`,
    () => `${r(BOOKING_PLATFORMS)} for ${r(NAMES)}`,
  ],

  // GROCERY SHOPPING (NEEDS)
  grocery_shopping: [
    () => `beli ${r(GROCERIES)} at ${r(GROCERY_PLACES)}`,
    () => `${r(GROCERIES)} shopping ${maybe() ? r(TIMES) : ''}`,
    () => `topup ${r(GROCERIES)} ${maybe() ? 'at ' + r(GROCERY_PLACES) : ''}`,
    () => `stock ${r(GROCERIES)} untuk ${r(NAMES)}`,
    () => `restock ${r(GROCERIES)}`,
    () => `buy ${r(GROCERIES)} from ${r(GROCERY_PLACES)}`,
  ],

  // ==================================================================================
  // SINGLE-WORD GENERATORS (Critical for model accuracy on standalone inputs)
  // ==================================================================================

  // SINGLE WORD: Food NEEDS - varied patterns
  single_food_needs: [
    () => r(SINGLE_WORD_FOOD_NEEDS),
    () => `${r(SINGLE_WORD_FOOD_NEEDS)} ${r(TIMES)}`,
    () => `beli ${r(SINGLE_WORD_FOOD_NEEDS)}`,
    () => `buy ${r(SINGLE_WORD_FOOD_NEEDS)}`,
    () => `${r(SINGLE_WORD_FOOD_NEEDS)} for ${r(NAMES)}`,
    () => `${r(SINGLE_WORD_FOOD_NEEDS)} dengan ${r(NAMES)}`,
    () => `${r(SINGLE_WORD_FOOD_NEEDS)} at ${r(PLACES_BASIC)}`,
    () => `makan ${r(SINGLE_WORD_FOOD_NEEDS)}`,
    () => `order ${r(SINGLE_WORD_FOOD_NEEDS)}`,
    () => `${r(ORDINALS)} ${r(SINGLE_WORD_FOOD_NEEDS)}`,
  ],

  // SINGLE WORD: Food WANTS - varied patterns
  single_food_wants: [
    () => r(SINGLE_WORD_FOOD_WANTS),
    () => `${r(SINGLE_WORD_FOOD_WANTS)} ${r(TIMES)}`,
    () => `order ${r(SINGLE_WORD_FOOD_WANTS)}`,
    () => `craving ${r(SINGLE_WORD_FOOD_WANTS)}`,
    () => `${r(SINGLE_WORD_FOOD_WANTS)} for ${r(NAMES)}`,
    () => `treat ${r(SINGLE_WORD_FOOD_WANTS)}`,
    () => `${r(SINGLE_WORD_FOOD_WANTS)} at ${r(PLACES_FANCY)}`,
    () => `celebrate with ${r(SINGLE_WORD_FOOD_WANTS)}`,
  ],

  // SINGLE WORD: Transport - varied patterns
  single_transport: [
    () => r(SINGLE_WORD_TRANSPORT),
    () => `${r(SINGLE_WORD_TRANSPORT)} ${r(TIMES)}`,
    () => `bayar ${r(SINGLE_WORD_TRANSPORT)}`,
    () => `pay ${r(SINGLE_WORD_TRANSPORT)}`,
    () => `${r(SINGLE_WORD_TRANSPORT)} to ${r(['office', 'home', 'mall', 'airport', 'station'])}`,
    () => `${r(SINGLE_WORD_TRANSPORT)} for ${r(NAMES)}`,
    () => `${r(DESCRIPTORS)} ${r(SINGLE_WORD_TRANSPORT)}`,
    () => `${r(SINGLE_WORD_TRANSPORT)} ${r(MODIFIERS)}`,
  ],

  // SINGLE WORD: Shopping - varied patterns
  single_shopping: [
    () => r(SINGLE_WORD_SHOPPING),
    () => `${r(SINGLE_WORD_SHOPPING)} ${r(TIMES)}`,
    () => `beli ${r(SINGLE_WORD_SHOPPING)}`,
    () => `buy ${r(SINGLE_WORD_SHOPPING)}`,
    () => `${r(SINGLE_WORD_SHOPPING)} for ${r(NAMES)}`,
    () => `new ${r(SINGLE_WORD_SHOPPING)}`,
    () => `${r(SINGLE_WORD_SHOPPING)} from ${r(SHOPPING_PLACES)}`,
    () => `order ${r(SINGLE_WORD_SHOPPING)} online`,
  ],

  // SINGLE WORD: Entertainment - varied patterns
  single_entertainment: [
    () => r(SINGLE_WORD_ENTERTAINMENT),
    () => `${r(SINGLE_WORD_ENTERTAINMENT)} ${r(TIMES)}`,
    () => `watch ${r(SINGLE_WORD_ENTERTAINMENT)}`,
    () => `${r(SINGLE_WORD_ENTERTAINMENT)} with ${r(NAMES)}`,
    () => `${r(SINGLE_WORD_ENTERTAINMENT)} night`,
    () => `${r(SINGLE_WORD_ENTERTAINMENT)} subscription`,
    () => `bayar ${r(SINGLE_WORD_ENTERTAINMENT)}`,
  ],

  // SINGLE WORD: Bills & Financial - varied patterns
  single_bills: [
    () => r(SINGLE_WORD_BILLS),
    () => `${r(SINGLE_WORD_BILLS)} ${r(TIMES)}`,
    () => `bayar ${r(SINGLE_WORD_BILLS)}`,
    () => `pay ${r(SINGLE_WORD_BILLS)}`,
    () => `${r(SINGLE_WORD_BILLS)} ${r(MODIFIERS)}`,
    () => `${r(DESCRIPTORS)} ${r(SINGLE_WORD_BILLS)}`,
    () => `${r(SINGLE_WORD_BILLS)} for ${r(NAMES)}`,
    () => `settle ${r(SINGLE_WORD_BILLS)}`,
  ],

  // SINGLE WORD: Others (healthcare, education, etc.) - varied patterns
  single_others: [
    () => r(SINGLE_WORD_OTHERS),
    () => `${r(SINGLE_WORD_OTHERS)} ${r(TIMES)}`,
    () => `pergi ${r(SINGLE_WORD_OTHERS)}`,
    () => `bayar ${r(SINGLE_WORD_OTHERS)}`,
    () => `${r(SINGLE_WORD_OTHERS)} for ${r(NAMES)}`,
    () => `visit ${r(SINGLE_WORD_OTHERS)}`,
    () => `${r(DESCRIPTORS)} ${r(SINGLE_WORD_OTHERS)}`,
    () => `${r(SINGLE_WORD_OTHERS)} checkup`,
  ],

  // TYPO VARIANTS (for model robustness) - varied patterns
  typo_variants: [
    () => {
      const words = Object.keys(TYPO_VARIANTS);
      const word = r(words);
      const typos = TYPO_VARIANTS[word];
      return r(typos);
    },
    () => {
      const words = Object.keys(TYPO_VARIANTS);
      const word = r(words);
      const typos = TYPO_VARIANTS[word];
      return `beli ${r(typos)}`;
    },
    () => {
      const words = Object.keys(TYPO_VARIANTS);
      const word = r(words);
      const typos = TYPO_VARIANTS[word];
      return `${r(typos)} ${r(TIMES)}`;
    },
    () => {
      const words = Object.keys(TYPO_VARIANTS);
      const word = r(words);
      const typos = TYPO_VARIANTS[word];
      return `bayar ${r(typos)}`;
    },
  ],
};

// ==================================================================================
// SECTION 10: MAIN GENERATION LOGIC
// ==================================================================================

function generate() {
  console.log('Starting generation process...\n');

  const uniqueSet = new Set();
  const rows = [];

  const targets = {
    // Original generators (increased for 250k)
    food_needs: 22000,
    food_wants: 12000,
    shopping_wants: 18000,
    finance_needs: 18000,
    transport_needs: 15000,
    others_needs: 12000,
    entertainment_wants: 8000,
    telecom_needs: 5000,
    gaming_wants: 12000,
    beauty_mixed: 8000,
    home_wants: 18000,
    pets_needs: 3000,
    hobbies_wants: 4000,
    insurance_needs: 3000,
    donations_mixed: 2000,
    books_wants: 3000,
    events_wants: 2500,
    regional_food: 6000,
    food_delivery: 10000,
    ride_services: 8000,
    ewallet_reload: 4000,
    parking_toll: 5000,
    delivery_services: 4000,
    online_services: 3000,
    bookings: 5000,
    grocery_shopping: 22000,
    // Single-word generators (INCREASED for better coverage)
    single_food_needs: 8000,
    single_food_wants: 5000,
    single_transport: 6000,
    single_shopping: 6000,
    single_entertainment: 5000,
    single_bills: 6000,
    single_others: 6000,
    typo_variants: 3000,
  };

  const categoryMap = {
    food_needs: { cat: 'needs', sub: 'Food & Beverage' },
    food_wants: { cat: 'wants', sub: 'Food & Beverage' },
    shopping_wants: { cat: 'wants', sub: 'Shopping' },
    finance_needs: { cat: 'needs', sub: 'Financial Services' },
    transport_needs: { cat: 'needs', sub: 'Transportation' },
    others_needs: { cat: 'needs', sub: 'Others' },
    entertainment_wants: { cat: 'wants', sub: 'Entertainment' },
    telecom_needs: { cat: 'needs', sub: 'Telecommunication' },
    gaming_wants: { cat: 'wants', sub: 'Entertainment' },
    beauty_mixed: { cat: 'wants', sub: 'Shopping' },
    home_wants: { cat: 'wants', sub: 'Shopping' },
    pets_needs: { cat: 'needs', sub: 'Others' },
    hobbies_wants: { cat: 'wants', sub: 'Entertainment' },
    insurance_needs: { cat: 'needs', sub: 'Financial Services' },
    donations_mixed: { cat: 'needs', sub: 'Others' },
    books_wants: { cat: 'wants', sub: 'Shopping' },
    events_wants: { cat: 'wants', sub: 'Others' },
    regional_food: { cat: 'needs', sub: 'Food & Beverage' },
    // DIGITAL PLATFORMS
    food_delivery: { cat: 'needs', sub: 'Food & Beverage' },
    ride_services: { cat: 'needs', sub: 'Transportation' },
    ewallet_reload: { cat: 'needs', sub: 'Financial Services' },
    parking_toll: { cat: 'needs', sub: 'Transportation' },
    delivery_services: { cat: 'needs', sub: 'Transportation' },
    online_services: { cat: 'wants', sub: 'Telecommunication' },
    bookings: { cat: 'wants', sub: 'Transportation' },
    grocery_shopping: { cat: 'needs', sub: 'Food & Beverage' },
    // SINGLE-WORD GENERATORS
    single_food_needs: { cat: 'needs', sub: 'Food & Beverage' },
    single_food_wants: { cat: 'wants', sub: 'Food & Beverage' },
    single_transport: { cat: 'needs', sub: 'Transportation' },
    single_shopping: { cat: 'wants', sub: 'Shopping' },
    single_entertainment: { cat: 'wants', sub: 'Entertainment' },
    single_bills: { cat: 'needs', sub: 'Financial Services' },
    single_others: { cat: 'needs', sub: 'Others' },
    typo_variants: { cat: 'needs', sub: 'Food & Beverage' }, // Typos mostly food-related
  };

  for (const [domain, target] of Object.entries(targets)) {
    const patterns = GENERATORS[domain];
    let count = 0;
    let attempts = 0;
    const maxAttempts = target * 300; // Increased attempt limit

    while (count < target && attempts < maxAttempts) {
      attempts++;

      const generator = r(patterns);
      let text = generator();

      // Clean and normalize
      text = text.replace(/\s+/g, ' ').trim().toLowerCase();

      // Skip if exists
      if (uniqueSet.has(text)) continue;

      uniqueSet.add(text);
      rows.push({
        description: text,
        category: categoryMap[domain].cat,
        subcategory: categoryMap[domain].sub
      });
      count++;
    }

    console.log(`✅ ${domain}: ${count.toLocaleString()} rows (${attempts.toLocaleString()} attempts)`);
  }

  // Shuffle
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  // Write to CSV
  const csv = ['description,category,subcategory'].concat(
    rows.map(r => `"${r.description}","${r.category}","${r.subcategory}"`)
  ).join('\n');

  fs.writeFileSync('dataset.csv', csv);

  // Final stats
  console.log(`\n🎉 SUCCESS! Generated ${rows.length.toLocaleString()} unique rows.`);

  const needsCount = rows.filter(r => r.category === 'needs').length;
  const wantsCount = rows.filter(r => r.category === 'wants').length;

  console.log(`📊 Needs: ${needsCount.toLocaleString()} (${(needsCount / rows.length * 100).toFixed(1)}%)`);
  console.log(`📊 Wants: ${wantsCount.toLocaleString()} (${(wantsCount / rows.length * 100).toFixed(1)}%)`);
  console.log(`\n💾 Saved to: dataset.csv`);
}

// Run generation
generate();
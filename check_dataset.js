const fs = require('fs');
const readline = require('readline');

async function analyzeDataset() {
  const fileStream = fs.createReadStream('./dataset_new.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  const categoryCounts = {};
  const subcategoryCounts = {};
  const categorySubcategoryPairs = {};
  const descLengths = [];
  const uniqueDescriptions = new Set();
  const duplicateDescriptions = [];
  
  rl.on('line', (line) => {
    lineCount++;
    if (lineCount === 1) return; // Skip header
    
    try {
      const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      if (!parts || parts.length < 3) return;
      
      const desc = parts[0].replace(/^"|"$/g, '').trim();
      const cat = parts[1].replace(/^"|"$/g, '').trim();
      const subcat = parts[2].replace(/^"|"$/g, '').trim();
      
      if (!desc || !cat || !subcat) return;
      
      // Count categories
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      subcategoryCounts[subcat] = (subcategoryCounts[subcat] || 0) + 1;
      
      // Count category-subcategory pairs
      const key = `${cat}|${subcat}`;
      categorySubcategoryPairs[key] = (categorySubcategoryPairs[key] || 0) + 1;
      
      // Track description lengths
      descLengths.push(desc.length);
      
      // Check for duplicates
      if (uniqueDescriptions.has(desc)) {
        duplicateDescriptions.push(desc);
      } else {
        uniqueDescriptions.add(desc);
      }
    } catch (err) {
      // Skip malformed lines
    }
  });
  
  await new Promise((resolve) => {
    rl.on('close', resolve);
  });
  
  const total = lineCount - 1;
  
  console.log('📊 DATASET ANALYSIS\n');
  console.log(`Total rows: ${total.toLocaleString()}`);
  console.log(`Unique descriptions: ${uniqueDescriptions.size.toLocaleString()}`);
  console.log(`Duplicate descriptions: ${duplicateDescriptions.length.toLocaleString()}`);
  
  console.log('\n📈 Category Distribution:');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(10)}: ${count.toString().padStart(6)} (${pct}%)`);
    });
  
  console.log('\n📈 Subcategory Distribution:');
  Object.entries(subcategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subcat, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${subcat.padEnd(20)}: ${count.toString().padStart(6)} (${pct}%)`);
    });
  
  console.log('\n📈 Category-Subcategory Pairs:');
  Object.entries(categorySubcategoryPairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([pair, count]) => {
      const [cat, subcat] = pair.split('|');
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(10)} + ${subcat.padEnd(20)}: ${count.toString().padStart(6)} (${pct}%)`);
    });
  
  // Description length stats
  descLengths.sort((a, b) => a - b);
  const avgLength = descLengths.reduce((a, b) => a + b, 0) / descLengths.length;
  const minLength = descLengths[0];
  const maxLength = descLengths[descLengths.length - 1];
  const medianLength = descLengths[Math.floor(descLengths.length / 2)];
  
  console.log('\n📏 Description Length Statistics:');
  console.log(`  Average: ${avgLength.toFixed(1)} characters`);
  console.log(`  Median: ${medianLength} characters`);
  console.log(`  Min: ${minLength} characters`);
  console.log(`  Max: ${maxLength} characters`);
  
  // Quality checks
  console.log('\n✅ Quality Checks:');
  const needsRatio = (categoryCounts['needs'] || 0) / total;
  const wantsRatio = (categoryCounts['wants'] || 0) / total;
  
  if (needsRatio > 0.6 || needsRatio < 0.4) {
    console.log(`  ⚠️  Category imbalance: needs=${(needsRatio*100).toFixed(1)}%, wants=${(wantsRatio*100).toFixed(1)}%`);
  } else {
    console.log(`  ✅ Category balance: needs=${(needsRatio*100).toFixed(1)}%, wants=${(wantsRatio*100).toFixed(1)}%`);
  }
  
  if (duplicateDescriptions.length > total * 0.01) {
    console.log(`  ⚠️  High duplicate rate: ${((duplicateDescriptions.length/total)*100).toFixed(2)}%`);
  } else {
    console.log(`  ✅ Low duplicate rate: ${((duplicateDescriptions.length/total)*100).toFixed(2)}%`);
  }
  
  const subcategoryCount = Object.keys(subcategoryCounts).length;
  if (subcategoryCount < 5) {
    console.log(`  ⚠️  Low subcategory diversity: ${subcategoryCount} subcategories`);
  } else {
    console.log(`  ✅ Good subcategory diversity: ${subcategoryCount} subcategories`);
  }
  
  // Check for any subcategory with very low representation
  const lowRepSubcats = Object.entries(subcategoryCounts)
    .filter(([_, count]) => count < total * 0.02)
    .map(([subcat, count]) => ({ subcat, count, pct: (count/total*100).toFixed(2) }));
  
  if (lowRepSubcats.length > 0) {
    console.log(`\n  ⚠️  Low representation subcategories (<2%):`);
    lowRepSubcats.forEach(({ subcat, count, pct }) => {
      console.log(`      ${subcat}: ${count} (${pct}%)`);
    });
  }
}

analyzeDataset().catch(console.error);

const fs = require('fs');
const csv = require('csv-parser');

const dataset = [];
const categoryCounts = {};
const subcategoryCounts = {};

fs.createReadStream('dataset_new.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Count Categories (Wants vs Needs)
    const cat = row.category ? row.category.trim() : 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Count Subcategories
    const sub = row.subcategory ? row.subcategory.trim() : 'Unknown';
    subcategoryCounts[sub] = (subcategoryCounts[sub] || 0) + 1;
    
    dataset.push(row);
  })
  .on('end', () => {
    console.log(`\n--- 📊 Dataset Statistics ---`);
    console.log(`Total Rows: ${dataset.length}\n`);

    console.log(`--- Category Balance (Target: Balanced) ---`);
    Object.entries(categoryCounts).forEach(([key, val]) => {
        const pct = ((val / dataset.length) * 100).toFixed(1);
        console.log(`${key.padEnd(10)}: ${val} (${pct}%)`);
    });

    console.log(`\n--- Subcategory Balance (Target: ~1000 each) ---`);
    Object.entries(subcategoryCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count
        .forEach(([key, val]) => {
            const pct = ((val / dataset.length) * 100).toFixed(1);
            const status = val < 50 ? "⚠️ LOW" : "✅ OK";
            console.log(`${key.padEnd(20)}: ${val} \t(${pct}%) \t${status}`);
    });
    
    console.log(`\n----------------------------`);
  });
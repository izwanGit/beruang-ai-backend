
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud
import os
import numpy as np

# Create directories
os.makedirs('visualizations/transaction/pre_training', exist_ok=True)
os.makedirs('visualizations/transaction/post_training', exist_ok=True)

# Load Data
print("📊 Loading dataset...")
df = pd.read_csv('dataset.csv')
print(f"✅ Loaded {len(df)} rows")

# Set Style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 12

# ==========================================
# 1. PRE-TRAINING VISUALIZATIONS
# ==========================================

# 1. Category Distribution Bar Chart
plt.figure()
ax = sns.countplot(y='subcategory', data=df, order=df['subcategory'].value_counts().index, palette='viridis')
plt.title('Distribution of Transaction Categories')
plt.xlabel('Number of Samples')
plt.ylabel('Category')
for i in ax.containers:
    ax.bar_label(i,)
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/bar_subcategory_distribution.png', dpi=300)
print("📸 Saved subcategory distribution")

# 2. Needs vs Wants Pie Chart
plt.figure(figsize=(8, 8))
colors = sns.color_palette('pastel')[0:2]
df['category'].value_counts().plot.pie(autopct='%1.1f%%', startangle=90, colors=colors, explode=(0.05, 0))
plt.title('Needs vs Wants Distribution')
plt.ylabel('')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/pie_needs_wants_ratio.png', dpi=300)
print("📸 Saved needs/wants pie chart")

# 3. Sentence Length Histogram
df['length'] = df['description'].str.split().str.len()
plt.figure()
sns.histplot(data=df, x='length', bins=15, kde=True, color='purple')
plt.title('Description Length Distribution (Word Count)')
plt.xlabel('Number of Words')
plt.ylabel('Frequency')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/histogram_sentence_length.png', dpi=300)
print("📸 Saved sentence length histogram")

# 4. Overall Word Cloud
text = ' '.join(df['description'].astype(str).tolist())
wordcloud = WordCloud(width=1600, height=800, background_color='white', colormap='magma').generate(text)
plt.figure(figsize=(15, 7.5))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis('off')
plt.title('Most Common Words in Transaction Dataset', fontsize=20)
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/wordcloud_all.png', dpi=300)
print("📸 Saved overall word cloud")

# 5. Needs Word Cloud
text_needs = ' '.join(df[df['category']=='needs']['description'].astype(str).tolist())
wc_needs = WordCloud(width=800, height=400, background_color='white', colormap='Blues').generate(text_needs)
plt.figure()
plt.imshow(wc_needs, interpolation='bilinear')
plt.axis('off')
plt.title('Top Words in NEEDS Transactions')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/wordcloud_needs.png', dpi=300)
print("📸 Saved needs word cloud")

# 6. Wants Word Cloud
text_wants = ' '.join(df[df['category']=='wants']['description'].astype(str).tolist())
wc_wants = WordCloud(width=800, height=400, background_color='white', colormap='Reds').generate(text_wants)
plt.figure()
plt.imshow(wc_wants, interpolation='bilinear')
plt.axis('off')
plt.title('Top Words in WANTS Transactions')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/wordcloud_wants.png', dpi=300)
print("📸 Saved wants word cloud")

# 7. Top 20 Triggers for NEEDS
from collections import Counter
words_needs = [w for s in df[df['category']=='needs']['description'] for w in s.split()]
common_needs = Counter(words_needs).most_common(20)
plt.figure(figsize=(12, 8))
sns.barplot(x=[x[1] for x in common_needs], y=[x[0] for x in common_needs], palette='Blues_r')
plt.title('Top 20 Keywords Triggering NEEDS')
plt.xlabel('Frequency')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/bar_top_20_triggers_needs.png', dpi=300)
print("📸 Saved top 20 needs triggers")

# 8. Top 20 Triggers for WANTS
words_wants = [w for s in df[df['category']=='wants']['description'] for w in s.split()]
common_wants = Counter(words_wants).most_common(20)
plt.figure(figsize=(12, 8))
sns.barplot(x=[x[1] for x in common_wants], y=[x[0] for x in common_wants], palette='Reds_r')
plt.title('Top 20 Keywords Triggering WANTS')
plt.xlabel('Frequency')
plt.tight_layout()
plt.savefig('visualizations/transaction/pre_training/bar_top_20_triggers_wants.png', dpi=300)
print("📸 Saved top 20 wants triggers")

# ==========================================
# DATA EXPORTS (for FYP documentation)
# ==========================================

print("\n💾 Exporting structured data files...")
os.makedirs('visualizations/transaction/data', exist_ok=True)

# Import json module and compute variables
import json
needs_df = df[df['category'] == 'needs']
wants_df = df[df['category'] == 'wants']
needs_count = len(needs_df)
wants_count = len(wants_df)

# 1. Dataset Summary
summary = {
    'total_rows': len(df),
    'unique_rows': len(df['description'].unique()),
    'needs_count': needs_count,
    'wants_count': wants_count,
    'needs_percentage': (needs_count / len(df) * 100),
    'wants_percentage': (wants_count / len(df) * 100),
    'avg_description_length': df['description'].str.split().str.len().mean(),
    'vocab_size': len(set(' '.join(df['description']).split()))
}
with open('visualizations/transaction/data/dataset_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)
print("✅ Saved dataset_summary.json")

# 2. Category Distribution
category_dist = {
    'needs': int(needs_count),
    'wants': int(wants_count)
}
with open('visualizations/transaction/data/category_distribution.json', 'w') as f:
    json.dump(category_dist, f, indent=2)
print("✅ Saved category_distribution.json")

# 3. Subcategory Distribution
subcat_dist = df['subcategory'].value_counts().to_dict()
with open('visualizations/transaction/data/subcategory_distribution.json', 'w') as f:
    json.dump(subcat_dist, f, indent=2)
df['subcategory'].value_counts().to_csv('visualizations/transaction/data/subcategory_distribution.csv')
print("✅ Saved subcategory_distribution files")

# 4. Text Length Histogram Data
length_data = df['description'].str.split().str.len().value_counts().sort_index().to_dict()
with open('visualizations/transaction/data/text_length_histogram.json', 'w') as f:
    json.dump(length_data, f, indent=2)
print("✅ Saved text_length_histogram.json")

# 5. Word Cloud Data (top 100 words)
word_cloud_data = {
    'all': dict(Counter(' '.join(df['description']).split()).most_common(100)),
    'needs': dict(Counter(' '.join(needs_df['description']).split()).most_common(100)),
    'wants': dict(Counter(' '.join(wants_df['description']).split()).most_common(100))
}
with open('visualizations/transaction/data/word_cloud_data.json', 'w') as f:
    json.dump(word_cloud_data, f, indent=2)
print("✅ Saved word_cloud_data.json")

# 6. Sample Transactions (50 from each category)
samples = {
    'needs': needs_df.sample(min(50, len(needs_df))).to_dict('records'),
    'wants': wants_df.sample(min(50, len(wants_df))).to_dict('records')
}
with open('visualizations/transaction/data/transaction_samples.json', 'w') as f:
    json.dump(samples, f, indent=2)
print("✅ Saved transaction_samples.json")

print("\n✨ Pre-training visualizations and data exports complete!")

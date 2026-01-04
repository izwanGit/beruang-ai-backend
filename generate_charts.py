#!/usr/bin/env python3
"""
📊 BERUANG VISUALIZATION GENERATOR - FYP REPORT EDITION
Generates publication-quality charts and graphs for thesis/FYP report

Requirements:
    pip install matplotlib seaborn pandas numpy wordcloud pillow

Output:
    visualizations/*.png - High-resolution images for report
"""

import json
import os
import sys

# Check for required packages
try:
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import seaborn as sns
    import pandas as pd
    import numpy as np
    from collections import Counter
except ImportError as e:
    print(f"Missing package: {e}")
    print("Run: pip install matplotlib seaborn pandas numpy")
    sys.exit(1)

try:
    from wordcloud import WordCloud
    WORDCLOUD_AVAILABLE = True
except ImportError:
    WORDCLOUD_AVAILABLE = False
    print("Note: wordcloud not installed. Run: pip install wordcloud")

# Configuration
INPUT_DIR = './visualizations'
OUTPUT_DIR = './visualizations'
FIGSIZE_LARGE = (14, 8)
FIGSIZE_MEDIUM = (12, 7)
FIGSIZE_SMALL = (10, 6)
DPI = 150

# Color schemes
COLORS = {
    'primary': '#4CAF50',      # Green
    'secondary': '#2196F3',    # Blue
    'accent': '#FF9800',       # Orange
    'danger': '#F44336',       # Red
    'grok': '#9C27B0',         # Purple
    'local': '#4CAF50',        # Green
    'garbage': '#757575',      # Gray
}

# Seaborn style
sns.set_theme(style="whitegrid")
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 12

def load_json(filename):
    """Load JSON data from visualizations directory"""
    filepath = os.path.join(INPUT_DIR, filename)
    with open(filepath, 'r') as f:
        return json.load(f)

def save_figure(fig, filename):
    """Save figure with high DPI for reports"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(filepath, dpi=DPI, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"  ✅ Saved: {filepath}")
    plt.close(fig)

# ============================================================================
# 1. CATEGORY DISTRIBUTION (PIE CHART)
# ============================================================================
def plot_category_pie():
    """Generate pie chart showing GROK vs Local vs Garbage distribution"""
    print("\n📊 Generating Category Distribution Pie Chart...")
    
    data = load_json('category_distribution.json')
    
    labels = [d['category'] for d in data]
    sizes = [d['count'] for d in data]
    colors = [COLORS['grok'], COLORS['local'], COLORS['garbage']]
    explode = (0.05, 0, 0)  # Explode GROK slice
    
    fig, ax = plt.subplots(figsize=FIGSIZE_SMALL)
    
    wedges, texts, autotexts = ax.pie(
        sizes, 
        labels=labels,
        colors=colors,
        explode=explode,
        autopct='%1.1f%%',
        startangle=90,
        pctdistance=0.75,
        shadow=True
    )
    
    # Styling
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(14)
        autotext.set_fontweight('bold')
    
    for text in texts:
        text.set_fontsize(12)
    
    ax.set_title('Intent Classification Dataset Distribution\n', fontsize=16, fontweight='bold')
    
    # Add legend with counts
    legend_labels = [f"{d['category']}: {d['count']:,} samples" for d in data]
    ax.legend(wedges, legend_labels, title="Categories", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    save_figure(fig, 'pie_category_distribution.png')

# ============================================================================
# 2. INTENT DISTRIBUTION (BAR CHART)
# ============================================================================
def plot_intent_bar():
    """Generate horizontal bar chart of intent distribution"""
    print("📊 Generating Intent Distribution Bar Chart...")
    
    data = load_json('intent_distribution.json')
    
    # Get top 20 intents
    top_intents = data[:20]
    
    intents = [d['intent'] for d in top_intents][::-1]  # Reverse for horizontal
    counts = [d['count'] for d in top_intents][::-1]
    
    # Color based on intent type
    colors = []
    for intent in intents:
        if intent == 'COMPLEX_ADVICE':
            colors.append(COLORS['grok'])
        elif intent == 'GARBAGE':
            colors.append(COLORS['garbage'])
        else:
            colors.append(COLORS['local'])
    
    fig, ax = plt.subplots(figsize=FIGSIZE_LARGE)
    
    bars = ax.barh(intents, counts, color=colors, edgecolor='white', linewidth=0.5)
    
    # Add value labels
    for bar, count in zip(bars, counts):
        width = bar.get_width()
        ax.text(width + 200, bar.get_y() + bar.get_height()/2, 
                f'{count:,}', ha='left', va='center', fontsize=10)
    
    ax.set_xlabel('Number of Samples', fontsize=12)
    ax.set_ylabel('Intent Category', fontsize=12)
    ax.set_title('Top 20 Intent Distribution in Training Dataset\n', fontsize=16, fontweight='bold')
    
    # Add legend
    legend_patches = [
        mpatches.Patch(color=COLORS['grok'], label='GROK Routing (Complex)'),
        mpatches.Patch(color=COLORS['local'], label='Local Response'),
        mpatches.Patch(color=COLORS['garbage'], label='Garbage Filter'),
    ]
    ax.legend(handles=legend_patches, loc='lower right')
    
    ax.set_xlim(0, max(counts) * 1.15)
    
    save_figure(fig, 'bar_intent_distribution.png')

# ============================================================================
# 3. TEXT LENGTH HISTOGRAM
# ============================================================================
def plot_text_length_histogram():
    """Generate histogram of text lengths"""
    print("📊 Generating Text Length Histogram...")
    
    data = load_json('text_length_histogram.json')
    
    # Parse bucket ranges and counts
    buckets = []
    counts = []
    for key, count in sorted(data.items(), key=lambda x: int(x[0].split('-')[0])):
        start = int(key.split('-')[0])
        buckets.append(start)
        counts.append(count)
    
    fig, ax = plt.subplots(figsize=FIGSIZE_MEDIUM)
    
    bars = ax.bar(buckets, counts, width=8, color=COLORS['primary'], edgecolor='white', alpha=0.8)
    
    ax.set_xlabel('Text Length (characters)', fontsize=12)
    ax.set_ylabel('Frequency', fontsize=12)
    ax.set_title('Distribution of Query Text Lengths\n', fontsize=16, fontweight='bold')
    
    # Add statistics annotation
    summary = load_json('dataset_summary.json')
    stats = summary['textLengthStats']
    stats_text = f"Mean: {stats['average']} chars\nMedian: {stats['median']} chars\nRange: {stats['min']}-{stats['max']} chars"
    ax.annotate(stats_text, xy=(0.95, 0.95), xycoords='axes fraction',
                fontsize=11, ha='right', va='top',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    save_figure(fig, 'histogram_text_length.png')

# ============================================================================
# 4. WORD CLOUD
# ============================================================================
def plot_word_cloud():
    """Generate word cloud from top words"""
    if not WORDCLOUD_AVAILABLE:
        print("⚠️  Skipping word cloud (wordcloud package not installed)")
        return
    
    print("📊 Generating Word Cloud...")
    
    data = load_json('word_cloud_data.json')
    word_freq = {d['text']: d['value'] for d in data}
    
    # Generate word cloud
    wordcloud = WordCloud(
        width=1600,
        height=800,
        background_color='white',
        colormap='viridis',
        max_words=100,
        min_font_size=10,
        max_font_size=150
    ).generate_from_frequencies(word_freq)
    
    fig, ax = plt.subplots(figsize=FIGSIZE_LARGE)
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    ax.set_title('Most Frequent Words in Training Dataset\n', fontsize=16, fontweight='bold')
    
    save_figure(fig, 'wordcloud_dataset.png')

# ============================================================================
# 5. DATASET SUMMARY TABLE
# ============================================================================
def plot_summary_table():
    """Generate summary statistics table"""
    print("📊 Generating Summary Statistics Table...")
    
    summary = load_json('dataset_summary.json')
    
    # Create table data
    table_data = [
        ['Total Samples', f"{summary['totalSamples']:,}"],
        ['Unique Texts', f"{summary['uniqueTexts']:,}"],
        ['Duplicate Rate', f"{summary['duplicatePercentage']}%"],
        ['Intent Categories', f"{summary['intentCount']}"],
        ['Avg Text Length', f"{summary['textLengthStats']['average']} chars"],
        ['Avg Word Count', f"{summary['wordCountStats']['average']} words"],
        ['GROK Routing', f"{summary['categoryBreakdown']['GROK (Complex/Analysis)']:,}"],
        ['Local Response', f"{summary['categoryBreakdown']['Local (App Help)']:,}"],
        ['Garbage Filter', f"{summary['categoryBreakdown']['Garbage']:,}"],
    ]
    
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.axis('off')
    
    table = ax.table(
        cellText=table_data,
        colLabels=['Metric', 'Value'],
        loc='center',
        cellLoc='left',
        colWidths=[0.5, 0.3]
    )
    
    table.auto_set_font_size(False)
    table.set_fontsize(12)
    table.scale(1.2, 1.8)
    
    # Style header
    for i in range(2):
        table[(0, i)].set_facecolor(COLORS['primary'])
        table[(0, i)].set_text_props(color='white', fontweight='bold')
    
    # Alternate row colors
    for i in range(1, len(table_data) + 1):
        if i % 2 == 0:
            for j in range(2):
                table[(i, j)].set_facecolor('#f5f5f5')
    
    ax.set_title('Dataset Summary Statistics\n', fontsize=16, fontweight='bold', y=0.98)
    
    save_figure(fig, 'table_dataset_summary.png')

# ============================================================================
# 6. INTENT CATEGORY BREAKDOWN (STACKED BAR)
# ============================================================================
def plot_category_breakdown():
    """Generate stacked bar showing intent type breakdown"""
    print("📊 Generating Category Breakdown Chart...")
    
    data = load_json('category_distribution.json')
    
    categories = ['Classification\nTarget']
    grok = [data[0]['count']]
    local = [data[1]['count']]
    garbage = [data[2]['count']]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    width = 0.5
    
    ax.bar(categories, grok, width, label='GROK (Complex Queries)', color=COLORS['grok'])
    ax.bar(categories, local, width, bottom=grok, label='Local (App Help)', color=COLORS['local'])
    ax.bar(categories, garbage, width, bottom=[g+l for g,l in zip(grok, local)], 
           label='Garbage', color=COLORS['garbage'])
    
    ax.set_ylabel('Number of Samples', fontsize=12)
    ax.set_title('Intent Classification Dataset Composition\n', fontsize=16, fontweight='bold')
    ax.legend(loc='upper right')
    
    # Add percentage annotations
    total = sum([grok[0], local[0], garbage[0]])
    y_pos = grok[0] / 2
    ax.annotate(f'{grok[0]/total*100:.1f}%', xy=(0, y_pos), ha='center', va='center', 
                fontsize=14, fontweight='bold', color='white')
    
    y_pos = grok[0] + local[0] / 2
    ax.annotate(f'{local[0]/total*100:.1f}%', xy=(0, y_pos), ha='center', va='center', 
                fontsize=14, fontweight='bold', color='white')
    
    save_figure(fig, 'stacked_category_breakdown.png')

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    print("=" * 60)
    print("   📊 BERUANG VISUALIZATION GENERATOR - FYP EDITION")
    print("=" * 60)
    
    # Check if data exists
    if not os.path.exists(INPUT_DIR):
        print(f"❌ Error: {INPUT_DIR} not found. Run visualize_dataset.js first.")
        sys.exit(1)
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate all visualizations
    plot_category_pie()
    plot_intent_bar()
    plot_text_length_histogram()
    plot_word_cloud()
    plot_summary_table()
    plot_category_breakdown()
    
    print("\n" + "=" * 60)
    print("   ✅ ALL VISUALIZATIONS GENERATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\n📁 Output directory: {os.path.abspath(OUTPUT_DIR)}")
    print("\nGenerated files:")
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith('.png'):
            print(f"  • {f}")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
📊 BERUANG TRAINING VISUALIZER - FYP REPORT EDITION
Generates training curves and confusion matrix visualizations

Run this AFTER train_intent.js to generate the training visualizations.

Requirements:
    pip install matplotlib seaborn pandas numpy

Output:
    visualizations/*.png - Training visualization images
"""

import json
import os
import sys

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    import pandas as pd
    import numpy as np
except ImportError as e:
    print(f"Missing package: {e}")
    print("Run: pip install matplotlib seaborn pandas numpy")
    sys.exit(1)

# Configuration
INPUT_DIR = './visualizations'
OUTPUT_DIR = './visualizations'
FIGSIZE_LARGE = (14, 8)
FIGSIZE_MEDIUM = (12, 7)
DPI = 150

# Seaborn style
sns.set_theme(style="whitegrid")
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 12

def load_json(filename):
    """Load JSON data from visualizations directory"""
    filepath = os.path.join(INPUT_DIR, filename)
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return None
    with open(filepath, 'r') as f:
        return json.load(f)

def save_figure(fig, filename):
    """Save figure with high DPI for reports"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(filepath, dpi=DPI, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"  ✅ Saved: {filepath}")
    plt.close(fig)

# ============================================================================
# 1. TRAINING LOSS CURVE
# ============================================================================
def plot_loss_curve():
    """Generate training and validation loss curve"""
    print("\n📊 Generating Loss Curve...")
    
    data = load_json('training_history.json')
    if data is None:
        return
    
    epochs = data['epochs']
    train_loss = data['trainLoss']
    val_loss = data['valLoss']
    
    fig, ax = plt.subplots(figsize=FIGSIZE_MEDIUM)
    
    ax.plot(epochs, train_loss, 'b-', linewidth=2, marker='o', markersize=4, label='Training Loss')
    ax.plot(epochs, val_loss, 'r-', linewidth=2, marker='s', markersize=4, label='Validation Loss')
    
    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Loss (Categorical Cross-Entropy)', fontsize=12)
    ax.set_title('Model Training Loss Curve\n', fontsize=16, fontweight='bold')
    ax.legend(loc='upper right', fontsize=11)
    ax.grid(True, alpha=0.3)
    
    # Find best epoch (lowest validation loss)
    best_epoch = epochs[val_loss.index(min(val_loss))]
    ax.axvline(x=best_epoch, color='green', linestyle='--', alpha=0.7, label=f'Best Epoch: {best_epoch}')
    ax.annotate(f'Best: Epoch {best_epoch}', xy=(best_epoch, min(val_loss)), 
                xytext=(best_epoch + 1, min(val_loss) + 0.1),
                fontsize=10, color='green')
    
    save_figure(fig, 'training_loss_curve.png')

# ============================================================================
# 2. TRAINING ACCURACY CURVE
# ============================================================================
def plot_accuracy_curve():
    """Generate training and validation accuracy curve"""
    print("📊 Generating Accuracy Curve...")
    
    data = load_json('training_history.json')
    if data is None:
        return
    
    epochs = data['epochs']
    train_acc = [a * 100 for a in data['trainAcc']]
    val_acc = [a * 100 for a in data['valAcc']]
    
    fig, ax = plt.subplots(figsize=FIGSIZE_MEDIUM)
    
    ax.plot(epochs, train_acc, 'b-', linewidth=2, marker='o', markersize=4, label='Training Accuracy')
    ax.plot(epochs, val_acc, 'r-', linewidth=2, marker='s', markersize=4, label='Validation Accuracy')
    
    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Accuracy (%)', fontsize=12)
    ax.set_title('Model Training Accuracy Curve\n', fontsize=16, fontweight='bold')
    ax.legend(loc='lower right', fontsize=11)
    ax.grid(True, alpha=0.3)
    ax.set_ylim(0, 105)
    
    # Final accuracy annotation
    final_val_acc = val_acc[-1]
    ax.annotate(f'Final: {final_val_acc:.1f}%', xy=(epochs[-1], final_val_acc),
                xytext=(epochs[-1] - 3, final_val_acc - 8),
                fontsize=11, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color='red'),
                color='red')
    
    save_figure(fig, 'training_accuracy_curve.png')

# ============================================================================
# 3. COMBINED TRAINING CURVES
# ============================================================================
def plot_combined_curves():
    """Generate combined loss and accuracy plot"""
    print("📊 Generating Combined Training Curves...")
    
    data = load_json('training_history.json')
    if data is None:
        return
    
    epochs = data['epochs']
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=FIGSIZE_LARGE)
    
    # Loss subplot
    ax1.plot(epochs, data['trainLoss'], 'b-', linewidth=2, label='Training')
    ax1.plot(epochs, data['valLoss'], 'r-', linewidth=2, label='Validation')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Loss Curve', fontsize=14, fontweight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Accuracy subplot
    train_acc = [a * 100 for a in data['trainAcc']]
    val_acc = [a * 100 for a in data['valAcc']]
    ax2.plot(epochs, train_acc, 'b-', linewidth=2, label='Training')
    ax2.plot(epochs, val_acc, 'r-', linewidth=2, label='Validation')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.set_title('Accuracy Curve', fontsize=14, fontweight='bold')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    ax2.set_ylim(0, 105)
    
    fig.suptitle('Intent Classification Model Training Progress\n', fontsize=16, fontweight='bold')
    plt.tight_layout()
    
    save_figure(fig, 'training_combined_curves.png')

# ============================================================================
# 4. CONFUSION MATRIX HEATMAP
# ============================================================================
def plot_confusion_matrix():
    """Generate confusion matrix heatmap"""
    print("📊 Generating Confusion Matrix Heatmap...")
    
    data = load_json('confusion_matrix.json')
    if data is None:
        return
    
    # Get all labels
    all_labels = sorted(set(list(data.keys()) + [p for d in data.values() for p in d.keys()]))
    
    # Limit to top N intents for readability
    # Get intent counts
    intent_counts = {}
    for true_label in data:
        for pred_label, count in data[true_label].items():
            intent_counts[true_label] = intent_counts.get(true_label, 0) + count
    
    # Sort by count and take top 15
    top_intents = sorted(intent_counts.keys(), key=lambda x: intent_counts.get(x, 0), reverse=True)[:15]
    
    # Build matrix
    matrix = []
    for true_label in top_intents:
        row = []
        for pred_label in top_intents:
            count = data.get(true_label, {}).get(pred_label, 0)
            row.append(count)
        matrix.append(row)
    
    matrix = np.array(matrix)
    
    fig, ax = plt.subplots(figsize=FIGSIZE_LARGE)
    
    # Create heatmap with better colors
    sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues',
                xticklabels=top_intents, yticklabels=top_intents,
                ax=ax, cbar_kws={'label': 'Count'})
    
    ax.set_xlabel('Predicted Intent', fontsize=12)
    ax.set_ylabel('True Intent', fontsize=12)
    ax.set_title('Confusion Matrix (Top 15 Intents)\n', fontsize=16, fontweight='bold')
    
    # Rotate labels
    plt.xticks(rotation=45, ha='right', fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    
    plt.tight_layout()
    save_figure(fig, 'confusion_matrix_heatmap.png')

# ============================================================================
# 5. CLASSIFICATION REPORT BAR CHART
# ============================================================================
def plot_classification_report():
    """Generate F1-score bar chart from classification report"""
    print("📊 Generating Classification Report Chart...")
    
    data = load_json('classification_report.json')
    if data is None:
        return
    
    # Filter out macro average and sort by F1 score
    filtered = [d for d in data if d['intent'] != 'MACRO_AVERAGE']
    sorted_data = sorted(filtered, key=lambda x: x['f1Score'], reverse=True)[:20]
    
    intents = [d['intent'] for d in sorted_data][::-1]
    f1_scores = [d['f1Score'] for d in sorted_data][::-1]
    
    # Color based on F1 score
    colors = ['#4CAF50' if f >= 0.8 else '#FF9800' if f >= 0.6 else '#F44336' for f in f1_scores]
    
    fig, ax = plt.subplots(figsize=FIGSIZE_LARGE)
    
    bars = ax.barh(intents, f1_scores, color=colors, edgecolor='white')
    
    # Add value labels
    for bar, f1 in zip(bars, f1_scores):
        width = bar.get_width()
        ax.text(width + 0.02, bar.get_y() + bar.get_height()/2,
                f'{f1:.2f}', ha='left', va='center', fontsize=10)
    
    ax.set_xlabel('F1 Score', fontsize=12)
    ax.set_ylabel('Intent', fontsize=12)
    ax.set_title('Intent Classification F1 Scores (Top 20)\n', fontsize=16, fontweight='bold')
    ax.set_xlim(0, 1.1)
    
    # Add threshold lines
    ax.axvline(x=0.8, color='green', linestyle='--', alpha=0.5, label='Good (0.8)')
    ax.axvline(x=0.6, color='orange', linestyle='--', alpha=0.5, label='Fair (0.6)')
    ax.legend(loc='lower right')
    
    save_figure(fig, 'classification_f1_scores.png')

# ============================================================================
# 6. FINAL METRICS SUMMARY
# ============================================================================
def plot_final_metrics():
    """Generate final metrics summary table"""
    print("📊 Generating Final Metrics Table...")
    
    data = load_json('final_metrics.json')
    if data is None:
        return
    
    # Create table data
    table_data = [
        ['Overall Accuracy', f"{data['accuracy']*100:.2f}%"],
        ['Macro F1 Score', f"{data['macroF1']:.4f}"],
        ['Total Samples', f"{data['totalSamples']:,}"],
        ['Training Samples', f"{data['trainingSamples']:,}"],
        ['Validation Samples', f"{data['validationSamples']:,}"],
        ['Intent Categories', f"{data['intentCount']}"],
        ['Epochs', f"{data['epochs']}"],
        ['Final Train Loss', f"{data['finalTrainLoss']:.4f}"],
        ['Final Val Loss', f"{data['finalValLoss']:.4f}"],
        ['Final Train Acc', f"{data['finalTrainAcc']*100:.2f}%"],
        ['Final Val Acc', f"{data['finalValAcc']*100:.2f}%"],
    ]
    
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.axis('off')
    
    table = ax.table(
        cellText=table_data,
        colLabels=['Metric', 'Value'],
        loc='center',
        cellLoc='left',
        colWidths=[0.5, 0.3]
    )
    
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1.2, 1.8)
    
    # Style header
    table[(0, 0)].set_facecolor('#4CAF50')
    table[(0, 0)].set_text_props(color='white', fontweight='bold')
    table[(0, 1)].set_facecolor('#4CAF50')
    table[(0, 1)].set_text_props(color='white', fontweight='bold')
    
    # Alternate row colors
    for i in range(1, len(table_data) + 1):
        if i % 2 == 0:
            table[(i, 0)].set_facecolor('#f5f5f5')
            table[(i, 1)].set_facecolor('#f5f5f5')
    
    ax.set_title('Model Training Results Summary\n', fontsize=16, fontweight='bold', y=0.98)
    
    save_figure(fig, 'table_training_metrics.png')

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    print("=" * 60)
    print("   📊 BERUANG TRAINING VISUALIZER - FYP EDITION")
    print("=" * 60)
    
    # Check if training history exists
    if not os.path.exists(os.path.join(INPUT_DIR, 'training_history.json')):
        print(f"\n⚠️  Training history not found. Run train_intent.js first.")
        print("   This script needs the training output files.")
        return
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate visualizations
    plot_loss_curve()
    plot_accuracy_curve()
    plot_combined_curves()
    plot_confusion_matrix()
    plot_classification_report()
    plot_final_metrics()
    
    print("\n" + "=" * 60)
    print("   ✅ TRAINING VISUALIZATIONS COMPLETE!")
    print("=" * 60)
    print(f"\n📁 Output directory: {os.path.abspath(OUTPUT_DIR)}")
    print("\nGenerated files:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.png') and 'training' in f.lower():
            print(f"  • {f}")

if __name__ == '__main__':
    main()

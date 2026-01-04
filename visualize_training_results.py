
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, f1_score
import numpy as np
import os

# Create directory
os.makedirs('visualizations/transaction/post_training', exist_ok=True)

# Load Data
print("📊 Loading training metrics...")
try:
    with open('model_transaction/training_history.json', 'r') as f:
        history = json.load(f)
    print("✅ Loaded training history")
except FileNotFoundError:
    print("❌ training_history.json not found! Run training first.")
    exit()

try:
    with open('model_transaction/test_results.json', 'r') as f:
        results_data = json.load(f)
    results = pd.DataFrame(results_data)
    print(f"✅ Loaded {len(results)} test results")
except FileNotFoundError:
    print("❌ test_results.json not found! Run training first.")
    exit()

# Set Style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 12

# ==========================================
# 1. TRAINING CURVES
# ==========================================

# Loss Curve
plt.figure()
plt.plot(history['loss'], label='Train Loss', linewidth=2)
plt.plot(history['val_loss'], label='Validation Loss', linewidth=2, linestyle='--')
plt.title('Training and Validation Loss Over Epochs')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/curve_training_loss.png', dpi=300)
print("📸 Saved loss curve")

# Accuracy Curve
plt.figure()
plt.plot(history['category_acc'], label='Train Accuracy', linewidth=2)
plt.plot(history['val_category_acc'], label='Validation Accuracy', linewidth=2, linestyle='--')
plt.title('Model Accuracy Performance')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/curve_training_accuracy.png', dpi=300)
print("📸 Saved accuracy curve")

# ==========================================
# 2. CONFUSION MATRICES
# ==========================================

# Category Confusion Matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(results['true_category'], results['pred_category'])
labels = sorted(list(set(results['true_category'])))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
plt.title('Confusion Matrix: Needs vs Wants')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/heatmap_confusion_matrix.png', dpi=300)
print("📸 Saved confusion matrix")

# Subcategory Confusion Matrix (More detailed)
plt.figure(figsize=(12, 10))
labels_sub = sorted(list(set(results['true_subcategory'])))
cm_sub = confusion_matrix(results['true_subcategory'], results['pred_subcategory'], labels=labels_sub)
sns.heatmap(cm_sub, annot=True, fmt='d', cmap='YlGnBu', xticklabels=labels_sub, yticklabels=labels_sub)
plt.title('Confusion Matrix: Subcategories', fontsize=16)
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/heatmap_subcategory_confusion.png', dpi=300)
print("📸 Saved subcategory confusion matrix")

# ==========================================
# 3. METRICS ANALYSIS
# ==========================================

# Classification Report Heatmap
report = classification_report(results['true_category'], results['pred_category'], output_dict=True)
plt.figure(figsize=(8, 5))
sns.heatmap(pd.DataFrame(report).iloc[:-1, :].T, annot=True, cmap='RdYlGn')
plt.title('Classification Metrics (Precision, Recall, F1)')
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/table_classification_metrics.png', dpi=300)
print("📸 Saved metrics table")

# Confidence Histogram
plt.figure()
sns.histplot(data=results, x='confidence', hue='true_category', multiple='stack', bins=20)
plt.title('Prediction Confidence Distribution')
plt.xlabel('Confidence Score (0-1)')
plt.ylabel('Count')
plt.tight_layout()
plt.savefig('visualizations/transaction/post_training/histogram_confidence.png', dpi=300)
print("📸 Saved confidence histogram")

# Error Analysis Pie Chart
errors = results[results['true_category'] != results['pred_category']]
error_types = errors.groupby(['true_category', 'pred_category']).size()
plt.figure(figsize=(8, 8))
if not error_types.empty:
    error_types.plot.pie(autopct='%1.1f%%')
    plt.title('Distribution of Misclassification Types')
    plt.ylabel('')
    plt.tight_layout()
    plt.savefig('visualizations/transaction/post_training/pie_error_distribution.png', dpi=300)
    print("📸 Saved error distribution pie chart")
else:
    print("✨ No errors found! Skipping error pie chart.")

# Save Data to CSV for Report
results.to_csv('visualizations/transaction/post_training/final_test_predictions.csv', index=False)
print("💾 Saved raw predictions to final_test_predictions.csv")

# ==========================================
# DATA EXPORTS
# ==========================================

print("\n💾 Exporting post-training data files...")

# Save training history to data folder
with open('visualizations/transaction/data/training_history.json', 'w') as f:
    json.dump(history, f, indent=2)
print("✅ Saved training_history.json to data folder")

# Save classification report
report = classification_report(results['true_category'], results['pred_category'], output_dict=True)
with open('visualizations/transaction/data/classification_report.json', 'w') as f:
    json.dump(report, f, indent=2)
print("✅ Saved classification_report.json")

# Save confusion matrix data
cm_data = {
    'labels': sorted(list(set(results['true_category']))),
    'matrix': confusion_matrix(results['true_category'], results['pred_category']).tolist()
}
with open('visualizations/transaction/data/confusion_matrix.json', 'w') as f:
    json.dump(cm_data, f, indent=2)
print("✅ Saved confusion_matrix.json")

# Save final metrics
final_metrics = {
    'accuracy': accuracy_score(results['true_category'], results['pred_category']),
    'f1_score': f1_score(results['true_category'], results['pred_category'], average='weighted'),
    'test_samples': len(results)
}
with open('visualizations/transaction/data/final_metrics.json', 'w') as f:
    json.dump(final_metrics, f, indent=2)
print("✅ Saved final_metrics.json")

print("\n✨ Post-training visualizations and data exports complete!")

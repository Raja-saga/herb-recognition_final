import os
import json
import torch
import numpy as np
from transformers import ViTForImageClassification
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# -----------------------------
# 1. PATHS
# -----------------------------
TEST_DATASET_PATH = "../dataset/test"
MODEL_WEIGHTS_PATH = "model/vit_herb_model.pth"
LABELS_PATH = "labels.json"

# -----------------------------
# 2. LOAD LABELS (🔥 FIX HERE)
# -----------------------------
with open(LABELS_PATH, "r") as f:
    labels = json.load(f)

NUM_CLASSES = len(labels)
class_names = list(labels.values())

print(f"✅ Number of classes (from training): {NUM_CLASSES}")

# -----------------------------
# 3. DEVICE
# -----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("✅ Using device:", device)

# -----------------------------
# 4. LOAD MODEL (MATCH TRAINING)
# -----------------------------
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=NUM_CLASSES,
    ignore_mismatched_sizes=True
)

model.load_state_dict(
    torch.load(MODEL_WEIGHTS_PATH, map_location=device)
)

model.to(device)
model.eval()
print("✅ Model loaded successfully")

# -----------------------------
# 5. TRANSFORMS
# -----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

# -----------------------------
# 6. LOAD TEST DATASET
# -----------------------------
test_dataset = datasets.ImageFolder(TEST_DATASET_PATH, transform=transform)
test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)

# -----------------------------
# 7. EVALUATION
# -----------------------------
y_true = []
y_pred = []

with torch.no_grad():
    for images, labels_idx in test_loader:
        images = images.to(device)

        outputs = model(images)
        preds = torch.argmax(outputs.logits, dim=1)

        y_true.extend(labels_idx.numpy())
        y_pred.extend(preds.cpu().numpy())

# -----------------------------
# 8. METRICS
# -----------------------------
accuracy = accuracy_score(y_true, y_pred)
print("\n🎯 Accuracy:", round(accuracy * 100, 2), "%\n")

print("📊 Classification Report:\n")
print(classification_report(
    y_true,
    y_pred,
    target_names=class_names,
    digits=4
))

# -----------------------------
# 9. CONFUSION MATRIX
# -----------------------------
cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=False)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix - ViT (74 classes)")
plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()

print("✅ Confusion matrix saved")

# -----------------------------
# 10. SAVE RESULTS
# -----------------------------
with open("evaluation_results.txt", "w") as f:
    f.write(f"Accuracy: {accuracy * 100:.2f}%\n\n")
    f.write(classification_report(
        y_true, y_pred, target_names=class_names, digits=4
    ))

print("✅ Evaluation results saved")

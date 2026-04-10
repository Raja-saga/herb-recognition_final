import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import json
import torch
from torchvision import transforms
from transformers import ViTForImageClassification
from torch.utils.data import DataLoader, random_split
from torch import nn, optim
from torchvision.datasets import ImageFolder
from PIL import Image
from torch.amp import autocast, GradScaler

# ---------------------------
# DEVICE
# ---------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------------------
# PATH
# ---------------------------
DATASET_PATH = "../dataset/images"

# ---------------------------
# CLEAN DATASET
# ---------------------------
print("\n🔍 Cleaning dataset...")
for root, dirs, files in os.walk(DATASET_PATH):
    for file in files:
        path = os.path.join(root, file)
        try:
            img = Image.open(path)
            img.verify()
        except:
            try:
                os.remove(path)
            except:
                pass

# ---------------------------
# LABELS
# ---------------------------
with open("labels.json", "r") as f:
    label_map = json.load(f)

num_labels = len(label_map)
print("Total classes:", num_labels)

# ---------------------------
# TRANSFORMS
# ---------------------------
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(0.2,0.2),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225]
    )
])

# ---------------------------
# DATASET CLASS (FINAL FIX)
# ---------------------------
# ---------------------------
# DATASET CLASS (FINAL FIX)
# ---------------------------
class SafeDataset(ImageFolder):
    def __init__(self, root, label_map, transform=None):
        super().__init__(root, transform=transform)

        def normalize(name):
            return name.replace("-", "_").lower()

        normalized_map = {
            normalize(k): v for k, v in label_map.items()
        }

        new_samples = []
        for path, _ in self.samples:   # ✅ use self.samples directly
            folder = os.path.basename(os.path.dirname(path))
            key = normalize(folder)

            if key in normalized_map:
                new_samples.append((path, normalized_map[key]))
            else:
                print("❌ Skipping:", folder)

        self.samples = new_samples


    def __getitem__(self, index):
        try:
            return super().__getitem__(index)
        except:
            return self.__getitem__((index + 1) % len(self))
        
        
# ---------------------------
# CREATE DATASET (MISSING ❗)
# ---------------------------
dataset = SafeDataset(DATASET_PATH, label_map, transform)
# ---------------------------
# TRAIN / VAL SPLIT
# ---------------------------
train_size = int(0.8 * len(dataset))
val_size = len(dataset) - train_size

train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=0, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, num_workers=0, pin_memory=True)

print("Train size:", len(train_dataset))
print("Val size:", len(val_dataset))

# ---------------------------
# MODEL
# ---------------------------
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=num_labels,
    ignore_mismatched_sizes=True   # ✅ IMPORTANT
)

model.to(device)

# ---------------------------
# LOSS & OPTIMIZER
# ---------------------------
criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam([
    {"params": model.vit.parameters(), "lr": 1e-5},
    {"params": model.classifier.parameters(), "lr": 5e-5}
])

scaler = GradScaler("cuda")

# ---------------------------
# TRAINING
# ---------------------------
torch.backends.cudnn.benchmark = True


best_acc = 0.0

for epoch in range(10):
    print(f"\n🚀 Epoch {epoch+1}")

    model.train()
    train_loss = 0

    for batch_idx, (imgs, labels) in enumerate(train_loader):
        imgs, labels = imgs.to(device), labels.to(device)

        with autocast(device_type="cuda"):
            outputs = model(imgs)
            loss = criterion(outputs.logits, labels)

        optimizer.zero_grad()
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        train_loss += loss.item()

        if batch_idx % 50 == 0:
            print(f"Batch {batch_idx}/{len(train_loader)} | Loss: {loss.item():.4f}")

    avg_train_loss = train_loss / len(train_loader)

    # ---- VALIDATION ----
    model.eval()
    correct = 0
    total = 0
    val_loss = 0

    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(device), labels.to(device)

            outputs = model(imgs)
            loss = criterion(outputs.logits, labels)

            val_loss += loss.item()

            preds = torch.argmax(outputs.logits, dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    acc = correct / total
    avg_val_loss = val_loss / len(val_loader)

    print(f"Train Loss: {avg_train_loss:.4f}")
    print(f"Val Loss: {avg_val_loss:.4f}")
    print(f"Val Accuracy: {acc*100:.2f}%")

    # ---- SAVE BEST MODEL ----
    if acc > best_acc:
        best_acc = acc
        os.makedirs("model", exist_ok=True)
        torch.save(model.state_dict(), "model/vit_herb_model_best.pth")
        print("✅ Best model saved!")

# ---------------------------
# FINAL SAVE
# ---------------------------
torch.save(model.state_dict(), "model/vit_herb_model_final.pth")

print("\n🎉 Training Completed!")
import sys
import json
import os
from PIL import Image
import torch
from transformers import ViTImageProcessor, ViTForImageClassification
import torchvision.transforms as transforms

def load_labels():
    """Load herb labels from JSON file"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        labels_path = os.path.join(script_dir, 'labels.json')
        with open(labels_path, 'r') as f:
            labels_dict = json.load(f)
        return {v: k for k, v in labels_dict.items()}
    except Exception as e:
        return None

def load_model():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'model', 'vit_herb_model_best.pth')
        labels_path = os.path.join(script_dir, 'labels.json')

        
        with open(labels_path, 'r') as f:
            labels_dict = json.load(f)

        num_labels = len(labels_dict)

        processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')

        model = ViTForImageClassification.from_pretrained(
            'google/vit-base-patch16-224',
            num_labels=num_labels,
            ignore_mismatched_sizes=True
        )

        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location='cpu'))
            print("Loaded trained weights", file=sys.stderr)

        model.eval()
        return processor, model

    except Exception as e:
        print(f"Model loading error: {str(e)}", file=sys.stderr)
        return None, None


def preprocess_image(image_path, processor):
    """Consistent preprocessing matching training pipeline"""
    try:
        
        image = Image.open(image_path).convert('RGB')
        
        image = image.resize((224, 224), Image.LANCZOS)
        
        inputs = processor(images=image, return_tensors="pt")
        return inputs
    except Exception as e:
        raise Exception(f"Image preprocessing failed: {str(e)}")

processor, model = load_model()
labels_map = load_labels()

def predict_herb(image_path):
    """Predict herb with proper model and label mapping"""
    try:
        
        global processor, model, labels_map
        
        if processor is None or model is None:
            return {"error": "Failed to load model", "success": False}
        
        if not labels_map:
            return {"error": "Failed to load labels", "success": False}
        
        inputs = preprocess_image(image_path, processor)
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            confidence = torch.max(predictions).item() * 100
            predicted_class = torch.argmax(predictions).item()
        
        herb_name = labels_map.get(predicted_class, "Unknown")
        
        return {
            "herb": herb_name,
            "confidence": round(confidence, 2),
            "predicted_class": predicted_class,
            "success": True
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            print(json.dumps({"error": "Usage: python predict.py <image_path>", "success": False}))
            sys.exit(1)
        
        image_path = sys.argv[1]
        if not os.path.exists(image_path):
            print(json.dumps({"error": f"Image file not found: {image_path}", "success": False}))
            sys.exit(1)
        
        result = predict_herb(image_path)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}", "success": False}))
        sys.exit(1)
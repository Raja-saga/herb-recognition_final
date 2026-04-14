from flask import Flask, request, jsonify
from PIL import Image
import io

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "ML Server Running 🚀"

from flask import Flask, request, jsonify
import os
from predict import predict_herb

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET"])
def home():
    return "ML Server Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image provided", "success": False}), 400

        file = request.files["image"]

        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # ✅ CALL YOUR FUNCTION DIRECTLY
        result = predict_herb(filepath)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
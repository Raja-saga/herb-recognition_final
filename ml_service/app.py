from flask import Flask, request, jsonify
from PIL import Image
import io

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "ML Server Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        file = request.files["image"]
        img = Image.open(file.stream)

        # TODO: call your model here
        result = {
            "prediction": "Neem",
            "confidence": 0.95
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
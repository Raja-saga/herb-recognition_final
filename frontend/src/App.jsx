import { useEffect, useState } from "react";
import "./styles.css";

import ImageUpload from "./components/ImageUpload";
import LocationInput from "./components/LocationInput";
import DataSourceBadge from "./components/DataSourceBadge";
import IndiaMap from "./components/IndiaMap";
import HerbChatbot from "./components/HerbChatbot";


export default function App() {
  const [prediction, setPrediction] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  return (
    <div className="app-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="upload-controls">
          <h1>Medicinal Herb Recognition</h1>
          <p className="subtitle">
            Location-Aware AI Classification with Explainable Validation
          </p>

          <LocationInput onLocationChange={setUserLocation} />

          <ImageUpload
            location={userLocation}
            onPredictionChange={setPrediction}
          />

          {prediction && (
            <div className="prediction-box">
              <p><b>Predicted Herb:</b> {prediction.herb}</p>
              <p><b>Image Confidence:</b> {prediction.confidence}%</p>
              <p><b>Final Confidence:</b> {prediction.finalConfidence}%</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="map-wrapper">
          <IndiaMap predictedHerb={prediction?.herb} />
        </div>
        <div className="chat-wrapper">
          <HerbChatbot predictedHerb={prediction?.herb} />
        </div>
      </div>

      <DataSourceBadge />
    </div>
  );
}

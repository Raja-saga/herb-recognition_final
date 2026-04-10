import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCurrentLocation } from "../services/api";
import LocationStatus from "./LocationStatus";

// Fix default marker icon broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickHandler({ onMapClick }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
    // Change cursor to crosshair when in manual mode
    mouseover() {
      map.getContainer().style.cursor = "crosshair";
    },
    mouseout() {
      map.getContainer().style.cursor = "";
    },
  });
  return null;
}

export default function LocationInput({ onLocationChange }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // "auto" | "manual"
  const [markerPos, setMarkerPos] = useState(null);
  const [address, setAddress] = useState(null);

  const handleCurrentLocation = async () => {
    setMode("auto");
    setLoading(true);
    setError(null);
    setMarkerPos(null);
    setAddress(null);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      onLocationChange(loc);
    } catch (err) {
      setError(err.message);
      onLocationChange(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = useCallback(async (latlng) => {
    const loc = { latitude: latlng.lat, longitude: latlng.lng };
    setMarkerPos([latlng.lat, latlng.lng]);
    setLocation(loc);
    onLocationChange(loc);
    setError(null);

    // Optional: reverse geocode via Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await res.json();
      setAddress(data.display_name || null);
    } catch {
      setAddress(null);
    }
  }, [onLocationChange]);

  const clearLocation = () => {
    setLocation(null);
    setMarkerPos(null);
    setAddress(null);
    setError(null);
    setMode(null);
    onLocationChange(null);
  };

  return (
    <div className="location-input">
      <h3>Location Required</h3>
      <LocationStatus location={location} error={error} />

      {!location && (
        <div className="location-controls">
          <button
            onClick={handleCurrentLocation}
            disabled={loading}
            className={`location-btn current ${mode === "auto" ? "active" : ""}`}
          >
            {loading ? "Getting Location..." : "Use Current Location"}
          </button>

          <button
            onClick={() => setMode(mode === "manual" ? null : "manual")}
            className={`location-btn manual ${mode === "manual" ? "active" : ""}`}
          >
            Enter Manually
          </button>
        </div>
      )}

      {mode === "manual" && !location && (
        <div className="map-click-container">
          <p className="map-hint">📍 Click anywhere on the map to select your location</p>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "300px", width: "100%", borderRadius: "8px", cursor: "crosshair" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {markerPos && <Marker position={markerPos} />}
          </MapContainer>
        </div>
      )}

      {location && (
        <div className="location-selected">
          <p>
            <strong>Lat:</strong> {location.latitude.toFixed(5)},{" "}
            <strong>Lng:</strong> {location.longitude.toFixed(5)}
          </p>
          {address && (
            <p className="location-address" title={address}>
              📍 {address.length > 60 ? address.slice(0, 60) + "…" : address}
            </p>
          )}
          <button onClick={clearLocation} className="location-btn clear">
            Change Location
          </button>
        </div>
      )}
    </div>
  );
}

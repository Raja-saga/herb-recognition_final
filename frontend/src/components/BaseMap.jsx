import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import { getStateData } from "../services/stateDataService";

function getColor(score = 0) {
  return score > 0.8 ? "#08306b" :
         score > 0.6 ? "#2171b5" :
         score > 0.4 ? "#6baed6" :
         score > 0.2 ? "#c6dbef" :
                       "#f0f0f0";
}

// function normalize(name) {
//   return name.toLowerCase().replace(/[-_]/g, " ").trim();
// }
function normalize(name = "") {
  return name
    .toLowerCase()
    .replace(/[\s-_]/g, "")
    .trim();
}


export default function BaseMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load GeoJSON safely
    fetch('/geojson/india_states.geojson')
      .then(response => {
        if (!response.ok) throw new Error('GeoJSON load failed');
        return response.json();
      })
      .then(setGeoData)
      .catch(err => {
        console.error('GeoJSON error:', err);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    if (!geoData || mapInstance.current) return;

    try {
      const herbStates = getStateData();
      
      mapInstance.current = L.map(mapRef.current).setView([22, 80], 4);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(mapInstance.current);

      L.geoJSON(geoData, {
        style: (feature) => {
          const rawName =
            feature?.properties?.NAME_1 ||
            feature?.properties?.NAME ||
            "";

          const stateData = herbStates[
            Object.keys(herbStates).find(
              (k) => normalize(k) === normalize(rawName)
            )
          ];

          return {
            fillColor: stateData
              ? getColor(stateData.normalizedScore)
              : "#eeeeee",
            weight: 1,
            color: "#444",
            fillOpacity: 0.8,
          };
        },

        onEachFeature: (feature, layer) => {
          const rawName =
            feature?.properties?.NAME_1 ||
            feature?.properties?.NAME ||
            "";

          const stateData = herbStates[
            Object.keys(herbStates).find(
              (k) => normalize(k) === normalize(rawName)
            )
          ];

          if (stateData) {
            layer.bindPopup(`
              <b>${rawName}</b><br/>
              Count: ${stateData.count}<br/>
              Presence: ${stateData.presence}
            `);
          }
        }
      }).addTo(mapInstance.current);
    } catch (err) {
      console.error('Map creation error:', err);
      setError(err.message);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [geoData]);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Map Error: {error}</div>;
  }

  if (!geoData) {
    return <div style={{ padding: '20px' }}>Loading map...</div>;
  }

  return <div ref={mapRef} style={{ height: "500px", width: "100%" }} />;
}

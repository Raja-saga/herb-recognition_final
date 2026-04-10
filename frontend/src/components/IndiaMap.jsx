import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getHerbStateData } from '../assets/data/herbStateData';
import HerbMarkers from './HerbMarkers';
import { loadHerbMetadata } from '../utils/metadataLoader';

export default function IndiaMap({ predictedHerb }) {
  const [geoData, setGeoData] = useState(null);
  const [herbData, setHerbData] = useState(null);
  const [markerLocations, setMarkerLocations] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    fetch('/geojson/gadm41_IND_1.json')
      .then(response => response.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (predictedHerb) {
      const data = getHerbStateData(predictedHerb);
      setHerbData(data);
      
      loadHerbMetadata(predictedHerb).then(locations => {
        setMarkerLocations(locations);
      });
    } else {
      
      setHerbData(null);
      setMarkerLocations(null);
      setSelectedState(null);
    }
  }, [predictedHerb]);

  const getColor = (score = 0, isSynthetic = false) => {
    if (isSynthetic) {
      return '#f0f0f0'; 
    }
    return score > 0.8 ? '#1b5e20' :
           score > 0.6 ? '#2e7d32' :
           score > 0.4 ? '#43a047' :
           score > 0.2 ? '#66bb6a' :
           score > 0   ? '#a5d6a7' : '#f5f5f5';
  };

  const style = (feature) => {
    if (!herbData) {
      return {
        fillColor: '#e8f4f8',
        weight: 1,
        opacity: 1,
        color: '#2196f3',
        fillOpacity: 0.3
      };
    }

    const stateName = feature.properties.NAME_1;
    const stateInfo = herbData.states[stateName];
    const score = stateInfo ? stateInfo.normalizedScore : 0;
    const isSynthetic = stateInfo ? stateInfo.synthetic : false;

    return {
      fillColor: getColor(score, isSynthetic),
      weight: 1,
      opacity: 1,
      color: '#333',
      fillOpacity: isSynthetic ? 0.3 : (score > 0 ? 0.6 : 0.1)
    };
  };

  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.NAME_1 || 'Unknown State';
    const normalizedHerbName = predictedHerb ? predictedHerb.replace(/_/g, ' ') : null;
    
    layer.on('click', () => {
      setSelectedState(stateName);
    });
    
    if (!herbData) {
      layer.bindPopup(`<div><h4>${stateName}</h4><p>State-level India Map</p></div>`);
      return;
    }

    const stateInfo = herbData.states[stateName];
    
    if (stateInfo) {
      const sourceLabel = stateInfo.synthetic ? 'GBIF' : 'GBIF';
      layer.bindPopup(`
        <div style="min-width: 200px;">
          <h4>${stateName}</h4>
          <p><strong>Herb:</strong> ${normalizedHerbName}</p>
          <p><strong>Presence:</strong> ${stateInfo.presence}</p>
          <p><strong>Score:</strong> ${(stateInfo.normalizedScore * 100).toFixed(1)}%</p>
          <p><strong>Source:</strong> ${sourceLabel}</p>
          ${stateInfo.synthetic ? '<p style="color: #666; font-size: 12px;"><em></em></p>' : ''}
          <p style="color: #0066cc; font-size: 12px; margin-top: 8px;"><em>Click to show location markers</em></p>
        </div>
      `);
    } else {
      layer.bindPopup(`
        <div>
          <h4>${stateName}</h4>
          <p><strong>Herb:</strong> ${normalizedHerbName}</p>
          <p>No occurrence data available</p>
        </div>
      `);
    }
  };

  if (!geoData) {
    return <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>;
  }

  return (
    <div className="india-map-container">
      {predictedHerb && herbData && (
        <div style={{ 
          padding: '10px', 
          background: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '10px',
          color: '#155724'
        }}>
          <strong>Showing distribution for:</strong> {predictedHerb.replace(/_/g, ' ')}
          {selectedState && (
            <span style={{ marginLeft: '10px', color: '#0066cc' }}>
              | <strong>Selected State:</strong> {selectedState}
            </span>
          )}
        </div>
      )}

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <GeoJSON
          key={`${predictedHerb || 'default'}-${Date.now()}`}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
        <HerbMarkers 
          locations={markerLocations} 
          selectedState={selectedState} 
          predictedHerb={predictedHerb}
        />
      </MapContainer>
    </div>
  );
}
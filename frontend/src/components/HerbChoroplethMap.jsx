import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function HerbChoroplethMap({ data }) {
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState(null);

  // Load GeoJSON on mount
  useEffect(() => {
    fetch('/geojson/gadm41_IND_1.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load map data');
        return response.json();
      })
      .then(setGeoData)
      .catch((err) => {
        console.error('GeoJSON load error:', err);
        setError(err.message);
      });
  }, []);

  // Color scale for herb density
  const getColor = (density = 0) => {
    return density > 0.8 ? '#08306b' :
           density > 0.6 ? '#2171b5' :
           density > 0.4 ? '#6baed6' :
           density > 0.2 ? '#c6dbef' :
           density > 0   ? '#eff3ff' : '#f7fbff';
  };

  // Style function for GeoJSON features
  const style = (feature) => {
    if (!data) {
      // Default style when no herb is predicted
      return {
        fillColor: '#f7fbff',
        weight: 1,
        opacity: 1,
        color: '#666',
        fillOpacity: 0.5,
      };
    }

    const stateName = feature.properties.NAME_1 || feature.properties.NAME || '';
    const normalizedName = stateName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

    // Find matching state in herb data
    const matchedState = Object.keys(data.states || {}).find(
      (dataState) => dataState.toLowerCase().replace(/[-_\s]+/g, ' ').trim() === normalizedName
    );

    const stateData = matchedState ? data.states[matchedState] : null;
    const density = stateData ? stateData.normalizedScore : 0;

    return {
      fillColor: getColor(density),
      weight: 2,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.7,
    };
  };

  // Popup content for each feature
  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.NAME_1 || feature.properties.NAME || '';

    if (!data) {
      layer.bindPopup(`
        <div>
          <h4>${stateName}</h4>
          <p>Please upload data to view distribution.</p>
        </div>
      `);
      return;
    }

    const normalizedName = stateName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

    const matchedState = Object.keys(data.states || {}).find(
      (dataState) => dataState.toLowerCase().replace(/[-_\s]+/g, ' ').trim() === normalizedName
    );

    const stateData = matchedState ? data.states[matchedState] : null;

    if (stateData) {
      const popupContent = `
        <div style="min-width: 200px;">
          <h4>${stateName}</h4>
          <p><strong>Herb:</strong> ${data.herb}</p>
          <p><strong>Occurrences:</strong> ${stateData.count}</p>
          <p><strong>Presence:</strong> ${stateData.presence}</p>
          <p><strong>Density:</strong> ${(stateData.normalizedScore * 100).toFixed(1)}%</p>
          <hr>
          <p><strong>Habitat:</strong> ${data.ecology?.habitat || 'N/A'}</p>
          <p><strong>Climate:</strong> ${data.ecology?.climate || 'N/A'}</p>
        </div>
      `;
      layer.bindPopup(popupContent);
    } else {
      layer.bindPopup(`
        <div>
          <h4>${stateName}</h4>
          <p>No data available for this region</p>
        </div>
      `);
    }
  };

  if (error) {
    return (
      <div style={{
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ddd',
        color: '#666'
      }}>
        <div>
          <h3>Map Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!geoData) {
    return (
      <div style={{
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ddd',
        color: '#666'
      }}>
        Loading map...
      </div>
    );
  }

  return (
    <div>
      {data && (
        <div style={{
          padding: '10px',
          background: '#f0f8ff',
          marginBottom: '10px',
          borderRadius: '4px',
        }}>
          <strong>Showing distribution for:</strong> {data.herb}
        </div>
      )}

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <GeoJSON
          key={data ? `${data.herb}-${Date.now()}` : 'default'}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
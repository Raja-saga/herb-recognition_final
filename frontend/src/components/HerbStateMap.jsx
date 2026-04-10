import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function HerbStateMap({ data }) {
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/geojson/india_states_real.geojson')
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

  const getColor = (density = 0) => {
    return density > 0.8 ? '#08306b' :
           density > 0.6 ? '#2171b5' :
           density > 0.4 ? '#6baed6' :
           density > 0.2 ? '#c6dbef' :
           density > 0   ? '#eff3ff' : '#f7fbff';
  };

  const style = (feature) => {
    if (!data) {
      return {
        fillColor: '#e8f4f8',
        weight: 1,
        opacity: 1,
        color: '#2196f3',
        fillOpacity: 0.3
      };
    }

    const stateName = feature.properties.NAME_1 || feature.properties.ST_NM || feature.properties.STATE || '';
    const normalizedName = stateName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

    const matchedState = Object.keys(data.states || {}).find(dataState =>
      dataState.toLowerCase().replace(/[-_\s]+/g, ' ').trim() === normalizedName
    );

    const stateData = matchedState ? data.states[matchedState] : null;
    const density = stateData ? stateData.normalizedScore : 0;

    return {
      fillColor: getColor(density),
      weight: 2,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.NAME_1 || feature.properties.ST_NM || feature.properties.STATE || '';

    if (!data) {
      layer.bindPopup(`
        <div style="min-width: 150px;">
          <h4>${stateName}</h4>
          <p>Upload an image to see herb distribution data</p>
        </div>
      `);
      return;
    }

    const normalizedName = stateName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

    const matchedState = Object.keys(data.states || {}).find(dataState =>
      dataState.toLowerCase().replace(/[-_\s]+/g, ' ').trim() === normalizedName
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
          <p><strong>Herb:</strong> ${data.herb}</p>
          <p>No occurrence data for this region</p>
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
        Loading interactive map...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: '10px',
        background: data ? '#f0f8ff' : '#f8f9fa',
        marginBottom: '10px',
        borderRadius: '4px'
      }}>
        {data ? (
          <><strong>Showing distribution for:</strong> {data.herb}</>
        ) : (
          <><strong>Interactive Map:</strong> Click states to explore regions</>
        )}
      </div>

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
          key={data ? `${data.herb}-${Date.now()}` : 'base-map'}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
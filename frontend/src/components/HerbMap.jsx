import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function HerbMap({ herbName, locations }) {
  const [map, setMap] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!map) {
      const newMap = L.map('herb-map').setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    }

    // Cleanup function to remove map on unmount
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  // Handle Markers and Bounds
  useEffect(() => {
    if (map && locations && locations.length > 0) {
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Add new markers
      const markerList = locations.map(location => {
        return L.marker([location.lat, location.lng])
          .addTo(map)
          .bindPopup(`
            <div>
              <h4>${herbName}</h4>
              <p><strong>Location:</strong> ${location.name}</p>
              <p><strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
            </div>
          `);
      });

      // Fit map to show all markers
      if (locations.length > 1) {
        const group = new L.featureGroup(markerList);
        map.fitBounds(group.getBounds().pad(0.1));
      } else {
        map.setView([locations[0].lat, locations[0].lng], 8);
      }
    }
  }, [map, herbName, locations]);

  return (
    <div>
      {herbName && (
        <div style={{
          padding: '10px',
          background: '#f0f8ff',
          marginBottom: '10px',
          borderRadius: '4px'
        }}>
          <strong>Herb Locations:</strong> {herbName}
          {locations && <span> ({locations.length} locations found)</span>}
        </div>
      )}
      <div id="herb-map" style={{ height: '500px', width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}></div>
    </div>
  );
}
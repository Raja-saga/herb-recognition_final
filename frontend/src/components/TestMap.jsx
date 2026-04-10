import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function TestMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    console.log('TestMap useEffect running');
    
    if (!mapRef.current) {
      console.error('Map container not found');
      return;
    }

    try {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      console.log('Creating map...');
      const map = L.map(mapRef.current).setView([22, 80], 4);
      
      console.log('Adding tile layer...');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      console.log('Map created successfully');

    } catch (error) {
      console.error('Map creation failed:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '400px', 
        width: '100%', 
        border: '2px solid red' // Visual debug
      }} 
    />
  );
}
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Auto zoom to user location
function SetViewOnUserLocation({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      map.setView([userLocation.lat, userLocation.lng], 10);
    }
  }, [userLocation, map]);

  return null;
}

// Fix default icon issue (Vite fix)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function HerbMarkers({ locations, selectedState, predictedHerb, userLocation }) {

  const safeLocations = Array.isArray(locations) ? locations : [];
  const targetState = selectedState?.toLowerCase().trim() || "";

  const filteredLocations = safeLocations.filter(loc => {
    if (!loc.state) return false;

    const locState = loc.state.toLowerCase().trim();
    return locState.includes(targetState) || targetState.includes(locState);
  });

  return (
    <>
      {/* Auto Zoom */}
      <SetViewOnUserLocation userLocation={userLocation} />

      {/* 🔵 User Location Marker */}
      {userLocation?.lat && userLocation?.lng && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>
            <strong>Your Selected Location</strong>
            <br />
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </Popup>
        </Marker>
      )}

      {/* 🔵 Herb Location Markers */}
      {filteredLocations.map((loc, idx) => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker
            key={`${predictedHerb}-${selectedState}-${idx}`}
            position={[lat, lng]}
          >
            <Popup>
              <div>
                <strong>Location {idx + 1}</strong>
                <br />
                {lat.toFixed(4)}, {lng.toFixed(4)}
                <br />
                {loc.state && <>State: {loc.state}<br /></>}
                {loc.country && <>Country: {loc.country}</>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
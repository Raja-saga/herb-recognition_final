export default function LocationStatus({ location }) {
  if (!location) {
    return (
      <div style={{ 
        padding: '8px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        color: '#856404',
        fontSize: '14px'
      }}>
        No location provided
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '8px', 
      background: '#d4edda', 
      border: '1px solid #c3e6cb',
      borderRadius: '4px',
      color: '#155724',
      fontSize: '14px'
    }}>
      <strong>Current Location:</strong><br/>
      Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
    </div>
  );
}
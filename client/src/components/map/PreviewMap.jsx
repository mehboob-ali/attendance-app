import { MapContainer, TileLayer, Circle, Polygon, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export default function PreviewMap({ 
  center = [19.089340, 72.878176], 
  point, 
  circleRadius, 
  polygon 
}) {
  return (
    <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
      <MapContainer 
        center={center} 
        zoom={17} 
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {point && <Marker position={[point.lat, point.lng]} />}
        {circleRadius && point && (
          <Circle 
            center={[point.lat, point.lng]} 
            radius={circleRadius} 
            pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2 }}
          />
        )}
        {polygon && (
          <Polygon 
            positions={polygon} 
            pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

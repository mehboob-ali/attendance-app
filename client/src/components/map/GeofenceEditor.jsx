import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function MapClickHandler({ onLocationSelect, center, radius }) {
  const [position, setPosition] = useState(center ? [center.lat, center.lng] : null);
  const [currentRadius, setCurrentRadius] = useState(radius || 100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const map = useMapEvents({
    click(e) {
      if (!isDragging) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setCurrentRadius(100); // Reset radius on new click
        onLocationSelect({ lat, lng, radius: 100 });
      }
    },
    mousedown(e) {
      if (position) {
        setIsDragging(true);
        setDragStart(e.latlng);
      }
    },
    mousemove(e) {
      if (isDragging && position && dragStart) {
        const distance = map.distance(position, [e.latlng.lat, e.latlng.lng]);
        const newRadius = Math.round(distance);
        setCurrentRadius(newRadius);
        onLocationSelect({ 
          lat: position[0], 
          lng: position[1], 
          radius: newRadius 
        });
      }
    },
    mouseup() {
      setIsDragging(false);
      setDragStart(null);
    }
  });

  useEffect(() => {
    if (center) {
      setPosition([center.lat, center.lng]);
      setCurrentRadius(radius || 100);
    }
  }, [center, radius]);

  return position ? (
    <>
      <Marker position={position} />
      <Circle
        center={position}
        radius={currentRadius}
        pathOptions={{
          color: isDragging ? '#f59e0b' : '#16a34a',
          fillColor: isDragging ? '#f59e0b' : '#16a34a',
          fillOpacity: 0.2,
          weight: 2
        }}
      />
    </>
  ) : null;
}

export default function GeofenceEditor({ 
  initialCenter = [19.089340, 72.878176], 
  initialRadius = 100,
  onLocationChange 
}) {
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    if (onLocationChange) {
      onLocationChange(location);
    }
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium text-blue-900 mb-1">📍 How to use:</p>
        <ol className="text-blue-800 space-y-1 list-decimal list-inside">
          <li><strong>Click</strong> on the map to place the geofence center</li>
          <li><strong>Click and drag</strong> from the center to adjust the radius</li>
          <li>The circle will turn <span className="text-amber-600">orange</span> while dragging</li>
        </ol>
      </div>

      {selectedLocation && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-slate-600">Latitude:</span>
              <span className="ml-2 font-mono font-medium">{selectedLocation.lat.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-600">Longitude:</span>
              <span className="ml-2 font-mono font-medium">{selectedLocation.lng.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-600">Radius:</span>
              <span className="ml-2 font-mono font-medium">{selectedLocation.radius}m</span>
            </div>
          </div>
        </div>
      )}

      <div className="h-96 rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={16}
          className="h-full w-full"
          style={{ cursor: 'crosshair' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler
            onLocationSelect={handleLocationSelect}
            center={selectedLocation}
            radius={selectedLocation?.radius}
          />
        </MapContainer>
      </div>

      {selectedLocation && (
        <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
          <p>
            💡 <strong>Tip:</strong> The radius is {selectedLocation.radius} meters 
            ({(selectedLocation.radius * 3.28084).toFixed(0)} feet). 
            Recommended for indoor malls: 50-150m depending on GPS accuracy.
          </p>
        </div>
      )}
    </div>
  );
}

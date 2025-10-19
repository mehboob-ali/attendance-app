import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, Marker, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Blue marker for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Current location button
function LocateButton({ onLocate }) {
  const map = useMap();
  
  useEffect(() => {
    const locateControl = L.control({ position: 'bottomright' });
    
    locateControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <a href="#" title="Go to my location" style="
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          text-decoration: none;
          font-size: 20px;
          color: #333;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
        ">📍</a>
      `;
      
      L.DomEvent.on(div, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        if (onLocate) onLocate();
      });
      
      return div;
    };
    
    locateControl.addTo(map);
    
    return () => {
      locateControl.remove();
    };
  }, [map, onLocate]);
  
  return null;
}

function MapClickHandler({ onLocationSelect, externalRadius, currentLocation }) {
  const [position, setPosition] = useState(null);
  const [currentRadius, setCurrentRadius] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  const map = useMapEvents({
    click(e) {
      if (!isDragging) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        const newRadius = externalRadius || 100;
        setCurrentRadius(newRadius);
        onLocationSelect({ lat, lng, radius: newRadius });
      }
    },
    mousedown(e) {
      if (position) {
        const distance = map.distance(position, [e.latlng.lat, e.latlng.lng]);
        if (Math.abs(distance - currentRadius) < 50) {
          setIsDragging(true);
        }
      }
    },
    mousemove(e) {
      if (isDragging && position) {
        const distance = map.distance(position, [e.latlng.lat, e.latlng.lng]);
        const newRadius = Math.max(10, Math.min(1000, Math.round(distance)));
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
    }
  });

  // Update radius from external slider WITHOUT refreshing map
  useEffect(() => {
    if (position && externalRadius && !isDragging) {
      setCurrentRadius(externalRadius);
    }
  }, [externalRadius, position, isDragging]);

  return (
    <>
      {currentLocation && (
        <Marker 
          position={[currentLocation.lat, currentLocation.lng]} 
          icon={currentLocationIcon}
        />
      )}
      
      {position && (
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
      )}
    </>
  );
}

export default function GeofenceEditor({ 
  externalRadius = 100,
  onLocationChange 
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.089340, 72.878176]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setMapCenter([location.lat, location.lng]);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    if (onLocationChange) {
      onLocationChange(location);
    }
  };

  const handleLocateClick = () => {
    getCurrentLocation();
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium text-blue-900 mb-1">📍 How to use:</p>
        <ol className="text-blue-800 space-y-1 list-decimal list-inside">
          <li><strong>Blue marker</strong> shows your current location</li>
          <li><strong>Click</strong> on the map to place the geofence center (red marker)</li>
          <li><strong>Drag circle edge</strong> OR <strong>use slider below</strong> to adjust radius</li>
          <li>Use the <strong>📍 button</strong> (bottom right) to recenter on your location</li>
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

      {currentLocation && (
        <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          📍 Your current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
        </div>
      )}

      <div className="h-96 rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <p className="text-slate-600">⏳ Getting your location...</p>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={16}
            className="h-full w-full"
            style={{ cursor: 'crosshair' }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ZoomControl position="topright" />
            <LocateButton onLocate={handleLocateClick} />
            <MapClickHandler
              onLocationSelect={handleLocationSelect}
              externalRadius={externalRadius}
              currentLocation={currentLocation}
            />
          </MapContainer>
        )}
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

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Geofence Center</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Geofence Area</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import Layout from '../../components/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LiveMap({ userLocation, geofences }) {
  if (!userLocation || !geofences || geofences.length === 0) {
    return null;
  }

  // Use first geofence as center, or user location
  const firstGeo = geofences[0];
  const center = firstGeo?.geometry?.coordinates 
    ? [firstGeo.geometry.coordinates[1], firstGeo.geometry.coordinates[0]]
    : [userLocation.lat, userLocation.lng];

  return (
    <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg">
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
        
        {/* User's current location */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <strong>Your Location</strong><br />
            Accuracy: {Math.round(userLocation.accuracy)}m
          </Popup>
        </Marker>

        {/* User's accuracy circle */}
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={userLocation.accuracy}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '5, 5'
          }}
        />

        {/* Geofence boundaries */}
        {geofences.map(geo => {
          if (geo.type === 'circle' && geo.geometry?.coordinates) {
            return (
              <Circle
                key={geo._id}
                center={[geo.geometry.coordinates[1], geo.geometry.coordinates[0]]}
                radius={geo.radiusMeters}
                pathOptions={{
                  color: '#16a34a',
                  fillColor: '#16a34a',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <strong>{geo.name}</strong><br />
                  Radius: {geo.radiusMeters}m
                </Popup>
              </Circle>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}

export default function Home() {
  const { loading, coords, error, get } = useGeolocation();
  const [status, setStatus] = useState(null);
  const [punching, setPunching] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [distance, setDistance] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const user = getUser();

  useEffect(() => {
    fetchUserGeofences();
  }, []);

  useEffect(() => {
    if (coords && geofences.length > 0) {
      calculateDistance();
    }
  }, [coords, geofences]);

  const fetchUserGeofences = async () => {
    try {
      const { data } = await api.get('/geofences');
      // In production, filter by user's assigned sites
      setGeofences(data.filter(g => g.active));
    } catch (err) {
      console.error('Failed to fetch geofences:', err);
    }
  };

  const calculateDistance = () => {
    if (!coords || geofences.length === 0) return;

    // Calculate distance to nearest geofence
    let minDistance = Infinity;
    let inside = false;

    geofences.forEach(geo => {
      if (geo.type === 'circle' && geo.geometry?.coordinates) {
        const [geoLng, geoLat] = geo.geometry.coordinates;
        const R = 6371e3; // Earth radius in meters
        const φ1 = (coords.lat * Math.PI) / 180;
        const φ2 = (geoLat * Math.PI) / 180;
        const Δφ = ((geoLat - coords.lat) * Math.PI) / 180;
        const Δλ = ((geoLng - coords.lng) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceToCenter = R * c;

        const distanceToBoundary = distanceToCenter - geo.radiusMeters;
        
        if (distanceToCenter <= geo.radiusMeters) {
          inside = true;
        }

        if (Math.abs(distanceToBoundary) < minDistance) {
          minDistance = Math.abs(distanceToBoundary);
        }
      }
    });

    setDistance(Math.round(minDistance));
    setIsInside(inside);
  };

  const onPunch = async (type) => {
    setPunching(true);
    setStatus(null);
    
    const reading = coords || await get();
    if (!reading) {
      setPunching(false);
      return;
    }
    
    try {
      await api.post('/punch', {
        type,
        coords: {
          lat: reading.lat,
          lng: reading.lng,
          accuracy: reading.accuracy
        },
        permissionState: 'granted'
      });
      
      const typeLabel = type === 'in' ? 'Clock In' : type === 'out' ? 'Clock Out' : 'Break';
      setStatus({ ok: true, msg: `${typeLabel} recorded successfully ✅` });
      
      // Refresh geofences after punch
      fetchUserGeofences();
    } catch (err) {
      setStatus({ 
        ok: false, 
        msg: err.response?.data?.message || 'Failed to record punch' 
      });
    } finally {
      setPunching(false);
    }
  };

  return (
    <Layout title="Attendance">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Location Status Card */}
        <Card className={isInside ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">
              {isInside ? '✅ You are inside the work area' : '⚠️ You are outside the work area'}
            </h2>
            <button 
              onClick={get}
              disabled={loading}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              {loading ? '⏳ Updating...' : '🔄 Refresh Location'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Your Status</div>
              <div className="font-semibold text-sm">
                {isInside ? (
                  <span className="text-emerald-600">✅ Inside</span>
                ) : (
                  <span className="text-amber-600">⚠️ Outside</span>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Distance</div>
              <div className="font-semibold text-sm">
                {distance !== null ? (
                  isInside ? (
                    <span className="text-emerald-600">{distance}m inside</span>
                  ) : (
                    <span className="text-rose-600">{distance}m away</span>
                  )
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">GPS Accuracy</div>
              <div className="font-semibold text-sm">
                {coords ? (
                  <span className={coords.accuracy <= 50 ? 'text-emerald-600' : coords.accuracy <= 100 ? 'text-amber-600' : 'text-rose-600'}>
                    {Math.round(coords.accuracy)}m
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Can Punch</div>
              <div className="font-semibold text-sm">
                {isInside && coords && coords.accuracy <= 100 ? (
                  <span className="text-emerald-600">✅ Yes</span>
                ) : (
                  <span className="text-rose-600">❌ No</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-2 bg-rose-100 border border-rose-300 rounded-lg text-sm text-rose-700">
              ❌ {error}
            </div>
          )}
        </Card>

        {/* Map */}
        {coords && geofences.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-3">Your Location on Map</h3>
            <LiveMap userLocation={coords} geofences={geofences} />
            <div className="mt-3 flex items-start gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Your Location (blue marker)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50"></div>
                <span>GPS Accuracy Circle</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Allowed Work Area (green circle)</span>
              </div>
            </div>
          </Card>
        )}

        {/* Clock In/Out Card */}
        <Card>
          <h2 className="text-xl font-semibold mb-2">Clock In/Out</h2>
          <p className="text-sm text-slate-600 mb-4">
            You must be inside the green work area circle to clock in or out.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {loading && <Badge color="blue">⏳ Getting location...</Badge>}
            {coords && (
              <>
                <Badge color={coords.accuracy <= 50 ? 'green' : coords.accuracy <= 100 ? 'amber' : 'red'}>
                  📍 GPS: {Math.round(coords.accuracy)}m accuracy
                </Badge>
                {isInside ? (
                  <Badge color="green">✅ Inside work area</Badge>
                ) : (
                  <Badge color="red">⚠️ Outside work area - Move {distance}m closer</Badge>
                )}
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              onClick={() => onPunch('in')} 
              disabled={punching || loading || !isInside || (coords && coords.accuracy > 100)}
            >
              {punching ? '⏳' : '✅'} Clock In
            </Button>
            <Button 
              onClick={() => onPunch('break')} 
              disabled={punching || loading || !isInside || (coords && coords.accuracy > 100)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {punching ? '⏳' : '☕'} Break
            </Button>
            <Button 
              variant="secondary"
              onClick={() => onPunch('out')}
              disabled={punching || loading || !isInside || (coords && coords.accuracy > 100)}
              className="md:col-span-1 col-span-2"
            >
              {punching ? '⏳' : '🚪'} Clock Out
            </Button>
          </div>

          {!isInside && coords && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>⚠️ You are {distance}m away from the work area.</strong>
              <br />
              Please move closer to the mall entrance to clock in. The buttons will enable automatically when you're inside.
            </div>
          )}

          {coords && coords.accuracy > 100 && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              <strong>❌ GPS accuracy too low ({Math.round(coords.accuracy)}m)</strong>
              <br />
              Move to an area with better GPS signal (near windows/outdoors) or enable Wi-Fi for better accuracy.
            </div>
          )}
        </Card>
        
        {status && (
          <Card className={status.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}>
            <p className={`text-sm font-medium ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              {status.msg}
            </p>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How to Use</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Allow location permissions when prompted</li>
            <li>The map shows your location (blue) and work area (green circle)</li>
            <li>Move inside the green circle to enable clock buttons</li>
            <li>GPS accuracy must be under 100m for reliable punches</li>
            <li>If accuracy is poor, move near windows or enable Wi-Fi</li>
          </ol>
        </Card>
      </div>
    </Layout>
  );
}

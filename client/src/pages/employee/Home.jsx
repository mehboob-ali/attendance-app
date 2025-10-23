import { useState, useEffect } from "react";
import useGeolocation from "../../hooks/useGeolocation";
import api from "../../lib/api";
import Layout from "../../components/Layout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Current location button (bottom right)
function LocateButton({ onLocate }) {
  const map = useMap();

  useEffect(() => {
    const locateControl = L.control({ position: "bottomright" });

    locateControl.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
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

      L.DomEvent.on(div, "click", (e) => {
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

// Map component that centers on user when location updates
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      console.log("Centering map on:", center);
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);

  return null;
}

function LiveMap({ userLocation, geofences, onLocate }) {
  if (!userLocation) {
    return (
      <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">📍 Getting your location...</p>
          <button
            onClick={onLocate}
            className="text-sm text-brand-600 hover:text-brand-700 underline"
          >
            Click here if location doesn't load
          </button>
        </div>
      </div>
    );
  }

  if (geofences.length === 0) {
    return (
      <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          ⚠️ No work areas configured. Contact your admin.
        </p>
      </div>
    );
  }

  // Always use user's actual location as center (Leaflet expects [lat, lng])
  const center = [userLocation.lat, userLocation.lng];

  // Debug: Log coordinates to console
  console.log("Map coordinates:", {
    lat: userLocation.lat,
    lng: userLocation.lng,
    center: center,
    accuracy: userLocation.accuracy,
  });

  // Ensure coordinates are valid numbers
  if (isNaN(userLocation.lat) || isNaN(userLocation.lng)) {
    console.error("Invalid coordinates:", userLocation);
    return (
      <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">⚠️ Invalid location coordinates</p>
      </div>
    );
  }

  return (
    <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg">
      <MapContainer
        center={center}
        zoom={17}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          errorTileUrl="https://via.placeholder.com/256x256/cccccc/666666?text=Map+Loading..."
        />
        <ZoomControl position="topright" />
        <LocateButton onLocate={onLocate} />
        <MapUpdater center={center} />

        {/* User's current location */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <strong>Your Location</strong>
            <br />
            Accuracy: {Math.round(userLocation.accuracy)}m
          </Popup>
        </Marker>

        {/* User's accuracy circle */}
        <Circle
          center={center}
          radius={userLocation.accuracy}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            weight: 1,
            dashArray: "5, 5",
          }}
        />

        {/* Geofence boundaries */}
        {geofences.map((geo) => {
          if (geo.type === "circle" && geo.geometry?.coordinates) {
            return (
              <Circle
                key={geo._id}
                center={[
                  geo.geometry.coordinates[1],
                  geo.geometry.coordinates[0],
                ]}
                radius={geo.radiusMeters}
                pathOptions={{
                  color: "#16a34a",
                  fillColor: "#16a34a",
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{geo.name}</strong>
                  <br />
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
  const [canPunch, setCanPunch] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    fetchUserGeofences();
    get(); // Get location on mount
  }, []);

  useEffect(() => {
    if (coords && geofences.length > 0) {
      calculateDistance();
    }
  }, [coords, geofences]);

  // Track when location was last updated for user feedback
  useEffect(() => {
    if (coords) {
      setLastUpdated(new Date());
    }
  }, [coords]);

  const fetchUserGeofences = async () => {
    try {
      const { data } = await api.get("/employees/me/sites");
      setGeofences(data);
    } catch (err) {
      console.error("Failed to fetch geofences:", err);
    }
  };

  const calculateDistance = () => {
    if (!coords || geofences.length === 0) {
      setDistance(null);
      setIsInside(false);
      setCanPunch(false);
      return;
    }

    // Check accuracy first
    const hasGoodAccuracy = coords.accuracy <= 100;

    let minDistance = Infinity;
    let inside = false;

    geofences.forEach((geo) => {
      if (geo.type === "circle" && geo.geometry?.coordinates) {
        const [geoLng, geoLat] = geo.geometry.coordinates;
        const R = 6371e3; // Earth radius in meters
        const φ1 = (coords.lat * Math.PI) / 180;
        const φ2 = (geoLat * Math.PI) / 180;
        const Δφ = ((geoLat - coords.lat) * Math.PI) / 180;
        const Δλ = ((geoLng - coords.lng) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceToCenter = R * c;

        const distanceToBoundary = distanceToCenter - geo.radiusMeters;

        // NEW: Only consider "inside" if the GPS accuracy circle fits entirely within the geofence
        // This means: distance to center + GPS accuracy margin must be <= geofence radius
        if (distanceToCenter + coords.accuracy <= geo.radiusMeters) {
          inside = true;
        }

        if (Math.abs(distanceToBoundary) < minDistance) {
          minDistance = Math.abs(distanceToBoundary);
        }
      }
    });

    setDistance(Math.round(minDistance));
    setIsInside(inside);
    setCanPunch(inside && hasGoodAccuracy);
  };

  const handleLocate = () => {
    get({ forceFresh: true });
    setIsFresh(true);
    setTimeout(() => setIsFresh(false), 3000); // Clear fresh indicator after 3s
  };

  const handleHighAccuracy = () => {
    get({ highAccuracy: true });
    setIsFresh(true);
    setTimeout(() => setIsFresh(false), 5000); // Clear fresh indicator after 5s
  };

  const onPunch = async (type) => {
    setPunching(true);
    setStatus(null);

    const reading = coords || (await get());
    if (!reading) {
      setPunching(false);
      return;
    }

    try {
      await api.post("/punch", {
        type,
        coords: {
          lat: reading.lat,
          lng: reading.lng,
          accuracy: reading.accuracy,
        },
        permissionState: "granted",
      });

      const typeLabel = type === "in" ? "Clock In" : "Clock Out";
      setStatus({ ok: true, msg: `${typeLabel} recorded successfully ✅` });

      fetchUserGeofences();
    } catch (err) {
      setStatus({
        ok: false,
        msg: err.response?.data?.message || "Failed to record punch",
      });
    } finally {
      setPunching(false);
    }
  };

  // Determine status for display
  const getStatus = () => {
    if (!coords) return { color: "amber", text: "⏳ Getting location..." };
    if (coords.accuracy > 100)
      return { color: "amber", text: "⚠️ GPS accuracy too low" };
    if (isInside)
      return { color: "emerald", text: "✅ You are inside the work area" };
    return { color: "amber", text: "⚠️ You are outside the work area" };
  };

  const statusInfo = getStatus();

  return (
    <Layout title="Attendance">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Location Status Card */}
        <Card
          className={`bg-${statusInfo.color}-50 border-${statusInfo.color}-200`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{statusInfo.text}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleLocate}
                disabled={loading}
                className="text-sm px-3 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {loading ? "⏳ Updating..." : "🔄 Refresh"}
              </button>
              <button
                onClick={handleHighAccuracy}
                disabled={loading}
                className="text-sm px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? "⏳ Improving..." : "🎯 High Accuracy"}
              </button>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-slate-500 -mt-2 mb-2">
              Last updated at {lastUpdated.toLocaleTimeString()}
              {isFresh && (
                <span className="ml-1 text-emerald-600 font-medium">
                  (fresh)
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Your Status</div>
              <div className="font-semibold text-sm">
                {canPunch ? (
                  <span className="text-emerald-600">✅ Ready</span>
                ) : coords && coords.accuracy > 100 ? (
                  <span className="text-rose-600">❌ Poor GPS</span>
                ) : isInside ? (
                  <span className="text-amber-600">⚠️ GPS Low</span>
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
                  <span
                    className={
                      coords.accuracy <= 50
                        ? "text-emerald-600"
                        : coords.accuracy <= 100
                        ? "text-amber-600"
                        : "text-rose-600"
                    }
                  >
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
                {canPunch ? (
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
        <Card>
          <h3 className="text-lg font-semibold mb-3">Your Location on Map</h3>
          <LiveMap
            userLocation={coords}
            geofences={geofences}
            onLocate={handleLocate}
          />
          <div className="mt-3 flex flex-wrap items-start gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50"></div>
              <span>GPS Accuracy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Work Area</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📍 = Find Current Location</span>
            </div>
          </div>
        </Card>

        {/* Clock In/Out Card */}
        <Card>
          <h2 className="text-xl font-semibold mb-2">Clock In/Out</h2>
          <p className="text-sm text-slate-600 mb-4">
            You must be inside the green work area with good GPS accuracy to
            clock in or out.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onPunch("in")}
              disabled={punching || loading || !canPunch}
            >
              {punching ? "⏳" : "✅"} Clock In
            </Button>
            <Button
              variant="secondary"
              onClick={() => onPunch("out")}
              disabled={punching || loading || !canPunch}
            >
              {punching ? "⏳" : "🚪"} Clock Out
            </Button>
          </div>

          {/* Show accuracy warning if GPS is bad */}
          {coords && coords.accuracy > 100 && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              <strong>
                ❌ GPS accuracy too low: {Math.round(coords.accuracy)}m (Need
                ≤100m)
              </strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Enable Wi-Fi (helps location even without connection)</li>
                <li>Move near a window or outside</li>
                <li>Enable "High Accuracy" mode in phone settings</li>
                <li>Wait 10-30 seconds for GPS to stabilize</li>
              </ul>
            </div>
          )}

          {/* Show distance warning if accuracy is good but you're outside */}
          {coords &&
            coords.accuracy <= 100 &&
            !isInside &&
            distance !== null && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>⚠️ You are {distance}m away from the work area.</strong>
                <br />
                Please move closer. The green circle on the map shows where you
                need to be.
              </div>
            )}

          {/* Show success message when ready */}
          {canPunch && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              <strong>✅ All conditions met!</strong> You can now clock in/out.
            </div>
          )}
        </Card>

        {status && (
          <Card
            className={
              status.ok
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-200"
            }
          >
            <p
              className={`text-sm font-medium ${
                status.ok ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {status.msg}
            </p>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How to Use</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click 📍 button on map to center on your location</li>
            <li>GPS accuracy must be ≤100m (enable Wi-Fi for best results)</li>
            <li>You must be inside the green circle (work area)</li>
            <li>
              When both conditions are met, buttons will enable automatically
            </li>
            <li>Status cards above show exactly what you need to fix</li>
          </ol>
        </Card>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GeofenceEditor from '../../components/map/GeofenceEditor';

export default function Geofences() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'circle',
    lat: '',
    lng: '',
    radius: '100'
  });
  const [mapLocation, setMapLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      const { data } = await api.get('/geofences');
      setGeofences(data);
    } catch (err) {
      console.error('Failed to fetch geofences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapLocationChange = (location) => {
    setMapLocation(location);
    setFormData(prev => ({
      ...prev,
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      radius: location.radius.toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);
      const radius = parseInt(formData.radius);

      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        setError('Invalid coordinates or radius');
        return;
      }

      if (radius < 10 || radius > 5000) {
        setError('Radius must be between 10m and 5000m');
        return;
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
        },
        radiusMeters: radius,
        active: true
      };

      await api.post('/geofences', payload);
      setSuccess('Geofence created successfully!');
      setShowForm(false);
      setFormData({ name: '', type: 'circle', lat: '', lng: '', radius: '100' });
      setMapLocation(null);
      fetchGeofences();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create geofence');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;

    try {
      await api.delete(`/geofences/${id}`);
      setSuccess('Geofence deleted successfully!');
      fetchGeofences();
    } catch (err) {
      setError('Failed to delete geofence');
    }
  };

  const openFormWithLocation = () => {
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return <Layout title="Geofences"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Geofences">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="mb-4">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Create Geofence'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Geofence</h3>
          
          {/* Interactive Map Editor */}
          <div className="mb-6">
            <GeofenceEditor
              onLocationChange={handleMapLocationChange}
              initialRadius={parseInt(formData.radius) || 100}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Geofence Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mall Entrance A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="19.089340"
                  required
                  readOnly={!!mapLocation}
                  className={mapLocation ? 'bg-slate-100' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="72.878176"
                  required
                  readOnly={!!mapLocation}
                  className={mapLocation ? 'bg-slate-100' : ''}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Radius (meters) - Current: {formData.radius}m
              </label>
              <Input
                type="range"
                min="10"
                max="500"
                step="5"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
            </div>

            {!mapLocation && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ⚠️ <strong>Click on the map above</strong> to select a location, then drag to set the radius.
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={!formData.lat || !formData.lng}
            >
              Create Geofence
            </Button>
          </form>
        </Card>
      )}
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">Existing Geofences</h3>
        {geofences.length === 0 ? (
          <p className="text-slate-600">No geofences configured. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {geofences.map(fence => (
              <div key={fence._id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{fence.name}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                      {fence.type}
                    </span>
                  </div>
                  {fence.geometry?.coordinates && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>📍 {fence.geometry.coordinates[1]?.toFixed(6)}, {fence.geometry.coordinates[0]?.toFixed(6)}</p>
                      {fence.radiusMeters && (
                        <p>⭕ Radius: {fence.radiusMeters}m ({(fence.radiusMeters * 3.28084).toFixed(0)} feet)</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(fence._id)}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1 hover:bg-rose-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📍 Quick Reference Locations</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Mumbai Airport T2:</strong> Lat: 19.089340, Lng: 72.878176</p>
          <p><strong>Delhi Airport T3:</strong> Lat: 28.556160, Lng: 77.100280</p>
          <p><strong>Bangalore Airport:</strong> Lat: 13.198890, Lng: 77.705610</p>
        </div>
      </Card>
    </Layout>
  );
}

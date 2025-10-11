import { useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PreviewMap from '../../components/map/PreviewMap';

export default function Home() {
  const { loading, coords, error, get } = useGeolocation();
  const [status, setStatus] = useState(null);
  const [punching, setPunching] = useState(false);

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
      
      setStatus({ ok: true, msg: `${type.toUpperCase()} recorded successfully` });
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <h2 className="text-xl font-semibold mb-2">Clock In/Out</h2>
          <p className="text-sm text-slate-600 mb-4">
            Your location accuracy and distance must meet policy requirements.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {error && <Badge color="red">❌ {error}</Badge>}
            {coords && (
              <Badge color={coords.accuracy <= 100 ? 'green' : 'amber'}>
                📍 Accuracy: {Math.round(coords.accuracy)} m
              </Badge>
            )}
            {loading && <Badge color="blue">⏳ Getting location...</Badge>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => onPunch('in')} 
              disabled={punching || loading}
            >
              {punching ? '⏳' : '✅'} Clock In
            </Button>
            <Button 
              variant="secondary"
              onClick={() => onPunch('out')}
              disabled={punching || loading}
            >
              {punching ? '⏳' : '🚪'} Clock Out
            </Button>
          </div>
        </Card>
        
        {coords && (
          <PreviewMap 
            center={[coords.lat, coords.lng]}
            point={{ lat: coords.lat, lng: coords.lng }} 
            circleRadius={100} 
          />
        )}
        
        {status && (
          <Card className={status.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}>
            <p className={`text-sm font-medium ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              {status.msg}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

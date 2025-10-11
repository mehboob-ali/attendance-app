import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function History() {
  const [punches, setPunches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/punch/my');
      setPunches(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout title="History"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Punch History">
      <div className="max-w-4xl mx-auto">
        <Card>
          {punches.length === 0 ? (
            <p className="text-slate-600">No punch records yet.</p>
          ) : (
            <div className="space-y-4">
              {punches.map(punch => (
                <div key={punch._id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="font-medium capitalize">{punch.type}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(punch.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={punch.accuracy <= 100 ? 'green' : 'amber'}>
                      {Math.round(punch.accuracy)} m
                    </Badge>
                    <Badge color={
                      punch.status === 'approved' ? 'green' :
                      punch.status === 'denied' ? 'red' : 'amber'
                    }>
                      {punch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

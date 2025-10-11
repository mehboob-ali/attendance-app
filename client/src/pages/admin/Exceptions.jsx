import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      const { data } = await api.get('/exceptions');
      setExceptions(data);
    } catch (err) {
      console.error('Failed to fetch exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      await api.post(`/exceptions/${id}/decision`, { decision, comment: '' });
      fetchExceptions();
    } catch (err) {
      console.error('Failed to update exception:', err);
    }
  };

  if (loading) {
    return <Layout title="Exceptions"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Exceptions">
      <Card>
        {exceptions.length === 0 ? (
          <p className="text-slate-600">No pending exceptions.</p>
        ) : (
          <div className="space-y-4">
            {exceptions.map(ex => (
              <div key={ex._id} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{ex.userId?.name}</p>
                    <p className="text-sm text-slate-600">{ex.reason}</p>
                  </div>
                  <Badge color={
                    ex.decision === 'approved' ? 'green' :
                    ex.decision === 'denied' ? 'red' : 'amber'
                  }>
                    {ex.decision}
                  </Badge>
                </div>
                {ex.decision === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => handleDecision(ex._id, 'approved')}
                      className="h-8 text-sm"
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleDecision(ex._id, 'denied')}
                      className="h-8 text-sm bg-rose-600 hover:bg-rose-700"
                    >
                      Deny
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}

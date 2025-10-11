import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function Dashboard() {
  const [punches, setPunches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyReport();
  }, []);

  const fetchDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get('/reports/daily', { params: { date: today } });
      setPunches(data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout title="Dashboard"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Punches Today</div>
          <div className="text-3xl font-bold text-slate-900">{punches.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Employees</div>
          <div className="text-3xl font-bold text-slate-900">—</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Exceptions</div>
          <div className="text-3xl font-bold text-slate-900">—</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Avg Accuracy</div>
          <div className="text-3xl font-bold text-slate-900">—</div>
        </Card>
      </div>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">Today's Punches</h3>
        {punches.length === 0 ? (
          <p className="text-slate-600">No punches recorded today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Accuracy</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {punches.map(punch => (
                  <tr key={punch._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">{punch.userId?.name || 'Unknown'}</td>
                    <td className="py-3 pr-4 capitalize">{punch.type}</td>
                    <td className="py-3 pr-4">
                      {new Date(punch.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color={punch.accuracy <= 100 ? 'green' : 'amber'}>
                        {Math.round(punch.accuracy)} m
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color={
                        punch.status === 'approved' ? 'green' :
                        punch.status === 'denied' ? 'red' : 'amber'
                      }>
                        {punch.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}

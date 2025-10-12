import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function Dashboard() {
  const [punches, setPunches] = useState([]);
  const [stats, setStats] = useState({
    totalPunches: 0,
    uniqueEmployees: 0,
    pendingExceptions: 0,
    avgAccuracy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [punchRes, exceptionsRes] = await Promise.all([
        api.get('/reports/daily', { params: { date: today } }),
        api.get('/exceptions', { params: { status: 'pending' } })
      ]);
      
      const punchData = punchRes.data;
      setPunches(punchData);
      
      // Calculate stats
      const uniqueEmps = new Set(punchData.map(p => p.userId?._id)).size;
      const totalAcc = punchData.reduce((sum, p) => sum + (p.accuracy || 0), 0);
      const avgAcc = punchData.length > 0 ? totalAcc / punchData.length : 0;
      
      setStats({
        totalPunches: punchData.length,
        uniqueEmployees: uniqueEmps,
        pendingExceptions: exceptionsRes.data.length,
        avgAccuracy: Math.round(avgAcc)
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group punches by employee
  const employeeActivity = punches.reduce((acc, punch) => {
    const empId = punch.userId?._id;
    if (!empId) return acc;
    
    if (!acc[empId]) {
      acc[empId] = {
        name: punch.userId.name,
        email: punch.userId.email,
        clockIn: null,
        clockOut: null,
        status: 'absent'
      };
    }
    
    if (punch.type === 'in' && !acc[empId].clockIn) {
      acc[empId].clockIn = punch.timestamp;
      acc[empId].status = 'present';
    }
    if (punch.type === 'out') {
      acc[empId].clockOut = punch.timestamp;
    }
    
    return acc;
  }, {});

  const activityList = Object.values(employeeActivity);

  if (loading) {
    return <Layout title="Dashboard"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Punches Today</div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalPunches}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Active Employees</div>
          <div className="text-3xl font-bold text-brand-600">{stats.uniqueEmployees}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Pending Exceptions</div>
          <div className="text-3xl font-bold text-amber-600">{stats.pendingExceptions}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-500 mb-1">Avg Accuracy</div>
          <div className="text-3xl font-bold text-slate-900">{stats.avgAccuracy}m</div>
        </Card>
      </div>

      {/* Employee Activity */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Employee Activity Today</h3>
        {activityList.length === 0 ? (
          <p className="text-slate-600">No activity today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Clock In</th>
                  <th className="py-2 pr-4">Clock Out</th>
                  <th className="py-2 pr-4">Hours</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {activityList.map((emp, idx) => {
                  const hours = emp.clockIn && emp.clockOut
                    ? ((new Date(emp.clockOut) - new Date(emp.clockIn)) / (1000 * 60 * 60)).toFixed(2)
                    : '—';
                  
                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {emp.clockIn ? new Date(emp.clockIn).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {emp.clockOut ? new Date(emp.clockOut).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {hours !== '—' ? `${hours}h` : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={emp.status === 'present' ? 'green' : 'slate'}>
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Recent Punches */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Punches</h3>
        {punches.length === 0 ? (
          <p className="text-slate-600">No punches recorded today.</p>
        ) : (
          <div className="space-y-3">
            {punches.slice(0, 10).map(punch => (
              <div key={punch._id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium">{punch.userId?.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-600">
                    <span className="capitalize font-medium">{punch.type}</span> • {new Date(punch.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={punch.accuracy <= 100 ? 'green' : 'amber'}>
                    {Math.round(punch.accuracy)}m
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
    </Layout>
  );
}

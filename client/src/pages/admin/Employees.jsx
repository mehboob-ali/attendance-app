import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout title="Employees"><p>Loading...</p></Layout>;
  }

  return (
    <Layout title="Employees">
      <Card>
        {employees.length === 0 ? (
          <p className="text-slate-600">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Assigned Sites</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">{emp.name}</td>
                    <td className="py-3 pr-4">{emp.email}</td>
                    <td className="py-3 pr-4">
                      {emp.sites?.map(s => s.name).join(', ') || 'None'}
                    </td>
                    <td className="py-3 pr-4">
                      <button className="text-sm text-brand-600 hover:text-brand-700">
                        Assign Sites
                      </button>
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

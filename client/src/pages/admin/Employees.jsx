import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, geoRes] = await Promise.all([
        api.get('/employees'),
        api.get('/geofences')
      ]);
      
      console.log('Employees loaded:', empRes.data);
      console.log('Geofences loaded:', geoRes.data);
      
      setEmployees(empRes.data);
      setGeofences(geoRes.data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (employee) => {
    console.log('Opening modal for employee:', employee);
    setSelectedEmployee(employee);
    
    // Extract site IDs from the employee's sites array
    const siteIds = employee.sites?.map(s => {
      // Handle both populated and unpopulated sites
      return typeof s === 'string' ? s : (s._id || s);
    }) || [];
    
    console.log('Pre-selected sites:', siteIds);
    setSelectedSites(siteIds);
    setError('');
    setSuccess('');
  };

  const handleSiteToggle = (siteId) => {
    setSelectedSites(prev => {
      const newSelection = prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId];
      console.log('Sites selection changed:', newSelection);
      return newSelection;
    });
  };

  const handleAssignSites = async () => {
    if (!selectedEmployee) {
      setError('No employee selected');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Assigning sites:', { 
        employeeId: selectedEmployee._id, 
        sites: selectedSites 
      });

      const response = await api.put(`/employees/${selectedEmployee._id}/sites`, { 
        sites: selectedSites 
      });
      
      console.log('Assignment successful:', response.data);
      
      setSuccess(`Sites assigned successfully to ${selectedEmployee.name}!`);
      setSelectedEmployee(null);
      setSelectedSites([]);
      
      // Refresh the employee list
      await fetchData();
    } catch (err) {
      console.error('Assignment error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign sites';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Employees">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading employees...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Employees">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✅ {success}
        </div>
      )}

      <Card>
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">No employees found.</p>
            <p className="text-sm text-slate-500">Run the seed script to create demo employees.</p>
          </div>
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
                    <td className="py-3 pr-4 font-medium">{emp.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{emp.email}</td>
                    <td className="py-3 pr-4">
                      {emp.sites && emp.sites.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {emp.sites.map((s, idx) => (
                            <Badge key={s._id || s || idx} color="blue">
                              {s.name || 'Unknown Site'}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No sites assigned</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <button 
                        onClick={() => openAssignModal(emp)}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium hover:bg-brand-50 px-3 py-1 rounded transition-colors"
                      >
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

      {/* Assignment Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Assign Sites to {selectedEmployee.name}
            </h3>
            
            {geofences.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-600 text-sm mb-4">
                  ⚠️ No geofences available. Create geofences first.
                </p>
                <Button onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {geofences.map(geo => (
                    <label 
                      key={geo._id} 
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSites.includes(geo._id)}
                        onChange={() => handleSiteToggle(geo._id)}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{geo.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {geo.type} • {geo.radiusMeters}m radius
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAssignSites}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Saving...' : `Save (${selectedSites.length} selected)`}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => setSelectedEmployee(null)}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </Layout>
  );
}

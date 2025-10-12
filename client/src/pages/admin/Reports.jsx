import { useState } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadCSV = async () => {
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = { startDate };
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/reports/export', { params });
      
      // Convert to CSV
      const headers = ['Employee', 'Email', 'Type', 'Date', 'Time', 'Accuracy (m)', 'Status'];
      const rows = data.map(punch => [
        punch.userId?.name || 'Unknown',
        punch.userId?.email || '',
        punch.type.toUpperCase(),
        new Date(punch.timestamp).toLocaleDateString(),
        new Date(punch.timestamp).toLocaleTimeString(),
        Math.round(punch.accuracy),
        punch.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${startDate}_${endDate || startDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const quickExport = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <Layout title="Reports">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Export Attendance Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        </div>

        <Button 
          onClick={downloadCSV} 
          disabled={loading || !startDate}
          className="w-full mb-4"
        >
          {loading ? '⏳ Generating...' : '📊 Download CSV'}
        </Button>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">Quick Export:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => quickExport(0)}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => quickExport(7)}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => quickExport(30)}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ CSV Format</h4>
        <p className="text-sm text-blue-800">
          The exported CSV includes: Employee Name, Email, Punch Type (IN/OUT/BREAK), 
          Date, Time, Location Accuracy, and Approval Status.
        </p>
      </Card>
    </Layout>
  );
}

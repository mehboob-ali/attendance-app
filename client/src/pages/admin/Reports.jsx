import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Reports() {
  return (
    <Layout title="Reports">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Export Reports</h3>
          <Button>📊 Export CSV</Button>
        </div>
        <p className="text-slate-600">
          Export functionality will be available here.
        </p>
      </Card>
    </Layout>
  );
}

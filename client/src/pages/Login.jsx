import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import { setSession } from '../lib/auth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // Can be email or mobile
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  const registered = params.get('registered');

  useEffect(() => {
    if (registered === 'true') {
      // Show success message if just registered
      setError(''); // Clear any errors
    }
  }, [registered]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Detect if identifier is mobile (10 digits) or email
      const isMobile = /^[0-9]{10}$/.test(identifier);
      
      const payload = {
        password,
        ...(isMobile ? { mobileNumber: identifier } : { email: identifier })
      };

      const { data } = await api.post('/auth/login', payload);
      setSession(data.token, data.user);

      const safeNext = next && next.startsWith('/') ? next : null;
      if (safeNext) {
        navigate(safeNext, { replace: true });
      } else if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {registered === 'true' && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            <strong>✓ Registration Successful!</strong>
            <p className="mt-1">Your account is pending admin approval. You'll be able to login once approved.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email or Mobile Number
            </label>
            <Input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="admin@attendance.com or 9876543210"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email or 10-digit mobile number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* New Employee Signup Link */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-slate-600 mb-3">
            New employee? Register your account
          </p>
          <Link to="/signup">
            <Button variant="secondary" className="w-full">
              Create Employee Account
            </Button>
          </Link>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <p className="font-medium mb-1">Demo Accounts</p>
          <p>Admin: admin@attendance.com / admin123</p>
          <p>Employee: employee@attendance.com / employee123</p>
        </div>
      </Card>
    </div>
  );
}

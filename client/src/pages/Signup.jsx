import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Signup() {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format mobile number (only digits)
    if (name === 'mobileNumber') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    // Check age (18+)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setError('You must be at least 18 years old to register');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const response = await api.post('/auth/employee-signup', dataToSend);
      
      setSuccess(response.data.message);
      
      // Clear form
      setFormData({
        mobileNumber: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        password: '',
        confirmPassword: ''
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?registered=true');
      }, 3000);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate max date (18 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Employee Registration</h1>
          <p className="text-slate-600 mt-2">Join our attendance tracking system</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <strong>Success!</strong>
            </div>
            <p className="text-sm">{success}</p>
            <p className="text-sm mt-2">Redirecting to login page...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              placeholder="10-digit mobile number"
              maxLength={10}
              disabled={loading || !!success}
              className="font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter your 10-digit mobile number (e.g., 9876543210)
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                First Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
                disabled={loading || !!success}
                minLength={2}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Middle Name
              </label>
              <Input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Optional"
                disabled={loading || !!success}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
                disabled={loading || !!success}
                minLength={2}
                maxLength={50}
              />
            </div>
          </div>

          {/* Gender and DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input w-full"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                max={maxDateString}
                disabled={loading || !!success}
              />
              <p className="text-xs text-slate-500 mt-1">You must be 18 or older</p>
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
                minLength={6}
                disabled={loading || !!success}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter password"
                minLength={6}
                disabled={loading || !!success}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading || !!success} 
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registering...
              </span>
            ) : (
              'Register for Account'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium hover:underline">
              Login here
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 mb-2">📝 Registration Process</p>
              <ol className="list-decimal list-inside space-y-1.5 text-blue-800 ml-1">
                <li>Complete this form with your accurate details</li>
                <li>Your registration will be sent to the admin for verification</li>
                <li>Admin will review and approve your account</li>
                <li>You'll receive confirmation within 24-48 hours</li>
                <li>Once approved, you can login and start using the system</li>
              </ol>
              <p className="mt-3 text-xs text-blue-700">
                <strong>Note:</strong> You cannot login until your account is approved by an administrator.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

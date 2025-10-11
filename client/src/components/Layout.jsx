import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../lib/auth';

export default function Layout({ children, title }) {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const navLinks = user?.role === 'admin' ? [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/geofences', label: 'Geofences' },
    { to: '/admin/employees', label: 'Employees' },
    { to: '/admin/exceptions', label: 'Exceptions' },
    { to: '/admin/reports', label: 'Reports' }
  ] : [
    { to: '/employee', label: 'Home' },
    { to: '/employee/history', label: 'History' },
    { to: '/employee/exceptions', label: 'Exceptions' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-slate-900">Attendance System</h1>
              <div className="hidden md:flex gap-4">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        {children}
      </main>
    </div>
  );
}

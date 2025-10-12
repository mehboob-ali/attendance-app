import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx'; // NEW
import EmployeeHome from './pages/employee/Home.jsx';
import EmployeeHistory from './pages/employee/History.jsx';
import EmployeeExceptions from './pages/employee/Exceptions.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminGeofences from './pages/admin/Geofences.jsx';
import AdminEmployees from './pages/admin/Employees.jsx';
import AdminExceptions from './pages/admin/Exceptions.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> {/* NEW */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Employee routes */}
      <Route path="/employee" element={<ProtectedRoute role="employee"><EmployeeHome /></ProtectedRoute>} />
      <Route path="/employee/history" element={<ProtectedRoute role="employee"><EmployeeHistory /></ProtectedRoute>} />
      <Route path="/employee/exceptions" element={<ProtectedRoute role="employee"><EmployeeExceptions /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/geofences" element={<ProtectedRoute role="admin"><AdminGeofences /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute role="admin"><AdminEmployees /></ProtectedRoute>} />
      <Route path="/admin/exceptions" element={<ProtectedRoute role="admin"><AdminExceptions /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
    </Routes>
  );
}

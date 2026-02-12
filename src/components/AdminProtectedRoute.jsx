import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

  console.debug('AdminProtectedRoute check:', { tokenExists: !!token, admin });

  if (!token || admin.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

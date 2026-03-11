import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  let admin = {};
  try {
    admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
  } catch {
    admin = {};
  }

  const rawRole = admin.role || admin.user_role || admin.userType || admin.type || '';
  const role = String(rawRole).toLowerCase().replace(/[_\s-]/g, '');
  const allowedRoles = ['admin', 'superadmin'];
  const hasAllowedRole = !role || allowedRoles.includes(role);

  console.debug('AdminProtectedRoute check:', { tokenExists: !!token, role });

  if (!token || !hasAllowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

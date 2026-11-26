import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', marginTop: '100px' }}>
        <h1 style={{ color: '#dc3545' }}>⛔ Cảnh báo vi phạm đặc quyền</h1>
        <p style={{ fontSize: '18px' }}>
          Tài khoản <strong>{user.email}</strong> (Role ID: {user.roleId}) không được cấp phép truy cập khu vực này.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{ padding: '8px 16px', marginTop: '20px', cursor: 'pointer' }}
        >
          Quay lại trang trước
        </button>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

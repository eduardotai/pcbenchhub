import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="surface-muted flex items-center gap-3 px-5 py-3">
          <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-sky-200/35 border-t-sky-300" />
          <span className="text-sm text-muted">Loading secure area...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}


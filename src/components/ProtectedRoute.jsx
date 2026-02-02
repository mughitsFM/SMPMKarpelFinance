import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../auth-firebase.js';

/**
 * Protected Route Component
 * Melindungi route yang hanya bisa diakses oleh user yang sudah login
 */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect ke login jika belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render children jika sudah login
  return children;
}

export default ProtectedRoute;

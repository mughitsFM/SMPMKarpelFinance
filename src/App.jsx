import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import Riwayat from './pages/Riwayat';
import ReviewBulanan from './pages/ReviewBulanan';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { onAuthChange, logoutUser, getUserInfo } from '../auth-firebase.js';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe ke auth state changes
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const confirm = window.confirm('Yakin ingin logout?');
    if (!confirm) return;
    
    try {
      await logoutUser();
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('Error logout:', error);
      alert('Gagal logout: ' + error.message);
    }
  };

  // Jangan render navigation di halaman login
  const isLoginPage = location.pathname === '/login';

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!isLoginPage && user && (
        <nav className="navigation">
          <div className="nav-header">
            <div className="nav-logo">
              <span className="logo-icon">💰</span>
              <span className="logo-text">Keuangan</span>
            </div>
            <div className="nav-user">
              <span className="user-icon">👤</span>
              <span className="user-name">{user.displayName}</span>
            </div>
          </div>

          <ul className="nav-menu">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/input-data" 
                className={`nav-link ${location.pathname === '/input-data' ? 'active' : ''}`}
              >
                <span className="nav-icon">➕</span>
                <span className="nav-text">Input Data</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/riwayat" 
                className={`nav-link ${location.pathname === '/riwayat' ? 'active' : ''}`}
              >
                <span className="nav-icon">📜</span>
                <span className="nav-text">Riwayat</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/review-bulanan" 
                className={`nav-link ${location.pathname === '/review-bulanan' ? 'active' : ''}`}
              >
                <span className="nav-icon">📈</span>
                <span className="nav-text">Review Bulanan</span>
              </Link>
            </li>
          </ul>

          <div className="nav-footer">
            <button onClick={handleLogout} className="btn-logout">
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </nav>
      )}

      <main className={`main-content ${!isLoginPage && user ? 'with-nav' : 'no-nav'}`}>
        <Routes>
          {/* Public Route - Login */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <Login />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/input-data" 
            element={
              <ProtectedRoute>
                <InputData />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/riwayat" 
            element={
              <ProtectedRoute>
                <Riwayat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/review-bulanan" 
            element={
              <ProtectedRoute>
                <ReviewBulanan />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to login or dashboard */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/" : "/login"} replace />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

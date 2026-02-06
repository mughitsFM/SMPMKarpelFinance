import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import InputData from './pages/InputData.jsx';
import Riwayat from './pages/Riwayat.jsx';
import ReviewBulanan from './pages/ReviewBulanan.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import WaitingActivation from './pages/WaitingActivation.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PopUp_SetSaldoAwal from './components/PopUp_SetSaldoAwal.jsx';
import { onAuthChange, logoutUser } from '../auth-firebase.js';
import { cekStatusSaldoAwal } from '../manajemen-keuangan.js';
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
  const [showPopupSaldoAwal, setShowPopupSaldoAwal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe ke auth state changes
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Cek apakah perlu menampilkan popup saldo awal
      if (currentUser && currentUser.statusAktif) {
        checkSaldoAwal(currentUser);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const checkSaldoAwal = async (currentUser) => {
    try {
      const status = await cekStatusSaldoAwal();
      if (!status.sudahDiSet) {
        setShowPopupSaldoAwal(true);
      }
    } catch (error) {
      console.error('Error checking saldo awal:', error);
    }
  };

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

  const handleSaldoAwalBerhasil = () => {
    setShowPopupSaldoAwal(false);
    // Refresh user data
    checkSaldoAwal(user);
  };

  // Jangan render navigation di halaman login, register, dan waiting activation
  const publicPages = ['/login', '/register', '/waiting-activation'];
  const isPublicPage = publicPages.includes(location.pathname);

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
      {!isPublicPage && user && (
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

      <main className={`main-content ${!isPublicPage && user ? 'with-nav' : 'no-nav'}`}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/" replace /> : <Register />
            } 
          />
          <Route 
            path="/waiting-activation" 
            element={<WaitingActivation />} 
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

      {/* Popup Saldo Awal */}
      {showPopupSaldoAwal && user && (
        <PopUp_SetSaldoAwal
          onTutup={() => setShowPopupSaldoAwal(false)}
          onBerhasil={handleSaldoAwalBerhasil}
        />
      )}
    </div>
  );
}

export default App;

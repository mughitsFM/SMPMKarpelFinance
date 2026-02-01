import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import Riwayat from './pages/Riwayat';
import ReviewBulanan from './pages/ReviewBulanan';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input-data" element={<InputData />} />
            <Route path="/riwayat" element={<Riwayat />} />
            <Route path="/review-bulanan" element={<ReviewBulanan />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Navigation() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/input-data', label: 'Input Data', icon: '➕' },
    { path: '/riwayat', label: 'Riwayat', icon: '📋' },
    { path: '/review-bulanan', label: 'Review Bulanan', icon: '📈' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">💰 Keuangan</h1>
      </div>
      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default App;

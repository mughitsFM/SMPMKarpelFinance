import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ambilDataDashboard, ambilDataGrafik } from '../../manajemen-keuangan';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [dataDashboard, setDataDashboard] = useState(null);
  const [dataGrafik, setDataGrafik] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    muatDataDashboard();
  }, []);

  const muatDataDashboard = async () => {
    try {
      setSedangMemuat(true);
      setError(null);
      
      const [dashboard, grafik] = await Promise.all([
        ambilDataDashboard(),
        ambilDataGrafik()
      ]);

      setDataDashboard(dashboard);
      setDataGrafik(grafik);
    } catch (err) {
      setError(err.message);
      console.error('Error memuat data dashboard:', err);
    } finally {
      setSedangMemuat(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatRupiahSingkat = (angka) => {
    if (angka >= 1000000000) {
      return `Rp ${(angka / 1000000000).toFixed(1)}M`;
    } else if (angka >= 1000000) {
      return `Rp ${(angka / 1000000).toFixed(1)}Jt`;
    } else if (angka >= 1000) {
      return `Rp ${(angka / 1000).toFixed(0)}Rb`;
    }
    return formatRupiah(angka);
  };

  const handleKlikBulanIni = () => {
    if (dataDashboard?.bulanIni) {
      navigate('/review-bulanan', {
        state: {
          bulan: dataDashboard.bulanIni.bulan,
          tahun: dataDashboard.bulanIni.tahun
        }
      });
    }
  };

  if (sedangMemuat) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h3>❌ Terjadi Kesalahan</h3>
          <p>{error}</p>
          <button onClick={muatDataDashboard} className="btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard Keuangan</h1>
        <p className="subtitle">Ringkasan keuangan Anda</p>
      </header>

      {/* Total Keseluruhan */}
      <section className="total-section">
        <div className="card card-total">
          <div className="card-icon pemasukan-icon">💰</div>
          <div className="card-content">
            <h3>Total Pemasukan</h3>
            <p className="amount pemasukan-amount">
              {formatRupiah(dataDashboard?.totalKeseluruhan?.totalPemasukan || 0)}
            </p>
          </div>
        </div>

        <div className="card card-total">
          <div className="card-icon pengeluaran-icon">💸</div>
          <div className="card-content">
            <h3>Total Pengeluaran</h3>
            <p className="amount pengeluaran-amount">
              {formatRupiah(dataDashboard?.totalKeseluruhan?.totalPengeluaran || 0)}
            </p>
          </div>
        </div>

        <div className="card card-total">
          <div className={`card-icon ${dataDashboard?.totalKeseluruhan?.saldo >= 0 ? 'saldo-positif-icon' : 'saldo-negatif-icon'}`}>
            {dataDashboard?.totalKeseluruhan?.saldo >= 0 ? '✅' : '⚠️'}
          </div>
          <div className="card-content">
            <h3>Saldo</h3>
            <p className={`amount ${dataDashboard?.totalKeseluruhan?.saldo >= 0 ? 'saldo-positif' : 'saldo-negatif'}`}>
              {formatRupiah(dataDashboard?.totalKeseluruhan?.saldo || 0)}
            </p>
          </div>
        </div>
      </section>

      {/* Bulan Berjalan */}
      <section className="bulan-section">
        <div className="section-header">
          <h2>
            Bulan {namaBulan[dataDashboard?.bulanIni?.bulan - 1]} {dataDashboard?.bulanIni?.tahun}
          </h2>
          <button onClick={handleKlikBulanIni} className="btn-secondary">
            Lihat Detail →
          </button>
        </div>

        <div className="bulan-cards">
          <div className="card card-bulan" onClick={handleKlikBulanIni}>
            <h3>📈 Pemasukan Bulan Ini</h3>
            <p className="bulan-amount pemasukan-amount">
              {formatRupiah(dataDashboard?.bulanIni?.pemasukan?.totalKeseluruhan || 0)}
            </p>
            <div className="kategori-list">
              {dataDashboard?.bulanIni?.pemasukan?.kategoriList?.slice(0, 3).map((item, index) => (
                <div key={index} className="kategori-item">
                  <span>{item.namaKategori}</span>
                  <span>{formatRupiahSingkat(item.jumlahTotal)}</span>
                </div>
              ))}
              {dataDashboard?.bulanIni?.pemasukan?.kategoriList?.length > 3 && (
                <p className="more-text">+{dataDashboard.bulanIni.pemasukan.kategoriList.length - 3} kategori lainnya</p>
              )}
            </div>
          </div>

          <div className="card card-bulan" onClick={handleKlikBulanIni}>
            <h3>📉 Pengeluaran Bulan Ini</h3>
            <p className="bulan-amount pengeluaran-amount">
              {formatRupiah(dataDashboard?.bulanIni?.pengeluaran?.totalKeseluruhan || 0)}
            </p>
            <div className="kategori-list">
              {dataDashboard?.bulanIni?.pengeluaran?.kategoriList?.slice(0, 3).map((item, index) => (
                <div key={index} className="kategori-item">
                  <span>{item.namaKategori}</span>
                  <span>{formatRupiahSingkat(item.jumlahTotal)}</span>
                </div>
              ))}
              {dataDashboard?.bulanIni?.pengeluaran?.kategoriList?.length > 3 && (
                <p className="more-text">+{dataDashboard.bulanIni.pengeluaran.kategoriList.length - 3} kategori lainnya</p>
              )}
            </div>
          </div>

          <div className="card card-bulan card-saldo">
            <h3>💵 Saldo Bulan Ini</h3>
            <p className={`bulan-amount ${dataDashboard?.bulanIni?.saldo >= 0 ? 'saldo-positif' : 'saldo-negatif'}`}>
              {formatRupiah(dataDashboard?.bulanIni?.saldo || 0)}
            </p>
            <p className={`status-text ${dataDashboard?.bulanIni?.saldo >= 0 ? 'status-positif' : 'status-negatif'}`}>
              {dataDashboard?.bulanIni?.saldo >= 0 ? '✓ Surplus' : '✗ Defisit'}
            </p>
          </div>
        </div>
      </section>

      {/* Grafik */}
      <section className="grafik-section">
        <h2>Tren Keuangan (6 Bulan Terakhir)</h2>
        
        <div className="grafik-container">
          <div className="card">
            <h3>Grafik Garis - Pemasukan vs Pengeluaran</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataGrafik}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={formatRupiahSingkat} />
                <Tooltip 
                  formatter={(value) => formatRupiah(value)}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pemasukan" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  name="Pemasukan"
                />
                <Line 
                  type="monotone" 
                  dataKey="pengeluaran" 
                  stroke="#f44336" 
                  strokeWidth={2}
                  name="Pengeluaran"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Grafik Batang - Perbandingan Bulanan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataGrafik}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={formatRupiahSingkat} />
                <Tooltip 
                  formatter={(value) => formatRupiah(value)}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Bar dataKey="pemasukan" fill="#4CAF50" name="Pemasukan" />
                <Bar dataKey="pengeluaran" fill="#f44336" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

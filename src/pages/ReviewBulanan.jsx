import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { reviewPemasukanPengeluaranBulanan } from '../../manajemen-keuangan.js';
import { exportKeExcel } from '../../fungsi-tambahan-be.js';
import '../styles/ReviewBulanan.css';

function ReviewBulanan() {
  const location = useLocation();
  const sekarang = new Date();
  
  // Ambil bulan dan tahun dari state navigation atau gunakan bulan sekarang
  const [bulan, setBulan] = useState(
    location.state?.bulan || sekarang.getMonth() + 1
  );
  const [tahun, setTahun] = useState(
    location.state?.tahun || sekarang.getFullYear()
  );

  const [dataReview, setDataReview] = useState(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangExport, setSedangExport] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    muatDataReview();
  }, [bulan, tahun]);

  const muatDataReview = async () => {
    try {
      setSedangMemuat(true);
      setError(null);
      const data = await reviewPemasukanPengeluaranBulanan(bulan, tahun);
      setDataReview(data);
    } catch (err) {
      setError(err.message);
      console.error('Error memuat review bulanan:', err);
    } finally {
      setSedangMemuat(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setSedangExport(true);
      await exportKeExcel(bulan, tahun);
      alert('File Excel berhasil didownload!');
    } catch (error) {
      console.error('Error export excel:', error);
      alert('Gagal export ke Excel: ' + error.message);
    } finally {
      setSedangExport(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate opsi tahun (5 tahun ke belakang dan 1 tahun ke depan)
  const tahunSekarang = new Date().getFullYear();
  const daftarTahun = Array.from({ length: 7 }, (_, i) => tahunSekarang - 5 + i);

  if (sedangMemuat) {
    return (
      <div className="review-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <div className="error-state">
          <h3>❌ Terjadi Kesalahan</h3>
          <p>{error}</p>
          <button onClick={muatDataReview} className="btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <header className="review-header">
        <div>
          <h1>Review Bulanan</h1>
          <p className="subtitle">Ringkasan pemasukan dan pengeluaran per bulan</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={sedangExport}
          className="btn-export"
        >
          {sedangExport ? (
            <>
              <span className="spinner-small"></span>
              Mengexport...
            </>
          ) : (
            <>
              <span className="icon">📥</span>
              Export ke Excel
            </>
          )}
        </button>
      </header>

      {/* Filter Bulan dan Tahun */}
      <section className="filter-section">
        <div className="filter-group">
          <label htmlFor="filter-bulan">Bulan:</label>
          <select
            id="filter-bulan"
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="select-filter"
          >
            {namaBulan.map((nama, index) => (
              <option key={index} value={index + 1}>
                {nama}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-tahun">Tahun:</label>
          <select
            id="filter-tahun"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="select-filter"
          >
            {daftarTahun.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Ringkasan */}
      <section className="ringkasan-section">
        <div className="card card-ringkasan pemasukan-card">
          <div className="card-header">
            <h3>💰 Total Pemasukan</h3>
          </div>
          <p className="amount-large pemasukan-amount">
            {formatRupiah(dataReview?.pemasukan?.totalKeseluruhan || 0)}
          </p>
        </div>

        <div className="card card-ringkasan pengeluaran-card">
          <div className="card-header">
            <h3>💸 Total Pengeluaran</h3>
          </div>
          <p className="amount-large pengeluaran-amount">
            {formatRupiah(dataReview?.pengeluaran?.totalKeseluruhan || 0)}
          </p>
        </div>

        <div className={`card card-ringkasan ${dataReview?.saldo >= 0 ? 'saldo-positif-card' : 'saldo-negatif-card'}`}>
          <div className="card-header">
            <h3>💵 Saldo</h3>
          </div>
          <p className={`amount-large ${dataReview?.saldo >= 0 ? 'saldo-positif' : 'saldo-negatif'}`}>
            {formatRupiah(dataReview?.saldo || 0)}
          </p>
          <p className={`status-badge ${dataReview?.saldo >= 0 ? 'badge-positif' : 'badge-negatif'}`}>
            {dataReview?.saldo >= 0 ? '✓ Surplus' : '✗ Defisit'}
          </p>
        </div>
      </section>

      {/* Tabel Detail */}
      <div className="tabel-section">
        {/* Tabel Pemasukan */}
        <div className="card">
          <div className="tabel-header">
            <h2>📈 Detail Pemasukan</h2>
          </div>
          {dataReview?.pemasukan?.kategoriList?.length > 0 ? (
            <div className="tabel-wrapper">
              <table className="tabel-review">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kategori</th>
                    <th className="text-right">Total Nominal</th>
                    <th className="text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {dataReview.pemasukan.kategoriList.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="kategori-cell">{item.namaKategori}</td>
                      <td className="text-right amount-cell">
                        {formatRupiah(item.jumlahTotal)}
                      </td>
                      <td className="text-right">
                        {((item.jumlahTotal / dataReview.pemasukan.totalKeseluruhan) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="2"><strong>TOTAL PEMASUKAN</strong></td>
                    <td className="text-right">
                      <strong>{formatRupiah(dataReview.pemasukan.totalKeseluruhan)}</strong>
                    </td>
                    <td className="text-right">
                      <strong>100%</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-table">
              <p>Tidak ada data pemasukan untuk periode ini</p>
            </div>
          )}
        </div>

        {/* Tabel Pengeluaran */}
        <div className="card">
          <div className="tabel-header">
            <h2>📉 Detail Pengeluaran</h2>
          </div>
          {dataReview?.pengeluaran?.kategoriList?.length > 0 ? (
            <div className="tabel-wrapper">
              <table className="tabel-review">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kategori</th>
                    <th className="text-right">Total Nominal</th>
                    <th className="text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {dataReview.pengeluaran.kategoriList.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="kategori-cell">{item.namaKategori}</td>
                      <td className="text-right amount-cell">
                        {formatRupiah(item.jumlahTotal)}
                      </td>
                      <td className="text-right">
                        {((item.jumlahTotal / dataReview.pengeluaran.totalKeseluruhan) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="2"><strong>TOTAL PENGELUARAN</strong></td>
                    <td className="text-right">
                      <strong>{formatRupiah(dataReview.pengeluaran.totalKeseluruhan)}</strong>
                    </td>
                    <td className="text-right">
                      <strong>100%</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-table">
              <p>Tidak ada data pengeluaran untuk periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewBulanan;

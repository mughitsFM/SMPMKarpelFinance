import { useState } from 'react';
import { setSaldoAwal } from '../../manajemen-keuangan.js';
import './PopUp.css';

function PopUp_SetSaldoAwal({ onTutup, onBerhasil }) {
  const [saldoAwal, setSaldoAwalValue] = useState(0);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatTanggalIndonesia = (tanggalStr) => {
    const date = new Date(tanggalStr);
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi saldo tidak boleh negatif
    if (saldoAwal < 0) {
      alert('Saldo awal tidak boleh negatif!');
      return;
    }

    // Validasi tanggal tidak boleh kosong
    if (!tanggal) {
      alert('Tanggal harus diisi!');
      return;
    }

    try {
      setSedangMenyimpan(true);
      await setSaldoAwal(saldoAwal, tanggal);
      alert('Saldo awal berhasil diset dan tercatat di riwayat pemasukan!');
      onBerhasil();
      onTutup();
    } catch (error) {
      console.error('Error set saldo awal:', error);
      alert('Gagal set saldo awal: ' + error.message);
    } finally {
      setSedangMenyimpan(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setSaldoAwalValue(value ? parseInt(value) : 0);
  };

  return (
    <div className="popup-overlay" onClick={onTutup}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>🎯 Tetapkan Saldo Awal</h2>
          <button onClick={onTutup} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="info-box-saldo">
            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div className="info-text">
              <p><strong>Selamat Datang!</strong></p>
              <p>Tetapkan saldo awal Anda untuk memulai pencatatan keuangan. Saldo awal akan tercatat sebagai pemasukan pada tanggal yang Anda pilih dan akan muncul di riwayat transaksi.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tanggal" className="form-label-required">
              Tanggal Saldo Awal
            </label>
            <div className="input-icon-wrapper">
              <svg className="input-icon-calendar" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
              </svg>
              <input
                type="date"
                id="tanggal"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="form-control input-with-icon"
                required
              />
            </div>
            <small className="form-hint">Pilih tanggal ketika saldo awal ini dicatat</small>
          </div>

          <div className="form-group">
            <label htmlFor="saldoAwal" className="form-label-required">
              Jumlah Saldo Awal
            </label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="text"
                id="saldoAwal"
                value={saldoAwal === 0 ? '' : saldoAwal.toLocaleString('id-ID')}
                onChange={handleInputChange}
                placeholder="0"
                className="form-control currency-input"
              />
            </div>
            <small className="form-hint">Ketik "0" jika ingin memulai dari nol</small>
          </div>

          <div className="preview-saldo-wrapper">
            <div className="preview-saldo">
              <div className="preview-label">Preview Saldo Awal:</div>
              <div className="preview-amount">{formatRupiah(saldoAwal)}</div>
            </div>
            
            <div className="preview-info">
              <div className="preview-info-row">
                <span className="preview-info-label">📅 Tanggal:</span>
                <span className="preview-info-value">{formatTanggalIndonesia(tanggal)}</span>
              </div>
              <div className="preview-info-row">
                <span className="preview-info-label">📝 Kategori:</span>
                <span className="preview-info-value">Saldo Awal</span>
              </div>
              <div className="preview-info-row">
                <span className="preview-info-label">💰 Jenis:</span>
                <span className="preview-info-value preview-pemasukan">Pemasukan</span>
              </div>
            </div>
          </div>

          <div className="saldo-info-note">
            <svg className="note-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <p>Saldo awal ini akan tercatat sebagai transaksi pemasukan dengan kategori "Saldo Awal" dan akan muncul di halaman Riwayat.</p>
          </div>

          <div className="popup-actions">
            <button
              type="button"
              onClick={onTutup}
              className="btn-cancel"
              disabled={sedangMenyimpan}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={sedangMenyimpan}
            >
              {sedangMenyimpan ? 'Menyimpan...' : 'Simpan & Mulai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PopUp_SetSaldoAwal;
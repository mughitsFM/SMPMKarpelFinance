import { useState } from 'react';
import { hapusTransaksi } from '../../manajemen-keuangan.js';
import './PopUp.css';

function PopUp_HapusTransaksi({ transaksi, onTutup, onBerhasil }) {
  const [sedangMenghapus, setSedangMenghapus] = useState(false);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleKonfirmasiHapus = async () => {
    try {
      setSedangMenghapus(true);
      await hapusTransaksi(transaksi.idTransaksi);
      alert('Data berhasil dihapus!');
      onBerhasil();
    } catch (error) {
      console.error('Error hapus data:', error);
      alert('Gagal menghapus data: ' + error.message);
    } finally {
      setSedangMenghapus(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={onTutup}>
      <div className="popup-content popup-hapus" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header popup-header-danger">
          <h2>⚠️ Konfirmasi Hapus</h2>
          <button 
            onClick={onTutup} 
            className="btn-close"
            disabled={sedangMenghapus}
          >×</button>
        </div>

        <div className="popup-body">
          <p className="warning-text">
            Apakah Anda yakin ingin menghapus transaksi ini? 
            Tindakan ini tidak dapat dibatalkan!
          </p>

          <div className="detail-hapus">
            <div className="detail-row">
              <span className="detail-label">Tipe:</span>
              <span className={`detail-value badge ${transaksi.jenis === 'pemasukan' ? 'badge-pemasukan' : 'badge-pengeluaran'}`}>
                {transaksi.jenis === 'pemasukan' ? '📈 Pemasukan' : '📉 Pengeluaran'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Kategori:</span>
              <span className="detail-value">{transaksi.kategori}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Uraian:</span>
              <span className="detail-value detail-uraian">{transaksi.uraian || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Jumlah:</span>
              <span className={`detail-value amount ${transaksi.jenis === 'pemasukan' ? 'pemasukan-amount' : 'pengeluaran-amount'}`}>
                {formatRupiah(transaksi.jumlah)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tanggal:</span>
              <span className="detail-value">{formatTanggal(transaksi.tanggal)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value detail-id">{transaksi.idTransaksi}</span>
            </div>
          </div>
        </div>

        <div className="popup-actions">
          <button
            onClick={onTutup}
            className="btn-cancel"
            disabled={sedangMenghapus}
          >
            Batalkan
          </button>
          <button
            onClick={handleKonfirmasiHapus}
            className="btn-danger"
            disabled={sedangMenghapus}
          >
            {sedangMenghapus ? 'Menghapus...' : '🗑️ Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PopUp_HapusTransaksi;

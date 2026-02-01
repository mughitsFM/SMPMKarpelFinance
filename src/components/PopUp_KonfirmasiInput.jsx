import { useState } from 'react';
import { kelolaInputUser } from '../../manajemen-keuangan.js';
import './PopUp.css';

function PopUp_KonfirmasiInput({ dataInput, daftarForm, onTutup, onBerhasil }) {
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

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

  // Pisahkan data menjadi pemasukan dan pengeluaran
  const dataPemasukan = [];
  const dataPengeluaran = [];

  daftarForm.forEach(form => {
    const data = dataInput[form.id];
    if (data) {
      if (data.tipeInput === 'pemasukan') {
        dataPemasukan.push(data);
      } else {
        dataPengeluaran.push(data);
      }
    }
  });

  const totalPemasukan = dataPemasukan.reduce((sum, item) => sum + item.jumlah, 0);
  const totalPengeluaran = dataPengeluaran.reduce((sum, item) => sum + item.jumlah, 0);

  const handleKonfirmasi = async () => {
    try {
      setSedangMenyimpan(true);
      
      const hasil = await kelolaInputUser(dataPemasukan, dataPengeluaran);
      
      if (hasil.sukses) {
        alert('Semua data berhasil disimpan!');
        onBerhasil();
      } else {
        const totalGagal = hasil.pemasukan.gagal + hasil.pengeluaran.gagal;
        const totalBerhasil = hasil.pemasukan.berhasil + hasil.pengeluaran.berhasil;
        alert(`${totalBerhasil} data berhasil disimpan, ${totalGagal} data gagal.`);
        onBerhasil();
      }
    } catch (error) {
      console.error('Error menyimpan data:', error);
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={onTutup}>
      <div className="popup-content popup-large" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Konfirmasi Input Data</h2>
          <button onClick={onTutup} className="btn-close" disabled={sedangMenyimpan}>×</button>
        </div>

        <div className="popup-body">
          <p className="konfirmasi-text">
            Pastikan data yang akan disimpan sudah benar:
          </p>

          {/* Ringkasan */}
          <div className="ringkasan-konfirmasi">
            <div className="ringkasan-item pemasukan">
              <span className="label">Total Pemasukan:</span>
              <span className="value">{formatRupiah(totalPemasukan)}</span>
            </div>
            <div className="ringkasan-item pengeluaran">
              <span className="label">Total Pengeluaran:</span>
              <span className="value">{formatRupiah(totalPengeluaran)}</span>
            </div>
            <div className="ringkasan-item total">
              <span className="label">Jumlah Transaksi:</span>
              <span className="value">{dataPemasukan.length + dataPengeluaran.length} transaksi</span>
            </div>
          </div>

          {/* Detail Pemasukan */}
          {dataPemasukan.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title pemasukan-title">💰 Pemasukan ({dataPemasukan.length})</h3>
              <div className="detail-list">
                {dataPemasukan.map((item, index) => (
                  <div key={index} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-kategori">{item.kategori}</span>
                      <span className="detail-uraian">{item.uraian}</span>
                      <span className="detail-tanggal">{formatTanggal(item.tanggal)}</span>
                    </div>
                    <span className="detail-jumlah pemasukan-amount">
                      {formatRupiah(item.jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Pengeluaran */}
          {dataPengeluaran.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title pengeluaran-title">💸 Pengeluaran ({dataPengeluaran.length})</h3>
              <div className="detail-list">
                {dataPengeluaran.map((item, index) => (
                  <div key={index} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-kategori">{item.kategori}</span>
                      <span className="detail-uraian">{item.uraian}</span>
                      <span className="detail-tanggal">{formatTanggal(item.tanggal)}</span>
                    </div>
                    <span className="detail-jumlah pengeluaran-amount">
                      {formatRupiah(item.jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={handleKonfirmasi}
            className="btn-primary"
            disabled={sedangMenyimpan}
          >
            {sedangMenyimpan ? 'Menyimpan...' : '✓ Konfirmasi & Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PopUp_KonfirmasiInput;

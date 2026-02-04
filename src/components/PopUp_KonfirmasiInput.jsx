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
      
      // Hitung total berhasil dan gagal
      const totalBerhasil = hasil.pemasukan.berhasil + hasil.pengeluaran.berhasil;
      const totalGagal = hasil.pemasukan.gagal + hasil.pengeluaran.gagal;
      const totalTransaksi = dataPemasukan.length + dataPengeluaran.length;

      if (totalGagal === 0) {
        // Semua transaksi berhasil
        alert(`✅ Sukses!\n\nSemua ${totalBerhasil} transaksi berhasil disimpan.`);
        onBerhasil();
      } else if (totalBerhasil > 0) {
        // Sebagian berhasil, sebagian gagal
        alert(
          `⚠️ Perhatian!\n\n` +
          `${totalBerhasil} transaksi berhasil disimpan.\n` +
          `${totalGagal} transaksi gagal.\n\n` +
          `Silakan periksa data yang gagal dan coba lagi.`
        );
        onBerhasil();
      } else {
        // Semua gagal
        alert(
          `❌ Gagal!\n\n` +
          `Tidak ada transaksi yang berhasil disimpan.\n` +
          `${totalGagal} dari ${totalTransaksi} transaksi gagal.\n\n` +
          `Silakan periksa data Anda dan coba lagi.`
        );
      }
    } catch (error) {
      console.error('Error menyimpan data:', error);
      
      // Parse error message untuk memberikan pesan yang lebih spesifik
      let errorMessage = error.message;
      
      // Deteksi error duplikasi "Saldo Bulan Lalu"
      if (errorMessage.includes('saldo bulan lalu') && errorMessage.includes('sudah ada')) {
        alert(
          `❌ Duplikasi Saldo Bulan Lalu!\n\n` +
          `${errorMessage}\n\n` +
          `💡 Solusi:\n` +
          `1. Hapus transaksi "Saldo Bulan Lalu" yang lama di halaman Riwayat\n` +
          `2. Atau ubah bulan transaksi ke bulan yang berbeda\n` +
          `3. Setiap bulan hanya boleh ada 1 "Saldo Bulan Lalu" untuk pemasukan dan pengeluaran`
        );
      } 
      // Deteksi error validasi lainnya
      else if (errorMessage.includes('harus diisi') || errorMessage.includes('tidak valid')) {
        alert(
          `❌ Data Tidak Valid!\n\n` +
          `${errorMessage}\n\n` +
          `Silakan periksa kembali semua form input.`
        );
      }
      // Deteksi error Firebase Auth
      else if (errorMessage.includes('User belum login')) {
        alert(
          `❌ Sesi Login Berakhir!\n\n` +
          `Anda belum login atau sesi sudah berakhir.\n\n` +
          `Silakan login kembali.`
        );
        // Optional: Redirect ke halaman login
        // window.location.href = '/login';
      }
      // Deteksi error koneksi/Firebase
      else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        alert(
          `❌ Masalah Koneksi!\n\n` +
          `Tidak dapat terhubung ke server.\n\n` +
          `💡 Solusi:\n` +
          `1. Periksa koneksi internet Anda\n` +
          `2. Refresh halaman\n` +
          `3. Coba lagi dalam beberapa saat`
        );
      }
      // Error umum lainnya
      else {
        alert(
          `❌ Terjadi Kesalahan!\n\n` +
          `${errorMessage}\n\n` +
          `Silakan coba lagi atau hubungi administrator jika masalah berlanjut.`
        );
      }
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
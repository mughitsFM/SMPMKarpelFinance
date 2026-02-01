import { useState, useEffect } from 'react';
import { ambilSemuaKategori, editDataPemasukan, editDataPengeluaran } from '../../manajemen-keuangan.js';
import './PopUp.css';

function PopUp_EditTransaksi({ transaksi, onTutup, onBerhasil }) {
  const [kategoriTerpilih, setKategoriTerpilih] = useState(transaksi.kategori);
  const [uraianBaru, setUraianBaru] = useState(transaksi.uraian || '');
  const [jumlahBaru, setJumlahBaru] = useState(transaksi.jumlah);
  const [daftarKategori, setDaftarKategori] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [tampilKonfirmasi, setTampilKonfirmasi] = useState(false);

  useEffect(() => {
    muatKategori();
  }, []);

  const muatKategori = async () => {
    try {
      setSedangMemuat(true);
      const kategori = await ambilSemuaKategori();
      
      // Ambil kategori sesuai tipe transaksi
      if (transaksi.tipeTransaksi === 'pemasukan') {
        setDaftarKategori(kategori.pemasukan || []);
      } else {
        setDaftarKategori(kategori.pengeluaran || []);
      }
    } catch (error) {
      console.error('Error memuat kategori:', error);
      alert('Gagal memuat kategori: ' + error.message);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Cek apakah ada perubahan
    const kategoriBerobah = kategoriTerpilih !== transaksi.kategori;
    const uraianBerobah = uraianBaru !== transaksi.uraian;
    const jumlahBerobah = jumlahBaru !== transaksi.jumlah;

    if (!kategoriBerobah && !jumlahBerobah && !uraianBerobah) {
      alert('Tidak ada perubahan data');
      return;
    }

    setTampilKonfirmasi(true);
  };

  const handleKonfirmasiEdit = async () => {
    try {
      setSedangMenyimpan(true);

      // Tentukan kategori, uraian, dan jumlah yang akan diupdate
      const kategoriUpdate = kategoriTerpilih !== transaksi.kategori ? kategoriTerpilih : null;
      const uraianUpdate = uraianBaru !== transaksi.uraian ? uraianBaru : null;
      const jumlahUpdate = jumlahBaru !== transaksi.jumlah ? jumlahBaru : null;

      // Edit sesuai tipe transaksi
      if (transaksi.tipeTransaksi === 'pemasukan') {
        await editDataPemasukan(transaksi.id, kategoriUpdate, uraianUpdate, jumlahUpdate);
      } else {
        await editDataPengeluaran(transaksi.id, kategoriUpdate, uraianUpdate, jumlahUpdate);
      }

      alert('Data berhasil diupdate!');
      onBerhasil();
    } catch (error) {
      console.error('Error update data:', error);
      alert('Gagal update data: ' + error.message);
    } finally {
      setSedangMenyimpan(false);
      setTampilKonfirmasi(false);
    }
  };

  if (sedangMemuat) {
    return (
      <div className="popup-overlay">
        <div className="popup-content">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tampilKonfirmasi) {
    return (
      <div className="popup-overlay" onClick={() => setTampilKonfirmasi(false)}>
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
          <div className="popup-header">
            <h2>Konfirmasi Update Data</h2>
            <button 
              onClick={() => setTampilKonfirmasi(false)} 
              className="btn-close"
              disabled={sedangMenyimpan}
            >×</button>
          </div>

          <div className="popup-body">
            <p className="konfirmasi-text">Apakah Anda yakin ingin mengupdate data ini?</p>
            
            <div className="perubahan-detail">
              <h4>Perubahan:</h4>
              
              {kategoriTerpilih !== transaksi.kategori && (
                <div className="perubahan-item">
                  <span className="label">Kategori:</span>
                  <div className="nilai-perubahan">
                    <span className="nilai-lama">{transaksi.kategori}</span>
                    <span className="arrow">→</span>
                    <span className="nilai-baru">{kategoriTerpilih}</span>
                  </div>
                </div>
              )}

              {uraianBaru !== transaksi.uraian && (
                <div className="perubahan-item">
                  <span className="label">Uraian:</span>
                  <div className="nilai-perubahan">
                    <span className="nilai-lama">{transaksi.uraian}</span>
                    <span className="arrow">→</span>
                    <span className="nilai-baru">{uraianBaru}</span>
                  </div>
                </div>
              )}

              {jumlahBaru !== transaksi.jumlah && (
                <div className="perubahan-item">
                  <span className="label">Jumlah:</span>
                  <div className="nilai-perubahan">
                    <span className="nilai-lama">{formatRupiah(transaksi.jumlah)}</span>
                    <span className="arrow">→</span>
                    <span className="nilai-baru">{formatRupiah(jumlahBaru)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="popup-actions">
            <button
              onClick={() => setTampilKonfirmasi(false)}
              className="btn-cancel"
              disabled={sedangMenyimpan}
            >
              Batalkan
            </button>
            <button
              onClick={handleKonfirmasiEdit}
              className="btn-primary"
              disabled={sedangMenyimpan}
            >
              {sedangMenyimpan ? 'Mengupdate...' : '✓ Ya, Update'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay" onClick={onTutup}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Edit Transaksi {transaksi.tipeTransaksi === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</h2>
          <button onClick={onTutup} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="info-transaksi">
            <p><strong>ID:</strong> {transaksi.id}</p>
            <p><strong>Tanggal:</strong> {new Date(transaksi.tanggal).toLocaleDateString('id-ID')}</p>
          </div>

          <div className="form-group">
            <label htmlFor="kategori">Kategori</label>
            <select
              id="kategori"
              value={kategoriTerpilih}
              onChange={(e) => setKategoriTerpilih(e.target.value)}
              className="form-control"
              required
            >
              {daftarKategori.map((kat) => (
                <option key={kat.id} value={kat.namaKategori}>
                  {kat.namaKategori}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="uraian">Uraian/Deskripsi</label>
            <input
              type="text"
              id="uraian"
              value={uraianBaru}
              onChange={(e) => setUraianBaru(e.target.value)}
              className="form-control"
              placeholder="Deskripsi transaksi"
              required
            />
            <small className="form-hint">
              Nilai asli: {transaksi.uraian}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="jumlah">Jumlah</label>
            <input
              type="number"
              id="jumlah"
              value={jumlahBaru}
              onChange={(e) => setJumlahBaru(Number(e.target.value))}
              className="form-control"
              min="1"
              required
            />
            <small className="form-hint">
              Nilai asli: {formatRupiah(transaksi.jumlah)}
            </small>
          </div>

          <div className="popup-actions">
            <button
              type="button"
              onClick={onTutup}
              className="btn-cancel"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Update Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PopUp_EditTransaksi;

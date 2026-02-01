import { useState } from 'react';
import { tambahKategori } from '../../manajemen-keuangan.js';
import './PopUp.css';

function PopUp_TambahKategori({ onTutup, onBerhasil }) {
  const [daftarKategori, setDaftarKategori] = useState([
    { id: 1, tipe: 'pemasukan', nama: '' }
  ]);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

  const handleTambahKategori = () => {
    const idBaru = daftarKategori.length > 0 
      ? Math.max(...daftarKategori.map(k => k.id)) + 1 
      : 1;
    setDaftarKategori([...daftarKategori, { id: idBaru, tipe: 'pemasukan', nama: '' }]);
  };

  const handleHapusKategori = (id) => {
    if (daftarKategori.length > 1) {
      setDaftarKategori(daftarKategori.filter(k => k.id !== id));
    }
  };

  const handlePerubahanKategori = (id, field, value) => {
    setDaftarKategori(daftarKategori.map(k =>
      k.id === id ? { ...k, [field]: value } : k
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi semua nama kategori terisi
    const semuaTerisi = daftarKategori.every(k => k.nama.trim() !== '');
    if (!semuaTerisi) {
      alert('Mohon isi semua nama kategori!');
      return;
    }

    // Validasi tidak ada nama kategori yang duplikat
    const namaKategori = daftarKategori.map(k => `${k.tipe}-${k.nama.trim().toLowerCase()}`);
    const duplikat = namaKategori.filter((item, index) => namaKategori.indexOf(item) !== index);
    if (duplikat.length > 0) {
      alert('Ada nama kategori yang duplikat. Mohon gunakan nama yang berbeda!');
      return;
    }

    try {
      setSedangMenyimpan(true);
      const hasil = await tambahKategori(daftarKategori);
      
      if (hasil.sukses || hasil.errors.length === 0) {
        alert('Kategori berhasil ditambahkan!');
        onBerhasil();
        onTutup();
      } else {
        alert(`Berhasil menambahkan kategori, namun ada ${hasil.errors.length} error`);
        onBerhasil();
        onTutup();
      }
    } catch (error) {
      console.error('Error menambah kategori:', error);
      alert('Gagal menambah kategori: ' + error.message);
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={onTutup}>
      <div className="popup-content popup-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Tambah Kategori Baru</h2>
          <button onClick={onTutup} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="kategori-list-scrollable">
            {daftarKategori.map((kategori, index) => (
              <div key={kategori.id} className="kategori-item-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipe Kategori</label>
                    <select
                      value={kategori.tipe}
                      onChange={(e) => handlePerubahanKategori(kategori.id, 'tipe', e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="pemasukan">Pemasukan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                    </select>
                  </div>

                  <div className="form-group flex-grow">
                    <label>Nama Kategori</label>
                    <input
                      type="text"
                      value={kategori.nama}
                      onChange={(e) => handlePerubahanKategori(kategori.id, 'nama', e.target.value)}
                      placeholder="Misal: Gaji, Bonus, Makanan, dll"
                      className="form-control"
                      required
                    />
                  </div>

                  {daftarKategori.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleHapusKategori(kategori.id)}
                      className="btn-hapus-kategori"
                      title="Hapus kategori"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleTambahKategori}
            className="btn-secondary btn-tambah-item"
          >
            ➕ Tambah Kategori Lain
          </button>

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
              {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PopUp_TambahKategori;

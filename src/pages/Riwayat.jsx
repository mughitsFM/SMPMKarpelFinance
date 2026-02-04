import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../konfigurasi-firebase.js';
import TabelRiwayat from '../components/TabelRiwayat';
import PopUp_EditTransaksi from '../components/PopUp_EditTransaksi';
import PopUp_HapusTransaksi from '../components/PopUp_HapusTransaksi';
import { filterDataTransaksi, ambilSemuaKategori } from '../../manajemen-keuangan.js';
import { ambilBulanTahun } from '../../utilitas.js';
import '../styles/Riwayat.css';

function Riwayat() {
  const [semuaData, setSemuaData] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);
  const [daftarKategori, setDaftarKategori] = useState({ pemasukan: [], pengeluaran: [] });
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk filter
  const [filterJenisTransaksi, setFilterJenisTransaksi] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterUrutan, setFilterUrutan] = useState('tanggal-terbaru');
  
  // State untuk pagination
  const [halamanSekarang, setHalamanSekarang] = useState(1);
  const itemPerHalaman = 10;

  // State untuk popup
  const [transaksiEdit, setTransaksiEdit] = useState(null);
  const [transaksiHapus, setTransaksiHapus] = useState(null);

  useEffect(() => {
    muatKategori();
    setupRealtimeListener();

    // Cleanup listener saat component unmount
    return () => {
      cleanupRealtimeListener();
    };
  }, []);

  useEffect(() => {
    terapkanFilter();
  }, [semuaData, filterJenisTransaksi, filterKategori, filterBulan, filterTahun, filterUrutan]);

  const muatKategori = async () => {
    try {
      const kategori = await ambilSemuaKategori();
      setDaftarKategori(kategori);
    } catch (error) {
      console.error('Error memuat kategori:', error);
    }
  };

  // Real-time listener untuk perubahan data
  const setupRealtimeListener = () => {
    const refTransaksi = ref(database, 'transaksi');

    // Listener untuk transaksi
    onValue(refTransaksi, (snapshot) => {
      updateDataFromFirebase();
    });
  };

  const cleanupRealtimeListener = () => {
    const refTransaksi = ref(database, 'transaksi');
    off(refTransaksi);
  };

  const updateDataFromFirebase = async () => {
    try {
      setSedangMemuat(true);
      setError(null);

      // Gunakan filter yang sudah ada
      const filter = {
        jenisTransaksi: filterJenisTransaksi || null,
        kategori: filterKategori || null,
        bulan: filterBulan ? Number(filterBulan) : null,
        tahun: filterTahun ? Number(filterTahun) : null,
        urutan: filterUrutan
      };

      const data = await filterDataTransaksi(filter);
      setSemuaData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error memuat data riwayat:', err);
    } finally {
      setSedangMemuat(false);
    }
  };

  const terapkanFilter = async () => {
    try {
      const filter = {
        jenisTransaksi: filterJenisTransaksi || null,
        kategori: filterKategori || null,
        bulan: filterBulan ? Number(filterBulan) : null,
        tahun: filterTahun ? Number(filterTahun) : null,
        urutan: filterUrutan
      };

      const hasil = await filterDataTransaksi(filter);
      setDataFilter(hasil);
      setHalamanSekarang(1); // Reset ke halaman pertama saat filter berubah
    } catch (err) {
      console.error('Error filter data:', err);
    }
  };

  const handleEdit = (transaksi) => {
    setTransaksiEdit(transaksi);
  };

  const handleHapus = (transaksi) => {
    setTransaksiHapus(transaksi);
  };

  const handleBerhasilEdit = () => {
    setTransaksiEdit(null);
    // Data akan auto-update dari real-time listener
  };

  const handleBerhasilHapus = () => {
    setTransaksiHapus(null);
    // Data akan auto-update dari real-time listener
  };

  const handleResetFilter = () => {
    setFilterJenisTransaksi('');
    setFilterKategori('');
    setFilterBulan('');
    setFilterTahun('');
    setFilterUrutan('tanggal-terbaru');
  };

  // Hitung data untuk halaman sekarang
  const indexAkhir = halamanSekarang * itemPerHalaman;
  const indexAwal = indexAkhir - itemPerHalaman;
  const dataTampil = dataFilter.slice(indexAwal, indexAkhir);
  const totalHalaman = Math.ceil(dataFilter.length / itemPerHalaman);

  const handleHalamanSebelumnya = () => {
    setHalamanSekarang(prev => Math.max(prev - 1, 1));
  };

  const handleHalamanBerikutnya = () => {
    setHalamanSekarang(prev => Math.min(prev + 1, totalHalaman));
  };

  const handlePilihHalaman = (nomor) => {
    setHalamanSekarang(nomor);
  };

  // Ambil daftar kategori sesuai jenis transaksi yang dipilih
  const kategoriOptions = filterJenisTransaksi === 'pemasukan'
    ? daftarKategori.pemasukan
    : filterJenisTransaksi === 'pengeluaran'
    ? daftarKategori.pengeluaran
    : [];

  // Generate opsi tahun (5 tahun ke belakang dan 1 tahun ke depan)
  const tahunSekarang = new Date().getFullYear();
  const daftarTahun = Array.from({ length: 7 }, (_, i) => tahunSekarang - 5 + i);

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (sedangMemuat && semuaData.length === 0) {
    return (
      <div className="riwayat-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data riwayat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="riwayat-container">
        <div className="error-state">
          <h3>❌ Terjadi Kesalahan</h3>
          <p>{error}</p>
          <button onClick={updateDataFromFirebase} className="btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="riwayat-container">
      <header className="riwayat-header">
        <div>
          <h1>Riwayat Transaksi</h1>
          <p className="subtitle">Kelola semua transaksi keuangan Anda</p>
        </div>
        <div className="header-stats">
          <span className="stat-item">
            Total: <strong>{dataFilter.length}</strong> transaksi
          </span>
        </div>
      </header>

      {/* Filter Section */}
      <section className="filter-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="filter-jenis">Jenis Transaksi:</label>
            <select
              id="filter-jenis"
              value={filterJenisTransaksi}
              onChange={(e) => {
                setFilterJenisTransaksi(e.target.value);
                setFilterKategori(''); // Reset kategori saat jenis berubah
              }}
              className="select-filter"
            >
              <option value="">Semua Jenis</option>
              <option value="pemasukan">💰 Pemasukan</option>
              <option value="pengeluaran">💸 Pengeluaran</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-kategori">Kategori:</label>
            <select
              id="filter-kategori"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="select-filter"
              disabled={!filterJenisTransaksi}
            >
              <option value="">
                {filterJenisTransaksi ? 'Semua Kategori' : 'Pilih Jenis Dulu'}
              </option>
              {kategoriOptions.map((kat) => (
                <option key={kat.id} value={kat.namaKategori}>
                  {kat.namaKategori}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-bulan">Bulan:</label>
            <select
              id="filter-bulan"
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="select-filter"
            >
              <option value="">Semua Bulan</option>
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
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="select-filter"
            >
              <option value="">Semua Tahun</option>
              {daftarTahun.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-urutan">Urutkan:</label>
            <select
              id="filter-urutan"
              value={filterUrutan}
              onChange={(e) => setFilterUrutan(e.target.value)}
              className="select-filter"
            >
              <option value="tanggal-terbaru">Tanggal (Terbaru)</option>
              <option value="tanggal-terlama">Tanggal (Terlama)</option>
            </select>
          </div>

          <div className="filter-group filter-actions">
            <label>&nbsp;</label>
            <button
              onClick={handleResetFilter}
              className="btn-reset-filter"
            >
              🔄 Reset Filter
            </button>
          </div>
        </div>
      </section>

      {/* Tabel */}
      {dataTampil.length > 0 ? (
        <>
          <TabelRiwayat
            data={dataTampil}
            onEdit={handleEdit}
            onHapus={handleHapus}
          />

          {/* Pagination */}
          {totalHalaman > 1 && (
            <div className="pagination">
              <button
                onClick={handleHalamanSebelumnya}
                disabled={halamanSekarang === 1}
                className="btn-pagination"
              >
                ‹ Sebelumnya
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalHalaman }, (_, i) => i + 1).map(nomor => (
                  <button
                    key={nomor}
                    onClick={() => handlePilihHalaman(nomor)}
                    className={`btn-page-number ${halamanSekarang === nomor ? 'active' : ''}`}
                  >
                    {nomor}
                  </button>
                ))}
              </div>

              <button
                onClick={handleHalamanBerikutnya}
                disabled={halamanSekarang === totalHalaman}
                className="btn-pagination"
              >
                Berikutnya ›
              </button>

              <span className="pagination-info">
                Halaman {halamanSekarang} dari {totalHalaman}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-icon">🔭</p>
          <h3>Tidak Ada Data</h3>
          <p>
            {filterJenisTransaksi || filterKategori || filterBulan || filterTahun
              ? 'Tidak ada transaksi yang sesuai dengan filter'
              : 'Mulai tambahkan transaksi dari halaman Input Data'}
          </p>
        </div>
      )}

      {/* Popup Edit */}
      {transaksiEdit && (
        <PopUp_EditTransaksi
          transaksi={transaksiEdit}
          onTutup={() => setTransaksiEdit(null)}
          onBerhasil={handleBerhasilEdit}
        />
      )}

      {/* Popup Hapus */}
      {transaksiHapus && (
        <PopUp_HapusTransaksi
          transaksi={transaksiHapus}
          onTutup={() => setTransaksiHapus(null)}
          onBerhasil={handleBerhasilHapus}
        />
      )}
    </div>
  );
}

export default Riwayat;

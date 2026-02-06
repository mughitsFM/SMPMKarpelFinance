import { useState, useEffect } from 'react';
import './FormInputKeuangan.css';

function FormInputKeuangan({ id, nomor, daftarKategori, onPerubahan, onHapus, bisaDihapus }) {
  const [tipeInput, setTipeInput] = useState('');
  const [kategoriTerpilih, setKategoriTerpilih] = useState('');
  const [uraian, setUraian] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [gunakanTanggalOtomatis, setGunakanTanggalOtomatis] = useState(true);

  useEffect(() => {
    // Set tanggal otomatis ke tanggal hari ini (WIB)
    if (gunakanTanggalOtomatis) {
      const sekarang = new Date();
      // Konversi ke WIB (UTC+7)
      const wibOffset = 7 * 60; // 7 jam dalam menit
      const localOffset = sekarang.getTimezoneOffset();
      const wibTime = new Date(sekarang.getTime() + (wibOffset + localOffset) * 60000);
      
      const tanggalWIB = wibTime.toISOString().split('T')[0];
      setTanggal(tanggalWIB);
    }
  }, [gunakanTanggalOtomatis]);

  useEffect(() => {
    // Kirim data ke parent saat semua field terisi
    if (tipeInput && kategoriTerpilih && uraian && jumlah && tanggal) {
      onPerubahan(id, {
        tipeInput,
        kategori: kategoriTerpilih,
        uraian,
        jumlah: Number(jumlah),
        tanggal
      });
    }
    // PERBAIKAN: Hapus onPerubahan dari dependency array untuk menghindari infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipeInput, kategoriTerpilih, uraian, jumlah, tanggal, id]);

  const handleTipeChange = (e) => {
    setTipeInput(e.target.value);
    setKategoriTerpilih(''); // Reset kategori saat tipe berubah
  };

  const handleToggleTanggal = () => {
    setGunakanTanggalOtomatis(!gunakanTanggalOtomatis);
  };

  // Ambil daftar kategori sesuai tipe
  const kategoriOptions = tipeInput 
    ? (tipeInput === 'pemasukan' ? daftarKategori.pemasukan : daftarKategori.pengeluaran)
    : [];

  const formatRupiah = (angka) => {
    if (!angka) return '';
    return new Intl.NumberFormat('id-ID').format(angka);
  };

  return (
    <div className="form-input-keuangan">
      <div className="form-header">
        <h3 className="form-nomor">Form #{nomor}</h3>
        {bisaDihapus && (
          <button
            type="button"
            onClick={() => onHapus(id)}
            className="btn-hapus-form"
            title="Hapus form ini"
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor={`tipe-${id}`}>
            Tipe Transaksi <span className="required">*</span>
          </label>
          <select
            id={`tipe-${id}`}
            value={tipeInput}
            onChange={handleTipeChange}
            className="form-control"
            required
          >
            <option value="">-- Pilih Tipe --</option>
            <option value="pemasukan">💰 Pemasukan</option>
            <option value="pengeluaran">💸 Pengeluaran</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor={`kategori-${id}`}>
            Kategori <span className="required">*</span>
          </label>
          <select
            id={`kategori-${id}`}
            value={kategoriTerpilih}
            onChange={(e) => setKategoriTerpilih(e.target.value)}
            className="form-control"
            disabled={!tipeInput}
            required
          >
            <option value="">
              {tipeInput ? '-- Pilih Kategori --' : '-- Pilih Tipe Dulu --'}
            </option>
            {kategoriOptions.map((kat) => (
              <option key={kat.id} value={kat.namaKategori}>
                {kat.namaKategori}
              </option>
            ))}
          </select>
          {tipeInput && kategoriOptions.length === 0 && (
            <small className="form-hint warning">
              Belum ada kategori {tipeInput}. Tambahkan kategori terlebih dahulu.
            </small>
          )}
        </div>

        <div className="form-group form-group-full">
          <label htmlFor={`uraian-${id}`}>
            Uraian/Deskripsi <span className="required">*</span>
          </label>
          <input
            type="text"
            id={`uraian-${id}`}
            value={uraian}
            onChange={(e) => setUraian(e.target.value)}
            placeholder="Misal: Gaji bulan Januari, Belanja bulanan, dll"
            className="form-control"
            required
          />
          <small className="form-hint">
            Berikan deskripsi singkat mengenai transaksi ini
          </small>
        </div>

        <div className="form-group">
          <label htmlFor={`jumlah-${id}`}>
            Jumlah (Rp) <span className="required">*</span>
          </label>
          <input
            type="number"
            id={`jumlah-${id}`}
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            placeholder="0"
            className="form-control"
            step="1"
            required
          />
          {jumlah && (
            <small className="form-hint">
              {formatRupiah(jumlah)} Rupiah
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`tanggal-${id}`}>
            Tanggal <span className="required">*</span>
          </label>
          <div className="tanggal-control">
            <input
              type="date"
              id={`tanggal-${id}`}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="form-control"
              disabled={gunakanTanggalOtomatis}
              required
            />
            <button
              type="button"
              onClick={handleToggleTanggal}
              className={`btn-toggle ${gunakanTanggalOtomatis ? 'active' : ''}`}
              title={gunakanTanggalOtomatis ? 'Klik untuk input manual' : 'Klik untuk tanggal otomatis'}
            >
              {gunakanTanggalOtomatis ? '🔒' : '🔓'}
            </button>
          </div>
          <small className="form-hint">
            {gunakanTanggalOtomatis 
              ? '📅 Otomatis (Hari ini - WIB)' 
              : '✏️ Manual (Pilih tanggal)'}
          </small>
        </div>
      </div>
    </div>
  );
}

export default FormInputKeuangan;

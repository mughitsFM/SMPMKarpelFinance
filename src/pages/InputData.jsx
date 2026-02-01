import { useState, useEffect, useCallback } from 'react';
import PopUp_TambahKategori from '../components/PopUp_TambahKategori';
import PopUp_KonfirmasiInput from '../components/PopUp_KonfirmasiInput';
import FormInputKeuangan from '../components/FormInputKeuangan';
import { ambilSemuaKategori } from '../../manajemen-keuangan.js';
import '../styles/InputData.css';

function InputData() {
  const [tampilPopUpKategori, setTampilPopUpKategori] = useState(false);
  const [tampilPopUpKonfirmasi, setTampilPopUpKonfirmasi] = useState(false);
  const [daftarKategori, setDaftarKategori] = useState({ pemasukan: [], pengeluaran: [] });
  const [daftarForm, setDaftarForm] = useState([{ id: 1 }]);
  const [dataInput, setDataInput] = useState({});
  const [sedangMemuat, setSedangMemuat] = useState(true);

  useEffect(() => {
    muatKategori();
  }, []);

  const muatKategori = async () => {
    try {
      setSedangMemuat(true);
      const kategori = await ambilSemuaKategori();
      setDaftarKategori(kategori);
    } catch (error) {
      console.error('Error memuat kategori:', error);
      alert('Gagal memuat kategori: ' + error.message);
    } finally {
      setSedangMemuat(false);
    }
  };

  const handleTambahForm = () => {
    const idBaru = daftarForm.length > 0 ? Math.max(...daftarForm.map(f => f.id)) + 1 : 1;
    setDaftarForm([...daftarForm, { id: idBaru }]);
  };

  const handleHapusForm = (id) => {
    if (daftarForm.length > 1) {
      setDaftarForm(daftarForm.filter(form => form.id !== id));
      // Hapus data form yang dihapus
      const dataBaruInput = { ...dataInput };
      delete dataBaruInput[id];
      setDataInput(dataBaruInput);
    }
  };

  // PERBAIKAN: Wrap dengan useCallback untuk menghindari infinite loop
  const handlePerubahanForm = useCallback((id, data) => {
    setDataInput(prev => ({
      ...prev,
      [id]: data
    }));
  }, []); // Empty dependency array karena tidak bergantung pada state/props lain

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi semua form terisi
    const semuaFormTerisi = daftarForm.every(form => {
      const data = dataInput[form.id];
      return data && data.tipeInput && data.kategori && data.uraian && data.jumlah && data.tanggal;
    });

    if (!semuaFormTerisi) {
      alert('Mohon lengkapi semua form input!');
      return;
    }

    setTampilPopUpKonfirmasi(true);
  };

  const handleKategoriDitambahkan = () => {
    muatKategori();
  };

  const handleBerhasilInput = () => {
    setTampilPopUpKonfirmasi(false);
    // Reset form
    setDaftarForm([{ id: 1 }]);
    setDataInput({});
  };

  if (sedangMemuat) {
    return (
      <div className="input-data-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="input-data-container">
      <header className="input-header">
        <div className="header-left">
          <h1>Input Data Keuangan</h1>
          <p className="subtitle">Tambahkan transaksi pemasukan atau pengeluaran</p>
        </div>
        <button 
          onClick={() => setTampilPopUpKategori(true)} 
          className="btn-tambah-kategori"
        >
          <span className="icon">➕</span>
          Tambah Kategori
        </button>
      </header>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-list">
          {daftarForm.map((form, index) => (
            <FormInputKeuangan
              key={form.id}
              id={form.id}
              nomor={index + 1}
              daftarKategori={daftarKategori}
              onPerubahan={handlePerubahanForm}
              onHapus={handleHapusForm}
              bisaDihapus={daftarForm.length > 1}
            />
          ))}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleTambahForm} 
            className="btn-secondary btn-tambah-form"
          >
            <span className="icon">➕</span>
            Tambah Form Input
          </button>

          <button 
            type="submit" 
            className="btn-primary btn-submit"
          >
            <span className="icon">✓</span>
            Submit Data
          </button>
        </div>
      </form>

      {/* Popup Tambah Kategori */}
      {tampilPopUpKategori && (
        <PopUp_TambahKategori
          onTutup={() => setTampilPopUpKategori(false)}
          onBerhasil={handleKategoriDitambahkan}
        />
      )}

      {/* Popup Konfirmasi Input */}
      {tampilPopUpKonfirmasi && (
        <PopUp_KonfirmasiInput
          dataInput={dataInput}
          daftarForm={daftarForm}
          onTutup={() => setTampilPopUpKonfirmasi(false)}
          onBerhasil={handleBerhasilInput}
        />
      )}
    </div>
  );
}

export default InputData;
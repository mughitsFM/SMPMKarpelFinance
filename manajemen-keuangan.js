// SISTEM MANAJEMEN KEUANGAN - UPDATED
// File: manajemen-keuangan.js
// Struktur Database Baru: Kategori per User

import { ref, get, set, update, remove } from 'firebase/database';
import { database } from './konfigurasi-firebase.js';
import { auth } from './auth-firebase.js';
import { 
  buatIdUnik, 
  ambilBulanTahun, 
  formatTanggal,
  ambilTimestampSekarang,
  validasiAngkaPositif,
  validasiStringTidakKosong,
  buatKeyBulanTahun
} from './utilitas.js';

// ==========================================
// HELPER: AMBIL ID AKUN USER YANG LOGIN
// ==========================================

/**
 * Mendapatkan ID akun dari user yang sedang login
 * @returns {string} ID akun
 */
const getIdAkun = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User belum login');
  }
  return user.uid;
};


// PERBAIKAN 1: Helper function untuk cek kategori khusus
const isKategoriSaldoBulanLalu = (namaKategori) => {
  return namaKategori.toLowerCase().includes('saldo bulan lalu');
};

const isKategoriSaldoAwal = (namaKategori) => {
  return namaKategori.toLowerCase().includes('saldo awal');
};

// PERBAIKAN 2: Validasi jumlah yang support minus untuk "Saldo Bulan Lalu"
/**
 * Validasi jumlah transaksi
 * KHUSUS: Kategori "Saldo Bulan Lalu" boleh minus, kategori lain tidak boleh
 * @param {number} jumlah - Jumlah transaksi
 * @param {string} namaKategori - Nama kategori
 * @returns {boolean} Valid atau tidak
 */
const validasiJumlahTransaksi = (jumlah, namaKategori) => {
  // Harus berupa angka
  if (typeof jumlah !== 'number' || isNaN(jumlah)) {
    return false;
  }
  
  // Kategori "Saldo Bulan Lalu" boleh minus
  if (isKategoriSaldoBulanLalu(namaKategori)) {
    return true; // Boleh positif atau negatif
  }
  
  // Kategori lain harus positif
  return jumlah > 0;
};

// ==========================================
// FUNGSI 1: TAMBAH KATEGORI (PER USER)
// ==========================================

/**
 * Menambahkan kategori baru untuk user yang login
 * @param {Array} daftarKategori - Array of {tipe: 'pemasukan'|'pengeluaran', nama: string}
 * @returns {Promise<object>} Hasil operasi
 */
export const tambahKategori = async (daftarKategori) => {
  try {
    const idAkun = getIdAkun();
    
    if (!Array.isArray(daftarKategori) || daftarKategori.length === 0) {
      throw new Error('Daftar kategori harus berupa array dan tidak boleh kosong');
    }

    const errors = [];
    const updates = {};

    // Ambil kategori yang sudah ada untuk validasi duplikasi
    const refKategoriUser = ref(database, `kategori/${idAkun}`);
    const snapshotKategori = await get(refKategoriUser);
    
    let kategoriExisting = {
      pemasukan: [],
      pengeluaran: []
    };
    
    if (snapshotKategori.exists()) {
      const data = snapshotKategori.val();
      if (data.pemasukan) {
        kategoriExisting.pemasukan = Object.values(data.pemasukan);
      }
      if (data.pengeluaran) {
        kategoriExisting.pengeluaran = Object.values(data.pengeluaran);
      }
    }

    for (const kategori of daftarKategori) {
      // Validasi
      if (!kategori.tipe || !['pemasukan', 'pengeluaran'].includes(kategori.tipe)) {
        errors.push(`Tipe kategori tidak valid: ${kategori.tipe}`);
        continue;
      }

      if (!validasiStringTidakKosong(kategori.nama)) {
        errors.push(`Nama kategori tidak boleh kosong`);
        continue;
      }

      // Cek duplikasi nama kategori
      const namaTrimmed = kategori.nama.trim().toLowerCase();
      const sudahAda = kategoriExisting[kategori.tipe].some(
        k => k.namaKategori.toLowerCase() === namaTrimmed
      );

      if (sudahAda) {
        errors.push(`Kategori "${kategori.nama}" untuk ${kategori.tipe} sudah ada`);
        continue;
      }

      // Generate ID unik untuk kategori
      const idKategori = buatIdUnik();
      
      // Path: kategori/{idAkun}/{tipe}/{idKategori}
      const pathKategori = `kategori/${idAkun}/${kategori.tipe}/${idKategori}`;
      
      updates[pathKategori] = {
        id: idKategori,
        namaKategori: kategori.nama.trim(),
        tanggalDibuat: ambilTimestampSekarang()
      };
    }

    // Simpan ke Firebase
    if (Object.keys(updates).length > 0) {
      const dbRef = ref(database);
      await update(dbRef, updates);
    }

    return {
      sukses: true,
      message: `Berhasil menambahkan ${Object.keys(updates).length} kategori`,
      errors
    };

  } catch (error) {
    console.error('Error tambah kategori:', error);
    throw new Error('Gagal menambah kategori: ' + error.message);
  }
};

// ==========================================
// FUNGSI 2: AMBIL KATEGORI USER
// ==========================================

/**
 * Mengambil semua kategori milik user yang login
 * PERBAIKAN: Filter kategori "Saldo Awal" menggunakan namaKategori (bukan nama)
 * @returns {Promise<object>} Object dengan property pemasukan dan pengeluaran
 */
export const ambilSemuaKategori = async () => {
  try {
    const idAkun = getIdAkun();
    const refKategori = ref(database, `kategori/${idAkun}`);
    const snapshot = await get(refKategori);
    
    const hasil = {
      pemasukan: [],
      pengeluaran: []
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Ambil kategori pemasukan, EXCLUDE "Saldo Awal"
      if (data.pemasukan) {
        hasil.pemasukan = Object.values(data.pemasukan).filter(
          (kategori) => !isKategoriSaldoAwal(kategori.namaKategori) // PERBAIKAN: gunakan namaKategori
        );
      }
      
      // Ambil kategori pengeluaran
      if (data.pengeluaran) {
        hasil.pengeluaran = Object.values(data.pengeluaran);
      }
    }

    return hasil;

  } catch (error) {
    console.error('Error ambil kategori:', error);
    throw new Error('Gagal mengambil kategori: ' + error.message);
  }
};

// ==========================================
// FUNGSI 3 (DIPERBAIKI FINAL): INPUT TRANSAKSI
// ==========================================

/**
 * Menambahkan transaksi baru (pemasukan atau pengeluaran)
 * PERBAIKAN: 
 * 1. Saldo total tidak berubah jika kategori = "Saldo Bulan Lalu"
 * 2. Support input minus untuk kategori "Saldo Bulan Lalu"
 * @param {Array} dataPemasukan - Array transaksi pemasukan
 * @param {Array} dataPengeluaran - Array transaksi pengeluaran
 * @returns {Promise<object>} Hasil operasi
 */
export const kelolaInputUser = async (dataPemasukan, dataPengeluaran) => {
  try {
    const idAkun = getIdAkun();
    const updates = {};
    
    const hasil = {
      sukses: true,
      pemasukan: { berhasil: 0, gagal: 0 },
      pengeluaran: { berhasil: 0, gagal: 0 }
    };

    // Helper untuk validasi dan simpan transaksi
    const prosesTransaksi = async (dataList, jenis) => {
      for (const data of dataList) {
        try {
          // Validasi
          if (!validasiStringTidakKosong(data.kategori)) {
            throw new Error('Kategori harus diisi');
          }
          if (!validasiStringTidakKosong(data.uraian)) {
            throw new Error('Uraian harus diisi');
          }
          
          // PERBAIKAN: Validasi jumlah yang support minus untuk "Saldo Bulan Lalu"
          if (!validasiJumlahTransaksi(data.jumlah, data.kategori)) {
            if (isKategoriSaldoBulanLalu(data.kategori)) {
              throw new Error('Jumlah harus berupa angka yang valid');
            } else {
              throw new Error('Jumlah harus angka positif');
            }
          }
          
          if (!data.tanggal) {
            throw new Error('Tanggal harus diisi');
          }

          const idTransaksi = buatIdUnik();
          const { bulan, tahun } = ambilBulanTahun(data.tanggal);
          const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

          // VALIDASI KHUSUS: Cek duplikasi "Saldo Bulan Lalu"
          const isSaldoBulanLalu = isKategoriSaldoBulanLalu(data.kategori);
          
          if (isSaldoBulanLalu) {
            // Cek apakah sudah ada "Saldo Bulan Lalu" di bulan ini
            const refBulananCheck = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
            const snapshotCheck = await get(refBulananCheck);
            
            if (snapshotCheck.exists()) {
              const dataBulananCheck = snapshotCheck.val();
              const sudahAda = dataBulananCheck.kategoriList.some(
                k => isKategoriSaldoBulanLalu(k.namaKategori) && k.jenis === jenis
              );
              
              if (sudahAda) {
                throw new Error(`Kategori "Saldo Bulan Lalu" untuk ${jenis} bulan ${bulan}/${tahun} sudah ada. Tidak boleh duplikat.`);
              }
            }
          }

          // 1. Simpan ke tabel Transaksi
          const pathTransaksi = `transaksi/${idTransaksi}`;
          updates[pathTransaksi] = {
            idTransaksi,
            idAkun,
            jenis, // 'pemasukan' atau 'pengeluaran'
            kategori: data.kategori,
            uraian: data.uraian,
            jumlah: data.jumlah, // Bisa positif atau negatif untuk "Saldo Bulan Lalu"
            tanggal: formatTanggal(data.tanggal),
            tanggalUpdate: ambilTimestampSekarang()
          };

          // 2. Update Transaksi Bulanan
          // Ambil data bulanan yang sudah ada
          const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
          const snapshotBulanan = await get(refBulanan);
          
          let dataBulanan = {
            idAkun,
            bulan,
            tahun,
            kategoriList: []
          };

          if (snapshotBulanan.exists()) {
            dataBulanan = snapshotBulanan.val();
          }

          // Update kategori list
          const indexKategori = dataBulanan.kategoriList.findIndex(
            k => k.namaKategori === data.kategori && k.jenis === jenis
          );

          if (indexKategori >= 0) {
            dataBulanan.kategoriList[indexKategori].jumlahTotal += data.jumlah;
          } else {
            dataBulanan.kategoriList.push({
              namaKategori: data.kategori,
              jenis,
              jumlahTotal: data.jumlah // Bisa negatif untuk "Saldo Bulan Lalu"
            });
          }

          const pathBulanan = `transaksiBulanan/${idAkun}/${keyBulanTahun}`;
          updates[pathBulanan] = dataBulanan;

          // 3. PERBAIKAN: Update saldo total di akun HANYA JIKA BUKAN "Saldo Bulan Lalu"
          if (!isSaldoBulanLalu) {
            const refAkun = ref(database, `akun/${idAkun}`);
            const snapshotAkun = await get(refAkun);
            
            if (snapshotAkun.exists()) {
              const dataAkun = snapshotAkun.val();
              let saldoBaru = dataAkun.saldoTotal || 0;
              
              if (jenis === 'pemasukan') {
                saldoBaru += data.jumlah;
              } else {
                saldoBaru -= data.jumlah;
              }
              
              updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
              updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
            }
          }

          hasil[jenis].berhasil++;

        } catch (error) {
          console.error(`Error proses ${jenis}:`, error);
          hasil[jenis].gagal++;
          hasil.sukses = false;
        }
      }
    };

    // Proses pemasukan
    if (dataPemasukan && dataPemasukan.length > 0) {
      await prosesTransaksi(dataPemasukan, 'pemasukan');
    }

    // Proses pengeluaran
    if (dataPengeluaran && dataPengeluaran.length > 0) {
      await prosesTransaksi(dataPengeluaran, 'pengeluaran');
    }

    // Simpan semua updates ke Firebase
    if (Object.keys(updates).length > 0) {
      const dbRef = ref(database);
      await update(dbRef, updates);
    }

    return hasil;

  } catch (error) {
    console.error('Error kelola input user:', error);
    throw new Error('Gagal menyimpan data: ' + error.message);
  }
};

// ==========================================
// FUNGSI 4 (DIPERBAIKI FINAL): EDIT TRANSAKSI
// ==========================================

/**
 * Mengedit transaksi yang sudah ada
 * PERBAIKAN: 
 * 1. Saldo total tidak berubah jika kategori = "Saldo Bulan Lalu"
 * 2. Support input minus untuk kategori "Saldo Bulan Lalu"
 * @param {string} idTransaksi - ID transaksi yang akan diedit
 * @param {string|null} kategoriBaru - Kategori baru (null jika tidak diubah)
 * @param {string|null} uraianBaru - Uraian baru (null jika tidak diubah)
 * @param {number|null} jumlahBaru - Jumlah baru (null jika tidak diubah)
 * @returns {Promise<object>} Hasil operasi
 */
export const editTransaksi = async (idTransaksi, kategoriBaru, uraianBaru, jumlahBaru) => {
  try {
    const idAkun = getIdAkun();
    
    // Ambil data transaksi lama
    const refTransaksi = ref(database, `transaksi/${idTransaksi}`);
    const snapshot = await get(refTransaksi);
    
    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    const transaksiLama = snapshot.val();
    
    // Validasi ownership
    if (transaksiLama.idAkun !== idAkun) {
      throw new Error('Tidak memiliki akses ke transaksi ini');
    }

    const updates = {};
    const { bulan, tahun } = ambilBulanTahun(transaksiLama.tanggal);
    const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

    // CEK apakah kategori lama atau baru adalah "Saldo Bulan Lalu"
    const kategoriLamaSaldoBulanLalu = isKategoriSaldoBulanLalu(transaksiLama.kategori);
    const kategoriBaruSaldoBulanLalu = kategoriBaru ? isKategoriSaldoBulanLalu(kategoriBaru) : kategoriLamaSaldoBulanLalu;
    
    // Tentukan kategori yang akan digunakan untuk validasi
    const kategoriUntukValidasi = kategoriBaru || transaksiLama.kategori;

    // 1. Update data transaksi
    if (kategoriBaru) {
      updates[`transaksi/${idTransaksi}/kategori`] = kategoriBaru;
    }
    if (uraianBaru !== null && uraianBaru !== undefined) {
      updates[`transaksi/${idTransaksi}/uraian`] = uraianBaru;
    }
    if (jumlahBaru !== null && jumlahBaru !== undefined) {
      // PERBAIKAN: Validasi yang support minus untuk "Saldo Bulan Lalu"
      if (!validasiJumlahTransaksi(jumlahBaru, kategoriUntukValidasi)) {
        if (isKategoriSaldoBulanLalu(kategoriUntukValidasi)) {
          throw new Error('Jumlah harus berupa angka yang valid');
        } else {
          throw new Error('Jumlah harus angka positif');
        }
      }
      updates[`transaksi/${idTransaksi}/jumlah`] = jumlahBaru;
    }
    updates[`transaksi/${idTransaksi}/tanggalUpdate`] = ambilTimestampSekarang();

    // 2. Update transaksi bulanan
    const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
    const snapshotBulanan = await get(refBulanan);
    
    if (snapshotBulanan.exists()) {
      let dataBulanan = snapshotBulanan.val();
      
      // Kurangi jumlah dari kategori lama
      const indexKategoriLama = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === transaksiLama.kategori && k.jenis === transaksiLama.jenis
      );
      
      if (indexKategoriLama >= 0) {
        dataBulanan.kategoriList[indexKategoriLama].jumlahTotal -= transaksiLama.jumlah;
        
        // Hapus kategori jika jumlahTotal = 0
        if (dataBulanan.kategoriList[indexKategoriLama].jumlahTotal === 0) {
          dataBulanan.kategoriList.splice(indexKategoriLama, 1);
        }
      }
      
      // Tambah jumlah ke kategori baru
      const kategoriAkhir = kategoriBaru || transaksiLama.kategori;
      const jumlahAkhir = jumlahBaru !== null && jumlahBaru !== undefined ? jumlahBaru : transaksiLama.jumlah;
      
      const indexKategoriBaru = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === kategoriAkhir && k.jenis === transaksiLama.jenis
      );
      
      if (indexKategoriBaru >= 0) {
        dataBulanan.kategoriList[indexKategoriBaru].jumlahTotal += jumlahAkhir;
      } else {
        dataBulanan.kategoriList.push({
          namaKategori: kategoriAkhir,
          jenis: transaksiLama.jenis,
          jumlahTotal: jumlahAkhir
        });
      }
      
      updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = dataBulanan;
    }

    // 3. PERBAIKAN: Update saldo total
    // Saldo berubah jika:
    // - Kategori lama BUKAN "Saldo Bulan Lalu" DAN jumlah berubah
    // - Atau kategori berubah dari/ke "Saldo Bulan Lalu"
    
    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshotAkun = await get(refAkun);
    
    if (snapshotAkun.exists()) {
      const dataAkun = snapshotAkun.val();
      let saldoBaru = dataAkun.saldoTotal || 0;
      let perluUpdateSaldo = false;
      
      // Kasus 1: Kategori tidak berubah DAN bukan "Saldo Bulan Lalu" DAN jumlah berubah
      if (!kategoriBaru && !kategoriLamaSaldoBulanLalu && jumlahBaru !== null && jumlahBaru !== undefined) {
        const selisih = jumlahBaru - transaksiLama.jumlah;
        if (transaksiLama.jenis === 'pemasukan') {
          saldoBaru += selisih;
        } else {
          saldoBaru -= selisih;
        }
        perluUpdateSaldo = true;
      }
      
      // Kasus 2: Kategori berubah
      if (kategoriBaru && kategoriBaru !== transaksiLama.kategori) {
        // Batalkan efek transaksi lama (jika bukan saldo bulan lalu)
        if (!kategoriLamaSaldoBulanLalu) {
          if (transaksiLama.jenis === 'pemasukan') {
            saldoBaru -= transaksiLama.jumlah;
          } else {
            saldoBaru += transaksiLama.jumlah;
          }
        }
        
        // Terapkan efek transaksi baru (jika bukan saldo bulan lalu)
        if (!kategoriBaruSaldoBulanLalu) {
          const jumlahAkhir = jumlahBaru !== null && jumlahBaru !== undefined ? jumlahBaru : transaksiLama.jumlah;
          if (transaksiLama.jenis === 'pemasukan') {
            saldoBaru += jumlahAkhir;
          } else {
            saldoBaru -= jumlahAkhir;
          }
        }
        
        perluUpdateSaldo = true;
      }
      
      if (perluUpdateSaldo) {
        updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    }

    // Simpan semua updates
    const dbRef = ref(database);
    await update(dbRef, updates);

    return {
      sukses: true,
      message: 'Transaksi berhasil diupdate'
    };

  } catch (error) {
    console.error('Error edit transaksi:', error);
    throw new Error('Gagal edit transaksi: ' + error.message);
  }
};


// ==========================================
// FUNGSI 5 (DIPERBAIKI): HAPUS TRANSAKSI
// ==========================================

/**
 * Menghapus transaksi
 * PERBAIKAN: Saldo total tidak berubah jika kategori = "Saldo Bulan Lalu"
 * (Sudah support minus karena hanya baca data yang sudah ada)
 * @param {string} idTransaksi - ID transaksi yang akan dihapus
 * @returns {Promise<object>} Hasil operasi
 */
export const hapusTransaksi = async (idTransaksi) => {
  try {
    const idAkun = getIdAkun();
    
    // Ambil data transaksi
    const refTransaksi = ref(database, `transaksi/${idTransaksi}`);
    const snapshot = await get(refTransaksi);
    
    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    const transaksi = snapshot.val();
    
    // Validasi ownership
    if (transaksi.idAkun !== idAkun) {
      throw new Error('Tidak memiliki akses ke transaksi ini');
    }

    // CEK apakah kategori adalah "Saldo Bulan Lalu"
    const isSaldoBulanLalu = isKategoriSaldoBulanLalu(transaksi.kategori);

    const updates = {};
    const { bulan, tahun } = ambilBulanTahun(transaksi.tanggal);
    const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

    // 1. Hapus transaksi
    updates[`transaksi/${idTransaksi}`] = null;

    // 2. Update transaksi bulanan
    const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
    const snapshotBulanan = await get(refBulanan);
    
    if (snapshotBulanan.exists()) {
      let dataBulanan = snapshotBulanan.val();
      
      // Kurangi jumlah dari kategori
      const indexKategori = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === transaksi.kategori && k.jenis === transaksi.jenis
      );
      
      if (indexKategori >= 0) {
        dataBulanan.kategoriList[indexKategori].jumlahTotal -= transaksi.jumlah;
        
        // Hapus kategori jika jumlahTotal = 0
        if (dataBulanan.kategoriList[indexKategori].jumlahTotal === 0) {
          dataBulanan.kategoriList.splice(indexKategori, 1);
        }
      }
      
      // Jika kategoriList kosong, hapus data bulanan
      if (dataBulanan.kategoriList.length === 0) {
        updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = null;
      } else {
        updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = dataBulanan;
      }
    }

    // 3. PERBAIKAN: Update saldo total HANYA JIKA BUKAN "Saldo Bulan Lalu"
    if (!isSaldoBulanLalu) {
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        const dataAkun = snapshotAkun.val();
        let saldoBaru = dataAkun.saldoTotal || 0;
        
        // Kembalikan saldo (kebalikan dari transaksi)
        // Sudah otomatis support minus karena hanya baca transaksi.jumlah
        if (transaksi.jenis === 'pemasukan') {
          saldoBaru -= transaksi.jumlah;
        } else {
          saldoBaru += transaksi.jumlah;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    }

    // Simpan semua updates
    const dbRef = ref(database);
    await update(dbRef, updates);

    return {
      sukses: true,
      message: 'Transaksi berhasil dihapus'
    };

  } catch (error) {
    console.error('Error hapus transaksi:', error);
    throw new Error('Gagal hapus transaksi: ' + error.message);
  }
};

// ==========================================
// FUNGSI 6: FILTER DATA TRANSAKSI
// ==========================================

/**
 * Filter transaksi berdasarkan kriteria
 * @param {object} filter - {jenisTransaksi, kategori, bulan, tahun, urutan}
 * @returns {Promise<Array>} Array transaksi
 */
export const filterDataTransaksi = async (filter) => {
  try {
    const idAkun = getIdAkun();
    const refTransaksi = ref(database, 'transaksi');
    const snapshot = await get(refTransaksi);
    
    let hasil = [];

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Filter hanya transaksi milik user
      hasil = Object.values(data).filter(t => t.idAkun === idAkun);
      
      // Filter berdasarkan jenis
      if (filter.jenisTransaksi) {
        hasil = hasil.filter(t => t.jenis === filter.jenisTransaksi);
      }
      
      // Filter berdasarkan kategori
      if (filter.kategori) {
        hasil = hasil.filter(t => t.kategori === filter.kategori);
      }
      
      // Filter berdasarkan bulan dan tahun
      if (filter.bulan || filter.tahun) {
        hasil = hasil.filter(t => {
          const { bulan, tahun } = ambilBulanTahun(t.tanggal);
          
          if (filter.bulan && filter.tahun) {
            return bulan === filter.bulan && tahun === filter.tahun;
          } else if (filter.bulan) {
            return bulan === filter.bulan;
          } else {
            return tahun === filter.tahun;
          }
        });
      }
      
      // Urutan
      if (filter.urutan === 'tanggal-terbaru') {
        hasil.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      } else if (filter.urutan === 'tanggal-terlama') {
        hasil.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
      }
    }

    return hasil;

  } catch (error) {
    console.error('Error filter transaksi:', error);
    throw new Error('Gagal filter transaksi: ' + error.message);
  }
};

// ==========================================
// FUNGSI 7: REVIEW BULANAN
// ==========================================

/**
 * Review pemasukan dan pengeluaran per bulan
 * PERBAIKAN: Kategori "Saldo Bulan Lalu" tidak dihitung dalam total dashboard
 * tapi tetap muncul di laporan (kategoriList)
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun
 * @returns {Promise<object>} Data review bulanan
 */
export const reviewPemasukanPengeluaranBulanan = async (bulan, tahun) => {
  try {
    const idAkun = getIdAkun();
    const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);
    
    const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
    const snapshot = await get(refBulanan);
    
    const hasil = {
      bulan,
      tahun,
      pemasukan: {
        kategoriList: [],
        totalKeseluruhan: 0,
        totalDashboard: 0 // TAMBAHAN: Total untuk dashboard (tanpa saldo bulan lalu)
      },
      pengeluaran: {
        kategoriList: [],
        totalKeseluruhan: 0,
        totalDashboard: 0 // TAMBAHAN: Total untuk dashboard (tanpa saldo bulan lalu)
      },
      saldo: 0,
      saldoDashboard: 0 // TAMBAHAN: Saldo untuk dashboard
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      if (data.kategoriList && Array.isArray(data.kategoriList)) {
        data.kategoriList.forEach(item => {
          const isSaldoBulanLalu = isKategoriSaldoBulanLalu(item.namaKategori);
          
          if (item.jenis === 'pemasukan') {
            hasil.pemasukan.kategoriList.push(item);
            hasil.pemasukan.totalKeseluruhan += item.jumlahTotal;
            
            // PERBAIKAN: Hanya tambahkan ke totalDashboard jika BUKAN "Saldo Bulan Lalu"
            if (!isSaldoBulanLalu) {
              hasil.pemasukan.totalDashboard += item.jumlahTotal;
            }
          } else if (item.jenis === 'pengeluaran') {
            hasil.pengeluaran.kategoriList.push(item);
            hasil.pengeluaran.totalKeseluruhan += item.jumlahTotal;
            
            // PERBAIKAN: Hanya tambahkan ke totalDashboard jika BUKAN "Saldo Bulan Lalu"
            if (!isSaldoBulanLalu) {
              hasil.pengeluaran.totalDashboard += item.jumlahTotal;
            }
          }
        });
      }
    }

    // Hitung saldo (totalKeseluruhan tetap pakai semua kategori untuk laporan)
    hasil.saldo = hasil.pemasukan.totalKeseluruhan - hasil.pengeluaran.totalKeseluruhan;
    
    // PERBAIKAN: Hitung saldoDashboard (tanpa saldo bulan lalu)
    hasil.saldoDashboard = hasil.pemasukan.totalDashboard - hasil.pengeluaran.totalDashboard;

    return hasil;

  } catch (error) {
    console.error('Error review bulanan:', error);
    throw new Error('Gagal mengambil review bulanan: ' + error.message);
  }
};


// ==========================================
// FUNGSI 8 (DIPERBAIKI): AMBIL DATA DASHBOARD
// ==========================================

/**
 * Mengambil data untuk dashboard
 * PERBAIKAN: 
 * 1. Total pemasukan/pengeluaran tidak termasuk "Saldo Bulan Lalu"
 * 2. Support nilai minus
 * @returns {Promise<object>} Data dashboard
 */
export const ambilDataDashboard = async () => {
  try {
    const idAkun = getIdAkun();
    
    // 1. Ambil saldo total dari akun
    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshotAkun = await get(refAkun);
    
    let saldoTotal = 0;
    if (snapshotAkun.exists()) {
      const dataAkun = snapshotAkun.val();
      saldoTotal = dataAkun.saldoTotal || 0;
    }

    // 2. PERBAIKAN: Hitung total pemasukan dan pengeluaran dari transaksi
    // TIDAK termasuk kategori "Saldo Bulan Lalu"
    const sekarang = new Date();
    const bulanIni = sekarang.getMonth() + 1;
    const tahunIni = sekarang.getFullYear();
    
    const refTransaksi = ref(database, 'transaksi');
    const snapshotTransaksi = await get(refTransaksi);
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    if (snapshotTransaksi.exists()) {
      const dataTransaksi = snapshotTransaksi.val();
      Object.values(dataTransaksi).forEach(t => {
        if (t.idAkun === idAkun) {
          // PERBAIKAN: Skip kategori "Saldo Bulan Lalu"
          if (!isKategoriSaldoBulanLalu(t.kategori)) {
            if (t.jenis === 'pemasukan') {
              totalPemasukan += t.jumlah; // Support minus
            } else {
              totalPengeluaran += t.jumlah; // Support minus
            }
          }
        }
      });
    }

    // 3. Data bulan ini (gunakan totalDashboard yang sudah exclude saldo bulan lalu)
    const dataBulanIni = await reviewPemasukanPengeluaranBulanan(bulanIni, tahunIni);

    return {
      totalKeseluruhan: {
        totalPemasukan,
        totalPengeluaran,
        saldo: saldoTotal
      },
      bulanIni: {
        bulan: bulanIni,
        tahun: tahunIni,
        pemasukan: {
          kategoriList: dataBulanIni.pemasukan.kategoriList,
          totalKeseluruhan: dataBulanIni.pemasukan.totalKeseluruhan
        },
        pengeluaran: {
          kategoriList: dataBulanIni.pengeluaran.kategoriList,
          totalKeseluruhan: dataBulanIni.pengeluaran.totalKeseluruhan
        },
        saldo: dataBulanIni.saldo
      }
    };

  } catch (error) {
    console.error('Error ambil data dashboard:', error);
    throw new Error('Gagal mengambil data dashboard: ' + error.message);
  }
};


// ==========================================
// FUNGSI 9: DATA GRAFIK
// ==========================================

/**
 * Ambil data untuk grafik (6 bulan terakhir)
 * @returns {Promise<Array>} Data grafik
 */
export const ambilDataGrafik = async () => {
  try {
    const idAkun = getIdAkun();
    const sekarang = new Date();
    const hasil = [];

    const namaBulan = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    // Loop 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
      const tanggal = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
      const bulan = tanggal.getMonth() + 1;
      const tahun = tanggal.getFullYear();

      const data = await reviewPemasukanPengeluaranBulanan(bulan, tahun);

      hasil.push({
        bulan: `${namaBulan[bulan - 1]} ${tahun}`,
        pemasukan: data.pemasukan.totalKeseluruhan,
        pengeluaran: data.pengeluaran.totalKeseluruhan
      });
    }

    return hasil;

  } catch (error) {
    console.error('Error ambil data grafik:', error);
    throw new Error('Gagal mengambil data grafik: ' + error.message);
  }
};

// ==========================================
// FUNGSI 10: SET SALDO AWAL (UPDATED)
// ==========================================

/**
 * Set saldo awal untuk user baru
 * Saldo awal akan disimpan sebagai transaksi pemasukan dengan kategori "Saldo Awal"
 * @param {number} saldoAwal - Jumlah saldo awal
 * @param {string} tanggal - Tanggal saldo awal (YYYY-MM-DD)
 * @returns {Promise<object>} Hasil operasi
 */
export const setSaldoAwal = async (saldoAwal, tanggal) => {
  try {
    const idAkun = getIdAkun();
    
    // Validasi saldo awal harus angka dan tidak negatif
    if (typeof saldoAwal !== 'number' || saldoAwal < 0) {
      throw new Error('Saldo awal harus angka positif atau 0');
    }

    // Validasi tanggal
    if (!tanggal) {
      throw new Error('Tanggal harus diisi');
    }

    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshot = await get(refAkun);
    
    if (!snapshot.exists()) {
      throw new Error('Akun tidak ditemukan');
    }

    const dataAkun = snapshot.val();
    
    // Cek apakah saldo awal sudah pernah diset
    if (dataAkun.saldoAwalDiSet) {
      throw new Error('Saldo awal sudah pernah diset sebelumnya');
    }

    const updates = {};
    const NAMA_KATEGORI_SALDO_AWAL = "Saldo Awal";

    // 1. Cek dan buat kategori "Saldo Awal" jika belum ada
    const refKategoriPemasukan = ref(database, `kategori/${idAkun}/pemasukan`);
    const snapshotKategori = await get(refKategoriPemasukan);
    
    let kategoriSaldoAwalId = null;
    
    if (snapshotKategori.exists()) {
      const kategoriList = Object.values(snapshotKategori.val());
      const kategoriSaldoAwal = kategoriList.find(
        k => k.namaKategori.toLowerCase() === NAMA_KATEGORI_SALDO_AWAL.toLowerCase()
      );
      
      if (kategoriSaldoAwal) {
        kategoriSaldoAwalId = kategoriSaldoAwal.id;
      }
    }

    // Buat kategori "Saldo Awal" jika belum ada
    if (!kategoriSaldoAwalId) {
      kategoriSaldoAwalId = buatIdUnik();
      const pathKategori = `kategori/${idAkun}/pemasukan/${kategoriSaldoAwalId}`;
      updates[pathKategori] = {
        id: kategoriSaldoAwalId,
        namaKategori: NAMA_KATEGORI_SALDO_AWAL,
        tanggalDibuat: ambilTimestampSekarang()
      };
    }

    // 2. Buat transaksi pemasukan dengan kategori "Saldo Awal"
    if (saldoAwal > 0) {
      const idTransaksi = buatIdUnik();
      const { bulan, tahun } = ambilBulanTahun(tanggal);
      const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

      // Simpan transaksi
      const pathTransaksi = `transaksi/${idTransaksi}`;
      updates[pathTransaksi] = {
        idTransaksi,
        idAkun,
        jenis: 'pemasukan',
        kategori: NAMA_KATEGORI_SALDO_AWAL,
        uraian: 'Saldo awal pencatatan keuangan',
        jumlah: saldoAwal,
        tanggal: formatTanggal(tanggal),
        tanggalUpdate: ambilTimestampSekarang()
      };

      // 3. Update Transaksi Bulanan
      const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
      const snapshotBulanan = await get(refBulanan);
      
      let dataBulanan = {
        idAkun,
        bulan,
        tahun,
        kategoriList: []
      };

      if (snapshotBulanan.exists()) {
        dataBulanan = snapshotBulanan.val();
      }

      // Tambah atau update kategori saldo awal di transaksi bulanan
      const indexKategori = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === NAMA_KATEGORI_SALDO_AWAL && k.jenis === 'pemasukan'
      );

      if (indexKategori >= 0) {
        dataBulanan.kategoriList[indexKategori].jumlahTotal += saldoAwal;
      } else {
        dataBulanan.kategoriList.push({
          namaKategori: NAMA_KATEGORI_SALDO_AWAL,
          jenis: 'pemasukan',
          jumlahTotal: saldoAwal
        });
      }

      const pathBulanan = `transaksiBulanan/${idAkun}/${keyBulanTahun}`;
      updates[pathBulanan] = dataBulanan;
    }

    // 4. Update data akun
    updates[`akun/${idAkun}/saldoTotal`] = saldoAwal;
    updates[`akun/${idAkun}/saldoAwal`] = saldoAwal;
    updates[`akun/${idAkun}/saldoAwalDiSet`] = true;
    updates[`akun/${idAkun}/tanggalSaldoAwal`] = formatTanggal(tanggal);
    updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();

    // 5. Simpan semua updates
    const dbRef = ref(database);
    await update(dbRef, updates);

    return {
      sukses: true,
      message: 'Saldo awal berhasil diset dan tercatat sebagai transaksi pemasukan',
      saldoAwal,
      tanggal
    };

  } catch (error) {
    console.error('Error set saldo awal:', error);
    throw new Error('Gagal set saldo awal: ' + error.message);
  }
};

// ==========================================
// FUNGSI 11: CEK STATUS SALDO AWAL
// ==========================================

/**
 * Cek apakah user sudah set saldo awal
 * @returns {Promise<object>} Status saldo awal
 */
export const cekStatusSaldoAwal = async () => {
  try {
    const idAkun = getIdAkun();
    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshot = await get(refAkun);
    
    if (!snapshot.exists()) {
      return {
        sudahDiSet: false,
        saldoAwal: 0
      };
    }

    const dataAkun = snapshot.val();
    
    return {
      sudahDiSet: dataAkun.saldoAwalDiSet || false,
      saldoAwal: dataAkun.saldoAwal || 0
    };

  } catch (error) {
    console.error('Error cek status saldo awal:', error);
    throw new Error('Gagal cek status saldo awal: ' + error.message);
  }
};
// SISTEM MANAJEMEN KEUANGAN - FIXED VERSION
// File: manajemen-keuangan.js
// Perbaikan utama: Multi-input race condition dan agregasi data

import { ref, get, set, update, remove, runTransaction } from 'firebase/database';
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
          (kategori) => !isKategoriSaldoAwal(kategori.namaKategori)
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
// FUNGSI 3 (FIXED): INPUT TRANSAKSI
// ==========================================

/**
 * PERBAIKAN UTAMA: Menggunakan transaksi Firebase untuk menghindari race condition
 * dan memastikan semua data tersimpan dengan benar pada multi-input
 */
export const kelolaInputUser = async (dataPemasukan, dataPengeluaran) => {
  try {
    const idAkun = getIdAkun();
    
    const hasil = {
      sukses: true,
      pemasukan: { berhasil: 0, gagal: 0 },
      pengeluaran: { berhasil: 0, gagal: 0 },
      errors: []
    };

    // Gabungkan semua transaksi dengan metadata jenis
    const semuaTransaksi = [];
    
    if (dataPemasukan && dataPemasukan.length > 0) {
      dataPemasukan.forEach(data => {
        semuaTransaksi.push({ ...data, jenis: 'pemasukan' });
      });
    }
    
    if (dataPengeluaran && dataPengeluaran.length > 0) {
      dataPengeluaran.forEach(data => {
        semuaTransaksi.push({ ...data, jenis: 'pengeluaran' });
      });
    }

    // Group transaksi berdasarkan bulan-tahun untuk optimasi
    const transaksiPerBulan = {};
    const transaksiData = [];

    // Validasi dan prepare semua transaksi
    for (const data of semuaTransaksi) {
      try {
        // Validasi
        if (!validasiStringTidakKosong(data.kategori)) {
          throw new Error('Kategori harus diisi');
        }
        if (!validasiStringTidakKosong(data.uraian)) {
          throw new Error('Uraian harus diisi');
        }
        
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
        const isSaldoBulanLalu = isKategoriSaldoBulanLalu(data.kategori);

        // Simpan data transaksi
        transaksiData.push({
          idTransaksi,
          jenis: data.jenis,
          kategori: data.kategori,
          uraian: data.uraian,
          jumlah: data.jumlah,
          tanggal: formatTanggal(data.tanggal),
          bulan,
          tahun,
          keyBulanTahun,
          isSaldoBulanLalu
        });

        // Group by bulan-tahun
        if (!transaksiPerBulan[keyBulanTahun]) {
          transaksiPerBulan[keyBulanTahun] = [];
        }
        transaksiPerBulan[keyBulanTahun].push({
          jenis: data.jenis,
          kategori: data.kategori,
          jumlah: data.jumlah,
          isSaldoBulanLalu
        });

        hasil[data.jenis].berhasil++;

      } catch (error) {
        console.error(`Error validasi ${data.jenis}:`, error);
        hasil[data.jenis].gagal++;
        hasil.errors.push(`${data.jenis}: ${error.message}`);
        hasil.sukses = false;
      }
    }

    // Jika semua gagal validasi, return
    if (transaksiData.length === 0) {
      return hasil;
    }

    // STEP 1: Simpan semua transaksi individual
    const updates = {};
    transaksiData.forEach(t => {
      updates[`transaksi/${t.idTransaksi}`] = {
        idTransaksi: t.idTransaksi,
        idAkun,
        jenis: t.jenis,
        kategori: t.kategori,
        uraian: t.uraian,
        jumlah: t.jumlah,
        tanggal: t.tanggal,
        tanggalUpdate: ambilTimestampSekarang()
      };
    });

    await update(ref(database), updates);

    // STEP 2: Update transaksi bulanan per bulan menggunakan transaction
    for (const [keyBulanTahun, transaksiList] of Object.entries(transaksiPerBulan)) {
      const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
      
      await runTransaction(refBulanan, (currentData) => {
        // Jika data belum ada, inisialisasi
        if (!currentData) {
          const [tahun, bulan] = keyBulanTahun.split('_');
          currentData = {
            idAkun,
            bulan: parseInt(bulan),
            tahun: parseInt(tahun),
            kategoriList: []
          };
        }

        // Ensure kategoriList exists
        if (!currentData.kategoriList) {
          currentData.kategoriList = [];
        }

        // Update setiap transaksi di bulan ini
        transaksiList.forEach(t => {
          const indexKategori = currentData.kategoriList.findIndex(
            k => k.namaKategori === t.kategori && k.jenis === t.jenis
          );

          if (indexKategori >= 0) {
            currentData.kategoriList[indexKategori].jumlahTotal += t.jumlah;
          } else {
            currentData.kategoriList.push({
              namaKategori: t.kategori,
              jenis: t.jenis,
              jumlahTotal: t.jumlah
            });
          }
        });

        return currentData;
      });
    }

    // STEP 3: Update saldo total menggunakan transaction
    // Hitung total perubahan saldo (exclude Saldo Bulan Lalu)
    let perubahanSaldo = 0;
    transaksiData.forEach(t => {
      if (!t.isSaldoBulanLalu) {
        if (t.jenis === 'pemasukan') {
          perubahanSaldo += t.jumlah;
        } else {
          perubahanSaldo -= t.jumlah;
        }
      }
    });

    // Update saldo total dengan transaction
    if (perubahanSaldo !== 0) {
      const refAkun = ref(database, `akun/${idAkun}`);
      await runTransaction(refAkun, (currentData) => {
        if (!currentData) {
          return currentData;
        }

        const saldoLama = currentData.saldoTotal || 0;
        currentData.saldoTotal = saldoLama + perubahanSaldo;
        currentData.tanggalUpdate = ambilTimestampSekarang();

        return currentData;
      });
    }

    return hasil;

  } catch (error) {
    console.error('Error kelola input:', error);
    throw new Error('Gagal menyimpan transaksi: ' + error.message);
  }
};

// ==========================================
// FUNGSI 4: EDIT TRANSAKSI
// ==========================================

/**
 * Mengedit transaksi yang sudah ada
 */
export const editTransaksi = async (idTransaksi, dataEdit) => {
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

    // Validasi data edit
    if (!validasiStringTidakKosong(dataEdit.kategori)) {
      throw new Error('Kategori harus diisi');
    }
    if (!validasiStringTidakKosong(dataEdit.uraian)) {
      throw new Error('Uraian harus diisi');
    }
    if (!validasiJumlahTransaksi(dataEdit.jumlah, dataEdit.kategori)) {
      throw new Error('Jumlah tidak valid');
    }
    if (!dataEdit.tanggal) {
      throw new Error('Tanggal harus diisi');
    }

    const { bulan: bulanLama, tahun: tahunLama } = ambilBulanTahun(transaksiLama.tanggal);
    const { bulan: bulanBaru, tahun: tahunBaru } = ambilBulanTahun(dataEdit.tanggal);
    
    const keyBulanLama = buatKeyBulanTahun(bulanLama, tahunLama);
    const keyBulanBaru = buatKeyBulanTahun(bulanBaru, tahunBaru);
    
    const isSaldoBulanLaluLama = isKategoriSaldoBulanLalu(transaksiLama.kategori);
    const isSaldoBulanLaluBaru = isKategoriSaldoBulanLalu(dataEdit.kategori);

    const updates = {};

    // 1. Update transaksi
    updates[`transaksi/${idTransaksi}`] = {
      ...transaksiLama,
      kategori: dataEdit.kategori,
      uraian: dataEdit.uraian,
      jumlah: dataEdit.jumlah,
      tanggal: formatTanggal(dataEdit.tanggal),
      tanggalUpdate: ambilTimestampSekarang()
    };

    // 2. Update transaksi bulanan lama (kurangi)
    const refBulananLama = ref(database, `transaksiBulanan/${idAkun}/${keyBulanLama}`);
    const snapshotBulananLama = await get(refBulananLama);
    
    if (snapshotBulananLama.exists()) {
      let dataBulananLama = snapshotBulananLama.val();
      
      const indexKategoriLama = dataBulananLama.kategoriList.findIndex(
        k => k.namaKategori === transaksiLama.kategori && k.jenis === transaksiLama.jenis
      );
      
      if (indexKategoriLama >= 0) {
        dataBulananLama.kategoriList[indexKategoriLama].jumlahTotal -= transaksiLama.jumlah;
        
        if (dataBulananLama.kategoriList[indexKategoriLama].jumlahTotal === 0) {
          dataBulananLama.kategoriList.splice(indexKategoriLama, 1);
        }
      }
      
      if (dataBulananLama.kategoriList.length === 0) {
        updates[`transaksiBulanan/${idAkun}/${keyBulanLama}`] = null;
      } else {
        updates[`transaksiBulanan/${idAkun}/${keyBulanLama}`] = dataBulananLama;
      }
    }

    // 3. Update transaksi bulanan baru (tambah)
    const refBulananBaru = ref(database, `transaksiBulanan/${idAkun}/${keyBulanBaru}`);
    const snapshotBulananBaru = await get(refBulananBaru);
    
    let dataBulananBaru = {
      idAkun,
      bulan: bulanBaru,
      tahun: tahunBaru,
      kategoriList: []
    };

    if (snapshotBulananBaru.exists()) {
      dataBulananBaru = snapshotBulananBaru.val();
    }

    const indexKategoriBaru = dataBulananBaru.kategoriList.findIndex(
      k => k.namaKategori === dataEdit.kategori && k.jenis === transaksiLama.jenis
    );

    if (indexKategoriBaru >= 0) {
      dataBulananBaru.kategoriList[indexKategoriBaru].jumlahTotal += dataEdit.jumlah;
    } else {
      dataBulananBaru.kategoriList.push({
        namaKategori: dataEdit.kategori,
        jenis: transaksiLama.jenis,
        jumlahTotal: dataEdit.jumlah
      });
    }

    updates[`transaksiBulanan/${idAkun}/${keyBulanBaru}`] = dataBulananBaru;

    // 4. Update saldo total (jika perlu)
    if (!isSaldoBulanLaluLama && !isSaldoBulanLaluBaru) {
      // Kedua-duanya bukan saldo bulan lalu - update saldo
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        const dataAkun = snapshotAkun.val();
        let saldoBaru = dataAkun.saldoTotal || 0;
        
        // Kembalikan efek transaksi lama
        if (transaksiLama.jenis === 'pemasukan') {
          saldoBaru -= transaksiLama.jumlah;
        } else {
          saldoBaru += transaksiLama.jumlah;
        }
        
        // Terapkan efek transaksi baru
        if (transaksiLama.jenis === 'pemasukan') {
          saldoBaru += dataEdit.jumlah;
        } else {
          saldoBaru -= dataEdit.jumlah;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    } else if (isSaldoBulanLaluLama && !isSaldoBulanLaluBaru) {
      // Dari saldo bulan lalu ke kategori biasa - tambah ke saldo
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        const dataAkun = snapshotAkun.val();
        let saldoBaru = dataAkun.saldoTotal || 0;
        
        if (transaksiLama.jenis === 'pemasukan') {
          saldoBaru += dataEdit.jumlah;
        } else {
          saldoBaru -= dataEdit.jumlah;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    } else if (!isSaldoBulanLaluLama && isSaldoBulanLaluBaru) {
      // Dari kategori biasa ke saldo bulan lalu - kurangi dari saldo
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        const dataAkun = snapshotAkun.val();
        let saldoBaru = dataAkun.saldoTotal || 0;
        
        if (transaksiLama.jenis === 'pemasukan') {
          saldoBaru -= transaksiLama.jumlah;
        } else {
          saldoBaru += transaksiLama.jumlah;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoBaru;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    }
    // Jika kedua-duanya saldo bulan lalu, tidak perlu update saldo

    // Simpan semua updates
    const dbRef = ref(database);
    await update(dbRef, updates);

    return {
      sukses: true,
      message: 'Transaksi berhasil diedit'
    };

  } catch (error) {
    console.error('Error edit transaksi:', error);
    throw new Error('Gagal edit transaksi: ' + error.message);
  }
};


// ==========================================
// FUNGSI 5: HAPUS TRANSAKSI
// ==========================================

/**
 * Menghapus transaksi
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
      
      const indexKategori = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === transaksi.kategori && k.jenis === transaksi.jenis
      );
      
      if (indexKategori >= 0) {
        dataBulanan.kategoriList[indexKategori].jumlahTotal -= transaksi.jumlah;
        
        if (dataBulanan.kategoriList[indexKategori].jumlahTotal === 0) {
          dataBulanan.kategoriList.splice(indexKategori, 1);
        }
      }
      
      if (dataBulanan.kategoriList.length === 0) {
        updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = null;
      } else {
        updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = dataBulanan;
      }
    }

    // 3. Update saldo total
    if (!isSaldoBulanLalu) {
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        const dataAkun = snapshotAkun.val();
        let saldoBaru = dataAkun.saldoTotal || 0;
        
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
        totalDashboard: 0
      },
      pengeluaran: {
        kategoriList: [],
        totalKeseluruhan: 0,
        totalDashboard: 0
      },
      saldo: 0,
      saldoDashboard: 0
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      if (data.kategoriList && Array.isArray(data.kategoriList)) {
        data.kategoriList.forEach(item => {
          const isSaldoBulanLalu = isKategoriSaldoBulanLalu(item.namaKategori);
          
          if (item.jenis === 'pemasukan') {
            hasil.pemasukan.kategoriList.push(item);
            hasil.pemasukan.totalKeseluruhan += item.jumlahTotal;
            
            if (!isSaldoBulanLalu) {
              hasil.pemasukan.totalDashboard += item.jumlahTotal;
            }
          } else if (item.jenis === 'pengeluaran') {
            hasil.pengeluaran.kategoriList.push(item);
            hasil.pengeluaran.totalKeseluruhan += item.jumlahTotal;
            
            if (!isSaldoBulanLalu) {
              hasil.pengeluaran.totalDashboard += item.jumlahTotal;
            }
          }
        });
      }
    }

    hasil.saldo = hasil.pemasukan.totalKeseluruhan - hasil.pengeluaran.totalKeseluruhan;
    hasil.saldoDashboard = hasil.pemasukan.totalDashboard - hasil.pengeluaran.totalDashboard;

    return hasil;

  } catch (error) {
    console.error('Error review bulanan:', error);
    throw new Error('Gagal mengambil review bulanan: ' + error.message);
  }
};


// ==========================================
// FUNGSI 8: AMBIL DATA DASHBOARD
// ==========================================

/**
 * Mengambil data untuk dashboard
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

    // 2. Hitung total pemasukan dan pengeluaran dari transaksi
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
          if (!isKategoriSaldoBulanLalu(t.kategori)) {
            if (t.jenis === 'pemasukan') {
              totalPemasukan += t.jumlah;
            } else {
              totalPengeluaran += t.jumlah;
            }
          }
        }
      });
    }

    // 3. Data bulan ini
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
// FUNGSI 10: SET SALDO AWAL
// ==========================================

/**
 * Set saldo awal untuk user baru
 */
export const setSaldoAwal = async (saldoAwal, tanggal) => {
  try {
    const idAkun = getIdAkun();
    
    if (typeof saldoAwal !== 'number' || saldoAwal < 0) {
      throw new Error('Saldo awal harus angka positif atau 0');
    }

    if (!tanggal) {
      throw new Error('Tanggal harus diisi');
    }

    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshot = await get(refAkun);
    
    if (!snapshot.exists()) {
      throw new Error('Akun tidak ditemukan');
    }

    const dataAkun = snapshot.val();
    
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
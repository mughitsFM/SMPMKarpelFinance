// SISTEM MANAJEMEN KEUANGAN
// File: manajemen-keuangan.js
// Struktur Database Baru dengan Multi-Akun Support

import { ref, get, set, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './konfigurasi-firebase.js';
import { auth } from './auth-firebase.js';
import { 
  buatIdUnik, 
  ambilBulanTahun, 
  formatTanggal,
  ambilTimestampSekarang,
  validasiAngkaPositif,
  validasiStringTidakKosong,
  buatKeyBulanTahun,
  parseKeyBulanTahun
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

// ==========================================
// FUNGSI 1: TAMBAH KATEGORI
// ==========================================

/**
 * Menambahkan kategori baru (pemasukan atau pengeluaran)
 * @param {Array} daftarKategori - Array of {tipe: 'pemasukan'|'pengeluaran', nama: string}
 * @returns {Promise<object>} Hasil operasi
 */
export const tambahKategori = async (daftarKategori) => {
  try {
    if (!Array.isArray(daftarKategori) || daftarKategori.length === 0) {
      throw new Error('Daftar kategori harus berupa array dan tidak boleh kosong');
    }

    const errors = [];
    const updates = {};

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

      // Generate ID unik untuk kategori
      const idKategori = buatIdUnik();
      
      // Path: kategori/{tipe}/{idKategori}
      const pathKategori = `kategori/${kategori.tipe}/${idKategori}`;
      
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
// FUNGSI 2: AMBIL SEMUA KATEGORI
// ==========================================

/**
 * Mengambil semua kategori yang tersedia
 * @returns {Promise<object>} Object dengan property pemasukan dan pengeluaran
 */
export const ambilSemuaKategori = async () => {
  try {
    const refKategori = ref(database, 'kategori');
    const snapshot = await get(refKategori);
    
    const hasil = {
      pemasukan: [],
      pengeluaran: []
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Ambil kategori pemasukan
      if (data.pemasukan) {
        hasil.pemasukan = Object.values(data.pemasukan);
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
// FUNGSI 3: INPUT TRANSAKSI
// ==========================================

/**
 * Menambahkan transaksi baru (pemasukan atau pengeluaran)
 * Format data: {kategori, uraian, jumlah, tanggal}
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
          if (!validasiAngkaPositif(data.jumlah)) {
            throw new Error('Jumlah harus angka positif');
          }
          if (!data.tanggal) {
            throw new Error('Tanggal harus diisi');
          }

          const idTransaksi = buatIdUnik();
          const { bulan, tahun } = ambilBulanTahun(data.tanggal);
          const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

          // VALIDASI KHUSUS: Cek duplikasi "Saldo Bulan Lalu"
          const isSaldoBulanLalu = data.kategori.toLowerCase().includes('saldo bulan lalu');
          
          if (isSaldoBulanLalu) {
            // Cek apakah sudah ada "Saldo Bulan Lalu" di bulan ini
            const refBulananCheck = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
            const snapshotCheck = await get(refBulananCheck);
            
            if (snapshotCheck.exists()) {
              const dataBulananCheck = snapshotCheck.val();
              const sudahAda = dataBulananCheck.kategoriList.some(
                k => k.namaKategori.toLowerCase().includes('saldo bulan lalu') && k.jenis === jenis
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
            jumlah: data.jumlah,
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
            // Kategori sudah ada, tambahkan jumlahnya
            dataBulanan.kategoriList[indexKategori].jumlahTotal += data.jumlah;
          } else {
            // Kategori baru
            dataBulanan.kategoriList.push({
              namaKategori: data.kategori,
              jenis,
              jumlahTotal: data.jumlah
            });
          }

          const pathBulanan = `transaksiBulanan/${idAkun}/${keyBulanTahun}`;
          updates[pathBulanan] = dataBulanan;

          // 3. Update Saldo Akun
          // SKIP jika kategori adalah "Saldo Bulan Lalu"
          if (!isSaldoBulanLalu) {
            const refAkun = ref(database, `akun/${idAkun}`);
            const snapshotAkun = await get(refAkun);
            
            let saldoTotal = 0;
            if (snapshotAkun.exists()) {
              saldoTotal = snapshotAkun.val().saldoTotal || 0;
            }

            // Update saldo: pemasukan (+), pengeluaran (-)
            if (jenis === 'pemasukan') {
              saldoTotal += data.jumlah;
            } else {
              saldoTotal -= data.jumlah;
            }

            updates[`akun/${idAkun}/saldoTotal`] = saldoTotal;
            updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
          }

          hasil[jenis].berhasil++;

        } catch (error) {
          console.error(`Error proses ${jenis}:`, error);
          
          // THROW langsung untuk error duplikasi "Saldo Bulan Lalu"
          // Error ini harus ditampilkan langsung ke user
          if (error.message.includes('Saldo Bulan Lalu') && error.message.includes('sudah ada')) {
            throw error; // Lempar ke atas untuk ditangkap di frontend
          }
          
          // Error validasi biasa (field kosong, dll) hanya increment counter
          hasil[jenis].gagal++;
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
// FUNGSI 4: EDIT TRANSAKSI
// ==========================================

/**
 * Edit transaksi yang sudah ada
 * @param {string} idTransaksi - ID transaksi
 * @param {string} kategoriBaru - Kategori baru (null jika tidak berubah)
 * @param {string} uraianBaru - Uraian baru (null jika tidak berubah)
 * @param {number} jumlahBaru - Jumlah baru (null jika tidak berubah)
 * @returns {Promise<object>} Hasil operasi
 */
export const editTransaksi = async (idTransaksi, kategoriBaru, uraianBaru, jumlahBaru) => {
  try {
    const idAkun = getIdAkun();
    
    // 1. Ambil data transaksi lama
    const refTransaksi = ref(database, `transaksi/${idTransaksi}`);
    const snapshot = await get(refTransaksi);
    
    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    const dataLama = snapshot.val();
    
    // Validasi kepemilikan
    if (dataLama.idAkun !== idAkun) {
      throw new Error('Anda tidak memiliki akses untuk mengedit transaksi ini');
    }

    const updates = {};
    const { bulan, tahun } = ambilBulanTahun(dataLama.tanggal);
    const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

    // 2. Update data transaksi
    if (kategoriBaru && kategoriBaru !== dataLama.kategori) {
      updates[`transaksi/${idTransaksi}/kategori`] = kategoriBaru;
    }
    if (uraianBaru && uraianBaru !== dataLama.uraian) {
      updates[`transaksi/${idTransaksi}/uraian`] = uraianBaru;
    }
    if (jumlahBaru && jumlahBaru !== dataLama.jumlah) {
      updates[`transaksi/${idTransaksi}/jumlah`] = jumlahBaru;
    }
    updates[`transaksi/${idTransaksi}/tanggalUpdate`] = ambilTimestampSekarang();

    // 3. Update Transaksi Bulanan jika ada perubahan kategori atau jumlah
    if ((kategoriBaru && kategoriBaru !== dataLama.kategori) || 
        (jumlahBaru && jumlahBaru !== dataLama.jumlah)) {
      
      // Ambil data bulanan
      const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
      const snapshotBulanan = await get(refBulanan);
      
      if (snapshotBulanan.exists()) {
        let dataBulanan = snapshotBulanan.val();
        
        // Kurangi dari kategori lama
        const indexLama = dataBulanan.kategoriList.findIndex(
          k => k.namaKategori === dataLama.kategori && k.jenis === dataLama.jenis
        );
        
        if (indexLama >= 0) {
          dataBulanan.kategoriList[indexLama].jumlahTotal -= dataLama.jumlah;
          
          // Hapus kategori jika total = 0
          if (dataBulanan.kategoriList[indexLama].jumlahTotal <= 0) {
            dataBulanan.kategoriList.splice(indexLama, 1);
          }
        }
        
        // Tambah ke kategori baru
        const kategoriFinal = kategoriBaru || dataLama.kategori;
        const jumlahFinal = jumlahBaru || dataLama.jumlah;
        
        const indexBaru = dataBulanan.kategoriList.findIndex(
          k => k.namaKategori === kategoriFinal && k.jenis === dataLama.jenis
        );
        
        if (indexBaru >= 0) {
          dataBulanan.kategoriList[indexBaru].jumlahTotal += jumlahFinal;
        } else {
          dataBulanan.kategoriList.push({
            namaKategori: kategoriFinal,
            jenis: dataLama.jenis,
            jumlahTotal: jumlahFinal
          });
        }
        
        updates[`transaksiBulanan/${idAkun}/${keyBulanTahun}`] = dataBulanan;
      }
    }

    // 4. Update Saldo Akun jika jumlah berubah
    // SKIP jika kategori lama atau baru adalah "Saldo Bulan Lalu"
    const isSaldoBulanLamaLama = dataLama.kategori.toLowerCase().includes('saldo bulan lalu');
    const isSaldoBulanLaluBaru = kategoriBaru && kategoriBaru.toLowerCase().includes('saldo bulan lalu');
    
    if (jumlahBaru && jumlahBaru !== dataLama.jumlah && !isSaldoBulanLamaLama && !isSaldoBulanLaluBaru) {
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        let saldoTotal = snapshotAkun.val().saldoTotal || 0;
        
        // Kembalikan jumlah lama
        if (dataLama.jenis === 'pemasukan') {
          saldoTotal -= dataLama.jumlah;
        } else {
          saldoTotal += dataLama.jumlah;
        }
        
        // Tambahkan jumlah baru
        if (dataLama.jenis === 'pemasukan') {
          saldoTotal += jumlahBaru;
        } else {
          saldoTotal -= jumlahBaru;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoTotal;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    }

    // Simpan updates
    if (Object.keys(updates).length > 0) {
      const dbRef = ref(database);
      await update(dbRef, updates);
    }

    return {
      sukses: true,
      message: 'Transaksi berhasil diupdate'
    };

  } catch (error) {
    console.error('Error edit transaksi:', error);
    throw new Error('Gagal mengedit transaksi: ' + error.message);
  }
};

// ==========================================
// FUNGSI 5: HAPUS TRANSAKSI
// ==========================================

/**
 * Hapus transaksi
 * @param {string} idTransaksi - ID transaksi yang akan dihapus
 * @returns {Promise<object>} Hasil operasi
 */
export const hapusTransaksi = async (idTransaksi) => {
  try {
    const idAkun = getIdAkun();
    
    // 1. Ambil data transaksi
    const refTransaksi = ref(database, `transaksi/${idTransaksi}`);
    const snapshot = await get(refTransaksi);
    
    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    const data = snapshot.val();
    
    // Validasi kepemilikan
    if (data.idAkun !== idAkun) {
      throw new Error('Anda tidak memiliki akses untuk menghapus transaksi ini');
    }

    const updates = {};
    const { bulan, tahun } = ambilBulanTahun(data.tanggal);
    const keyBulanTahun = buatKeyBulanTahun(bulan, tahun);

    // 2. Hapus transaksi
    updates[`transaksi/${idTransaksi}`] = null;

    // 3. Update Transaksi Bulanan
    const refBulanan = ref(database, `transaksiBulanan/${idAkun}/${keyBulanTahun}`);
    const snapshotBulanan = await get(refBulanan);
    
    if (snapshotBulanan.exists()) {
      let dataBulanan = snapshotBulanan.val();
      
      // Kurangi dari kategori
      const indexKategori = dataBulanan.kategoriList.findIndex(
        k => k.namaKategori === data.kategori && k.jenis === data.jenis
      );
      
      if (indexKategori >= 0) {
        dataBulanan.kategoriList[indexKategori].jumlahTotal -= data.jumlah;
        
        // Hapus kategori jika total <= 0
        if (dataBulanan.kategoriList[indexKategori].jumlahTotal <= 0) {
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

    // 4. Update Saldo Akun
    // SKIP jika kategori adalah "Saldo Bulan Lalu"
    const isSaldoBulanLalu = data.kategori.toLowerCase().includes('saldo bulan lalu');
    
    if (!isSaldoBulanLalu) {
      const refAkun = ref(database, `akun/${idAkun}`);
      const snapshotAkun = await get(refAkun);
      
      if (snapshotAkun.exists()) {
        let saldoTotal = snapshotAkun.val().saldoTotal || 0;
        
        // Kembalikan saldo
        if (data.jenis === 'pemasukan') {
          saldoTotal -= data.jumlah;
        } else {
          saldoTotal += data.jumlah;
        }
        
        updates[`akun/${idAkun}/saldoTotal`] = saldoTotal;
        updates[`akun/${idAkun}/tanggalUpdate`] = ambilTimestampSekarang();
      }
    }

    // Simpan updates
    const dbRef = ref(database);
    await update(dbRef, updates);

    return {
      sukses: true,
      message: 'Transaksi berhasil dihapus'
    };

  } catch (error) {
    console.error('Error hapus transaksi:', error);
    throw new Error('Gagal menghapus transaksi: ' + error.message);
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
 * Review pemasukan dan pengeluaran bulanan
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun
 * @returns {Promise<object>} Data review
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
        totalKeseluruhan: 0,
        kategoriList: []
      },
      pengeluaran: {
        totalKeseluruhan: 0,
        kategoriList: []
      },
      saldo: 0
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Pisahkan pemasukan dan pengeluaran
      data.kategoriList.forEach(item => {
        if (item.jenis === 'pemasukan') {
          hasil.pemasukan.kategoriList.push({
            namaKategori: item.namaKategori,
            jumlahTotal: item.jumlahTotal
          });
          hasil.pemasukan.totalKeseluruhan += item.jumlahTotal;
        } else {
          hasil.pengeluaran.kategoriList.push({
            namaKategori: item.namaKategori,
            jumlahTotal: item.jumlahTotal
          });
          hasil.pengeluaran.totalKeseluruhan += item.jumlahTotal;
        }
      });
    }

    hasil.saldo = hasil.pemasukan.totalKeseluruhan - hasil.pengeluaran.totalKeseluruhan;

    return hasil;

  } catch (error) {
    console.error('Error review bulanan:', error);
    throw new Error('Gagal mengambil review bulanan: ' + error.message);
  }
};

// ==========================================
// FUNGSI 8: DATA DASHBOARD
// ==========================================

/**
 * Ambil data untuk dashboard
 * @returns {Promise<object>} Data dashboard
 */
export const ambilDataDashboard = async () => {
  try {
    const idAkun = getIdAkun();
    const sekarang = new Date();
    const bulanIni = sekarang.getMonth() + 1;
    const tahunIni = sekarang.getFullYear();

    // 1. Ambil total keseluruhan dari akun
    const refAkun = ref(database, `akun/${idAkun}`);
    const snapshotAkun = await get(refAkun);
    
    const saldoTotal = snapshotAkun.exists() ? snapshotAkun.val().saldoTotal || 0 : 0;

    // 2. Hitung total pemasukan dan pengeluaran keseluruhan
    const refTransaksi = ref(database, 'transaksi');
    const snapshotTransaksi = await get(refTransaksi);
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    if (snapshotTransaksi.exists()) {
      const dataTransaksi = snapshotTransaksi.val();
      Object.values(dataTransaksi).forEach(t => {
        if (t.idAkun === idAkun) {
          if (t.jenis === 'pemasukan') {
            totalPemasukan += t.jumlah;
          } else {
            totalPengeluaran += t.jumlah;
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
        pemasukan: dataBulanIni.pemasukan,
        pengeluaran: dataBulanIni.pengeluaran,
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
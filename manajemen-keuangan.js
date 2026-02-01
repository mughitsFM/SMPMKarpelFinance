// manajemen-keuangan.js
// File utama yang berisi semua fungsi untuk mengelola data keuangan di Firebase Realtime Database

import { database } from './konfigurasi-firebase.js';
import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
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
// KONSTANTA PATH DATABASE
// ==========================================
const PATH_PEMASUKAN = 'pemasukan';
const PATH_PENGELUARAN = 'pengeluaran';
const PATH_ALL_PEMASUKAN = 'allPemasukan';
const PATH_ALL_PENGELUARAN = 'allPengeluaran';
const PATH_KATEGORI = 'kategori';

// // ==========================================
// // FUNGSI 1: MANAGE INPUT USER
// // ==========================================

// /**
//  * Mengelola input dari user berupa list pemasukan dan/atau pengeluaran
//  * Fungsi ini akan memproses list dan mendistribusikan ke fungsi tambah yang sesuai
//  * 
//  * @param {Array} listPemasukan - Array berisi object pemasukan {kategori, tanggal, jumlah}
//  * @param {Array} listPengeluaran - Array berisi object pengeluaran {kategori, tanggal, jumlah}
//  * @returns {Promise<object>} Hasil pemrosesan dengan status sukses/gagal
//  */
// export const kelolaInputUser = async (listPemasukan = [], listPengeluaran = []) => {
//   const hasil = {
//     sukses: true,
//     pemasukan: {
//       berhasil: 0,
//       gagal: 0,
//       errors: []
//     },
//     pengeluaran: {
//       berhasil: 0,
//       gagal: 0,
//       errors: []
//     }
//   };

//   try {
//     // Proses semua pemasukan
//     if (Array.isArray(listPemasukan) && listPemasukan.length > 0) {
//       for (let i = 0; i < listPemasukan.length; i++) {
//         const item = listPemasukan[i];
//         try {
//           await tambahPemasukan(item.kategori, item.tanggal, item.jumlah);
//           hasil.pemasukan.berhasil++;
//         } catch (error) {
//           hasil.pemasukan.gagal++;
//           hasil.pemasukan.errors.push({
//             index: i,
//             data: item,
//             error: error.message
//           });
//         }
//       }
//     }

//     // Proses semua pengeluaran
//     if (Array.isArray(listPengeluaran) && listPengeluaran.length > 0) {
//       for (let i = 0; i < listPengeluaran.length; i++) {
//         const item = listPengeluaran[i];
//         try {
//           await tambahPengeluaran(item.kategori, item.tanggal, item.jumlah);
//           hasil.pengeluaran.berhasil++;
//         } catch (error) {
//           hasil.pengeluaran.gagal++;
//           hasil.pengeluaran.errors.push({
//             index: i,
//             data: item,
//             error: error.message
//           });
//         }
//       }
//     }

//     // Set sukses false jika ada yang gagal
//     if (hasil.pemasukan.gagal > 0 || hasil.pengeluaran.gagal > 0) {
//       hasil.sukses = false;
//     }

//     return hasil;
//   } catch (error) {
//     throw new Error(`Gagal mengelola input user: ${error.message}`);
//   }
// };

// ==========================================
// FUNGSI 1: MANAGE INPUT USER (DIPERBAIKI)
// ==========================================

/**
 * Mengelola input dari user berupa list pemasukan dan/atau pengeluaran
 * DIPERBAIKI: Menambahkan field uraian
 * 
 * @param {Array} listPemasukan - Array berisi object pemasukan {kategori, uraian, tanggal, jumlah}
 * @param {Array} listPengeluaran - Array berisi object pengeluaran {kategori, uraian, tanggal, jumlah}
 * @returns {Promise<object>} Hasil pemrosesan dengan status sukses/gagal
 */
export const kelolaInputUser = async (listPemasukan = [], listPengeluaran = []) => {
  const hasil = {
    sukses: true,
    pemasukan: {
      berhasil: 0,
      gagal: 0,
      errors: []
    },
    pengeluaran: {
      berhasil: 0,
      gagal: 0,
      errors: []
    }
  };

  try {
    // Proses semua pemasukan
    if (Array.isArray(listPemasukan) && listPemasukan.length > 0) {
      for (let i = 0; i < listPemasukan.length; i++) {
        const item = listPemasukan[i];
        try {
          await tambahPemasukan(item.kategori, item.uraian, item.tanggal, item.jumlah);
          hasil.pemasukan.berhasil++;
        } catch (error) {
          hasil.pemasukan.gagal++;
          hasil.pemasukan.errors.push({
            index: i,
            data: item,
            error: error.message
          });
        }
      }
    }

    // Proses semua pengeluaran
    if (Array.isArray(listPengeluaran) && listPengeluaran.length > 0) {
      for (let i = 0; i < listPengeluaran.length; i++) {
        const item = listPengeluaran[i];
        try {
          await tambahPengeluaran(item.kategori, item.uraian, item.tanggal, item.jumlah);
          hasil.pengeluaran.berhasil++;
        } catch (error) {
          hasil.pengeluaran.gagal++;
          hasil.pengeluaran.errors.push({
            index: i,
            data: item,
            error: error.message
          });
        }
      }
    }

    // Set sukses false jika ada yang gagal
    if (hasil.pemasukan.gagal > 0 || hasil.pengeluaran.gagal > 0) {
      hasil.sukses = false;
    }

    return hasil;
  } catch (error) {
    throw new Error(`Gagal mengelola input user: ${error.message}`);
  }
};

// // ==========================================
// // FUNGSI 2: TAMBAH PEMASUKAN
// // ==========================================

// /**
//  * Menambahkan data pemasukan baru ke database
//  * Otomatis mengupdate tabel ALL Pemasukan
//  * 
//  * @param {string} kategori - Nama kategori pemasukan
//  * @param {string} tanggal - Tanggal pemasukan (YYYY-MM-DD atau timestamp)
//  * @param {number} jumlah - Jumlah uang pemasukan
//  * @returns {Promise<object>} Data pemasukan yang telah disimpan
//  */
// export const tambahPemasukan = async (kategori, tanggal, jumlah) => {
//   try {
//     // Validasi input
//     if (!validasiStringTidakKosong(kategori)) {
//       throw new Error('Kategori tidak valid');
//     }
//     if (!validasiAngkaPositif(jumlah)) {
//       throw new Error('Jumlah harus angka positif');
//     }

//     // Buat ID unik dan ambil bulan/tahun
//     const id = buatIdUnik();
//     const tanggalFormatted = formatTanggal(tanggal);
//     const { bulan, tahun } = ambilBulanTahun(tanggal);
//     const tanggalUpdate = ambilTimestampSekarang();

//     // Data pemasukan yang akan disimpan
//     const dataPemasukan = {
//       id,
//       kategori,
//       tanggal: tanggalFormatted,
//       jumlah,
//       tanggalUpdate
//     };

//     // Simpan ke tabel pemasukan
//     const refPemasukan = ref(database, `${PATH_PEMASUKAN}/${id}`);
//     await set(refPemasukan, dataPemasukan);

//     // Update ALL Pemasukan
//     await updateAllPemasukan(kategori, jumlah, bulan, tahun);

//     return dataPemasukan;
//   } catch (error) {
//     throw new Error(`Gagal menambah pemasukan: ${error.message}`);
//   }
// };

// ==========================================
// FUNGSI 2: TAMBAH PEMASUKAN (DIPERBAIKI)
// ==========================================

/**
 * Menambahkan data pemasukan baru ke database
 * DIPERBAIKI: Menambahkan parameter uraian
 * 
 * @param {string} kategori - Nama kategori pemasukan
 * @param {string} uraian - Deskripsi/uraian pemasukan
 * @param {string} tanggal - Tanggal pemasukan (YYYY-MM-DD atau timestamp)
 * @param {number} jumlah - Jumlah uang pemasukan
 * @returns {Promise<object>} Data pemasukan yang telah disimpan
 */
export const tambahPemasukan = async (kategori, uraian, tanggal, jumlah) => {
  try {
    // Validasi input
    if (!validasiStringTidakKosong(kategori)) {
      throw new Error('Kategori tidak valid');
    }
    if (!validasiStringTidakKosong(uraian)) {
      throw new Error('Uraian tidak valid');
    }
    if (!validasiAngkaPositif(jumlah)) {
      throw new Error('Jumlah harus angka positif');
    }

    // Buat ID unik dan ambil bulan/tahun
    const id = buatIdUnik();
    const tanggalFormatted = formatTanggal(tanggal);
    const { bulan, tahun } = ambilBulanTahun(tanggal);
    const tanggalUpdate = ambilTimestampSekarang();

    // Data pemasukan yang akan disimpan
    const dataPemasukan = {
      id,
      kategori,
      uraian,
      tanggal: tanggalFormatted,
      jumlah,
      tanggalUpdate
    };

    // Simpan ke tabel pemasukan
    const refPemasukan = ref(database, `${PATH_PEMASUKAN}/${id}`);
    await set(refPemasukan, dataPemasukan);

    // Update ALL Pemasukan
    await updateAllPemasukan(kategori, jumlah, bulan, tahun);

    return dataPemasukan;
  } catch (error) {
    throw new Error(`Gagal menambah pemasukan: ${error.message}`);
  }
};

// // ==========================================
// // FUNGSI 3: TAMBAH PENGELUARAN
// // ==========================================

// /**
//  * Menambahkan data pengeluaran baru ke database
//  * Otomatis mengupdate tabel ALL Pengeluaran
//  * 
//  * @param {string} kategori - Nama kategori pengeluaran
//  * @param {string} tanggal - Tanggal pengeluaran (YYYY-MM-DD atau timestamp)
//  * @param {number} jumlah - Jumlah uang pengeluaran
//  * @returns {Promise<object>} Data pengeluaran yang telah disimpan
//  */
// export const tambahPengeluaran = async (kategori, tanggal, jumlah) => {
//   try {
//     // Validasi input
//     if (!validasiStringTidakKosong(kategori)) {
//       throw new Error('Kategori tidak valid');
//     }
//     if (!validasiAngkaPositif(jumlah)) {
//       throw new Error('Jumlah harus angka positif');
//     }

//     // Buat ID unik dan ambil bulan/tahun
//     const id = buatIdUnik();
//     const tanggalFormatted = formatTanggal(tanggal);
//     const { bulan, tahun } = ambilBulanTahun(tanggal);
//     const tanggalUpdate = ambilTimestampSekarang();

//     // Data pengeluaran yang akan disimpan
//     const dataPengeluaran = {
//       id,
//       kategori,
//       tanggal: tanggalFormatted,
//       jumlah,
//       tanggalUpdate
//     };

//     // Simpan ke tabel pengeluaran
//     const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
//     await set(refPengeluaran, dataPengeluaran);

//     // Update ALL Pengeluaran
//     await updateAllPengeluaran(kategori, jumlah, bulan, tahun);

//     return dataPengeluaran;
//   } catch (error) {
//     throw new Error(`Gagal menambah pengeluaran: ${error.message}`);
//   }
// };

// ==========================================
// FUNGSI 3: TAMBAH PENGELUARAN (DIPERBAIKI)
// ==========================================

/**
 * Menambahkan data pengeluaran baru ke database
 * DIPERBAIKI: Menambahkan parameter uraian
 * 
 * @param {string} kategori - Nama kategori pengeluaran
 * @param {string} uraian - Deskripsi/uraian pengeluaran
 * @param {string} tanggal - Tanggal pengeluaran (YYYY-MM-DD atau timestamp)
 * @param {number} jumlah - Jumlah uang pengeluaran
 * @returns {Promise<object>} Data pengeluaran yang telah disimpan
 */
export const tambahPengeluaran = async (kategori, uraian, tanggal, jumlah) => {
  try {
    // Validasi input
    if (!validasiStringTidakKosong(kategori)) {
      throw new Error('Kategori tidak valid');
    }
    if (!validasiStringTidakKosong(uraian)) {
      throw new Error('Uraian tidak valid');
    }
    if (!validasiAngkaPositif(jumlah)) {
      throw new Error('Jumlah harus angka positif');
    }

    // Buat ID unik dan ambil bulan/tahun
    const id = buatIdUnik();
    const tanggalFormatted = formatTanggal(tanggal);
    const { bulan, tahun } = ambilBulanTahun(tanggal);
    const tanggalUpdate = ambilTimestampSekarang();

    // Data pengeluaran yang akan disimpan
    const dataPengeluaran = {
      id,
      kategori,
      uraian,
      tanggal: tanggalFormatted,
      jumlah,
      tanggalUpdate
    };

    // Simpan ke tabel pengeluaran
    const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
    await set(refPengeluaran, dataPengeluaran);

    // Update ALL Pengeluaran
    await updateAllPengeluaran(kategori, jumlah, bulan, tahun);

    return dataPengeluaran;
  } catch (error) {
    throw new Error(`Gagal menambah pengeluaran: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 4: UPDATE ALL PEMASUKAN
// ==========================================

/**
 * Mengupdate atau membuat data agregat pemasukan per bulan/tahun
 * Mengelompokkan pemasukan berdasarkan kategori dalam periode tertentu
 * 
 * @param {string} kategori - Nama kategori pemasukan
 * @param {number} jumlah - Jumlah yang akan ditambahkan
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun (YYYY)
 * @returns {Promise<object>} Data ALL Pemasukan yang telah diupdate
 */
export const updateAllPemasukan = async (kategori, jumlah, bulan, tahun) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPemasukan = ref(database, `${PATH_ALL_PEMASUKAN}/${key}`);

    // Ambil data yang sudah ada
    const snapshot = await get(refAllPemasukan);
    let dataAll;

    if (snapshot.exists()) {
      // Data sudah ada, update existing
      dataAll = snapshot.val();
      
      // Cari apakah kategori sudah ada dalam list
      const indexKategori = dataAll.kategoriList.findIndex(
        item => item.namaKategori === kategori
      );

      if (indexKategori !== -1) {
        // Kategori sudah ada, tambahkan jumlahnya
        dataAll.kategoriList[indexKategori].jumlahTotal += jumlah;
      } else {
        // Kategori belum ada, tambahkan kategori baru
        dataAll.kategoriList.push({
          namaKategori: kategori,
          jumlahTotal: jumlah
        });
      }
    } else {
      // Data belum ada, buat baru
      dataAll = {
        id: key,
        bulan,
        tahun,
        kategoriList: [
          {
            namaKategori: kategori,
            jumlahTotal: jumlah
          }
        ]
      };
    }

    // Simpan ke database
    await set(refAllPemasukan, dataAll);
    return dataAll;
  } catch (error) {
    throw new Error(`Gagal update ALL Pemasukan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 5: UPDATE ALL PENGELUARAN
// ==========================================

/**
 * Mengupdate atau membuat data agregat pengeluaran per bulan/tahun
 * Mengelompokkan pengeluaran berdasarkan kategori dalam periode tertentu
 * 
 * @param {string} kategori - Nama kategori pengeluaran
 * @param {number} jumlah - Jumlah yang akan ditambahkan
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun (YYYY)
 * @returns {Promise<object>} Data ALL Pengeluaran yang telah diupdate
 */
export const updateAllPengeluaran = async (kategori, jumlah, bulan, tahun) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPengeluaran = ref(database, `${PATH_ALL_PENGELUARAN}/${key}`);

    // Ambil data yang sudah ada
    const snapshot = await get(refAllPengeluaran);
    let dataAll;

    if (snapshot.exists()) {
      // Data sudah ada, update existing
      dataAll = snapshot.val();
      
      // Cari apakah kategori sudah ada dalam list
      const indexKategori = dataAll.kategoriList.findIndex(
        item => item.namaKategori === kategori
      );

      if (indexKategori !== -1) {
        // Kategori sudah ada, tambahkan jumlahnya
        dataAll.kategoriList[indexKategori].jumlahTotal += jumlah;
      } else {
        // Kategori belum ada, tambahkan kategori baru
        dataAll.kategoriList.push({
          namaKategori: kategori,
          jumlahTotal: jumlah
        });
      }
    } else {
      // Data belum ada, buat baru
      dataAll = {
        id: key,
        bulan,
        tahun,
        kategoriList: [
          {
            namaKategori: kategori,
            jumlahTotal: jumlah
          }
        ]
      };
    }

    // Simpan ke database
    await set(refAllPengeluaran, dataAll);
    return dataAll;
  } catch (error) {
    throw new Error(`Gagal update ALL Pengeluaran: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 6: TAMBAH KATEGORI
// ==========================================

/**
 * Menambahkan kategori baru ke database
 * Mendukung penambahan batch untuk pemasukan dan/atau pengeluaran
 * 
 * @param {Array} listKategori - Array berisi object {tipe: 'pemasukan'/'pengeluaran', nama: 'string'}
 * @returns {Promise<object>} Hasil penambahan kategori
 */
export const tambahKategori = async (listKategori) => {
  try {
    if (!Array.isArray(listKategori) || listKategori.length === 0) {
      throw new Error('List kategori harus berupa array dan tidak boleh kosong');
    }

    const hasil = {
      sukses: true,
      pemasukan: [],
      pengeluaran: [],
      errors: []
    };

    const refKategori = ref(database, PATH_KATEGORI);
    const snapshot = await get(refKategori);
    
    let dataKategori = {
      pemasukan: [],
      pengeluaran: []
    };

    // Ambil data existing jika ada
    if (snapshot.exists()) {
      dataKategori = snapshot.val();
      if (!dataKategori.pemasukan) dataKategori.pemasukan = [];
      if (!dataKategori.pengeluaran) dataKategori.pengeluaran = [];
    }

    // Proses setiap kategori dalam list
    for (let i = 0; i < listKategori.length; i++) {
      const item = listKategori[i];
      
      try {
        if (!item.tipe || !item.nama) {
          throw new Error('Tipe dan nama kategori harus diisi');
        }

        const id = buatIdUnik();
        const kategoriData = {
          id,
          namaKategori: item.nama
        };

        if (item.tipe === 'pemasukan') {
          // Cek apakah kategori sudah ada
          const sudahAda = dataKategori.pemasukan.some(
            kat => kat.namaKategori === item.nama
          );
          
          if (!sudahAda) {
            dataKategori.pemasukan.push(kategoriData);
            hasil.pemasukan.push(kategoriData);
          }
        } else if (item.tipe === 'pengeluaran') {
          // Cek apakah kategori sudah ada
          const sudahAda = dataKategori.pengeluaran.some(
            kat => kat.namaKategori === item.nama
          );
          
          if (!sudahAda) {
            dataKategori.pengeluaran.push(kategoriData);
            hasil.pengeluaran.push(kategoriData);
          }
        } else {
          throw new Error('Tipe kategori harus "pemasukan" atau "pengeluaran"');
        }
      } catch (error) {
        hasil.errors.push({
          index: i,
          data: item,
          error: error.message
        });
        hasil.sukses = false;
      }
    }

    // Simpan ke database
    await set(refKategori, dataKategori);

    return hasil;
  } catch (error) {
    throw new Error(`Gagal menambah kategori: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 7: AMBIL DATA PEMASUKAN
// ==========================================

/**
 * Mengambil data pemasukan dari database
 * Bisa difilter berdasarkan bulan dan/atau tahun
 * 
 * @param {number|null} bulan - Bulan (1-12) atau null untuk semua
 * @param {number|null} tahun - Tahun (YYYY) atau null untuk semua
 * @returns {Promise<Array>} Array berisi data pemasukan
 */
export const ambilDataPemasukan = async (bulan = null, tahun = null) => {
  try {
    const refPemasukan = ref(database, PATH_PEMASUKAN);
    const snapshot = await get(refPemasukan);

    if (!snapshot.exists()) {
      return [];
    }

    const dataPemasukan = snapshot.val();
    let hasilArray = Object.values(dataPemasukan);

    // Filter berdasarkan bulan dan tahun jika ada
    if (bulan !== null || tahun !== null) {
      hasilArray = hasilArray.filter(item => {
        const { bulan: itemBulan, tahun: itemTahun } = ambilBulanTahun(item.tanggal);
        
        let cocok = true;
        if (bulan !== null && itemBulan !== bulan) cocok = false;
        if (tahun !== null && itemTahun !== tahun) cocok = false;
        
        return cocok;
      });
    }

    return hasilArray;
  } catch (error) {
    throw new Error(`Gagal mengambil data pemasukan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 8: AMBIL DATA PENGELUARAN
// ==========================================

/**
 * Mengambil data pengeluaran dari database
 * Bisa difilter berdasarkan bulan dan/atau tahun
 * 
 * @param {number|null} bulan - Bulan (1-12) atau null untuk semua
 * @param {number|null} tahun - Tahun (YYYY) atau null untuk semua
 * @returns {Promise<Array>} Array berisi data pengeluaran
 */
export const ambilDataPengeluaran = async (bulan = null, tahun = null) => {
  try {
    const refPengeluaran = ref(database, PATH_PENGELUARAN);
    const snapshot = await get(refPengeluaran);

    if (!snapshot.exists()) {
      return [];
    }

    const dataPengeluaran = snapshot.val();
    let hasilArray = Object.values(dataPengeluaran);

    // Filter berdasarkan bulan dan tahun jika ada
    if (bulan !== null || tahun !== null) {
      hasilArray = hasilArray.filter(item => {
        const { bulan: itemBulan, tahun: itemTahun } = ambilBulanTahun(item.tanggal);
        
        let cocok = true;
        if (bulan !== null && itemBulan !== bulan) cocok = false;
        if (tahun !== null && itemTahun !== tahun) cocok = false;
        
        return cocok;
      });
    }

    return hasilArray;
  } catch (error) {
    throw new Error(`Gagal mengambil data pengeluaran: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 9: EDIT DATA PEMASUKAN BY ID
// ==========================================

/**
 * Mengedit data pemasukan berdasarkan ID
 * Otomatis mengupdate ALL Pemasukan sesuai perubahan
 * 
 * @param {string} id - ID pemasukan yang akan diedit
 * @param {string} kategoriBaru - Kategori baru (opsional, kirim null jika tidak berubah)
 * @param {number} jumlahBaru - Jumlah baru (opsional, kirim null jika tidak berubah)
 * @returns {Promise<object>} Data pemasukan yang telah diupdate
 */
export const editDataPemasukan = async (id, kategoriBaru = null, uraianBaru = null, jumlahBaru = null) => {
  try {
    if (!id) {
      throw new Error('ID pemasukan harus diisi');
    }

    // Ambil data asli
    const refPemasukan = ref(database, `${PATH_PEMASUKAN}/${id}`);
    const snapshot = await get(refPemasukan);

    if (!snapshot.exists()) {
      throw new Error('Data pemasukan tidak ditemukan');
    }

    const dataAsli = snapshot.val();
    const { bulan, tahun } = ambilBulanTahun(dataAsli.tanggal);

    // Deteksi perubahan
    const kategoriBerobah = kategoriBaru !== null && kategoriBaru !== dataAsli.kategori;
    const uraianBerobah = uraianBaru !== null && uraianBaru !== dataAsli.uraian;
    const jumlahBerobah = jumlahBaru !== null && jumlahBaru !== dataAsli.jumlah;

    if (!kategoriBerobah && !jumlahBerobah && !uraianBerobah) {
      return dataAsli; // Tidak ada perubahan
    }

    // Update ALL Pemasukan berdasarkan perubahan
    if (kategoriBerobah || jumlahBerobah) {
      const kategoriUpdate = kategoriBaru !== null ? kategoriBaru : dataAsli.kategori;
      const jumlahUpdate = jumlahBaru !== null ? jumlahBaru : dataAsli.jumlah;
      
      await updateAllPengeluaranPadaEdit(
        dataAsli.kategori,
        dataAsli.jumlah,
        kategoriUpdate,
        jumlahUpdate,
        bulan,
        tahun
      );
    }

    // Update data pemasukan
    const dataUpdate = {
      ...dataAsli,
      ...(kategoriBaru !== null && { kategori: kategoriBaru }),
      ...(uraianBaru !== null && { uraian: uraianBaru }),
      ...(jumlahBaru !== null && { jumlah: jumlahBaru }),
      tanggalUpdate: ambilTimestampSekarang()
    };

    await set(refPemasukan, dataUpdate);
    return dataUpdate;
  } catch (error) {
    throw new Error(`Gagal edit data pemasukan: ${error.message}`);
  }
};

/**
 * Helper function untuk mengupdate ALL Pemasukan saat edit data
 * Mengurangi nilai lama dan menambahkan nilai baru
 * 
 * @param {string} kategoriLama - Kategori sebelumnya
 * @param {number} jumlahLama - Jumlah sebelumnya
 * @param {string} kategoriBaru - Kategori baru
 * @param {number} jumlahBaru - Jumlah baru
 * @param {number} bulan - Bulan
 * @param {number} tahun - Tahun
 */
const updateAllPemasukanPadaEdit = async (
  kategoriLama,
  jumlahLama,
  kategoriBaru,
  jumlahBaru,
  bulan,
  tahun
) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPemasukan = ref(database, `${PATH_ALL_PEMASUKAN}/${key}`);
    const snapshot = await get(refAllPemasukan);

    if (!snapshot.exists()) {
      throw new Error('Data ALL Pemasukan tidak ditemukan');
    }

    const dataAll = snapshot.val();

    // Kurangi nilai lama
    const indexLama = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategoriLama
    );

    if (indexLama !== -1) {
      dataAll.kategoriList[indexLama].jumlahTotal -= jumlahLama;
      
      // Hapus jika total menjadi 0 atau negatif
      if (dataAll.kategoriList[indexLama].jumlahTotal <= 0) {
        dataAll.kategoriList.splice(indexLama, 1);
      }
    }

    // Tambahkan nilai baru
    const indexBaru = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategoriBaru
    );

    if (indexBaru !== -1) {
      dataAll.kategoriList[indexBaru].jumlahTotal += jumlahBaru;
    } else {
      dataAll.kategoriList.push({
        namaKategori: kategoriBaru,
        jumlahTotal: jumlahBaru
      });
    }

    await set(refAllPemasukan, dataAll);
  } catch (error) {
    throw new Error(`Gagal update ALL Pemasukan pada edit: ${error.message}`);
  }
};

// // ==========================================
// // FUNGSI 10: EDIT DATA PENGELUARAN BY ID
// // ==========================================

// /**
//  * Mengedit data pengeluaran berdasarkan ID
//  * Otomatis mengupdate ALL Pengeluaran sesuai perubahan
//  * 
//  * @param {string} id - ID pengeluaran yang akan diedit
//  * @param {string} kategoriBaru - Kategori baru (opsional, kirim null jika tidak berubah)
//  * @param {number} jumlahBaru - Jumlah baru (opsional, kirim null jika tidak berubah)
//  * @returns {Promise<object>} Data pengeluaran yang telah diupdate
//  */
// export const editDataPengeluaran = async (id, kategoriBaru = null, jumlahBaru = null) => {
//   try {
//     if (!id) {
//       throw new Error('ID pengeluaran harus diisi');
//     }

//     // Ambil data asli
//     const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
//     const snapshot = await get(refPengeluaran);

//     if (!snapshot.exists()) {
//       throw new Error('Data pengeluaran tidak ditemukan');
//     }

//     const dataAsli = snapshot.val();
//     const { bulan, tahun } = ambilBulanTahun(dataAsli.tanggal);

//     // Deteksi perubahan
//     const kategoriBerobah = kategoriBaru !== null && kategoriBaru !== dataAsli.kategori;
//     const jumlahBerobah = jumlahBaru !== null && jumlahBaru !== dataAsli.jumlah;

//     if (!kategoriBerobah && !jumlahBerobah) {
//       return dataAsli; // Tidak ada perubahan
//     }

//     // Update ALL Pengeluaran berdasarkan perubahan
//     if (kategoriBerobah && jumlahBerobah) {
//       // Keduanya berubah
//       await updateAllPengeluaranPadaEdit(
//         dataAsli.kategori,
//         dataAsli.jumlah,
//         kategoriBaru,
//         jumlahBaru,
//         bulan,
//         tahun
//       );
//     } else if (kategoriBerobah) {
//       // Hanya kategori berubah
//       await updateAllPengeluaranPadaEdit(
//         dataAsli.kategori,
//         dataAsli.jumlah,
//         kategoriBaru,
//         dataAsli.jumlah,
//         bulan,
//         tahun
//       );
//     } else if (jumlahBerobah) {
//       // Hanya jumlah berubah
//       await updateAllPengeluaranPadaEdit(
//         dataAsli.kategori,
//         dataAsli.jumlah,
//         dataAsli.kategori,
//         jumlahBaru,
//         bulan,
//         tahun
//       );
//     }

//     // Update data pengeluaran
//     const dataUpdate = {
//       ...dataAsli,
//       ...(kategoriBaru !== null && { kategori: kategoriBaru }),
//       ...(jumlahBaru !== null && { jumlah: jumlahBaru }),
//       tanggalUpdate: ambilTimestampSekarang()
//     };

//     await set(refPengeluaran, dataUpdate);
//     return dataUpdate;
//   } catch (error) {
//     throw new Error(`Gagal edit data pengeluaran: ${error.message}`);
//   }
// };

// ==========================================
// FUNGSI 10: EDIT DATA PENGELUARAN (DIPERBAIKI)
// ==========================================

/**
 * Mengedit data pengeluaran berdasarkan ID
 * DIPERBAIKI: Bisa edit uraian juga
 * 
 * @param {string} id - ID pengeluaran yang akan diedit
 * @param {string} kategoriBaru - Kategori baru (opsional, kirim null jika tidak berubah)
 * @param {string} uraianBaru - Uraian baru (opsional, kirim null jika tidak berubah)
 * @param {number} jumlahBaru - Jumlah baru (opsional, kirim null jika tidak berubah)
 * @returns {Promise<object>} Data pengeluaran yang telah diupdate
 */
export const editDataPengeluaran = async (id, kategoriBaru = null, uraianBaru = null, jumlahBaru = null) => {
  try {
    if (!id) {
      throw new Error('ID pengeluaran harus diisi');
    }

    // Ambil data asli
    const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
    const snapshot = await get(refPengeluaran);

    if (!snapshot.exists()) {
      throw new Error('Data pengeluaran tidak ditemukan');
    }

    const dataAsli = snapshot.val();
    const { bulan, tahun } = ambilBulanTahun(dataAsli.tanggal);

    // Deteksi perubahan
    const kategoriBerobah = kategoriBaru !== null && kategoriBaru !== dataAsli.kategori;
    const uraianBerobah = uraianBaru !== null && uraianBaru !== dataAsli.uraian;
    const jumlahBerobah = jumlahBaru !== null && jumlahBaru !== dataAsli.jumlah;

    if (!kategoriBerobah && !jumlahBerobah && !uraianBerobah) {
      return dataAsli; // Tidak ada perubahan
    }

    // Update ALL Pengeluaran hanya jika kategori atau jumlah berubah
    if (kategoriBerobah || jumlahBerobah) {
      const kategoriUpdate = kategoriBaru !== null ? kategoriBaru : dataAsli.kategori;
      const jumlahUpdate = jumlahBaru !== null ? jumlahBaru : dataAsli.jumlah;
      
      await updateAllPengeluaranPadaEdit(
        dataAsli.kategori,
        dataAsli.jumlah,
        kategoriUpdate,
        jumlahUpdate,
        bulan,
        tahun
      );
    }

    // Update data pengeluaran
    const dataUpdate = {
      ...dataAsli,
      ...(kategoriBaru !== null && { kategori: kategoriBaru }),
      ...(uraianBaru !== null && { uraian: uraianBaru }),
      ...(jumlahBaru !== null && { jumlah: jumlahBaru }),
      tanggalUpdate: ambilTimestampSekarang()
    };

    await set(refPengeluaran, dataUpdate);
    return dataUpdate;
  } catch (error) {
    throw new Error(`Gagal edit data pengeluaran: ${error.message}`);
  }
};

/**
 * Helper function untuk mengupdate ALL Pengeluaran saat edit data
 * Mengurangi nilai lama dan menambahkan nilai baru
 * 
 * @param {string} kategoriLama - Kategori sebelumnya
 * @param {number} jumlahLama - Jumlah sebelumnya
 * @param {string} kategoriBaru - Kategori baru
 * @param {number} jumlahBaru - Jumlah baru
 * @param {number} bulan - Bulan
 * @param {number} tahun - Tahun
 */
const updateAllPengeluaranPadaEdit = async (
  kategoriLama,
  jumlahLama,
  kategoriBaru,
  jumlahBaru,
  bulan,
  tahun
) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPengeluaran = ref(database, `${PATH_ALL_PENGELUARAN}/${key}`);
    const snapshot = await get(refAllPengeluaran);

    if (!snapshot.exists()) {
      throw new Error('Data ALL Pengeluaran tidak ditemukan');
    }

    const dataAll = snapshot.val();

    // Kurangi nilai lama
    const indexLama = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategoriLama
    );

    if (indexLama !== -1) {
      dataAll.kategoriList[indexLama].jumlahTotal -= jumlahLama;
      
      // Hapus jika total menjadi 0 atau negatif
      if (dataAll.kategoriList[indexLama].jumlahTotal <= 0) {
        dataAll.kategoriList.splice(indexLama, 1);
      }
    }

    // Tambahkan nilai baru
    const indexBaru = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategoriBaru
    );

    if (indexBaru !== -1) {
      dataAll.kategoriList[indexBaru].jumlahTotal += jumlahBaru;
    } else {
      dataAll.kategoriList.push({
        namaKategori: kategoriBaru,
        jumlahTotal: jumlahBaru
      });
    }

    await set(refAllPengeluaran, dataAll);
  } catch (error) {
    throw new Error(`Gagal update ALL Pengeluaran pada edit: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 11: HAPUS DATA PEMASUKAN BY ID
// ==========================================

/**
 * Menghapus data pemasukan berdasarkan ID
 * Otomatis mengupdate ALL Pemasukan
 * 
 * @param {string} id - ID pemasukan yang akan dihapus
 * @returns {Promise<object>} Status penghapusan
 */
export const hapusDataPemasukan = async (id) => {
  try {
    if (!id) {
      throw new Error('ID pemasukan harus diisi');
    }

    // Ambil data yang akan dihapus
    const refPemasukan = ref(database, `${PATH_PEMASUKAN}/${id}`);
    const snapshot = await get(refPemasukan);

    if (!snapshot.exists()) {
      throw new Error('Data pemasukan tidak ditemukan');
    }

    const dataHapus = snapshot.val();
    const { bulan, tahun } = ambilBulanTahun(dataHapus.tanggal);

    // Update ALL Pemasukan (kurangi jumlah)
    await updateAllPemasukanPadaHapus(
      dataHapus.kategori,
      dataHapus.jumlah,
      bulan,
      tahun
    );

    // Hapus data dari tabel pemasukan
    await remove(refPemasukan);

    return {
      sukses: true,
      dataYangDihapus: dataHapus
    };
  } catch (error) {
    throw new Error(`Gagal hapus data pemasukan: ${error.message}`);
  }
};

/**
 * Helper function untuk mengupdate ALL Pemasukan saat hapus data
 * Mengurangi jumlah dari kategori yang sesuai
 * 
 * @param {string} kategori - Kategori yang akan dikurangi
 * @param {number} jumlah - Jumlah yang akan dikurangi
 * @param {number} bulan - Bulan
 * @param {number} tahun - Tahun
 */
const updateAllPemasukanPadaHapus = async (kategori, jumlah, bulan, tahun) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPemasukan = ref(database, `${PATH_ALL_PEMASUKAN}/${key}`);
    const snapshot = await get(refAllPemasukan);

    if (!snapshot.exists()) {
      return; // Data tidak ada, tidak perlu update
    }

    const dataAll = snapshot.val();

    // Kurangi jumlah dari kategori
    const indexKategori = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategori
    );

    if (indexKategori !== -1) {
      dataAll.kategoriList[indexKategori].jumlahTotal -= jumlah;

      // Hapus kategori jika total menjadi 0 atau negatif
      if (dataAll.kategoriList[indexKategori].jumlahTotal <= 0) {
        dataAll.kategoriList.splice(indexKategori, 1);
      }

      // Jika kategoriList kosong, hapus seluruh data
      if (dataAll.kategoriList.length === 0) {
        await remove(refAllPemasukan);
      } else {
        await set(refAllPemasukan, dataAll);
      }
    }
  } catch (error) {
    throw new Error(`Gagal update ALL Pemasukan pada hapus: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 12: HAPUS DATA PENGELUARAN BY ID
// ==========================================

/**
 * Menghapus data pengeluaran berdasarkan ID
 * Otomatis mengupdate ALL Pengeluaran
 * 
 * @param {string} id - ID pengeluaran yang akan dihapus
 * @returns {Promise<object>} Status penghapusan
 */
export const hapusDataPengeluaran = async (id) => {
  try {
    if (!id) {
      throw new Error('ID pengeluaran harus diisi');
    }

    // Ambil data yang akan dihapus
    const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
    const snapshot = await get(refPengeluaran);

    if (!snapshot.exists()) {
      throw new Error('Data pengeluaran tidak ditemukan');
    }

    const dataHapus = snapshot.val();
    const { bulan, tahun } = ambilBulanTahun(dataHapus.tanggal);

    // Update ALL Pengeluaran (kurangi jumlah)
    await updateAllPengeluaranPadaHapus(
      dataHapus.kategori,
      dataHapus.jumlah,
      bulan,
      tahun
    );

    // Hapus data dari tabel pengeluaran
    await remove(refPengeluaran);

    return {
      sukses: true,
      dataYangDihapus: dataHapus
    };
  } catch (error) {
    throw new Error(`Gagal hapus data pengeluaran: ${error.message}`);
  }
};

/**
 * Helper function untuk mengupdate ALL Pengeluaran saat hapus data
 * Mengurangi jumlah dari kategori yang sesuai
 * 
 * @param {string} kategori - Kategori yang akan dikurangi
 * @param {number} jumlah - Jumlah yang akan dikurangi
 * @param {number} bulan - Bulan
 * @param {number} tahun - Tahun
 */
const updateAllPengeluaranPadaHapus = async (kategori, jumlah, bulan, tahun) => {
  try {
    const key = buatKeyBulanTahun(bulan, tahun);
    const refAllPengeluaran = ref(database, `${PATH_ALL_PENGELUARAN}/${key}`);
    const snapshot = await get(refAllPengeluaran);

    if (!snapshot.exists()) {
      return; // Data tidak ada, tidak perlu update
    }

    const dataAll = snapshot.val();

    // Kurangi jumlah dari kategori
    const indexKategori = dataAll.kategoriList.findIndex(
      item => item.namaKategori === kategori
    );

    if (indexKategori !== -1) {
      dataAll.kategoriList[indexKategori].jumlahTotal -= jumlah;

      // Hapus kategori jika total menjadi 0 atau negatif
      if (dataAll.kategoriList[indexKategori].jumlahTotal <= 0) {
        dataAll.kategoriList.splice(indexKategori, 1);
      }

      // Jika kategoriList kosong, hapus seluruh data
      if (dataAll.kategoriList.length === 0) {
        await remove(refAllPengeluaran);
      } else {
        await set(refAllPengeluaran, dataAll);
      }
    }
  } catch (error) {
    throw new Error(`Gagal update ALL Pengeluaran pada hapus: ${error.message}`);
  }
};

// ==========================================
// FUNGSI 13: REVIEW PEMASUKAN DAN PENGELUARAN BULANAN
// ==========================================

/**
 * Mengambil ringkasan pemasukan dan pengeluaran untuk bulan tertentu
 * Menampilkan total per kategori untuk frontend
 * 
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun (YYYY)
 * @returns {Promise<object>} Data review bulanan
 */
export const reviewPemasukanPengeluaranBulanan = async (bulan, tahun) => {
  try {
    if (!bulan || !tahun) {
      throw new Error('Bulan dan tahun harus diisi');
    }

    const key = buatKeyBulanTahun(bulan, tahun);

    // Ambil data ALL Pemasukan
    const refAllPemasukan = ref(database, `${PATH_ALL_PEMASUKAN}/${key}`);
    const snapshotPemasukan = await get(refAllPemasukan);

    // Ambil data ALL Pengeluaran
    const refAllPengeluaran = ref(database, `${PATH_ALL_PENGELUARAN}/${key}`);
    const snapshotPengeluaran = await get(refAllPengeluaran);

    const hasil = {
      bulan,
      tahun,
      pemasukan: {
        kategoriList: [],
        totalKeseluruhan: 0
      },
      pengeluaran: {
        kategoriList: [],
        totalKeseluruhan: 0
      },
      saldo: 0
    };

    // Proses data pemasukan
    if (snapshotPemasukan.exists()) {
      const dataPemasukan = snapshotPemasukan.val();
      hasil.pemasukan.kategoriList = dataPemasukan.kategoriList || [];
      hasil.pemasukan.totalKeseluruhan = hasil.pemasukan.kategoriList.reduce(
        (total, item) => total + item.jumlahTotal,
        0
      );
    }

    // Proses data pengeluaran
    if (snapshotPengeluaran.exists()) {
      const dataPengeluaran = snapshotPengeluaran.val();
      hasil.pengeluaran.kategoriList = dataPengeluaran.kategoriList || [];
      hasil.pengeluaran.totalKeseluruhan = hasil.pengeluaran.kategoriList.reduce(
        (total, item) => total + item.jumlahTotal,
        0
      );
    }

    // Hitung saldo (pemasukan - pengeluaran)
    hasil.saldo = hasil.pemasukan.totalKeseluruhan - hasil.pengeluaran.totalKeseluruhan;

    return hasil;
  } catch (error) {
    throw new Error(`Gagal review pemasukan pengeluaran bulanan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI TAMBAHAN: AMBIL SEMUA KATEGORI
// ==========================================

/**
 * Mengambil semua kategori yang tersedia
 * Berguna untuk dropdown/select di frontend
 * 
 * @returns {Promise<object>} Object berisi list kategori pemasukan dan pengeluaran
 */
export const ambilSemuaKategori = async () => {
  try {
    const refKategori = ref(database, PATH_KATEGORI);
    const snapshot = await get(refKategori);

    if (!snapshot.exists()) {
      return {
        pemasukan: [],
        pengeluaran: []
      };
    }

    return snapshot.val();
  } catch (error) {
    throw new Error(`Gagal mengambil kategori: ${error.message}`);
  }
};

// ==========================================
// FUNGSI TAMBAHAN: AMBIL DETAIL PEMASUKAN BY ID
// ==========================================

/**
 * Mengambil detail pemasukan berdasarkan ID
 * 
 * @param {string} id - ID pemasukan
 * @returns {Promise<object>} Data pemasukan
 */
export const ambilDetailPemasukan = async (id) => {
  try {
    const refPemasukan = ref(database, `${PATH_PEMASUKAN}/${id}`);
    const snapshot = await get(refPemasukan);

    if (!snapshot.exists()) {
      throw new Error('Data pemasukan tidak ditemukan');
    }

    return snapshot.val();
  } catch (error) {
    throw new Error(`Gagal mengambil detail pemasukan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI TAMBAHAN: AMBIL DETAIL PENGELUARAN BY ID
// ==========================================

/**
 * Mengambil detail pengeluaran berdasarkan ID
 * 
 * @param {string} id - ID pengeluaran
 * @returns {Promise<object>} Data pengeluaran
 */
export const ambilDetailPengeluaran = async (id) => {
  try {
    const refPengeluaran = ref(database, `${PATH_PENGELUARAN}/${id}`);
    const snapshot = await get(refPengeluaran);

    if (!snapshot.exists()) {
      throw new Error('Data pengeluaran tidak ditemukan');
    }

    return snapshot.val();
  } catch (error) {
    throw new Error(`Gagal mengambil detail pengeluaran: ${error.message}`);
  }
};

// ==========================================
// FUNGSI TAMBAHAN: AMBIL SEMUA ALL PEMASUKAN
// ==========================================

/**
 * Mengambil semua data agregat pemasukan
 * Menampilkan semua periode yang ada
 * 
 * @returns {Promise<Array>} Array data ALL Pemasukan
 */
export const ambilSemuaAllPemasukan = async () => {
  try {
    const refAllPemasukan = ref(database, PATH_ALL_PEMASUKAN);
    const snapshot = await get(refAllPemasukan);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    return Object.values(data);
  } catch (error) {
    throw new Error(`Gagal mengambil semua ALL Pemasukan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI TAMBAHAN: AMBIL SEMUA ALL PENGELUARAN
// ==========================================

/**
 * Mengambil semua data agregat pengeluaran
 * Menampilkan semua periode yang ada
 * 
 * @returns {Promise<Array>} Array data ALL Pengeluaran
 */
export const ambilSemuaAllPengeluaran = async () => {
  try {
    const refAllPengeluaran = ref(database, PATH_ALL_PENGELUARAN);
    const snapshot = await get(refAllPengeluaran);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    return Object.values(data);
  } catch (error) {
    throw new Error(`Gagal mengambil semua ALL Pengeluaran: ${error.message}`);
  }
};


// fungsi-tambahan-be.js
// Fungsi tambahan untuk mendukung fitur frontend

import * as XLSX from 'xlsx';

// ==========================================
// FUNGSI: AMBIL TOTAL KESELURUHAN
// ==========================================

/**
 * Mengambil total keseluruhan pemasukan dan pengeluaran
 * Berguna untuk dashboard
 * 
 * @returns {Promise<object>} Object dengan total pemasukan dan pengeluaran
 */
export const ambilTotalKeseluruhan = async () => {
  try {
    // Ambil semua data pemasukan
    const refPemasukan = ref(database, 'pemasukan');
    const snapshotPemasukan = await get(refPemasukan);
    
    let totalPemasukan = 0;
    if (snapshotPemasukan.exists()) {
      const dataPemasukan = snapshotPemasukan.val();
      totalPemasukan = Object.values(dataPemasukan).reduce(
        (total, item) => total + item.jumlah,
        0
      );
    }

    // Ambil semua data pengeluaran
    const refPengeluaran = ref(database, 'pengeluaran');
    const snapshotPengeluaran = await get(refPengeluaran);
    
    let totalPengeluaran = 0;
    if (snapshotPengeluaran.exists()) {
      const dataPengeluaran = snapshotPengeluaran.val();
      totalPengeluaran = Object.values(dataPengeluaran).reduce(
        (total, item) => total + item.jumlah,
        0
      );
    }

    return {
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran
    };
  } catch (error) {
    throw new Error(`Gagal mengambil total keseluruhan: ${error.message}`);
  }
};

// ==========================================
// FUNGSI: AMBIL DATA DASHBOARD
// ==========================================

/**
 * Mengambil semua data yang diperlukan untuk dashboard
 * Menggabungkan total keseluruhan dan data bulan berjalan
 * 
 * @returns {Promise<object>} Data dashboard lengkap
 */
export const ambilDataDashboard = async () => {
  try {
    const sekarang = new Date();
    const bulanSekarang = sekarang.getMonth() + 1;
    const tahunSekarang = sekarang.getFullYear();

    // Ambil total keseluruhan
    const totalKeseluruhan = await ambilTotalKeseluruhan();

    // Ambil data bulan berjalan
    const key = `${tahunSekarang}_${bulanSekarang.toString().padStart(2, '0')}`;
    
    const refAllPemasukan = ref(database, `allPemasukan/${key}`);
    const refAllPengeluaran = ref(database, `allPengeluaran/${key}`);

    const snapshotPemasukan = await get(refAllPemasukan);
    const snapshotPengeluaran = await get(refAllPengeluaran);

    const bulanIni = {
      bulan: bulanSekarang,
      tahun: tahunSekarang,
      pemasukan: {
        kategoriList: [],
        totalKeseluruhan: 0
      },
      pengeluaran: {
        kategoriList: [],
        totalKeseluruhan: 0
      },
      saldo: 0
    };

    if (snapshotPemasukan.exists()) {
      const dataPemasukan = snapshotPemasukan.val();
      bulanIni.pemasukan.kategoriList = dataPemasukan.kategoriList || [];
      bulanIni.pemasukan.totalKeseluruhan = bulanIni.pemasukan.kategoriList.reduce(
        (total, item) => total + item.jumlahTotal,
        0
      );
    }

    if (snapshotPengeluaran.exists()) {
      const dataPengeluaran = snapshotPengeluaran.val();
      bulanIni.pengeluaran.kategoriList = dataPengeluaran.kategoriList || [];
      bulanIni.pengeluaran.totalKeseluruhan = bulanIni.pengeluaran.kategoriList.reduce(
        (total, item) => total + item.jumlahTotal,
        0
      );
    }

    bulanIni.saldo = bulanIni.pemasukan.totalKeseluruhan - bulanIni.pengeluaran.totalKeseluruhan;

    return {
      totalKeseluruhan,
      bulanIni
    };
  } catch (error) {
    throw new Error(`Gagal mengambil data dashboard: ${error.message}`);
  }
};

// ==========================================
// FUNGSI: AMBIL DATA UNTUK GRAFIK
// ==========================================

/**
 * Mengambil data untuk grafik dashboard (6 bulan terakhir)
 * 
 * @returns {Promise<Array>} Array data untuk grafik
 */
export const ambilDataGrafik = async () => {
  try {
    const sekarang = new Date();
    const dataGrafik = [];

    // Ambil data 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
      const tanggal = new Date(sekarang);
      tanggal.setMonth(tanggal.getMonth() - i);
      
      const bulan = tanggal.getMonth() + 1;
      const tahun = tanggal.getFullYear();
      const key = `${tahun}_${bulan.toString().padStart(2, '0')}`;

      const refAllPemasukan = ref(database, `allPemasukan/${key}`);
      const refAllPengeluaran = ref(database, `allPengeluaran/${key}`);

      const snapshotPemasukan = await get(refAllPemasukan);
      const snapshotPengeluaran = await get(refAllPengeluaran);

      let totalPemasukan = 0;
      let totalPengeluaran = 0;

      if (snapshotPemasukan.exists()) {
        const data = snapshotPemasukan.val();
        totalPemasukan = data.kategoriList.reduce(
          (total, item) => total + item.jumlahTotal,
          0
        );
      }

      if (snapshotPengeluaran.exists()) {
        const data = snapshotPengeluaran.val();
        totalPengeluaran = data.kategoriList.reduce(
          (total, item) => total + item.jumlahTotal,
          0
        );
      }

      const namaBulan = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      dataGrafik.push({
        bulan: namaBulan[bulan - 1],
        pemasukan: totalPemasukan,
        pengeluaran: totalPengeluaran,
        saldo: totalPemasukan - totalPengeluaran
      });
    }

    return dataGrafik;
  } catch (error) {
    throw new Error(`Gagal mengambil data grafik: ${error.message}`);
  }
};


// ==========================================
// FUNGSI BARU: FILTER DATA TRANSAKSI LANJUTAN
// ==========================================

/**
 * Filter data transaksi dengan berbagai kriteria
 * FUNGSI BARU untuk support filter detail di halaman riwayat
 * 
 * @param {object} filter - Object filter dengan property:
 *   - jenisTranaksi: 'pemasukan' | 'pengeluaran' | null (semua)
 *   - kategori: string | null
 *   - bulan: number (1-12) | null
 *   - tahun: number (YYYY) | null
 *   - urutan: 'tanggal-terbaru' | 'tanggal-terlama'
 * @returns {Promise<Array>} Array data transaksi yang sudah difilter
 */
export const filterDataTransaksi = async (filter = {}) => {
  try {
    const {
      jenisTransaksi = null,
      kategori = null,
      bulan = null,
      tahun = null,
      urutan = 'tanggal-terbaru'
    } = filter;

    let hasilFilter = [];

    // Ambil data sesuai jenis transaksi
    if (jenisTransaksi === 'pemasukan' || jenisTransaksi === null) {
      const dataPemasukan = await ambilDataPemasukan();
      const pemasukanDenganTipe = dataPemasukan.map(item => ({
        ...item,
        tipeTransaksi: 'pemasukan'
      }));
      hasilFilter = [...hasilFilter, ...pemasukanDenganTipe];
    }

    if (jenisTransaksi === 'pengeluaran' || jenisTransaksi === null) {
      const dataPengeluaran = await ambilDataPengeluaran();
      const pengeluaranDenganTipe = dataPengeluaran.map(item => ({
        ...item,
        tipeTransaksi: 'pengeluaran'
      }));
      hasilFilter = [...hasilFilter, ...pengeluaranDenganTipe];
    }

    // Filter berdasarkan kategori
    if (kategori !== null && kategori !== '') {
      hasilFilter = hasilFilter.filter(item => item.kategori === kategori);
    }

    // Filter berdasarkan bulan dan/atau tahun
    if (bulan !== null || tahun !== null) {
      hasilFilter = hasilFilter.filter(item => {
        const { bulan: itemBulan, tahun: itemTahun } = ambilBulanTahun(item.tanggal);
        
        let cocok = true;
        if (bulan !== null && itemBulan !== bulan) cocok = false;
        if (tahun !== null && itemTahun !== tahun) cocok = false;
        
        return cocok;
      });
    }

    // Urutkan berdasarkan pilihan
    switch (urutan) {
      case 'tanggal-terbaru':
        hasilFilter.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        break;
      case 'tanggal-terlama':
        hasilFilter.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        break;
      default:
        break;
    }

    return hasilFilter;
  } catch (error) {
    throw new Error(`Gagal filter data transaksi: ${error.message}`);
  }
};
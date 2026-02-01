// utilitas.js
// File ini berisi fungsi-fungsi helper yang digunakan di berbagai tempat

/**
 * Menghasilkan ID unik untuk data baru
 * Format: timestamp + random string
 * @returns {string} ID unik
 */
export const buatIdUnik = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${randomStr}`;
};

/**
 * Mendapatkan bulan dan tahun dari tanggal
 * @param {string} tanggal - Format: YYYY-MM-DD atau timestamp
 * @returns {object} Object dengan property bulan dan tahun
 */
export const ambilBulanTahun = (tanggal) => {
  const date = new Date(tanggal);
  const bulan = date.getMonth() + 1; // 1-12
  const tahun = date.getFullYear();
  
  return { bulan, tahun };
};

/**
 * Memformat tanggal ke ISO string
 * @param {string|Date} tanggal - Tanggal yang akan diformat
 * @returns {string} Tanggal dalam format ISO
 */
export const formatTanggal = (tanggal) => {
  return new Date(tanggal).toISOString();
};

/**
 * Mendapatkan timestamp saat ini
 * @returns {string} Timestamp dalam format ISO
 */
export const ambilTimestampSekarang = () => {
  return new Date().toISOString();
};

/**
 * Validasi apakah nilai adalah angka positif
 * @param {number} nilai - Nilai yang akan divalidasi
 * @returns {boolean} True jika valid
 */
export const validasiAngkaPositif = (nilai) => {
  return typeof nilai === 'number' && nilai > 0;
};

/**
 * Validasi apakah string tidak kosong
 * @param {string} str - String yang akan divalidasi
 * @returns {boolean} True jika valid
 */
export const validasiStringTidakKosong = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * Membuat key untuk data berdasarkan bulan dan tahun
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun (YYYY)
 * @returns {string} Key dalam format "YYYY_MM"
 */
export const buatKeyBulanTahun = (bulan, tahun) => {
  const bulanStr = bulan.toString().padStart(2, '0');
  return `${tahun}_${bulanStr}`;
};

/**
 * Parse key bulan tahun menjadi object
 * @param {string} key - Key dalam format "YYYY_MM"
 * @returns {object} Object dengan property bulan dan tahun
 */
export const parseKeyBulanTahun = (key) => {
  const [tahun, bulan] = key.split('_');
  return {
    bulan: parseInt(bulan),
    tahun: parseInt(tahun)
  };
};

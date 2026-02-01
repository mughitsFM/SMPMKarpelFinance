# 📊 Manajemen Keuangan Firebase Realtime Database

Sistem manajemen keuangan lengkap menggunakan Firebase Realtime Database dengan JavaScript.

## 📁 Struktur File

```
├── .env                        # File konfigurasi (buat sendiri dari .env.example)
├── .env.example                # Template konfigurasi Firebase
├── konfigurasi-firebase.js     # Setup koneksi Firebase
├── utilitas.js                 # Fungsi-fungsi helper
├── manajemen-keuangan.js       # File utama dengan semua fungsi
├── contoh-penggunaan.js        # Contoh penggunaan fungsi
└── README.md                   # Dokumentasi ini
```

## 🗄️ Struktur Database Firebase

### 1. Tabel `pemasukan`
```json
{
  "pemasukan": {
    "1234567890_abc123": {
      "id": "1234567890_abc123",
      "kategori": "Gaji",
      "tanggal": "2026-01-15T00:00:00.000Z",
      "jumlah": 5000000,
      "tanggalUpdate": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Tabel `pengeluaran`
```json
{
  "pengeluaran": {
    "1234567890_def456": {
      "id": "1234567890_def456",
      "kategori": "Makanan",
      "tanggal": "2026-01-20T00:00:00.000Z",
      "jumlah": 500000,
      "tanggalUpdate": "2026-01-20T15:45:00.000Z"
    }
  }
}
```

### 3. Tabel `allPemasukan`
```json
{
  "allPemasukan": {
    "2026_01": {
      "id": "2026_01",
      "bulan": 1,
      "tahun": 2026,
      "kategoriList": [
        {
          "namaKategori": "Gaji",
          "jumlahTotal": 5000000
        },
        {
          "namaKategori": "Bonus",
          "jumlahTotal": 2000000
        }
      ]
    }
  }
}
```

### 4. Tabel `allPengeluaran`
```json
{
  "allPengeluaran": {
    "2026_01": {
      "id": "2026_01",
      "bulan": 1,
      "tahun": 2026,
      "kategoriList": [
        {
          "namaKategori": "Makanan",
          "jumlahTotal": 1500000
        },
        {
          "namaKategori": "Transport",
          "jumlahTotal": 500000
        }
      ]
    }
  }
}
```

### 5. Tabel `kategori`
```json
{
  "kategori": {
    "pemasukan": [
      {
        "id": "1234567890_xyz",
        "namaKategori": "Gaji"
      },
      {
        "id": "1234567891_xyz",
        "namaKategori": "Bonus"
      }
    ],
    "pengeluaran": [
      {
        "id": "1234567892_xyz",
        "namaKategori": "Makanan"
      },
      {
        "id": "1234567893_xyz",
        "namaKategori": "Transport"
      }
    ]
  }
}
```

## 🚀 Setup & Instalasi

### 1. Install Dependencies
```bash
npm install firebase dotenv
```

### 2. Setup Environment Variables
Salin file `.env.example` menjadi `.env` dan isi dengan kredensial Firebase Anda:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3. Cara Mendapatkan Kredensial Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih atau buat project baru
3. Klik ⚙️ (Settings) > Project Settings
4. Scroll ke bagian "Your apps"
5. Klik ikon Web (</>) untuk membuat web app
6. Salin konfigurasi yang muncul ke file `.env`
7. Aktifkan Realtime Database di menu Build > Realtime Database

## 📚 Daftar Fungsi

### Fungsi Utama

| No | Nama Fungsi | Deskripsi |
|----|-------------|-----------|
| 1 | `kelolaInputUser()` | Mengelola input batch pemasukan & pengeluaran dari user |
| 2 | `tambahPemasukan()` | Menambah data pemasukan baru |
| 3 | `tambahPengeluaran()` | Menambah data pengeluaran baru |
| 4 | `updateAllPemasukan()` | Update agregat pemasukan bulanan |
| 5 | `updateAllPengeluaran()` | Update agregat pengeluaran bulanan |
| 6 | `tambahKategori()` | Menambah kategori baru (batch) |
| 7 | `ambilDataPemasukan()` | Mengambil data pemasukan dengan filter |
| 8 | `ambilDataPengeluaran()` | Mengambil data pengeluaran dengan filter |
| 9 | `editDataPemasukan()` | Edit data pemasukan by ID |
| 10 | `editDataPengeluaran()` | Edit data pengeluaran by ID |
| 11 | `hapusDataPemasukan()` | Hapus data pemasukan by ID |
| 12 | `hapusDataPengeluaran()` | Hapus data pengeluaran by ID |
| 13 | `reviewPemasukanPengeluaranBulanan()` | Review/ringkasan bulanan |

### Fungsi Tambahan

| Nama Fungsi | Deskripsi |
|-------------|-----------|
| `ambilSemuaKategori()` | Mengambil semua kategori |
| `ambilDetailPemasukan()` | Ambil detail pemasukan by ID |
| `ambilDetailPengeluaran()` | Ambil detail pengeluaran by ID |
| `ambilSemuaAllPemasukan()` | Ambil semua agregat pemasukan |
| `ambilSemuaAllPengeluaran()` | Ambil semua agregat pengeluaran |

### Fungsi Helper (dari utilitas.js)

| Nama Fungsi | Deskripsi |
|-------------|-----------|
| `buatIdUnik()` | Generate ID unik |
| `ambilBulanTahun()` | Extract bulan & tahun dari tanggal |
| `formatTanggal()` | Format tanggal ke ISO string |
| `ambilTimestampSekarang()` | Get timestamp sekarang |
| `validasiAngkaPositif()` | Validasi angka positif |
| `validasiStringTidakKosong()` | Validasi string tidak kosong |
| `buatKeyBulanTahun()` | Buat key format YYYY_MM |
| `parseKeyBulanTahun()` | Parse key menjadi object |

## 💡 Cara Penggunaan

### 1. Import Fungsi

```javascript
import {
  kelolaInputUser,
  tambahPemasukan,
  reviewPemasukanPengeluaranBulanan
} from './manajemen-keuangan.js';
```

### 2. Tambah Kategori

```javascript
const listKategori = [
  { tipe: 'pemasukan', nama: 'Gaji' },
  { tipe: 'pemasukan', nama: 'Bonus' },
  { tipe: 'pengeluaran', nama: 'Makanan' },
  { tipe: 'pengeluaran', nama: 'Transport' }
];

const hasil = await tambahKategori(listKategori);
console.log(hasil);
```

### 3. Input Data Batch

```javascript
const listPemasukan = [
  { kategori: 'Gaji', tanggal: '2026-01-01', jumlah: 5000000 },
  { kategori: 'Bonus', tanggal: '2026-01-15', jumlah: 2000000 }
];

const listPengeluaran = [
  { kategori: 'Makanan', tanggal: '2026-01-05', jumlah: 1500000 },
  { kategori: 'Transport', tanggal: '2026-01-10', jumlah: 500000 }
];

const hasil = await kelolaInputUser(listPemasukan, listPengeluaran);
console.log(hasil);
```

### 4. Tambah Data Manual

```javascript
// Tambah pemasukan
const pemasukan = await tambahPemasukan('Gaji', '2026-01-15', 5000000);

// Tambah pengeluaran
const pengeluaran = await tambahPengeluaran('Makanan', '2026-01-20', 500000);
```

### 5. Ambil Data dengan Filter

```javascript
// Ambil semua pemasukan
const semua = await ambilDataPemasukan();

// Ambil pemasukan bulan Januari 2026
const januari = await ambilDataPemasukan(1, 2026);

// Ambil pemasukan tahun 2026 saja
const tahun2026 = await ambilDataPemasukan(null, 2026);
```

### 6. Edit Data

```javascript
// Edit kategori saja
await editDataPemasukan(id, 'Bonus', null);

// Edit jumlah saja
await editDataPemasukan(id, null, 6000000);

// Edit keduanya
await editDataPemasukan(id, 'Gaji', 5500000);
```

### 7. Hapus Data

```javascript
await hapusDataPemasukan(id);
await hapusDataPengeluaran(id);
```

### 8. Review Bulanan

```javascript
const review = await reviewPemasukanPengeluaranBulanan(1, 2026);

console.log('Total Pemasukan:', review.pemasukan.totalKeseluruhan);
console.log('Total Pengeluaran:', review.pengeluaran.totalKeseluruhan);
console.log('Saldo:', review.saldo);

// Detail per kategori
review.pemasukan.kategoriList.forEach(item => {
  console.log(`${item.namaKategori}: ${item.jumlahTotal}`);
});
```

## 🎯 Fitur Utama

### ✅ Otomatis Update Agregat
Setiap kali ada penambahan, edit, atau penghapusan data pemasukan/pengeluaran, sistem otomatis mengupdate tabel `allPemasukan` dan `allPengeluaran`.

### ✅ Validasi Input
Semua fungsi dilengkapi validasi input untuk memastikan data yang masuk valid.

### ✅ Error Handling
Setiap fungsi memiliki try-catch dengan pesan error yang jelas.

### ✅ Timestamp Otomatis
Setiap data memiliki `tanggalUpdate` yang otomatis ter-update saat ada perubahan.

### ✅ Batch Processing
Fungsi `kelolaInputUser()` mendukung input batch dengan hasil detail (berhasil/gagal per item).

## 🔧 Maintenance & Best Practices

### 1. Struktur Kode
- Semua fungsi menggunakan `async/await`
- Penamaan fungsi dan variabel menggunakan bahasa Indonesia
- Komentar lengkap untuk setiap fungsi
- Helper functions dipisah di file `utilitas.js`

### 2. Error Handling
```javascript
try {
  const hasil = await tambahPemasukan('Gaji', '2026-01-15', 5000000);
  console.log('Sukses:', hasil);
} catch (error) {
  console.error('Gagal:', error.message);
}
```

### 3. Validasi Data
Sebelum menyimpan ke database, sistem akan memvalidasi:
- String tidak kosong
- Angka harus positif
- Format tanggal valid

### 4. Database Rules (Opsional)
Untuk keamanan tambahan, set rules di Firebase Console:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## 📊 Alur Kerja Sistem

### Menambah Pemasukan
```
User Input
    ↓
tambahPemasukan()
    ↓
Validasi Input
    ↓
Simpan ke tabel `pemasukan`
    ↓
updateAllPemasukan()
    ↓
Update/Buat agregat di `allPemasukan`
```

### Edit Pemasukan
```
User Input (ID + Data Baru)
    ↓
editDataPemasukan()
    ↓
Ambil Data Lama
    ↓
Bandingkan & Deteksi Perubahan
    ↓
updateAllPemasukanPadaEdit()
    ├─ Kurangi nilai lama
    └─ Tambah nilai baru
    ↓
Update data di tabel `pemasukan`
```

### Hapus Pemasukan
```
User Input (ID)
    ↓
hapusDataPemasukan()
    ↓
Ambil Data yang akan dihapus
    ↓
updateAllPemasukanPadaHapus()
    ├─ Kurangi nilai dari agregat
    └─ Hapus kategori jika total = 0
    ↓
Hapus dari tabel `pemasukan`
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase'"
```bash
npm install firebase
```

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Error: "PERMISSION_DENIED"
Pastikan Firebase Realtime Database rules sudah diset dengan benar.

### Error: "Firebase configuration is invalid"
Cek kembali file `.env` apakah semua variabel sudah diisi dengan benar.

## 📝 Catatan Penting

1. **ID Unik**: Setiap data memiliki ID unik yang terdiri dari timestamp + random string
2. **Format Tanggal**: Sistem menggunakan ISO string untuk konsistensi
3. **Key Bulan/Tahun**: Format `YYYY_MM` (contoh: `2026_01`)
4. **Agregat Otomatis**: Tabel `all*` selalu sinkron dengan data transaksi
5. **Delete Cascade**: Menghapus transaksi otomatis update agregat

## 🤝 Kontribusi

Jika ada bug atau saran perbaikan, silakan buat issue atau pull request.

## 📄 Lisensi

MIT License - Bebas digunakan untuk project pribadi maupun komersial.

---

**Dibuat dengan ❤️ menggunakan Firebase Realtime Database**

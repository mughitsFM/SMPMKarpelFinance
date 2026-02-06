// SISTEM AUTENTIKASI FIREBASE - UPDATED
// File: auth-firebase.js
// Dengan fitur: Register, Login, Validasi Akun Aktif

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from './konfigurasi-firebase.js';

// Kontak pengembang (sesuaikan dengan kontak Anda)
export const KONTAK_PENGEMBANG = {
  nama: "Muhammad Fathin Mughits",
  telepon: "0895701060401",
  email: "mughitsfmwork@gmail.com",
  whatsapp: "62895701060401" // Format: 62 + nomor tanpa 0
};

// ==========================================
// FUNGSI 1: REGISTER USER BARU
// ==========================================

/**
 * Register user baru
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @param {string} username - Username/Nama lengkap
 * @returns {Promise<object>} User credential
 */
export const registerUser = async (email, password, username) => {
  try {
    // Validasi input
    if (!email || !password || !username) {
      throw new Error('Email, password, dan username harus diisi');
    }

    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    // Set persistence agar login tetap tersimpan
    await setPersistence(auth, browserLocalPersistence);

    // Buat akun di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile dengan username
    await updateProfile(user, {
      displayName: username
    });

    // Buat data akun di database dengan status TIDAK AKTIF
    const refAkun = ref(database, `akun/${user.uid}`);
    await set(refAkun, {
      idAkun: user.uid,
      username: username,
      email: email,
      saldoTotal: 0,
      saldoAwal: 0,
      saldoAwalDiSet: false,
      statusAktif: false, // AKUN BELUM AKTIF
      tanggalDaftar: new Date().toISOString(),
      tanggalDibuat: new Date().toISOString(),
      tanggalUpdate: new Date().toISOString()
    });

    return {
      sukses: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: username,
        statusAktif: false
      },
      message: 'Registrasi berhasil! Akun Anda menunggu aktivasi dari admin.'
    };

  } catch (error) {
    console.error('Error register:', error);
    
    // Handle specific error codes
    let errorMessage = 'Gagal registrasi';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email sudah terdaftar';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Format email tidak valid';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password terlalu lemah (minimal 6 karakter)';
        break;
      default:
        errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// ==========================================
// FUNGSI 2: LOGIN USER
// ==========================================

/**
 * Login user dengan email dan password
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @returns {Promise<object>} User credential
 */
export const loginUser = async (email, password) => {
  try {
    // Validasi input
    if (!email || !password) {
      throw new Error('Email dan password harus diisi');
    }

    // Set persistence agar login tetap tersimpan
    await setPersistence(auth, browserLocalPersistence);

    // Login dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Cek status aktif akun di database
    const refAkun = ref(database, `akun/${user.uid}`);
    const snapshot = await get(refAkun);

    if (!snapshot.exists()) {
      // Akun tidak ditemukan di database
      await signOut(auth);
      throw new Error('Data akun tidak ditemukan. Hubungi administrator.');
    }

    const dataAkun = snapshot.val();

    // Cek apakah akun sudah aktif
    if (!dataAkun.statusAktif) {
      // Akun belum diaktifkan
      return {
        sukses: false,
        statusAktif: false,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: dataAkun.username
        },
        message: 'Akun Anda belum diaktifkan oleh admin. Silakan hubungi admin untuk aktivasi.'
      };
    }

    // Login berhasil dan akun aktif
    return {
      sukses: true,
      statusAktif: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: dataAkun.username,
        saldoAwalDiSet: dataAkun.saldoAwalDiSet || false
      },
      message: 'Login berhasil'
    };

  } catch (error) {
    console.error('Error login:', error);
    
    // Handle specific error codes
    let errorMessage = 'Gagal login';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Format email tidak valid';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Akun ini telah dinonaktifkan';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Email tidak terdaftar';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Password salah';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Email atau password salah';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti';
        break;
      default:
        errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// ==========================================
// FUNGSI 3: LOGOUT USER
// ==========================================

/**
 * Logout user
 * @returns {Promise<object>} Logout result
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    
    return {
      sukses: true,
      message: 'Logout berhasil'
    };
  } catch (error) {
    console.error('Error logout:', error);
    throw new Error('Gagal logout: ' + error.message);
  }
};

// ==========================================
// FUNGSI 4: CEK STATUS AUTH
// ==========================================

/**
 * Cek apakah user sedang login dan apakah akunnya aktif
 * @returns {Promise<object|null>} User object atau null
 */
export const getCurrentUser = async () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            // Cek status aktif di database
            const refAkun = ref(database, `akun/${user.uid}`);
            const snapshot = await get(refAkun);

            if (!snapshot.exists()) {
              resolve(null);
              return;
            }

            const dataAkun = snapshot.val();

            // Jika akun tidak aktif, logout otomatis
            if (!dataAkun.statusAktif) {
              await signOut(auth);
              resolve(null);
              return;
            }

            resolve({
              uid: user.uid,
              email: user.email,
              displayName: dataAkun.username || user.email.split('@')[0],
              statusAktif: dataAkun.statusAktif,
              saldoAwalDiSet: dataAkun.saldoAwalDiSet || false
            });
          } catch (error) {
            console.error('Error getting user data:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      },
      reject
    );
  });
};

// ==========================================
// FUNGSI 5: LISTEN AUTH STATE CHANGES
// ==========================================

/**
 * Subscribe ke perubahan status auth
 * @param {function} callback - Fungsi yang dipanggil saat auth state berubah
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Cek status aktif di database
        const refAkun = ref(database, `akun/${user.uid}`);
        const snapshot = await get(refAkun);

        if (!snapshot.exists()) {
          callback(null);
          return;
        }

        const dataAkun = snapshot.val();

        // Jika akun tidak aktif, logout otomatis
        if (!dataAkun.statusAktif) {
          await signOut(auth);
          callback(null);
          return;
        }

        callback({
          uid: user.uid,
          email: user.email,
          displayName: dataAkun.username || user.email.split('@')[0],
          statusAktif: dataAkun.statusAktif,
          saldoAwalDiSet: dataAkun.saldoAwalDiSet || false
        });
      } catch (error) {
        console.error('Error in auth change:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// ==========================================
// FUNGSI 6: CEK APAKAH USER SUDAH LOGIN
// ==========================================

/**
 * Helper untuk cek apakah ada user yang login
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
  return auth.currentUser !== null;
};

// ==========================================
// FUNGSI 7: GET USER INFO
// ==========================================

/**
 * Get informasi user yang sedang login
 * @returns {Promise<object|null>}
 */
export const getUserInfo = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const refAkun = ref(database, `akun/${user.uid}`);
      const snapshot = await get(refAkun);

      if (!snapshot.exists()) {
        return null;
      }

      const dataAkun = snapshot.val();

      return {
        uid: user.uid,
        email: user.email,
        displayName: dataAkun.username || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        statusAktif: dataAkun.statusAktif,
        saldoAwalDiSet: dataAkun.saldoAwalDiSet || false
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }
  return null;
};

// ==========================================
// FUNGSI 8: CEK STATUS AKUN AKTIF
// ==========================================

/**
 * Cek apakah akun user aktif
 * @returns {Promise<boolean>}
 */
export const isAccountActive = async () => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const refAkun = ref(database, `akun/${user.uid}`);
    const snapshot = await get(refAkun);

    if (!snapshot.exists()) return false;

    const dataAkun = snapshot.val();
    return dataAkun.statusAktif || false;
  } catch (error) {
    console.error('Error checking account status:', error);
    return false;
  }
};

// ==========================================
// EXPORT AUTH INSTANCE
// ==========================================
export { auth };

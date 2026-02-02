// SISTEM AUTENTIKASI FIREBASE
// File: auth-firebase.js

import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './konfigurasi-firebase.js';

// ==========================================
// FUNGSI 1: LOGIN USER
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

    // Set persistence agar login tetap tersimpan setelah browser ditutup
    await setPersistence(auth, browserLocalPersistence);

    // Login dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      sukses: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || email.split('@')[0]
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
// FUNGSI 2: LOGOUT USER
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
// FUNGSI 3: CEK STATUS AUTH
// ==========================================

/**
 * Cek apakah user sedang login
 * @returns {Promise<object|null>} User object atau null
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        if (user) {
          resolve({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
          });
        } else {
          resolve(null);
        }
      },
      reject
    );
  });
};

// ==========================================
// FUNGSI 4: LISTEN AUTH STATE CHANGES
// ==========================================

/**
 * Subscribe ke perubahan status auth
 * @param {function} callback - Fungsi yang dipanggil saat auth state berubah
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0]
      });
    } else {
      callback(null);
    }
  });
};

// ==========================================
// FUNGSI 5: CEK APAKAH USER SUDAH LOGIN
// ==========================================

/**
 * Helper untuk cek apakah ada user yang login
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
  return auth.currentUser !== null;
};

// ==========================================
// FUNGSI 6: GET USER INFO
// ==========================================

/**
 * Get informasi user yang sedang login
 * @returns {object|null}
 */
export const getUserInfo = () => {
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      emailVerified: user.emailVerified
    };
  }
  return null;
};

// ==========================================
// EXPORT AUTH INSTANCE
// ==========================================
export { auth };

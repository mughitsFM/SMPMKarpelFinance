// konfigurasi-firebase.js
// File ini berisi konfigurasi dan inisialisasi Firebase Realtime Database

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
/**
 * Konfigurasi Firebase dari environment variables
 * Pastikan semua variabel sudah diisi di file .env
 */
const konfigurasiFirebase = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Inisialisasi Firebase App
 */
const aplikasiFirebase = initializeApp(konfigurasiFirebase);
const auth = getAuth(aplikasiFirebase);
/**
 * Mendapatkan referensi ke Realtime Database
 */
const database = getDatabase(aplikasiFirebase);

export { database, auth };

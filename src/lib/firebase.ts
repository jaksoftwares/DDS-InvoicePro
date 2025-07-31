// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBPiBl1Bb3iTSA_8iOHYd8F6kireeNFIJI",
  authDomain: "invoiceproauth.firebaseapp.com",
  projectId: "invoiceproauth",
  storageBucket: "invoiceproauth.firebasestorage.app",
  messagingSenderId: "853834465001",
  appId: "1:853834465001:web:da6e7ffcaad6bbfb293a78",
  measurementId: "G-FBS97853QG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export the auth instance
export const auth = getAuth(app);

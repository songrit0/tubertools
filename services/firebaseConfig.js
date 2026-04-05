import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC95K5rmqsZbmPmSDvgGeWgqbQvOll4X60",
  authDomain: "tuber-tools-266cb.firebaseapp.com",
  databaseURL: "https://tuber-tools-266cb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tuber-tools-266cb",
  storageBucket: "tuber-tools-266cb.firebasestorage.app",
  messagingSenderId: "519614170930",
  appId: "1:519614170930:web:243813c3bcba9df196b92b",
  measurementId: "G-RESMP2HBCL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

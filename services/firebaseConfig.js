import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
 apiKey: "AIzaSyCtiln7kHTUmXPxLxc0l3_vRzgZAsfTaO0",
  authDomain: "quest-17ccc.firebaseapp.com",
  projectId: "quest-17ccc",
  storageBucket: "quest-17ccc.firebasestorage.app",
  messagingSenderId: "190230033932",
  appId: "1:190230033932:web:188a6d777d0214c4fc2029",
  measurementId: "G-T6YRNF9FJY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

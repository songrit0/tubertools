import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzcvIeBho6Kcn9So3saq4cUlG76ncU3L0",
  authDomain: "vtuber-92546.firebaseapp.com",
  databaseURL: "https://vtuber-92546-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vtuber-92546",
  storageBucket: "vtuber-92546.firebasestorage.app",
  messagingSenderId: "885558594207",
  appId: "1:885558594207:web:5416f6f40ff04b21e770aa",
  measurementId: "G-FY54VQHF2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCS0Z2cuO3kmd2BbUeGHwECPTRjMmZ5ccM",
  authDomain: "terteeb.firebaseapp.com",
  projectId: "terteeb",
  storageBucket: "terteeb.firebasestorage.app",
  messagingSenderId: "98850227972",
  appId: "1:98850227972:web:67f918a642361b9e95f251",
  measurementId: "G-4QLYPVFXYP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

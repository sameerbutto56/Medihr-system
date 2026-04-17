import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCS0Z2cuO3kmd2BbUeGHwECPTRjMmZ5ccM",
  authDomain: "terteeb.firebaseapp.com",
  projectId: "terteeb",
  storageBucket: "terteeb.firebasestorage.app",
  messagingSenderId: "98850227972",
  appId: "1:98850227972:web:67f918a642361b9e95f251",
  measurementId: "G-4QLYPVFXYP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) {
      console.log("No users found in Firestore 'users' collection.");
    } else {
      console.log(`Found ${snap.size} users:`);
      snap.forEach(doc => {
        console.log(`- ID: ${doc.id}, Email: ${doc.data().email}, Role: ${doc.data().role}`);
      });
    }
  } catch (err) {
    console.error("Failed to read users:", err.message);
  }
  process.exit();
}

listUsers();

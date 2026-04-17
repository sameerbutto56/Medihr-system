import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function clearUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'users', d.id));
      count++;
    }
    console.log(`Successfully deleted ${count} users from Firestore.`);
  } catch (err) {
    console.error("Failed to delete users:", err.message);
  }
  process.exit();
}

clearUsers();

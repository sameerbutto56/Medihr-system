import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

async function testAuth() {
  try {
    const ts = Date.now();
    const email = `test-admin-${ts}@example.com`;
    console.log("Trying to create account:", email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, "password123");
    console.log("User created! UID:", userCredential.user.uid);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName: "Test Admin",
      role: 'owner',
      createdAt: new Date().toISOString()
    });
    console.log("User saved in Firestore.");
  } catch (error) {
    console.error("Auth Test Error:", error.code, error.message);
  }
  process.exit();
}

testAuth();

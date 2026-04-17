import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

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

async function wipeAll() {
  console.log("Starting complete database wipe...");
  const collections = [
    'users',
    'employees', 
    'attendance', 
    'payroll', 
    'patients', 
    'appointments', 
    'therapySessions', 
    'therapyRecommendations', 
    'medicalRecords', 
    'invoices',
    'branches'
  ];
  
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          await deleteDoc(docSnap.ref);
        }
        console.log(`Wiped ${snap.docs.length} records from ${collName}`);
      } else {
        console.log(`Collection ${collName} is active but empty.`);
      }
    } catch (e) {
      console.error(`Failed to wipe ${collName}:`, e.message);
    }
  }

  console.log("WIPE COMPLETE! All Firestore data has been erased.");
  process.exit(0);
}

wipeAll().catch(err => {
  console.error(err);
  process.exit(1);
});

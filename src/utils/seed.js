import { db } from '../firebase'
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { employees, attendance, payroll, patients, appointments, medicalRecords } from './mockData'

/**
 * Utility to seed Firestore with initial mock data.
 * Run this once from a component or dev console to populate the database.
 */
export async function seedFirestore() {
  const collections = [
    { name: 'employees',      data: employees },
    { name: 'attendance',     data: attendance },
    { name: 'payroll',        data: payroll },
    { name: 'patients',       data: patients },
    { name: 'appointments',   data: appointments },
    { name: 'medicalRecords', data: medicalRecords },
  ]

  console.log('🚀 Starting Firestore seeding...')

  for (const col of collections) {
    const colRef = collection(db, col.name)
    
    // Optional: Clear existing data in collection (Careful!)
    // const existing = await getDocs(colRef)
    // existing.forEach(d => deleteDoc(doc(db, col.name, d.id)))

    for (const item of col.data) {
      // Remove local ID if present (Firestore will generate a new one)
      const { id, ...payload } = item
      await addDoc(colRef, payload)
    }
    console.log(`✅ Seeded ${col.data.length} items to "${col.name}"`)
  }

  console.log('✨ Seeding complete!')
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore'

const AppContext = createContext(null)

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

export function AppProvider({ children }) {
  // ── HR State ──────────────────────────────────────────────────────────────
  const [hrEmployees, setHrEmployees]   = useState([])
  const [hrAttendance, setHrAttendance] = useState([])
  const [hrPayroll, setHrPayroll]       = useState([])

  // ── Hospital State ────────────────────────────────────────────────────────
  const [hosPatients, setHosPatients]           = useState([])
  const [hosAppointments, setHosAppointments]   = useState([])
  const [hosTherapySessions, setHosTherapySessions] = useState([])
  const [hosInvoices, setHosInvoices] = useState([])
  const [hosTherapyRecommendations, setHosTherapyRecommendations] = useState([])
  const [hosMedicalRecords, setHosMedicalRecords] = useState([])
  
  // ── Branch State ──────────────────────────────────────────────────────────
  const [branches, setBranches] = useState([])
  const [activeBranchId, setActiveBranchId] = useState(localStorage.getItem('activeBranchId') || '')

  // ── UI State ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeModule, setActiveModule] = useState('hr')

  // Auth dependency
  const { currentUser, userRole, userData } = useAuth()

  // ── Branch Sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setBranches([])
      return
    }

    const unsub = onSnapshot(query(collection(db, 'branches'), orderBy('name')), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setBranches(bList)
      
      // Seed initial branches if empty
      if (bList.length === 0) {
        const seed = async () => {
          await addDoc(collection(db, 'branches'), { name: 'Branch 1', createdAt: new Date().toISOString() })
          await addDoc(collection(db, 'branches'), { name: 'Branch 2', createdAt: new Date().toISOString() })
        }
        seed()
      } else if (!activeBranchId || !bList.find(b => b.id === activeBranchId)) {
        // Set default branch if none selected or if selected one is gone
        const defaultId = bList[0].id
        setActiveBranchId(defaultId)
        localStorage.setItem('activeBranchId', defaultId)
      }
    })
    return unsub
  }, [activeBranchId])

  // ── Lock non-owner users to their assigned branch ──────────────────────────
  useEffect(() => {
    if (userRole && userRole !== 'owner' && userData?.branchId) {
      if (activeBranchId !== userData.branchId) {
        setActiveBranchId(userData.branchId)
        localStorage.setItem('activeBranchId', userData.branchId)
      }
    }
  }, [userData, userRole, activeBranchId])

  // ── Firestore Real-time Sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBranchId || !currentUser) return

    const q = (coll) => query(collection(db, coll), where('branchId', '==', activeBranchId))

    // HR Collections
    const unsubEmployees  = onSnapshot(query(collection(db, 'employees'), where('branchId', '==', activeBranchId), orderBy('name')), 
      (snap) => setHrEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Employees sync error:", err)
    )
    const unsubAttendance = onSnapshot(q('attendance'), 
      (snap) => setHrAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Attendance sync error:", err)
    )
    const unsubPayroll    = onSnapshot(q('payroll'), 
      (snap) => setHrPayroll(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Payroll sync error:", err)
    )

    // Hospital Collections
    const unsubPatients   = onSnapshot(query(collection(db, 'patients'), where('branchId', '==', activeBranchId), orderBy('name')), 
      (snap) => setHosPatients(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Patients sync error:", err)
    )
    const unsubAppts      = onSnapshot(q('appointments'), 
      (snap) => setHosAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Appointments sync error:", err)
    )
    const unsubTherapy    = onSnapshot(q('therapySessions'), 
      (snap) => setHosTherapySessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Therapy Sessions sync error:", err)
    )
    const unsubInvoices   = onSnapshot(q('invoices'), 
      (snap) => setHosInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Invoices sync error:", err)
    )
    const unsubTherapyRec = onSnapshot(q('therapyRecommendations'), 
      (snap) => setHosTherapyRecommendations(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Therapy Recommendations sync error:", err)
    )
    const unsubRecords    = onSnapshot(q('medicalRecords'), 
      (snap) => setHosMedicalRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Medical records sync error:", err)
    )

    return () => {
      unsubEmployees(); unsubAttendance(); unsubPayroll();
      unsubPatients(); unsubAppts(); unsubTherapy(); unsubTherapyRec(); unsubRecords(); unsubInvoices();
    }
  }, [activeBranchId])

  // ── HR Actions (Firestore) ────────────────────────────────────────────────
  const addEmployee     = useCallback((data) => addDoc(collection(db, 'employees'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateEmployee  = useCallback((id, data) => updateDoc(doc(db, 'employees', id), data), [])
  const deleteEmployee  = useCallback((id) => deleteDoc(doc(db, 'employees', id)), [])
  const addAttendance   = useCallback((data) => addDoc(collection(db, 'attendance'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateAttendance = useCallback((id, data) => updateDoc(doc(db, 'attendance', id), data), [])
  const addPayroll      = useCallback((data) => addDoc(collection(db, 'payroll'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updatePayroll   = useCallback((id, data) => updateDoc(doc(db, 'payroll', id), data), [])

  // ── Hospital Actions (Firestore) ──────────────────────────────────────────
  const addPatient    = useCallback((data) => addDoc(collection(db, 'patients'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updatePatient = useCallback((id, data) => updateDoc(doc(db, 'patients', id), data), [])
  const deletePatient = useCallback((id) => deleteDoc(doc(db, 'patients', id)), [])

  const addAppointment    = useCallback((data) => addDoc(collection(db, 'appointments'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateAppointment = useCallback((id, data) => updateDoc(doc(db, 'appointments', id), data), [])

  const addTherapySession    = useCallback((data) => addDoc(collection(db, 'therapySessions'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateTherapySession = useCallback((id, data) => updateDoc(doc(db, 'therapySessions', id), data), [])
  const deleteTherapySession = useCallback((id) => deleteDoc(doc(db, 'therapySessions', id)), [])
  
  const addInvoice           = useCallback((data) => addDoc(collection(db, 'invoices'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateInvoice        = useCallback((id, data) => updateDoc(doc(db, 'invoices', id), data), [])
  const deleteInvoice        = useCallback((id) => deleteDoc(doc(db, 'invoices', id)), [])
  
  const addTherapyRecommendation = useCallback((data) => addDoc(collection(db, 'therapyRecommendations'), { ...data, branchId: activeBranchId }), [activeBranchId])
  const updateTherapyRecommendation = useCallback((id, data) => updateDoc(doc(db, 'therapyRecommendations', id), data), [])

  const addMedicalRecord = useCallback((data) => addDoc(collection(db, 'medicalRecords'), { ...data, branchId: activeBranchId }), [activeBranchId])

  // ── Branch Management ──────────────────────────────────────────────────────
  const addBranch = useCallback((name) => addDoc(collection(db, 'branches'), { name, createdAt: new Date().toISOString() }), [])
  const updateBranch = useCallback((id, name) => updateDoc(doc(db, 'branches', id), { name }), [])

  const migrateOrphanRecords = useCallback(async (targetBranchId) => {
    if (!targetBranchId) return { success: false, message: 'No target branch selected' }
    
    const collections = [
      'employees', 'attendance', 'payroll', 'patients', 'appointments', 
      'therapySessions', 'therapyRecommendations', 'medicalRecords', 'invoices'
    ];
    
    let totalMigrated = 0;
    
    for (const collName of collections) {
      const q = query(collection(db, collName))
      const snap = await getDocs(q)
      const orphanDocs = snap.docs.filter(d => !d.data().branchId)
      
      if (orphanDocs.length > 0) {
        const batch = writeBatch(db)
        orphanDocs.forEach(d => {
          batch.update(d.ref, { branchId: targetBranchId })
        })
        await batch.commit()
        totalMigrated += orphanDocs.length
      }
    }
    
    return { success: true, count: totalMigrated }
  }, [])

  const value = {
    // hr
    hrEmployees, hrAttendance, hrPayroll,
    addEmployee, updateEmployee, deleteEmployee, addAttendance, updateAttendance, addPayroll, updatePayroll,
    // hospital
    hosPatients, hosAppointments, hosTherapySessions, hosTherapyRecommendations, hosMedicalRecords, hosInvoices,
    addPatient, updatePatient, deletePatient,
    addAppointment, updateAppointment,
    addTherapySession, updateTherapySession, deleteTherapySession, addTherapyRecommendation, updateTherapyRecommendation,
    addMedicalRecord, addInvoice, updateInvoice, deleteInvoice,
    // ui
    sidebarOpen, setSidebarOpen,
    mobileMenuOpen, setMobileMenuOpen,
    activeModule, setActiveModule,
    // branches
    branches, activeBranchId, setActiveBranchId: (id) => {
      setActiveBranchId(id)
      localStorage.setItem('activeBranchId', id)
    },
    addBranch, updateBranch, migrateOrphanRecords
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

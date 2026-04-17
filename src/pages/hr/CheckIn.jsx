import React, { useState } from 'react'
import { LogIn, LogOut, Clock, CheckCircle2, Hash, Fingerprint } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { db } from '../../firebase'
import { bufferFromBase64, generateChallenge } from '../../utils/webauthn'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, limit } from 'firebase/firestore'

export default function CheckIn() {
  const { hrEmployees, updateAttendance, activeBranchId } = useApp()
  const [empId, setEmpId] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | active | success
  const [currentSession, setCurrentSession] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [message, setMessage] = useState('')
  const [scanning, setScanning] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const lookupSession = async (inputId) => {
    setStatus('loading')
    try {
      // Find employee by unique employeeId (TRB-XXXX)
      const emp = hrEmployees.find(e => e.employeeId === inputId.toUpperCase().trim())
      if (!emp) {
        setMessage('Employee not found. Please check your ID (e.g. TRB-0001).')
        setStatus('idle')
        return
      }
      setEmployee(emp)

      // Find existing attendance for today
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', emp.id),
        where('date', '==', todayStr),
        where('branchId', '==', activeBranchId),
        limit(1)
      )
      const snap = await getDocs(q)
      
      if (!snap.empty) {
        const session = { id: snap.docs[0].id, ...snap.docs[0].data() }
        
        const now = new Date()
        if (!session.checkOut && now.getHours() >= 16) {
          await updateDoc(doc(db, 'attendance', session.id), { checkOut: '16:00' })
          session.checkOut = '16:00'
          setMessage('Shift exceeded 4:00 PM. System has auto-closed your work day.')
          setCurrentSession(session)
          setStatus('success')
        } else {
          setCurrentSession(session)
          if (session.checkOut) {
            setMessage('You have already completed your shift for today.')
            setStatus('idle')
          } else {
            setStatus('active')
          }
        }
      } else {
        setStatus('idle')
        setMessage('Ready to start shift.')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error fetching data.')
    }
  }

  const handleStopShift = async () => {
    setScanning(true)
    try {
      // Physical Biometric Verification
      if (employee.biometricCredentialId) {
        const challenge = generateChallenge()
        const options = {
          challenge,
          allowCredentials: [{
            id: bufferFromBase64(employee.biometricCredentialId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
        await navigator.credentials.get({ publicKey: options })
      }

      // Proceed if biometric pass or no biometric enrolled
      setTimeout(async () => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        try {
          await updateAttendance(currentSession.id, {
            checkOut: time
          })
          setStatus('success')
          setMessage('Shift ended. Great work today!')
        } catch (err) {
          alert('Failed to end shift.')
        }
        setScanning(false)
      }, 1000)
    } catch (err) {
      console.error('Biometric verification failed:', err)
      setMessage('Biometric verification failed. Please try again.')
      setScanning(false)
    }
  }

  const handleStartShift = async () => {
    setScanning(true)
    try {
      // Physical Biometric Verification
      if (employee.biometricCredentialId) {
        const challenge = generateChallenge()
        const options = {
          challenge,
          allowCredentials: [{
            id: bufferFromBase64(employee.biometricCredentialId),
            type: 'public-key'
          }],
          userVerification: 'required'
        }
        await navigator.credentials.get({ publicKey: options })
      }

      // Proceed if biometric pass or no biometric enrolled
      setTimeout(async () => {
        const now = new Date()
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        try {
          const docRef = await addDoc(collection(db, 'attendance'), {
            employeeId: employee.id,
            date: todayStr,
            checkIn: time,
            checkOut: null,
            status: 'present',
            branchId: activeBranchId
          })
          setCurrentSession({ id: docRef.id, checkIn: time })
          setStatus('active')
          setMessage('Shift started successfully!')
        } catch (err) {
          alert('Failed to start shift.')
        }
        setScanning(false)
      }, 1000)
    } catch (err) {
      console.error('Biometric verification failed:', err)
      setMessage('Biometric verification failed. Please try again.')
      setScanning(false)
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '80px auto', background: 'var(--bg-surface)', padding: 40, borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
      <div className="avatar" style={{ margin: '0 auto 20px', width: 60, height: 60, fontSize: 24 }}>🏢</div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Employee Portal</h1>
      <p className="text-muted mb-6">Enter your Employee ID to manage your shift.</p>

      {!employee && status === 'idle' && (
        <div className="flex-col gap-4">
          <div className="search-bar mb-4" style={{ width: '100%' }}>
            <Hash size={15} style={{ marginLeft: 10, color: 'var(--text-secondary)' }} />
            <input 
              type="text" className="form-control" placeholder="e.g. TRB-0001" 
              value={empId} onChange={e => setEmpId(e.target.value)}
              style={{ border: 'none', background: 'transparent', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={() => lookupSession(empId)}>
            Login with ID
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="p-8 flex-col items-center">
          <div className="loader mb-4"></div>
          <div className="text-muted">Syncing session...</div>
        </div>
      )}

      {employee && status === 'idle' && (
        <div className="flex-col items-center">
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Welcome, {employee.name}</div>
          <div className="text-muted mb-6" style={{ fontSize: 13 }}>ID: {employee.employeeId} · {employee.role}</div>
          
          <div 
            className={`biometric-scanner ${scanning ? 'scanning' : ''}`}
            onClick={!scanning && !currentSession?.checkOut ? handleStartShift : undefined}
            style={{ 
              width: 140, height: 140, borderRadius: '50%', background: 'var(--surface)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              border: `2px solid ${scanning ? 'var(--primary)' : 'var(--border)'}`,
              cursor: scanning || currentSession?.checkOut ? 'default' : 'pointer',
              position: 'relative', overflow: 'hidden',
              boxShadow: scanning ? '0 0 20px var(--primary-light)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            <Fingerprint size={64} color={scanning ? 'var(--primary)' : 'var(--text-muted)'} />
            {scanning && <div className="scan-line" />}
          </div>

          <p className="text-muted mb-6">{scanning ? 'Authenticating Biometrics...' : message || 'Place thumb on scanner to Check-In'}</p>
          
          <button className="btn btn-ghost mt-4" onClick={() => { setEmployee(null); setStatus('idle'); setEmpId(''); setMessage(''); }}>
            Use Different ID
          </button>
        </div>
      )}

      {status === 'active' && (
        <div className="flex-col items-center">
          <div className="badge present mb-6" style={{ padding: '8px 16px' }}>Shift in Progress</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Hello, {employee.name}</div>
          <div className="text-muted mb-8" style={{ fontSize: 13 }}>Started at: {currentSession.checkIn}</div>
          
          <div 
            className={`biometric-scanner ${scanning ? 'scanning' : ''}`}
            onClick={!scanning ? handleStopShift : undefined}
            style={{ 
              width: 140, height: 140, borderRadius: '50%', background: 'var(--surface)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              border: `2px solid ${scanning ? 'var(--red)' : 'var(--border)'}`,
              cursor: scanning ? 'default' : 'pointer',
              position: 'relative', overflow: 'hidden',
              boxShadow: scanning ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            <Fingerprint size={64} color={scanning ? 'var(--red)' : 'var(--text-muted)'} />
            {scanning && <div className="scan-line red" />}
          </div>

          <p className="text-muted mb-4">{scanning ? 'Verifying Checkout...' : 'Place thumb on scanner to Check-Out'}</p>
        </div>
      )}

      {/* CSS for Biometric Scan Animation */}
      <style>{`
        .biometric-scanner.scanning .scan-line {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--primary);
          box-shadow: 0 0 15px var(--primary);
          animation: scan 1.5s infinite ease-in-out;
        }
        .biometric-scanner.scanning .scan-line.red {
          background: var(--red);
          box-shadow: 0 0 15px var(--red);
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      {status === 'success' && (
        <div>
          <CheckCircle2 size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Shift Completed</h2>
          <p className="text-muted mb-8" style={{ fontSize: 16 }}>{message}</p>
          <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={() => { setStatus('idle'); setEmpId(''); setEmployee(null); }}>
            Done
          </button>
        </div>
      )}

      {message && status === 'idle' && (
        <div className="mt-4 text-sm" style={{ color: message.includes('not found') ? 'var(--red)' : 'var(--text-secondary)' }}>
          {message}
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { User, Activity, MapPin, RefreshCw, Plus, Trash2, Key } from 'lucide-react'
import { db } from '../../firebase'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

function BranchManagement() {
  const { branches, addBranch, updateBranch, migrateOrphanRecords, activeBranchId } = useApp()
  const [newBranchName, setNewBranchName] = useState('')
  const [editingBranch, setEditingBranch] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)

  const handleAdd = async () => {
    if (!newBranchName.trim()) return
    await addBranch(newBranchName)
    setNewBranchName('')
  }

  const handleUpdate = async () => {
    if (!editingBranch || !editingBranch.name.trim()) return
    await updateBranch(editingBranch.id, editingBranch.name)
    setEditingBranch(null)
  }

  const handleMigrate = async () => {
    const currentBranch = branches.find(b => b.id === activeBranchId)
    if (!window.confirm(`This will move ALL un-branched data to "${currentBranch?.name}". Continue?`)) return
    
    setIsMigrating(true)
    const res = await migrateOrphanRecords(activeBranchId)
    setIsMigrating(false)
    
    if (res.success) {
      alert(`Success! Successfully migrated ${res.count} records.`)
      window.location.reload()
    } else {
      alert(`Migration failed: ${res.message}`)
    }
  }

  return (
    <div className="mt-8 mb-8">
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          <MapPin size={20} className="text-primary" /> Clinic Branch Management
        </h2>
        <p className="section-sub">Configure your branches and migrate older data</p>
      </div>

      <div className="grid-2 gap-6">
        {/* Branch List */}
        <div className="card p-6">
          <h3 className="text-sm font-bold mb-4">Active Branches</h3>
          <div className="flex flex-col gap-3">
            {branches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-hover rounded-lg border border-border">
                {editingBranch?.id === b.id ? (
                  <input 
                    className="form-control btn-sm" 
                    value={editingBranch.name} 
                    onChange={e => setEditingBranch({...editingBranch, name: e.target.value})}
                    onBlur={handleUpdate}
                    autoFocus
                  />
                ) : (
                  <span className="fw-600">{b.name}</span>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingBranch(b)}>Rename</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input 
                className="form-control" 
                placeholder="New branch name..." 
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /></button>
            </div>
          </div>
        </div>

        {/* Migration Tool */}
        <div className="card p-6" style={{ background: 'rgba(99,102,241,0.05)', borderStyle: 'dashed' }}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-primary" /> Data Migration Assistant
          </h3>
          <p className="text-xs text-muted mb-4">
            If you have data from before the multi-branch update, it won't be visible until it's assigned to a branch.
            Use this tool to move all "orphan" records to your <strong>currently selected branch</strong>.
          </p>
          <button 
            className="btn btn-primary w-100" 
            style={{ width: '100%', justifyContent: 'center' }} 
            onClick={handleMigrate}
            disabled={isMigrating}
          >
            {isMigrating ? 'Migrating...' : 'Migrate Orphan Data to This Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}

function HRAccountManagement() {
  const { createSecondaryAccount } = useAuth()
  const { branches } = useApp()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cnic: '',
    department: '',
    designation: '',
    branchId: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRegisterHR = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const branchName = branches.find(b => b.id === form.branchId)?.name || ''
      await createSecondaryAccount(form.email, form.password, form.name, 'hr', {
        phone: form.phone,
        cnic: form.cnic,
        department: form.department,
        designation: form.designation,
        branchId: form.branchId,
        branchName
      })
      setMessage(`✅ Successfully registered HR account for ${form.name} (${branchName})`)
      setForm({ name: '', email: '', password: '', phone: '', cnic: '', department: '', designation: '', branchId: '' })
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="mt-4 mb-8">
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          <User size={20} className="text-primary" /> Create HR Manager Account
        </h2>
        <p className="section-sub">Register a new HR manager with full details and assign them to a branch</p>
      </div>
      
      <div className="card p-6" style={{ maxWidth: '750px', border: '1px solid rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))' }}>
        <form onSubmit={handleRegisterHR}>
          {/* Personal Details */}
          <div style={{ marginBottom: '20px' }}>
            <div className="text-xs fw-600 text-primary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Details</div>
            <div className="grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input required className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Sarah Khan" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input required type="tel" className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="03XX-XXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">CNIC / ID Card *</label>
                <input required className="form-control" name="cnic" value={form.cnic} onChange={handleChange} placeholder="42101-XXXXXXX-X" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Human Resources" />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Designation / Role</label>
              <input className="form-control" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. HR Manager, HR Coordinator" />
            </div>
          </div>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border)', opacity: 0.3 }} />

          {/* Branch Assignment */}
          <div style={{ marginBottom: '20px' }}>
            <div className="text-xs fw-600 text-primary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Branch Assignment</div>
            <div className="form-group">
              <label className="form-label">Assign to Branch *</label>
              <select required className="form-control" name="branchId" value={form.branchId} onChange={handleChange}>
                <option value="">— Select Branch —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border)', opacity: 0.3 }} />

          {/* Login Credentials */}
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
            <div className="text-xs fw-600 text-primary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>🔐 Login Credentials</div>
            <div className="grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Login Email *</label>
                <input type="email" required className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="hr@clinic.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input type="password" required className="form-control" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {loading ? 'Creating HR Account...' : '🚀 Register HR Manager'}
          </button>
          {message && <div style={{ fontSize: '13px', marginTop: '12px', color: message.startsWith('Error') ? 'var(--red)' : 'var(--green)', fontWeight: 600, textAlign: 'center' }}>{message}</div>}
        </form>
      </div>
    </div>
  )
}

export default function CEOPortal() {
  const { userRole } = useAuth()
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetCode, setResetCode] = useState('')

  const handleWipeData = async () => {
    if (resetCode.trim() !== '916500') {
      alert("Invalid security code.")
      return
    }

    try {
      const collections = [
        'employees', 'attendance', 'payroll', 'patients', 'appointments', 
        'therapySessions', 'therapyRecommendations', 'medicalRecords', 'invoices'
      ];
      
      let totalDeleted = 0;
      for (const collName of collections) {
          const snap = await getDocs(collection(db, collName));
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            totalDeleted += snap.docs.length;
          }
      }
      alert(`SYSTEM WIPE COMPLETE! \n\nSuccessfully deleted ${totalDeleted} records.`);
      window.location.reload();
    } catch (err) {
      alert(`Critical error: ${err.message}`);
    }
  }

  if (userRole !== 'owner') {
    return (
      <div className="empty-state">
        <Key size={40} className="empty-icon" />
        <h3>Access Denied</h3>
        <p>Only the CEO/Owner can access this portal.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>CEO Management Portal</h1>
        <p>Manage clinic branches, HR accounts, and administrative settings</p>
      </div>

      <HRAccountManagement />
      
      <BranchManagement />

      {/* Danger Zone */}
      <div className="settings-section" style={{ border: '2px solid #ef4444', marginTop: '60px', padding: '30px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.08)', textAlign: 'center' }}>
        <h3 className="section-title text-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: 0, color: '#ef4444', fontSize: '20px' }}>
          <Trash2 size={24} /> CRITICAL DANGER ZONE
        </h3>
        <p className="text-muted mb-6" style={{ marginTop: '8px', color: '#f87171' }}>
          Warning: Erase the entire clinic database (Staff, Patients, Appointments, Payroll). 
          <br />This action is irreversible and requires authorization.
        </p>
        
        <button 
          className="btn btn-danger" 
          onClick={() => setShowResetModal(true)} 
          style={{ 
            padding: '12px 32px', 
            fontSize: '16px', 
            fontWeight: 800,
            background: '#ef4444',
            color: 'white',
            borderRadius: '12px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          Wipe All Data Factory Reset
        </button>
      </div>

      {showResetModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title text-danger">Safety Check</h2>
              <button className="toggle-btn" onClick={() => setShowResetModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ color: 'var(--red)', fontSize: '48px', marginBottom: '16px' }}><Activity size={48} /></div>
              <p className="mb-4">This will permanently delete ALL clinic data.</p>
              <div className="form-group">
                <label className="form-label">Type Security Code (916500):</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="Enter 916500"
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, letterSpacing: '4px' }}
                />
              </div>
              <button 
                className="btn btn-danger w-100 mt-4" 
                onClick={handleWipeData}
                style={{ width: '100%', background: resetCode === '916500' ? '#ef4444' : '#334155' }}
              >
                Confirm Full System Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

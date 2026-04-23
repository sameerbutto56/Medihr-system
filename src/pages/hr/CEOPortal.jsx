import React, { useState } from 'react'
import { User, Activity, MapPin, RefreshCw, Plus, Trash2, Key, ShieldCheck } from 'lucide-react'
import { db } from '../../firebase'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { createPortal } from 'react-dom'

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

function DepartmentManagement() {
  const { hrDepartments, addDepartment, updateDepartment, deleteDepartment } = useApp()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editing, setEditing] = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await addDepartment({ name: newName, description: newDesc })
    setNewName('')
    setNewDesc('')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editing.name.trim()) return
    await updateDepartment(editing.id, { name: editing.name, description: editing.description })
    setEditing(null)
  }

  return (
    <div className="mt-8 mb-8">
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          <Activity size={20} className="text-primary" /> Department Management
        </h2>
        <p className="section-sub">Create and manage flexible departments for your clinic</p>
      </div>

      <div className="grid-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-bold mb-4">Active Departments</h3>
          <div className="flex flex-col gap-3">
            {hrDepartments.length === 0 ? (
              <p className="text-xs text-muted">No departments created yet.</p>
            ) : (
              hrDepartments.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-hover rounded-lg border border-border">
                  <div>
                    <div className="fw-600">{d.name}</div>
                    <div className="text-xs text-muted">{d.description || 'No description'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(d)}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteDepartment(d.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold mb-4">{editing ? 'Edit Department' : 'Create Department'}</h3>
          <form onSubmit={editing ? handleUpdate : handleAdd} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input 
                className="form-control" 
                value={editing ? editing.name : newName} 
                onChange={e => editing ? setEditing({...editing, name: e.target.value}) : setNewName(e.target.value)} 
                placeholder="e.g. Surgery"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input 
                className="form-control" 
                value={editing ? editing.description : newDesc} 
                onChange={e => editing ? setEditing({...editing, description: e.target.value}) : setNewDesc(e.target.value)} 
                placeholder="Brief purpose..."
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="submit" className="btn btn-primary w-100" style={{ flex: 1, justifyContent: 'center' }}>
                {editing ? 'Save Changes' : 'Create Department'}
              </button>
              {editing && <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ManagerManagement() {
  const { hrEmployees, hrDepartments, promoteToManager } = useApp()
  const [selectedEmp, setSelectedEmp] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePromote = async (e) => {
    e.preventDefault()
    if (!selectedEmp || !selectedDept) return
    setLoading(true)
    try {
      await promoteToManager(selectedEmp, selectedDept)
      alert("Employee successfully promoted to Manager!")
      setSelectedEmp('')
      setSelectedDept('')
    } catch (err) {
      alert("Promotion failed: " + err.message)
    }
    setLoading(false)
  }

  const managerList = hrEmployees.filter(e => e.isManager)

  return (
    <div className="mt-8 mb-8">
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" /> Manager Assignment
        </h2>
        <p className="section-sub">Appoint employee as a manager for a specific department</p>
      </div>

      <div className="grid-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-bold mb-4">Promote Employee to Manager</h3>
          <form onSubmit={handlePromote} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Select Employee</label>
              <select 
                className="form-control" 
                value={selectedEmp} 
                onChange={e => setSelectedEmp(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {hrEmployees.filter(e => !e.isManager).map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                ))}
              </select>
            </div>
            <div className="form-group mt-3">
              <label className="form-label">Assign to Department</label>
              <select 
                className="form-control" 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)}
                required
              >
                <option value="">-- Select Department --</option>
                {hrDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-4" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !selectedEmp || !selectedDept}>
              {loading ? 'Processing...' : 'Appoint as Manager'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold mb-4">Active Managers</h3>
          <div className="flex flex-col gap-3">
            {managerList.length === 0 ? (
              <p className="text-xs text-muted">No managers appointed yet.</p>
            ) : (
              managerList.map(m => {
                const dept = hrDepartments.find(d => d.id === m.managedDepartmentId)
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-hover rounded-lg border border-border">
                    <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                      {m.name.split(' ').map(n=>n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-700">{m.name}</div>
                      <div className="text-xs text-primary fw-800">MANAGER: {dept?.name || 'Unknown Dept'}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HRAccountManagement() {
  const { createSecondaryAccount } = useAuth()
  const { branches, addEmployee } = useApp()
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
      const uid = await createSecondaryAccount(form.email, form.password, form.name, 'hr', {
        phone: form.phone,
        cnic: form.cnic,
        department: form.department,
        designation: form.designation,
        branchId: form.branchId,
        branchName
      })
      // Also register as an employee so they appear in payroll/attendance
      await addEmployee({
        name: form.name,
        loginEmail: form.email,
        phone: form.phone,
        cnic: form.cnic,
        department: form.department || 'Human Resources',
        role: form.designation || 'HR Manager',
        authUid: uid,
        status: 'active',
        joined: new Date().toISOString().split('T')[0],
        compensationType: 'salary',
        salary: 0,
        hrsPerDay: 8,
        daysPerWeek: 6
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
  const { allUsers, updateUser, branches, hrEmployees, hrDepartments, updateEmployee, promoteToManager } = useApp()
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const handleOpenEdit = (user) => {
    if (!user) return
    setEditingUser(user)
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'employee',
      branchId: user.branchId || '',
      phone: user.phone || '',
      department: user.department || '',
      designation: user.designation || ''
    })
  }


  const handleUpdateAccount = async (e) => {
    e.preventDefault()
    try {
      // 1. Update Core User Account
      await updateUser(editingUser.id, editForm)

      // 2. Sync with Employee Record if it exists
      const relatedEmployee = hrEmployees.find(emp => emp.authUid === editingUser.id)
      if (relatedEmployee) {
        await updateEmployee(relatedEmployee.id, {
          name: editForm.displayName,
          phone: editForm.phone,
          department: editForm.department,
          role: editForm.designation || editForm.role,
          status: 'active'
        })
      }

      alert('Account updated successfully!')
      setEditingUser(null)
    } catch (err) {
      alert(`Update failed: ${err.message}`)
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
      
      <DepartmentManagement />
      
      <ManagerManagement />
      
      {/* Account Management Table */}
      <div className="mt-8 mb-8">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <User size={20} className="text-primary" /> System User Management
          </h2>
          <p className="section-sub">Manage roles and details for all hospital staff accounts</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-100" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Name / Role</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Contact</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Branch</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div className="fw-700">{user.displayName || 'Unnamed User'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{user.role}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div className="text-sm">{user.email}</div>
                    <div className="text-xs text-muted">{user.phone || 'No Phone'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div className="badge badge-primary">{branches.find(b => b.id === user.branchId)?.name || 'Admin / No Branch'}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(user)}>Edit Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Managers Directory */}
      <div className="mt-8 mb-8">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> Active Manager Directory
          </h2>
          <p className="section-sub">Quick overview of all appointed department managers</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-100" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Manager Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Department</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Contact Details</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {hrEmployees.filter(e => e.isManager).map(manager => {
                const dept = hrDepartments.find(d => d.id === manager.managedDepartmentId)
                return (
                  <tr key={manager.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(manager.name || '').split(' ').map(n=>n[0]).join('').toUpperCase()}
                        </div>
                        <div className="fw-700">{manager.name || 'Unnamed Manager'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="badge badge-primary">{dept?.name || 'Global / Unassigned'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="text-sm">{manager.loginEmail || manager.email}</div>
                      <div className="text-xs text-muted">{manager.phone}</div>
                      {(allUsers || []).find(u => u.id === manager.authUid)?.role !== 'manager' && manager.authUid && (
                        <div className="badge badge-danger mt-1" style={{ fontSize: '10px' }}>Portal Access Outdated</div>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div className="flex flex-col gap-2 items-end">
                        {(allUsers || []).find(u => u.id === manager.authUid)?.role !== 'manager' && manager.authUid && (
                          <button 
                            className="btn btn-primary btn-xs" 
                            onClick={async () => {
                              try {
                                await promoteToManager(manager.id, manager.managedDepartmentId)
                                alert("Portal access fixed! The manager can now log in.")
                              } catch (err) {
                                alert("Fix failed: " + err.message)
                              }
                            }}
                          >
                            Fix Portal Access
                          </button>
                        )}
                        {manager.authUid ? (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            const user = (allUsers || []).find(u => u.id === manager.authUid)
                            if (user) {
                              handleOpenEdit(user)
                            } else {
                              alert("System account not found. It may have been deleted or is still loading.")
                            }
                          }}
                        >
                          Manage Account
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => {
                            setForm({
                              ...form,
                              name: manager.name,
                              email: manager.loginEmail || '',
                              phone: manager.phone || ''
                            })
                            // Scroll to registration form
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            alert("Filling registration form with manager's details. Please complete the password and branch to create their account.")
                          }}
                        >
                          Create Account
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {hrEmployees.filter(e => e.isManager).length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
                    No managers have been appointed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BranchManagement />

      {/* Edit User Modal - PORTALED TO BODY */}
      {editingUser && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: 500, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title">Edit Account: {editingUser.displayName}</h2>
              <button type="button" className="toggle-btn" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateAccount}>
              <div className="modal-body">
                <div className="grid-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input className="form-control" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                  </div>
                </div>

                <div className="grid-2 gap-4 mt-4">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-control" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                      <option value="owner">CEO / Owner</option>
                      <option value="hr">HR Manager</option>
                      <option value="employee">Standard Employee</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label className="form-label">Branch Assignment</label>
                  <select className="form-control" value={editForm.branchId} onChange={e => setEditForm({...editForm, branchId: e.target.value})}>
                    <option value="">No Specific Branch (Admin Only)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2 gap-4 mt-4">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-control" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input className="form-control" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>

  )
}

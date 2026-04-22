import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Fingerprint, CheckCircle2, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { bufferToBase64, generateChallenge } from '../../utils/webauthn'

function generateEmployeeId(existingEmployees) {
  let maxNum = 0
  existingEmployees.forEach(e => {
    if (e.employeeId && e.employeeId.startsWith('TRB-')) {
      const parts = e.employeeId.split('-')
      const num = parseInt(parts[1], 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return `TRB-${String(nextNum).padStart(4, '0')}`
}

export default function EmployeeForm({ employee, onClose }) {
  const { addEmployee, updateEmployee, hrEmployees, hrDepartments } = useApp()
  const isEdit = !!employee

  const generatedId = useMemo(() => generateEmployeeId(hrEmployees), [hrEmployees])
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    role: '',
    compensationType: 'salary',
    salary: '',
    dailyRate: '',
    percentageRate: '',
    dob: '',
    joined: new Date().toISOString().split('T')[0],
    hrsPerDay: 8,
    daysPerWeek: 5,
    status: 'active',
    employeeId: '',
    cnic: '', // ID Card Number
    biometricCredentialId: null,
    loginEmail: '',
    loginPassword: ''
  })

  // We need auth context for secondary account creation
  const { createSecondaryAccount } = useAuth()
  const [isCreatingAuth, setIsCreatingAuth] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')

  const [biometricStatus, setBiometricStatus] = useState('idle')

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        salary: employee.salary || '',
        dailyRate: employee.dailyRate || '',
        percentageRate: employee.percentageRate || ''
      })
    }
  }, [employee])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsCreatingAuth(true)
    setSaveStatus('saving')
    try {
      let uid = null;

      // Handle Firebase Auth creation only if the employee doesn't already have an account
      if (!employee?.authUid && formData.loginEmail && formData.loginPassword) {
         uid = await createSecondaryAccount(formData.loginEmail, formData.loginPassword, formData.name, 'employee')
      }

      const payload = {
        name: formData.name || '',
        phone: formData.phone || '',
        department: formData.department || '',
        role: formData.role || '',
        compensationType: formData.compensationType || 'salary',
        dob: formData.dob || '',
        joined: formData.joined || '',
        status: formData.status || 'active',
        cnic: formData.cnic || '',
        biometricCredentialId: formData.biometricCredentialId || null,
        employeeId: formData.employeeId || generatedId,
        salary: formData.compensationType === 'salary' ? Number(formData.salary) : 0,
        dailyRate: formData.compensationType === 'dailyRate' ? Number(formData.dailyRate) : 0,
        percentageRate: formData.compensationType === 'percentage' ? Number(formData.percentageRate) : 0,
        hrsPerDay: Number(formData.hrsPerDay) || 8,
        daysPerWeek: Number(formData.daysPerWeek) || 5,
        loginEmail: formData.loginEmail || '',
        loginPassword: formData.loginPassword || ''
      }

      if (uid) {
        payload.authUid = uid;
      }

      if (isEdit) {
        await updateEmployee(employee.id, payload)
      } else {
        await addEmployee(payload)
      }
      setSaveStatus('success')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error saving employee:', err)
      alert(`Failed to save employee: ${err.message}`)
      setSaveStatus('error')
      setIsCreatingAuth(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const copyId = (id) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegisterBiometrics = async () => {
    setBiometricStatus('loading')
    try {
      const challenge = generateChallenge()
      const empIdForBiometrics = formData.employeeId || generatedId
      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: "MediHR", id: window.location.hostname },
        user: {
          id: Uint8Array.from(empIdForBiometrics, c => c.charCodeAt(0)),
          name: formData.name || "Employee",
          displayName: formData.name || "Employee",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { 
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "discouraged",
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "direct"
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      })

      const credentialIdB64 = bufferToBase64(credential.rawId)
      setFormData(prev => ({ ...prev, biometricCredentialId: credentialIdB64 }))
      setBiometricStatus('enrolled')
    } catch (err) {
      console.error('Biometric registration failed:', err)
      setBiometricStatus('error')
    }
  }

  const isFormValid = !!(
    formData.name && 
    formData.phone && 
    formData.cnic && 
    formData.department && 
    formData.role &&
    formData.joined &&
    (formData.compensationType === 'salary' ? formData.salary !== '' : 
     formData.compensationType === 'dailyRate' ? formData.dailyRate !== '' : 
     formData.percentageRate !== '')
  )

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h2 className="section-title">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '20px' }}>

            {/* Employee ID & CNIC */}
            <div className="form-group" style={{ padding: '16px', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--primary-light)', textTransform: 'uppercase', fontWeight: 700 }}>Machine Sync ID</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" name="employeeId" required 
                  className="form-control" style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 800, fontSize: '20px', letterSpacing: '2px', color: 'var(--primary-light)' }}
                  placeholder={generatedId} value={formData.employeeId} onChange={handleChange} 
                />
                <button type="button" onClick={() => copyId(formData.employeeId || generatedId)} className="btn btn-ghost" style={{ padding: '4px' }}><Copy size={16} /></button>
              </div>
              <p className="text-xs text-muted mt-2">Must match the ID assigned to this employee on the ZKTeco biometric machine.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" name="name" required className="form-control" 
                  placeholder="e.g. Dr. Ahmed Khan" value={formData.name} onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID Card Number (CNIC)</label>
                <input 
                  type="text" name="cnic" required className="form-control" 
                  placeholder="42101-XXXXXXX-X" value={formData.cnic} onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" required className="form-control" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  name="department" required className="form-control" 
                  value={formData.department} onChange={handleChange}
                >
                  <option value="">-- Select Department --</option>
                  {hrDepartments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                  {!hrDepartments.find(d => d.name === formData.department) && formData.department && (
                    <option value={formData.department}>{formData.department}</option>
                  )}
                </select>
                {hrDepartments.length === 0 && <p className="text-xs text-muted mt-1">No departments created by CEO yet.</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role / Designation</label>
                <input type="text" name="role" required className="form-control" value={formData.role} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Compensation Type</label>
                <select name="compensationType" className="form-control" value={formData.compensationType} onChange={handleChange}>
                  <option value="salary">Fixed Monthly Salary</option>
                  <option value="dailyRate">Daily Rate (DR Base)</option>
                  <option value="percentage">Percentage Based</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              {formData.compensationType === 'salary' ? (
                <div className="form-group">
                  <label className="form-label">Annual Salary (PKR)</label>
                  <input type="number" name="salary" required className="form-control" value={formData.salary} onChange={handleChange} />
                </div>
              ) : formData.compensationType === 'dailyRate' ? (
                <div className="form-group">
                  <label className="form-label">Daily Rate (PKR)</label>
                  <input type="number" name="dailyRate" required className="form-control" value={formData.dailyRate} onChange={handleChange} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Percentage Commission (%)</label>
                  <input type="number" name="percentageRate" required className="form-control" value={formData.percentageRate} onChange={handleChange} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <hr style={{ margin: '20px 0', borderColor: 'var(--border)', opacity: 0.5 }} />

            {/* Employee Portal Login — Highlighted Section */}
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))', borderRadius: '14px', border: '1px dashed var(--primary)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="section-title text-sm text-primary" style={{ fontSize: '14px', margin: 0 }}>🔐 Employee Portal Login</div>
                {isEdit && employee?.authUid && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                    <CheckCircle2 size={14} /> Account Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mb-3" style={{ lineHeight: '1.5' }}>
                Fill these fields to create a login for this employee. Once created, they can sign in via the <strong>Employee Portal</strong> and view <strong>only their own</strong> attendance &amp; payroll data.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Portal Email</label>
                  <input type="email" name="loginEmail" className="form-control" value={formData.loginEmail} onChange={handleChange} placeholder="employee@clinic.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input type="password" name="loginPassword" className="form-control" value={formData.loginPassword} onChange={handleChange} placeholder="Min 6 characters" />
                </div>
              </div>
              {isEdit && employee?.authUid && (
                <p className="text-xs text-muted" style={{ marginTop: '8px', fontStyle: 'italic' }}>This employee already has a linked login account. Adding new credentials will create an additional account.</p>
              )}
            </div>

            <hr style={{ margin: '20px 0', borderColor: 'var(--border)', opacity: 0.5 }} />

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Working Minutes/Day</label>
                <input type="number" name="hrsPerDay" required className="form-control" value={formData.hrsPerDay} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Days/Week</label>
                <input type="number" name="daysPerWeek" required className="form-control" value={formData.daysPerWeek} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Enroll Biometrics</label>
                <button 
                  type="button" 
                  className={`btn ${biometricStatus === 'enrolled' ? 'btn-success' : 'btn-ghost'}`} 
                  onClick={handleRegisterBiometrics}
                  style={{ width: '100%', border: '1px dashed var(--border)' }}
                >
                  {biometricStatus === 'enrolled' ? <><CheckCircle2 size={16} /> Enrolled</> : <><Fingerprint size={16} /> Link Device</>}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Join Date</label>
                <input type="date" name="joined" required className="form-control" value={formData.joined} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isCreatingAuth || saveStatus === 'success'}>Cancel</button>
            <button 
              type="submit" 
              className={`btn ${saveStatus === 'success' ? 'btn-success' : 'btn-primary'}`} 
              disabled={!isFormValid || isCreatingAuth || saveStatus === 'success'}
              style={saveStatus === 'success' ? { background: 'var(--green)', color: '#fff', borderColor: 'var(--green)' } : {}}
            >
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved Successfully! ✓' : 
               (isEdit ? 'Save Changes' : 'Register Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

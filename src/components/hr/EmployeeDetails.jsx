import React from 'react'
import { X, Phone, Briefcase, Calendar, CreditCard, Shield, Fingerprint, MapPin } from 'lucide-react'
import { formatDate, avatarInitials, formatCurrency } from '../../utils/helpers'

export default function EmployeeDetails({ employee, onClose }) {
  if (!employee) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: 0, overflow: 'hidden' }}>
        
        {/* Header / Profile Summary */}
        <div style={{ background: 'var(--primary)', color: 'white', padding: '40px 30px', position: 'relative' }}>
          <button 
            className="toggle-btn" 
            onClick={onClose} 
            style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', opacity: 0.8 }}
          >
            <X size={24} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '36px', border: '4px solid rgba(255,255,255,0.2)' }}>
              {avatarInitials(employee.name)}
            </div>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{employee.name}</h2>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', opacity: 0.9, fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {employee.role}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {employee.department}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={14} /> {employee.employeeId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="grid-2" style={{ gap: '30px' }}>
            
            {/* Left Column: Personal & Professional */}
            <div>
              <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> Professional Details
              </h3>
              
              <div className="details-card" style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div className="grid-2">
                  <div>
                    <label className="text-xs text-muted">Joining Date</label>
                    <div style={{ fontWeight: 600 }}>{formatDate(employee.joined)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted">Status</label>
                    <div><span className={`badge ${employee.status}`}>{employee.status}</span></div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-muted">Phone Number</label>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {employee.phone}</div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-muted">Biometric Registration</label>
                    <div style={{ fontWeight: 600, color: employee.biometricCredentialId ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Fingerprint size={12} /> {employee.biometricCredentialId ? 'Registered' : 'Not Registered'}
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="section-title" style={{ fontSize: '16px', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} /> Compensation
              </h3>
              <div className="details-card" style={{ padding: '20px', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '14px' }}>
                  <strong>Type:</strong> {employee.compensationType === 'salary' ? 'Monthly Salary' : employee.compensationType === 'dailyRate' ? 'Daily Rate' : 'Commission Based'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
                  {employee.compensationType === 'salary' 
                    ? formatCurrency(employee.salary / 12) + '/mo'
                    : employee.compensationType === 'dailyRate'
                      ? formatCurrency(employee.dailyRate) + '/day'
                      : employee.percentageRate + '% commission'
                  }
                </div>
                <div className="text-xs text-muted mt-2">
                  Full-time: {employee.hrsPerDay} mins/day • {employee.daysPerWeek} days/week
                </div>
              </div>
            </div>

            {/* Right Column: Identity Verification (No Photos) */}
            <div>
              <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> Identity Verification
              </h3>
              
              <div style={{ 
                background: 'var(--bg-hover)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <label className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>CNIC / ID Number</label>
                <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {employee.cnic || 'NOT PROVIDED'}
                </div>
              </div>

              <h3 className="section-title" style={{ fontSize: '16px', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> System Account Credentials
              </h3>
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
                <div className="mb-2">
                  <label className="text-xs text-muted fw-700 uppercase">Login Email</label>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{employee.loginEmail || 'No account created'}</div>
                </div>
                <div>
                  <label className="text-xs text-muted fw-700 uppercase">System Password</label>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{employee.loginPassword || '••••••••'}</div>
                </div>
              </div>
            </div>

          </div> {/* End grid-2 */}
        </div> {/* End modal-body */}

        <div className="modal-footer" style={{ background: 'var(--bg-light)', padding: '20px 30px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  )
}

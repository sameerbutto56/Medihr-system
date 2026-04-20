import { Bell, Search, LogOut, Menu, Trash2, Activity } from 'lucide-react'
import React, { useState } from 'react'

import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { avatarInitials } from '../../utils/helpers'
import BranchSwitcher from './BranchSwitcher'

const TITLES = {
  '/hr':                   'HR Dashboard',
  '/hr/employees':         'Employees',
  '/hr/attendance':        'Attendance',
  '/hr/payroll':           'Payroll',
  '/hr/portal':            'Employee Directory',
  '/hr/ceo':               'CEO Management Portal',
  '/hospital':             'Rehabilitation Dashboard',
  '/hospital/patients':    'Patients',
  '/hospital/appointments':'Appointments',
  '/hospital/records':     'Rehab Records',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'MediHR'
  const { userRole, currentUser, logout } = useAuth()
  const { setMobileMenuOpen, factoryReset } = useApp()
  const [showWipeModal, setShowWipeModal] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [isWiping, setIsWiping] = useState(false)

  const handleFullWipe = async () => {
    if (resetCode !== '916500') {
      alert("Invalid security code.")
      return
    }
    if (!window.confirm("FINAL WARNING: This is IRREVERSIBLE. Are you absolutely certain?")) return

    setIsWiping(true)
    try {
      const count = await factoryReset(resetCode)
      alert(`FACTORY RESET COMPLETE!\n\nDeleted ${count} total records. The system will now reload.`)
      window.location.reload()
    } catch (err) {
      alert(`Wipe failed: ${err.message}`)
      setIsWiping(false)
    }
  }


  return (
    <header className="topbar">
      <button 
        className="icon-btn mobile-only" 
        style={{ marginRight: '8px' }} 
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={20} />
      </button>

      <span className="topbar-title">{title}</span>

      <div className="topbar-actions">
        {userRole === 'owner' && <BranchSwitcher />}
        
        <div className="search-bar">
          <Search size={15} />
          <input type="text" placeholder="Search…" />
        </div>

        {userRole === 'owner' && (
          <button 
            className="icon-btn" 
            title="Wipe All Data (Factory Reset)" 
            onClick={() => setShowWipeModal(true)}
            style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <Trash2 size={16} />
          </button>
        )}

        <button className="icon-btn" title="Logout" onClick={logout}>
          <LogOut size={16} />
        </button>


        <div className="avatar-chip">
          <div className="avatar">{avatarInitials(currentUser?.displayName || 'User')}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="avatar-name" style={{ lineHeight: 1 }}>{currentUser?.displayName?.split(' ')[0] || 'User'}</span>
            <span style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800, marginTop: '2px', lineHeight: 1 }}>
              {userRole === 'owner' ? 'CEO Portal' : userRole === 'hr' ? 'HR Portal' : userRole === 'employee' ? 'Employee Portal' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title text-danger">Safety Check</h2>
              <button className="toggle-btn" onClick={() => setShowWipeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ color: '#ef4444', fontSize: '48px', marginBottom: '16px' }}><Activity size={48} /></div>
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Erase Entire Database?</h3>
              <p className="mb-4 text-sm text-muted">This will permanently delete all clinics, staff, patients, and financial records.</p>
              
              <div className="form-group text-left">
                <label className="form-label">Type Security Code:</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="Enter Code"
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '20px', fontWeight: 800, letterSpacing: '4px' }}
                />
              </div>

              <button 
                className="btn btn-danger w-100 mt-4" 
                onClick={handleFullWipe}
                disabled={isWiping || resetCode !== '916500'}
                style={{ width: '100%', padding: '12px', background: resetCode === '916500' ? '#ef4444' : '#334155' }}
              >
                {isWiping ? 'Wiping System...' : 'Confirm Full System Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>

  )
}

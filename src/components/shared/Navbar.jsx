import { Bell, Search, LogOut, Menu, Trash2 } from 'lucide-react'
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
  const { setMobileMenuOpen, setShowWipeModal } = useApp()

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
        
        <div className="search-bar desktop-only">
          <Search size={15} />
          <input type="text" placeholder="Search…" />
        </div>

        {userRole === 'owner' && (
          <button 
            id="wipe-data-trigger"
            className="icon-btn" 
            title="Wipe All Data (Factory Reset)" 
            onClick={() => {
              console.log("Triggering Wipe Modal from Navbar...");
              setShowWipeModal(true);
            }}
            style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)' }}
          >
            <Trash2 size={18} />
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
    </header>
  )
}

import { Bell, Search, LogOut } from 'lucide-react'
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
  '/hospital':             'Rehabilitation Dashboard',
  '/hospital/patients':    'Patients',
  '/hospital/appointments':'Appointments',
  '/hospital/records':     'Rehab Records',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'MediHR'
  const { userRole, currentUser, logout } = useAuth()

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>

      <div className="topbar-actions">
        {userRole === 'owner' && <BranchSwitcher />}
        
        <div className="search-bar">
          <Search size={15} />
          <input type="text" placeholder="Search…" />
        </div>

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

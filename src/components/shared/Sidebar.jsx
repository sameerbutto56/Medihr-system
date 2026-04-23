import { NavLink, useLocation } from 'react-router-dom'
import {
  Users, ClipboardList, DollarSign, Calendar, Clock,
  Activity, FileText, LayoutDashboard, Building2,
  Stethoscope, ChevronLeft, ChevronRight, Settings, LogOut,
  ShieldCheck, Menu, X
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const HR_NAV = [
  { to: '/hr',            label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/me',            label: 'My Profile', icon: ClipboardList },
  { to: '/hr/employees',  label: 'Employees',  icon: Users },
  { to: '/hr/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/hr/payroll',    label: 'Payroll',    icon: DollarSign },
  { to: '/hr/portal',     label: 'HR Portal',  icon: Settings },
]

const REHAB_NAV = [
  { to: '/hospital',              label: 'Dashboard',       icon: Activity },
  { to: '/me',                    label: 'My Profile',      icon: ClipboardList },
  { to: '/hospital/patients',     label: 'Patients',        icon: Users },
  { to: '/hospital/appointments', label: 'Appointments',    icon: Calendar },
  { to: '/hospital/therapy',      label: 'Therapy Sessions', icon: Users },
  { to: '/hospital/billing',      label: 'Billing',         icon: DollarSign },
  { to: '/hospital/records',      label: 'Rehab Records',   icon: FileText },
]

const EMP_NAV = [
  { to: '/me', label: 'My Dashboard', icon: LayoutDashboard },
]

const MANAGER_NAV = [
  { to: '/hr/manager', label: 'Manager Portal', icon: ClipboardList },
  { to: '/me',         label: 'My Profile',     icon: Users },
]

export default function Sidebar() {
  const { 
    sidebarOpen, setSidebarOpen, 
    activeModule, setActiveModule,
    mobileMenuOpen, setMobileMenuOpen 
  } = useApp()
  const { userRole } = useAuth()
  const collapsed = !sidebarOpen
  
  // Combine core nav with conditional CEO portal
  let nav = []
  if (userRole === 'employee') {
    nav = EMP_NAV
  } else if (userRole === 'manager') {
    nav = MANAGER_NAV
  } else {
    nav = (activeModule === 'hr' ? HR_NAV : REHAB_NAV)
  }
  
  if (userRole === 'owner' && activeModule === 'hr') {
    // Insert CEO Portal before general HR Portal settings
    const ceoItem = { to: '/hr/ceo', label: 'CEO Portal', icon: ShieldCheck }
    if (!nav.find(i => i.to === '/hr/ceo')) {
      nav = [nav[0], ceoItem, ...nav.slice(1)]
    }
  }

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon logo-icon-3d" style={{ background: 'var(--brand-gradient)', color: '#fff', fontWeight: 800, fontSize: '18px' }}>
          M
        </div>
        {!collapsed && <span className="logo-text">MediHR</span>}
      </div>

      {/* Module Switcher - Hide for Employees and Managers */}
      {userRole !== 'employee' && userRole !== 'manager' && (
        !collapsed ? (
          <div className="sidebar-module-switcher">
            <button
              className={`module-btn${activeModule === 'hr' ? ' active' : ''}`}
              onClick={() => setActiveModule('hr')}
            >
              <Building2 size={14} />
              HR
            </button>
            <button
              className={`module-btn${activeModule === 'hospital' ? ' active' : ''}`}
              onClick={() => setActiveModule('hospital')}
            >
              <Stethoscope size={14} />
              Rehabilitation
            </button>
          </div>
        ) : (
          <div style={{ borderBottom: '1px solid var(--border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              className={`module-btn${activeModule === 'hr' ? ' active' : ''}`}
              onClick={() => setActiveModule('hr')}
              title="HR"
            ><Building2 size={14} /></button>
            <button
              className={`module-btn${activeModule === 'hospital' ? ' active' : ''}`}
              onClick={() => setActiveModule('hospital')}
              title="Hospital"
            ><Stethoscope size={14} /></button>
          </div>
        )
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">
          {userRole === 'employee' ? 'Employee Portal' : (activeModule === 'hr' ? 'HR Management' : 'Rehabilitation')}
        </div>}
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/hr' || to === '/hospital'}
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="nav-icon" />
            {!collapsed && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <NavLink to="/settings" className="nav-item" style={{ marginBottom: 4 }}>
            <Settings size={16} className="nav-icon" />
            <span className="nav-label">Settings</span>
          </NavLink>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="nav-item"
          style={{ width: '100%', background:'none', border:'none', cursor:'pointer' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed
            ? <ChevronRight size={16} className="nav-icon" />
            : <><ChevronLeft size={16} className="nav-icon" /><span className="nav-label">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}

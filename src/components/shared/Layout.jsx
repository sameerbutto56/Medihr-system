import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../../context/AppContext'

export default function Layout({ children }) {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp()

  return (
    <div className="app-shell">
      <div 
        className={`sidebar-overlay${mobileMenuOpen ? ' show' : ''}`} 
        onClick={() => setMobileMenuOpen(false)}
      />
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="page-content">
          <div className="perspective-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

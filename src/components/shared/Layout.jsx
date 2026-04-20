import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../../context/AppContext'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'

export default function Layout({ children }) {
  const { mobileMenuOpen, setMobileMenuOpen, showWipeModal, setShowWipeModal, factoryReset } = useApp()
  const [resetCode, setResetCode] = useState('')
  const [isWiping, setIsWiping] = useState(false)

  const handleFullWipe = async () => {
    const trimmedCode = resetCode.trim()
    if (trimmedCode !== '916500') {
      alert(`Invalid security code: "${trimmedCode}"`)
      return
    }
    if (!window.confirm("FINAL WARNING: This is IRREVERSIBLE. Are you absolutely certain?")) return

    setIsWiping(true)
    try {
      const count = await factoryReset(trimmedCode)
      alert(`FACTORY RESET COMPLETE!\n\nDeleted ${count} total records. The system will now reload.`)
      window.location.reload()
    } catch (err) {
      alert(`Wipe failed: ${err.message}`)
      setIsWiping(false)
    }
  }

  // Clear state when modal closes
  React.useEffect(() => {
    if (!showWipeModal) {
      setResetCode('')
      setIsWiping(false)
    }
  }, [showWipeModal])

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

      {/* GLOBAL Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="modal-overlay" style={{ zIndex: 1000000, background: 'rgba(5, 0, 15, 0.9)', backdropFilter: 'blur(12px)' }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: 440, 
              textAlign: 'center', 
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(180deg, #1a0b3b 0%, #0a0118 100%)',
              boxShadow: '0 25px 70px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
              transform: 'translateZ(2000px)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
              <h2 className="section-title" style={{ color: '#ef4444', fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>CRITICAL SYSTEM WIPE</h2>
              <button className="toggle-btn" onClick={() => setShowWipeModal(false)} style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '32px 24px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'rgba(239, 68, 68, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}>
                <Trash2 size={36} color="#ef4444" />
              </div>

              <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Initiate Factory Reset?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', padding: '0 10px' }}>
                This is a <strong style={{ color: '#ef4444' }}>permanent</strong> action. All employee records, patient histories, and financial data will be destroyed.
              </p>
              
              <div className="form-group" style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '16px' }}>
                  Master Authorization required
                </label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '28px', 
                    fontWeight: 900, 
                    letterSpacing: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: resetCode.trim() === '916500' ? '#10b981' : '#fff',
                    fontFamily: 'monospace',
                    textShadow: resetCode.trim() === '916500' ? '0 0 15px rgba(16,185,129,0.5)' : 'none',
                    transition: 'all 0.3s ease',
                    height: '60px'
                  }}
                />
              </div>

              <button 
                className="btn" 
                onClick={handleFullWipe}
                disabled={isWiping || resetCode.trim() !== '916500'}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  marginTop: '28px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: resetCode.trim() === '916500' ? 'pointer' : 'not-allowed',
                  background: resetCode.trim() === '916500' ? 'linear-gradient(90deg, #ef4444, #b91c1c)' : 'rgba(255,255,255,0.05)',
                  color: resetCode.trim() === '916500' ? '#fff' : '#4b5563',
                  boxShadow: resetCode.trim() === '916500' ? '0 15px 30px rgba(239, 68, 68, 0.4)' : 'none',
                  border: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {isWiping ? 'DELETING SYSTEM DATA...' : 'TERMINATE ALL DATA'}
              </button>
              
              <button 
                onClick={() => setShowWipeModal(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#94a3b8', 
                  fontSize: '13px', 
                  marginTop: '20px', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Discard Clearance Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

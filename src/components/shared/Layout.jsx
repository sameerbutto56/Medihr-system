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
        <div className="modal-overlay" style={{ zIndex: 100000, background: 'rgba(5, 0, 15, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: 440, 
              textAlign: 'center', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'linear-gradient(180deg, #160832 0%, #0a0118 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.1)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
              <h2 className="section-title" style={{ color: '#ef4444', fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>SYSTEM DESTRUCTION</h2>
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
                border: '1px solid rgba(239, 68, 68, 0.2)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
              }}>
                <Trash2 size={36} color="#ef4444" />
              </div>

              <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Factory Reset System?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', padding: '0 10px' }}>
                This is a <strong style={{ color: '#ef4444' }}>permanent</strong> action. Every branch, staff record, patient history, and financial invoice will be erased forever.
              </p>
              
              <div className="form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94a3b8', marginBottom: '16px' }}>
                  Enter Master Authorization Code
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '32px', 
                    fontWeight: 900, 
                    letterSpacing: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: resetCode === '916500' ? '#10b981' : '#fff',
                    fontFamily: 'monospace',
                    textShadow: resetCode === '916500' ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              <button 
                className="btn" 
                onClick={handleFullWipe}
                disabled={isWiping || resetCode !== '916500'}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  marginTop: '24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: resetCode === '916500' ? 'pointer' : 'not-allowed',
                  background: resetCode === '916500' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                  color: resetCode === '916500' ? '#fff' : '#475569',
                  boxShadow: resetCode === '916500' ? '0 10px 20px rgba(239, 68, 68, 0.3)' : 'none',
                  border: 'none',
                  transition: 'all 0.3s ease'
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

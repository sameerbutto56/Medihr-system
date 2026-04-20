import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../../context/AppContext'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

export default function Layout({ children }) {
  const { mobileMenuOpen, setMobileMenuOpen, showWipeModal, setShowWipeModal, factoryReset } = useApp()
  const [resetCode, setResetCode] = useState('')
  const [isWiping, setIsWiping] = useState(false)
  const [confirmStep, setConfirmStep] = useState(0) // 0: initial, 1: double-confirm

  const handleFullWipe = async () => {
    console.log("handleFullWipe START, step:", confirmStep);
    const trimmedCode = resetCode.trim()
    
    if (trimmedCode !== '916500') {
      alert(`Invalid security code.`)
      return
    }

    if (confirmStep === 0) {
      console.log("Entering confirmation step 1");
      setConfirmStep(1)
      return
    }

    console.log("Wipe confirmed via double-click. Executing...");
    setIsWiping(true)
    try {
      const count = await factoryReset(trimmedCode)
      alert(`SUCCESS! Deleted ${count} records. Reloading...`)
      window.location.reload()
    } catch (err) {
      alert(`Error: ${err.message}`)
      setIsWiping(false)
      setConfirmStep(0)
    }
  }

  // Clear state when modal closes
  React.useEffect(() => {
    if (!showWipeModal) {
      setResetCode('')
      setIsWiping(false)
      setConfirmStep(0)
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

      {/* GLOBAL Wipe Confirmation Modal - PORTALED TO BODY */}
      {showWipeModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000000, background: 'rgba(5, 0, 15, 0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: 440, 
              width: '90%',
              textAlign: 'center', 
              border: confirmStep === 1 ? '1px solid #fbbf24' : '1px solid rgba(239, 68, 68, 0.5)',
              background: 'linear-gradient(180deg, #1a0b3b 0%, #0a0118 100%)',
              boxShadow: confirmStep === 1 ? '0 40px 100px rgba(0, 0, 0, 0.9), 0 0 40px rgba(251, 191, 36, 0.2)' : '0 40px 100px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.1)',
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
              <h2 className="section-title" style={{ color: '#ef4444', fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>CRITICAL SYSTEM WIPE</h2>
              <button className="toggle-btn" onClick={() => setShowWipeModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
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
                    height: '60px',
                    width: '100%'
                  }}
                />
              </div>

              <button 
                type="button"
                id="execute-wipe-btn"
                className="btn btn-danger" 
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
                  cursor: (isWiping || resetCode.trim() !== '916500') ? 'not-allowed' : 'pointer',
                  background: isWiping 
                    ? '#4b5563' 
                    : resetCode.trim() !== '916500' 
                      ? 'rgba(255,255,255,0.05)' 
                      : confirmStep === 1 
                        ? 'linear-gradient(90deg, #fbbf24, #d97706)' 
                        : 'linear-gradient(90deg, #ef4444, #b91c1c)',
                  color: isWiping || resetCode.trim() !== '916500' ? '#4b5563' : '#fff',
                  boxShadow: resetCode.trim() === '916500' ? (confirmStep === 1 ? '0 15px 30px rgba(251, 191, 36, 0.4)' : '0 15px 30px rgba(239, 68, 68, 0.4)') : 'none',
                  border: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'auto'
                }}
              >
                {isWiping 
                  ? 'DELETING SYSTEM DATA...' 
                  : confirmStep === 1 
                    ? '⚠️ ARE YOU CERTAIN? CLICK AGAIN' 
                    : 'TERMINATE ALL DATA'}
              </button>
              
              <button 
                type="button"
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
        </div>,
        document.body
      )}
    </div>
  )
}

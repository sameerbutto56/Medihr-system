import React, { useState, useMemo } from 'react'
import { X, Calendar, DollarSign, Activity, FileText, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatDate, formatCurrency } from '../../utils/helpers'
import AddMedicalRecordForm from './AddMedicalRecordForm'

const headerStyle = { fontSize: '15px', color: 'var(--primary)', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontWeight: 'bold' }

const tabStyle = (isActive) => ({
  flex: 1, padding: '12px', background: isActive ? 'var(--surface)' : 'transparent', border: 'none',
  borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  fontWeight: 500, color: isActive ? 'var(--primary)' : 'var(--text-muted)'
})

export default function PatientDetails({ patient, onClose }) {
  const { hosAppointments, hosTherapySessions, hosInvoices, hosMedicalRecords } = useApp()
  const [activeTab, setActiveTab] = useState('appointments')
  const [showAddRecord, setShowAddRecord] = useState(false)

  if (!patient) return null

  // Safely grab patient ID/Name ensuring backwards compatibility with older data missing patientId
  const matchP = (record) => record.patientId === patient.id || (record.patientName === patient.name && !record.patientId)

  // Filter Data
  const appointments = (hosAppointments || []).filter(matchP).sort((a,b) => new Date(b.date) - new Date(a.date))
  const sessions = (hosTherapySessions || []).filter(matchP).sort((a,b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  const invoices = (hosInvoices || []).filter(matchP).sort((a,b) => new Date(b.date) - new Date(a.date))
  const records = (hosMedicalRecords || []).filter(matchP).sort((a,b) => new Date(b.date) - new Date(a.date))

  // Financial Stats
  const finStats = useMemo(() => {
    let billed = 0, paid = 0, balance = 0
    invoices.forEach(i => {
      billed += Number(i.totalAmount) || 0
      paid += Number(i.amountPaid) || 0
      balance += Number(i.balance) || 0
    })
    return { billed, paid, balance }
  }, [invoices])

  const sessionStats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'completed').length
    const scheduled = sessions.filter(s => s.status === 'scheduled').length
    return { completed, scheduled, total: sessions.length }
  }, [sessions])

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 850, padding: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '22px' }}>{patient.name}</h2>
            <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
              <strong>{patient.patientId || patient.id.slice(-6).toUpperCase()}</strong> &nbsp;|&nbsp; 
              Admitted: {formatDate(patient.admittedOn)} &nbsp;|&nbsp; 
              {patient.age} yrs &nbsp;|&nbsp; 
              {patient.gender} &nbsp;|&nbsp; 
              Blood: {patient.bloodType} &nbsp;|&nbsp; 
              {patient.phone || 'No phone'}
            </p>
          </div>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
          <button onClick={() => setActiveTab('appointments')} style={tabStyle(activeTab === 'appointments')}>
            <Calendar size={16} /> Appointments ({appointments.length})
          </button>
          <button onClick={() => setActiveTab('therapy')} style={tabStyle(activeTab === 'therapy')}>
            <Activity size={16} /> Therapy ({sessions.length})
          </button>
          <button onClick={() => setActiveTab('billing')} style={tabStyle(activeTab === 'billing')}>
            <DollarSign size={16} /> Billing
          </button>
          <button onClick={() => setActiveTab('records')} style={tabStyle(activeTab === 'records')}>
            <FileText size={16} /> Records
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', minHeight: '300px', maxHeight: '60vh', overflowY: 'auto' }}>
          
          <style>{`
            .prof-mini-stat { flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; border-left: 4px solid var(--primary); background: var(--surface); }
            .prof-mini-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
            .prof-mini-table th, .prof-mini-table td { padding: 10px; border-bottom: 1px solid var(--border); }
            .prof-mini-table th { background: var(--bg-hover); color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .prof-mini-table tr:last-child td { border-bottom: none; }
          `}</style>

          {activeTab === 'appointments' && (
            <div>
              <h3 style={headerStyle}>Appointment History</h3>
              {appointments.length > 0 ? (
                <table className="prof-mini-table">
                  <thead><tr><th>Date & Time</th><th>Doctor</th><th>Specialty</th><th>Location</th><th>Status</th></tr></thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>{formatDate(a.date)} at {a.time}</td>
                        <td>{a.doctor}</td>
                        <td>{a.specialty}</td>
                        <td>{a.location || '-'}</td>
                        <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted text-sm">No appointments found.</p>}
            </div>
          )}

          {activeTab === 'therapy' && (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div className="prof-mini-stat">
                  <span className="text-muted text-xs">Total Sessions</span><br/>
                  <strong style={{ fontSize: '18px' }}>{sessionStats.total}</strong>
                </div>
                <div className="prof-mini-stat" style={{ borderLeftColor: 'emerald' }}>
                  <span className="text-muted text-xs">Completed</span><br/>
                  <strong className="text-green" style={{ fontSize: '18px' }}>{sessionStats.completed}</strong>
                </div>
                <div className="prof-mini-stat" style={{ borderLeftColor: 'var(--amber)' }}>
                  <span className="text-muted text-xs">Scheduled</span><br/>
                  <strong style={{ fontSize: '18px', color: 'var(--amber)' }}>{sessionStats.scheduled}</strong>
                </div>
              </div>
              
              <h3 style={headerStyle}>Therapy Session History</h3>
              {sessions.length > 0 ? (
                <table className="prof-mini-table">
                  <thead><tr><th>Type</th><th>Date/Time</th><th>Therapist</th><th>Notes</th><th>Status</th></tr></thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td><span className={`badge ${s.sessionType === 'Monthly' ? 'status-default' : 'status-info'}`}>{s.sessionType}</span></td>
                        <td style={{ fontWeight: 500 }}>{s.sessionType === 'Monthly' ? 'Recurring Plan' : `${formatDate(s.date)} at ${s.time}`}</td>
                        <td>{s.therapist}</td>
                        <td className="text-muted text-xs">{s.notes?.substring(0, 30)}...</td>
                        <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted text-sm">No therapy sessions found.</p>}
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div className="prof-mini-stat" style={{ borderLeftColor: 'indigo' }}>
                  <span className="text-muted text-xs">Total Billed</span><br/>
                  <strong style={{ fontSize: '16px' }}>{formatCurrency(finStats.billed)}</strong>
                </div>
                <div className="prof-mini-stat" style={{ borderLeftColor: 'emerald' }}>
                  <span className="text-muted text-xs">Total Paid</span><br/>
                  <strong className="text-green" style={{ fontSize: '16px' }}>{formatCurrency(finStats.paid)}</strong>
                </div>
                <div className="prof-mini-stat" style={{ borderLeftColor: finStats.balance > 0 ? 'var(--red)' : 'var(--border)' }}>
                  <span className="text-muted text-xs">Outstanding Balance</span><br/>
                  <strong style={{ fontSize: '16px', color: finStats.balance > 0 ? 'var(--red)' : 'inherit' }}>{formatCurrency(finStats.balance)}</strong>
                </div>
              </div>

              <h3 style={headerStyle}>Invoice History</h3>
              {invoices.length > 0 ? (
                <table className="prof-mini-table">
                  <thead><tr><th>Invoice #</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                  <tbody>
                    {invoices.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontFamily: 'monospace' }}>{i.id.slice(-6).toUpperCase()}</td>
                        <td style={{ fontWeight: 500 }}>{formatDate(i.date)}</td>
                        <td>{formatCurrency(i.totalAmount)}</td>
                        <td className="text-green">{formatCurrency(i.amountPaid)}</td>
                        <td style={{ color: i.balance > 0 ? 'var(--red)' : 'inherit' }}>{formatCurrency(i.balance)}</td>
                        <td><span className={`badge ${i.status}`}>{i.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted text-sm">No billing records found.</p>}
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ ...headerStyle, marginBottom: 0, borderBottom: 'none' }}>Clinical Notes & Records</h3>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setShowAddRecord(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Add Record
                </button>
              </div>
              
              {records.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {records.map(r => (
                    <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', background: 'var(--surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '10px' }}>{r.type}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{formatDate(r.date)}</span>
                      </div>
                      <div style={{ fontSize: '13px', marginBottom: '8px', lineHeight: '1.5' }}>{r.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>Doctor:</strong> {r.doctor}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted text-sm">No clinical records found for this patient.</p>}

              {showAddRecord && (
                <AddMedicalRecordForm 
                  onClose={() => setShowAddRecord(false)} 
                  prefilledPatientId={patient.id} 
                />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

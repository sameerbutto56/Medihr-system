import React, { useState } from 'react'
import { X, Save, FileText, Clipboard, Activity, FlaskConical, Stethoscope } from 'lucide-react'
import { useApp } from '../../context/AppContext'
// import Removed FunnyButton

const RECORD_TYPES = [
  { label: 'Diagnosis', icon: Stethoscope, color: 'indigo' },
  { label: 'Prescription', icon: Clipboard, color: 'amber' },
  { label: 'Lab Result', icon: FlaskConical, color: 'cyan' },
  { label: 'Treatment', icon: Activity, color: 'emerald' },
  { label: 'Surgery', icon: FileText, color: 'red' },
  { label: 'Initial Consultation', icon: Stethoscope, color: 'violet' }
]

export default function AddMedicalRecordForm({ onClose, prefilledPatientId = '' }) {
  const { addMedicalRecord, hosPatients, hrEmployees } = useApp()
  const [formData, setFormData] = useState({
    patientId: prefilledPatientId,
    type: 'Diagnosis',
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    attachments: []
  })

  const [docSearch, setDocSearch] = useState('')
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false)

  const activeDoctors = hrEmployees.filter(e => 
    e.status === 'active' && 
    (e.role.toLowerCase().includes('dr') || e.role.toLowerCase().includes('doctor') || e.name.toLowerCase().includes('dr.'))
  )

  const filteredDoctors = activeDoctors.filter(e => 
    e.name.toLowerCase().includes(docSearch.toLowerCase()) || 
    e.role.toLowerCase().includes(docSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.patientId) {
        alert('Please select a patient.')
        return
      }
      await addMedicalRecord({
        ...formData,
        createdAt: new Date().toISOString()
      })
      onClose()
    } catch (err) {
      console.error('Error adding record:', err)
      alert('Failed to add medical record.')
    }
  }

  const isFormValid = !!(formData.patientId && formData.type && formData.doctor && formData.date && formData.description)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Add Medical Record</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select 
                className="form-control" 
                value={formData.patientId} 
                onChange={e => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                disabled={!!prefilledPatientId}
              >
                <option value="">-- Select Patient --</option>
                {hosPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.patientId || 'ID Pending'})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Record Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {RECORD_TYPES.map(rt => {
                    const Icon = rt.icon
                    const isSelected = formData.type === rt.label
                    return (
                      <button
                        key={rt.label}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: rt.label }))}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          padding: '8px', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--surface)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <Icon size={18} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                        <span style={{ fontSize: '10px', fontWeight: isSelected ? 600 : 400 }}>{rt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Consulting Doctor</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search Doctor..."
                  value={docSearch}
                  onChange={(e) => {
                    setDocSearch(e.target.value)
                    setIsDocDropdownOpen(true)
                  }}
                  onFocus={() => setIsDocDropdownOpen(true)}
                />
                {isDocDropdownOpen && filteredDoctors.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                    borderRadius: '8px', zIndex: 100, maxHeight: '150px', overflowY: 'auto',
                    marginTop: '4px', boxShadow: 'var(--shadow-lg)'
                  }}>
                    {filteredDoctors.map(doc => (
                      <div 
                        key={doc.id} 
                        className="p-2" 
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, doctor: doc.name }))
                          setDocSearch(doc.name)
                          setIsDocDropdownOpen(false)
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{doc.role}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date} 
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Notes / Description</label>
              <textarea 
                className="form-control" 
                rows={4} 
                placeholder="Enter detailed diagnosis, treatment plan, or surgery notes..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              ></textarea>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isFormValid}>Save Record</button>
          </div>
        </form>
      </div>
    </div>
  )
}

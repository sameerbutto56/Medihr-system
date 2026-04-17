import React, { useState } from 'react'
import { X, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function RecommendTherapyForm({ appointment, onClose }) {
  const { addTherapyRecommendation } = useApp()
  const [formData, setFormData] = useState({
    advisedSessions: 1,
    notes: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addTherapyRecommendation({
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        phone: appointment.phone || '',
        doctor: appointment.doctor,
        advisedSessions: parseInt(formData.advisedSessions, 10),
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: 'pending' // pending until it is scheduled
      })
      onClose()
    } catch (err) {
      console.error('Error adding therapy recommendation:', err)
      alert('Failed to add therapy recommendation.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} className="text-primary" />
            Recommend Therapy
          </h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-banner" style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}><strong>Patient:</strong> {appointment.patientName}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }} className="text-muted"><strong>Doctor:</strong> {appointment.doctor}</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Advised Number of Sessions</label>
              <input 
                type="number" 
                name="advisedSessions" 
                required 
                className="form-control" 
                min="1"
                value={formData.advisedSessions} 
                onChange={handleChange} 
              />
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                How many sessions are recommended for this patient?
              </span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Notes / Therapy Instructions</label>
              <textarea 
                name="notes" 
                className="form-control" 
                value={formData.notes} 
                onChange={handleChange} 
                rows={3}
                placeholder="Specific instructions for the therapist..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Recommendation</button>
          </div>
        </form>
      </div>
    </div>
  )
}

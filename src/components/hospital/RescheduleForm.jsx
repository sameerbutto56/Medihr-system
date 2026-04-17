import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function RescheduleForm({ appointment, onClose }) {
  const { updateAppointment } = useApp()
  const [formData, setFormData] = useState({
    date: appointment.date || '',
    time: appointment.time || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateAppointment(appointment.id, {
        date: formData.date,
        time: formData.time,
        rescheduledCount: (appointment.rescheduledCount || 0) + 1,
        lastRescheduledAt: new Date().toISOString()
      })
      onClose()
    } catch (err) {
      console.error('Error rescheduling appointment:', err)
      alert('Failed to reschedule appointment.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Reschedule Appointment</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="text-muted mb-4 text-sm">Rescheduling for <strong>{appointment.patientName}</strong> with {appointment.doctor}.</p>
            <div className="form-group">
              <label className="form-label">New Date</label>
              <input type="date" name="date" required className="form-control" value={formData.date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">New Time</label>
              <input type="time" name="time" required className="form-control" value={formData.time} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

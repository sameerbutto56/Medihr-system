import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function AttendanceForm({ onClose }) {
  const { hrEmployees, addAttendance } = useApp()
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '17:00',
    status: 'present'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employeeId) return alert('Please select an employee')
    
    try {
      await addAttendance(formData)
      onClose()
    } catch (err) {
      console.error('Error adding attendance:', err)
      alert('Failed to record attendance.')
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
          <h2 className="section-title">Mark Attendance</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Employee</label>
              <select name="employeeId" required className="form-control" value={formData.employeeId} onChange={handleChange}>
                <option value="">Select Employee...</option>
                {hrEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="date" required className="form-control" value={formData.date} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input type="time" name="checkIn" className="form-control" value={formData.checkIn} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input type="time" name="checkOut" className="form-control" value={formData.checkOut} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Record Attendance</button>
          </div>
        </form>
      </div>
    </div>
  )
}

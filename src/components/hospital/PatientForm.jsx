import React, { useState, useMemo } from 'react'
import { X, Copy } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import FunnyButton from '../shared/FunnyButton'

function generatePatientId(existingPatients) {
  let maxNum = 0
  existingPatients.forEach(p => {
    if (p.patientId && p.patientId.startsWith('PT-')) {
      const num = parseInt(p.patientId.replace('PT-', ''), 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return `PT-${String(nextNum).padStart(4, '0')}`
}

export default function PatientForm({ onClose }) {
  const { addPatient, hosPatients } = useApp()
  const generatedId = useMemo(() => generatePatientId(hosPatients), [hosPatients])
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodType: 'O+',
    ward: '',
    condition: 'Stable',
    admittedOn: new Date().toISOString().split('T')[0],
    status: 'active'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addPatient({
        ...formData,
        age: Number(formData.age),
        patientId: generatedId
      })
      onClose()
    } catch (err) {
      console.error('Error adding patient:', err)
      alert('Failed to add patient.')
    }
  }

  const isFormValid = !!(formData.name && formData.age && formData.admittedOn)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const copyId = () => {
    navigator.clipboard.writeText(generatedId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Enroll New Patient</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-group" style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'var(--primary-light)', fontSize: '12px', marginBottom: '6px' }}>Patient Unique ID (Auto-generated)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '2px', color: 'var(--primary-light)' }}>{generatedId}</span>
                <button type="button" onClick={copyId} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }} title="Copy ID">
                  <Copy size={16} />
                </button>
                {copied && <span className="text-xs" style={{ color: 'var(--green)' }}>Copied!</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" required className="form-control" value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" name="age" required className="form-control" min="0" value={formData.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <select name="bloodType" className="form-control" value={formData.bloodType} onChange={handleChange}>
                  <option>A+</option><option>A-</option>
                  <option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option>
                  <option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program / Unit</label>
                <input type="text" name="ward" className="form-control" placeholder="e.g. Speech Unit, ABA Program" value={formData.ward} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select name="condition" className="form-control" value={formData.condition} onChange={handleChange}>
                  <option>Stable</option>
                  <option>Serious</option>
                  <option>Critical</option>
                  <option>Recovered</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Enrolled On</label>
              <input type="date" name="admittedOn" required className="form-control" value={formData.admittedOn} onChange={handleChange} />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <FunnyButton label="Save Patient" isFormValid={isFormValid} />
          </div>
        </form>
      </div>
    </div>
  )
}

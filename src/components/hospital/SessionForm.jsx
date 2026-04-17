import React, { useState, useEffect } from 'react'
import { X, Activity, AlertCircle, DollarSign } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { findScheduleConflict } from '../../utils/conflicts'

export default function SessionForm({ onClose, initialRecId = '' }) {
  const { 
    addTherapySession, 
    hrEmployees, 
    hosTherapyRecommendations, 
    updateTherapyRecommendation, 
    hosPatients,
    hosAppointments,
    hosTherapySessions,
    addInvoice
  } = useApp()
  const [selectedRecId, setSelectedRecId] = useState(initialRecId)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    therapist: '',
    sessionType: 'Comprehensive Assessment',
    date: new Date().toISOString().split('T')[0],
    recurringDays: [],
    time: '10:00',
    notes: '',
    status: 'scheduled',
    fee: '0',
    createInvoice: false
  })

  const REHAB_SESSION_TYPES = [
    'Comprehensive Assessment',
    'Speech Language Therapy',
    'ABA Behavior Therapy',
    'Sensory Integration',
    'Academic / Remedial',
    'School Readiness Plan',
    'Psychological Counseling',
    'Initial Consultation'
  ]

  const [conflict, setConflict] = useState(null)

  // Filter for pending recommendations
  const pendingRecs = (hosTherapyRecommendations || []).filter(r => r.status === 'pending')

  // Auto-fill form fields when a recommendation is selected
  useEffect(() => {
    if (selectedRecId) {
      const rec = pendingRecs.find(r => r.id === selectedRecId)
      if (rec) {
        setFormData(prev => ({
          ...prev,
          patientName: rec.patientName || '',
          phone: rec.phone || '',
          notes: rec.notes ? `Advised Sessions: ${rec.advisedSessions}\nDoctor Notes: ${rec.notes}` : `Advised Sessions: ${rec.advisedSessions}`
        }))
      }
    } else {
      // Clear auto-fill if deselected (but keep date/time/etc)
      setFormData(prev => ({
        ...prev,
        patientName: '',
        phone: '',
        notes: ''
      }))
      setSelectedPatientId('')
    }
  }, [selectedRecId])

  useEffect(() => {
    if (!selectedRecId) {
      if (selectedPatientId) {
        const p = hosPatients.find(p => p.id === selectedPatientId)
        if (p) {
          setFormData(prev => ({ ...prev, patientName: p.name, phone: p.phone || prev.phone }))
        }
      } else {
        setFormData(prev => ({ ...prev, patientName: '', phone: '' }))
      }
    }
  }, [selectedPatientId, selectedRecId, hosPatients])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (formData.sessionType === 'Monthly' && formData.recurringDays.length === 0) {
      alert('Please select at least one recurring day for a Monthly session.')
      return
    }

    // Conflict Check
    const existingConflict = findScheduleConflict(formData, hosAppointments, hosTherapySessions)
    if (existingConflict) {
      setConflict(existingConflict)
      alert(`SCHEDULE CONFLICT: ${formData.therapist} is already booked for ${existingConflict.patientName} at ${existingConflict.time}. Please choose another time.`)
      return
    }

    try {
      const sessionData = {
        ...formData,
        patientId: selectedPatientId || null,
        date: formData.sessionType === 'Monthly' ? null : formData.date,
        createdAt: new Date().toISOString(),
        recommendationId: selectedRecId || null
      }

      await addTherapySession(sessionData)

      // AUTOMATED INVOICING
      if (formData.createInvoice && Number(formData.fee) > 0) {
        const patientObj = hosPatients.find(p => p.id === selectedPatientId)
        await addInvoice({
          patientName: formData.patientName,
          patientId: selectedPatientId || null,
          patientRegNumber: patientObj?.patientId || null,
          phone: formData.phone,
          date: new Date().toISOString().split('T')[0],
          items: [{ 
            description: `Therapy Session (${formData.sessionType}) - ${formData.therapist}`, 
            quantity: 1, 
            unitPrice: Number(formData.fee), 
            total: Number(formData.fee) 
          }],
          subtotal: Number(formData.fee),
          discount: 0,
          totalAmount: Number(formData.fee),
          amountPaid: 0,
          balance: Number(formData.fee),
          status: 'unpaid',
          createdAt: new Date().toISOString(),
          type: formData.sessionType,
          planType: formData.planType || 'Per Session'
        })
      }

      // Update the recommendation status
      if (selectedRecId) {
        await updateTherapyRecommendation(selectedRecId, { status: 'scheduled' })
      }

      onClose()
    } catch (err) {
      console.error('Error adding therapy session:', err)
      alert('Failed to add therapy session.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRecurringToggle = (day) => {
    setFormData(prev => {
      const days = prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
      return { ...prev, recurringDays: days }
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Schedule Therapy Session</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {pendingRecs.length > 0 && (
              <div className="form-group" style={{ marginBottom: '16px', padding: '12px', background: 'var(--primary-light)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                  <Activity size={14} /> Pending Doctor Recommendations
                </label>
                <select 
                  className="form-control" 
                  value={selectedRecId} 
                  onChange={(e) => setSelectedRecId(e.target.value)}
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="">-- Start from scratch --</option>
                  {pendingRecs.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.patientName} (Advised: {r.advisedSessions} sessions) - Recommended by {r.doctor}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Registered Patient</label>
              <select 
                className="form-control" 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{ marginBottom: '16px' }}
                disabled={!!selectedRecId}
              >
                <option value="">-- Custom / Unregistered Patient --</option>
                {hosPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.patientId ? `(${p.patientId})` : ''} - {p.phone || 'No phone'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient Name</label>
                <input 
                  type="text" 
                  name="patientName" 
                  required 
                  className="form-control" 
                  value={formData.patientName} 
                  onChange={handleChange} 
                  readOnly={!!selectedPatientId || !!selectedRecId}
                  style={{ background: (selectedPatientId || selectedRecId) ? 'var(--bg-hover)' : 'inherit' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" required className="form-control" value={formData.phone} onChange={handleChange} placeholder="e.g. +1 234 567 8900" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Therapist</label>
                <select name="therapist" required className="form-control" value={formData.therapist} onChange={handleChange}>
                  <option value="" disabled>Select Therapist</option>
                  {hrEmployees.filter(e => e.status === 'active').map(e => (
                    <option key={e.id} value={e.name}>{e.name} - {e.role} ({e.department})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Session Category</label>
                <select name="sessionType" className="form-control" value={formData.sessionType} onChange={handleChange}>
                  {REHAB_SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Plan Type</label>
                <select 
                  name="planType" 
                  className="form-control" 
                  value={formData.planType || 'Per Session'} 
                  onChange={e => setFormData(p => ({ ...p, planType: e.target.value }))}
                >
                  <option value="Per Session">One-time / Per Session</option>
                  <option value="Monthly">Monthly Recurring</option>
                  <option value="Package">Standard Package</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              {(formData.planType === 'Monthly') ? (
                <div className="form-group">
                  <label className="form-label">Recurring Days</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.recurringDays.includes(day)}
                          onChange={() => handleRecurringToggle(day)}
                        /> {day}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" name="date" required className="form-control" value={formData.date} onChange={handleChange} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" name="time" required className="form-control" value={formData.time} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} /> Session Fee (PKR)
                </label>
                <input type="number" name="fee" className="form-control" value={formData.fee} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                <input 
                  type="checkbox" 
                  id="createInvoice" 
                  checked={formData.createInvoice} 
                  onChange={(e) => setFormData(p => ({ ...p, createInvoice: e.target.checked }))} 
                />
                <label htmlFor="createInvoice" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Generate Hospital Invoice</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-control" value={formData.notes} onChange={handleChange} rows={2}></textarea>
            </div>
            
            {conflict && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} />
                <span><strong>Conflict:</strong> {formData.therapist} has an appointment with {conflict.patientName} at this time.</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Session</button>
          </div>
        </form>
      </div>
    </div>
  )
}

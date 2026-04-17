import { X, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import FunnyButton from '../shared/FunnyButton'
import { findScheduleConflict } from '../../utils/conflicts'

export default function AppointmentForm({ onClose }) {
  const { addAppointment, addPatient, hrEmployees, hosPatients } = useApp()
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctor: '',
    specialty: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: '',
    status: 'scheduled'
  })

  // Searchable Doctor State
  const [docSearch, setDocSearch] = useState('')
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [conflict, setConflict] = useState(null)

  const activeDoctors = hrEmployees.filter(e => 
    e.status === 'active' && 
    (
      e.role.toLowerCase().includes('dr') || 
      e.role.toLowerCase().includes('doctor') || 
      e.name.toLowerCase().includes('dr.') ||
      e.department?.toLowerCase().includes('medical') ||
      e.department?.toLowerCase().includes('clinical')
    )
  )

  const filteredDoctors = activeDoctors.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(docSearch.toLowerCase()) || 
                          e.role.toLowerCase().includes(docSearch.toLowerCase())
    
    // If first visit, ONLY show General practitioners unless they search specifically for something else
    if (isFirstVisit && !docSearch) {
      return (e.role?.toLowerCase().includes('general') || e.department?.toLowerCase().includes('general'))
    }
    
    return matchesSearch
  })

  useEffect(() => {
    if (selectedPatientId) {
      const p = hosPatients.find(p => p.id === selectedPatientId)
      if (p) {
        setFormData(prev => ({ ...prev, patientName: p.name, phone: p.phone || prev.phone }))
      }
      setIsFirstVisit(false)
    } else {
      setFormData(prev => ({ ...prev, patientName: '', phone: '' }))
      setIsFirstVisit(true)
    }
  }, [selectedPatientId, hosPatients])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let finalPatientId = selectedPatientId

      // AUTO-REGISTRATION: If it's a new patient, create them in the patients collection first
      if (!finalPatientId) {
        const newPatient = {
          name: formData.patientName,
          phone: formData.phone,
          status: 'active',
          condition: 'Stable',
          admittedOn: new Date().toISOString(),
          ward: 'Outpatient',
          age: 'N/A',
          gender: 'N/A',
          bloodType: 'N/A',
          createdAt: new Date().toISOString(),
          isAutoRegistered: true
        }
        const patientRef = await addPatient(newPatient)
        finalPatientId = patientRef.id
      }

      // Conflict Check
      const existingConflict = findScheduleConflict(formData, hosAppointments, hosTherapySessions)
      if (existingConflict) {
        setConflict(existingConflict)
        alert(`SCHEDULE CONFLICT: ${formData.doctor} is already booked for ${existingConflict.patientName} at ${existingConflict.time}. Please choose another time.`)
        return
      }

      await addAppointment({
        ...formData,
        patientId: finalPatientId,
        createdAt: new Date().toISOString(),
        rescheduledCount: 0,
        isFirstVisit
      })
      onClose()
    } catch (err) {
      console.error('Error adding appointment/patient:', err)
      alert('Failed to process appointment.')
    }
  }

  const isFormValid = !!(
    formData.patientName && 
    formData.phone && 
    formData.doctor && 
    formData.location && 
    formData.date && 
    formData.time
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Schedule Appointment</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <label className="form-label" style={{ margin: 0 }}>Select Registered Patient</label>
                {!selectedPatientId && <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: 600 }}> (New Patient Auto-Register)</span>}
              </div>
              <select 
                className="form-control" 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{ width: '60%', marginBottom: 0 }}
              >
                <option value="">-- Custom / Unregistered --</option>
                {hosPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.patientId ? `(${p.patientId})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', background: isFirstVisit ? 'rgba(124, 58, 237, 0.1)' : 'transparent', padding: '8px', borderRadius: '6px', border: isFirstVisit ? '1px dashed var(--primary)' : '1px solid transparent' }}>
              <input 
                type="checkbox" 
                id="firstVisit" 
                checked={isFirstVisit} 
                onChange={e => setIsFirstVisit(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="firstVisit" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                First-Time Visit (Initial Consultation)
                {isFirstVisit && <span style={{ display: 'block', fontSize: '10px', fontWeight: 400, color: 'var(--primary-light)', marginTop: '2px' }}>This patient's history will be marked as an initial consultation.</span>}
              </label>
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
                  readOnly={!!selectedPatientId}
                  style={{ background: selectedPatientId ? 'var(--bg-hover)' : 'inherit', cursor: selectedPatientId ? 'not-allowed' : 'text' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" required className="form-control" value={formData.phone} onChange={handleChange} placeholder="e.g. +1 234 567 8900" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">
                  Doctor 
                  {isFirstVisit && <span className="badge" style={{ marginLeft: '8px', fontSize: '9px', background: 'var(--primary)', color: '#fff' }}>Recommended: General</span>}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={isFirstVisit ? "Showing General Doctors..." : "Search Doctor..."}
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
                    borderRadius: '8px', zIndex: 100, maxHeight: '200px', overflowY: 'auto',
                    marginTop: '4px', boxShadow: 'var(--shadow-lg)'
                  }}>
                    {filteredDoctors.map(doc => (
                      <div 
                        key={doc.id} 
                        className="p-2" 
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, doctor: doc.name, specialty: doc.role }))
                          setDocSearch(doc.name)
                          setIsDocDropdownOpen(false)
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{doc.role} ({doc.department})</div>
                      </div>
                    ))}
                  </div>
                )}
                {isDocDropdownOpen && filteredDoctors.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                    borderRadius: '8px', zIndex: 100, padding: '10px', textAlign: 'center',
                    marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px'
                  }}>
                    No doctors found matching "{docSearch}"
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Specialty</label>
                <input 
                  type="text" 
                  name="specialty" 
                  className="form-control" 
                  value={formData.specialty} 
                  onChange={handleChange}
                  placeholder="e.g. Cardiology"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location (e.g. Room, Branch)</label>
                <input type="text" name="location" required className="form-control" value={formData.location} onChange={handleChange} placeholder="Room 101" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" name="date" required className="form-control" value={formData.date} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" name="time" required className="form-control" value={formData.time} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-control" value={formData.notes} onChange={handleChange} rows={2}></textarea>
            </div>

            {conflict && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <AlertCircle size={14} />
                <span><strong>Conflict:</strong> {formData.doctor} has a session/appointment with {conflict.patientName} at this time.</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <FunnyButton label="Schedule" isFormValid={isFormValid} />
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { CalendarPlus, Search, Calendar, Clock, RefreshCcw, MessageCircle, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import StatCard from '../../components/shared/StatCard'
import AppointmentForm from '../../components/hospital/AppointmentForm'
import RescheduleForm from '../../components/hospital/RescheduleForm'
import RecommendTherapyForm from '../../components/hospital/RecommendTherapyForm'
import { formatDate } from '../../utils/helpers'
import { startOfWeek, startOfMonth, parseISO, isAfter } from 'date-fns'

export default function Appointments() {
  const { hosAppointments } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [rescheduleData, setRescheduleData] = useState(null)
  const [recommendData, setRecommendData] = useState(null)

  const filtered = hosAppointments.filter(a =>
    [a.patientName, a.doctor, a.specialty, a.status].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    
    let createdThisMonth = 0
    let rescheduledThisMonth = 0
    let createdThisWeek = 0
    let rescheduledThisWeek = 0

    hosAppointments.forEach(a => {
      // Created stats
      if (a.createdAt) {
        try {
          const createdDate = parseISO(a.createdAt)
          if (isAfter(createdDate, monthStart)) createdThisMonth++
          if (isAfter(createdDate, weekStart)) createdThisWeek++
        } catch(e) {}
      }

      // Rescheduled stats
      if (a.rescheduledCount > 0) {
        if (a.lastRescheduledAt) {
          try {
            const reschedDate = parseISO(a.lastRescheduledAt)
            if (isAfter(reschedDate, monthStart)) rescheduledThisMonth++
            if (isAfter(reschedDate, weekStart)) rescheduledThisWeek++
          } catch(e) {}
        }
      }
    })

    return { createdThisMonth, rescheduledThisMonth, createdThisWeek, rescheduledThisWeek, total: hosAppointments.length }
  }, [hosAppointments])

  const columns = [
    { label: 'Patient',     key: 'patientName', render: a => {
        const waNumber = a.phone ? a.phone.replace(/[^0-9]/g, '') : ''
        const waMessage = encodeURIComponent(`Hello ${a.patientName}, your appointment with ${a.doctor} (${a.specialty}) is scheduled for ${formatDate(a.date)} at ${a.time}. Location: ${a.location || 'TBD'}.`)
        
        return (
          <div>
            <strong>{a.patientName}</strong>
            {a.phone && (
              <div className="text-muted text-xs mt-1">
                <a 
                  href={`whatsapp://send?phone=${waNumber}&text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  title="Send WhatsApp Message"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <MessageCircle size={12} /> {a.phone}
                </a>
              </div>
            )}
          </div>
        )
      }
    },
    { label: 'Doctor',      key: 'doctor' },
    { label: 'Specialty',   key: 'specialty' },
    { label: 'Location',    key: 'location', render: a => a.location || '-' },
    { label: 'Date',        key: 'date', render: a => formatDate(a.date) },
    { label: 'Time',        key: 'time' },
    { label: 'Notes',       key: 'notes', render: a => <span className="text-muted text-sm truncate" style={{ maxWidth: 150, display: 'inline-block' }}>{a.notes || '-'}</span> },
    {
      label: 'Status', key: 'status',
      render: a => <span className={`badge ${a.status}`}>{a.status}</span>,
    },
    {
      label: 'Actions', key: 'actions',
      render: a => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className="btn btn-ghost btn-sm text-primary" 
            onClick={() => setRescheduleData(a)}
            title="Reschedule"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCcw size={14} />
            <span className="text-xs">Reschedule</span>
          </button>
          <button 
            className="btn btn-ghost btn-sm text-emerald" 
            onClick={() => setRecommendData(a)}
            title="Recommend Therapy"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Activity size={14} />
            <span className="text-xs">Therapy</span>
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Schedule and manage patient appointments</p>
      </div>

      <div className="stats-grid mb-6">
        <StatCard 
          label="Appointments Created" 
          value={stats.createdThisMonth} 
          sub={`${stats.createdThisWeek} this week`} 
          icon={Calendar} 
          color="indigo" 
        />
        <StatCard 
          label="Rescheduled Appointments" 
          value={stats.rescheduledThisMonth} 
          sub={`${stats.rescheduledThisWeek} this week`} 
          icon={RefreshCcw} 
          color="amber" 
        />
        <StatCard 
          label="Total All Time" 
          value={stats.total} 
          icon={Clock} 
          color="emerald" 
        />
      </div>

      <div className="section-header mb-4">
        <div className="search-bar">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, specialty…"
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <CalendarPlus size={15} /> Schedule
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMsg="No appointments found." />

      {showForm && <AppointmentForm onClose={() => setShowForm(false)} />}
      {rescheduleData && <RescheduleForm appointment={rescheduleData} onClose={() => setRescheduleData(null)} />}
      {recommendData && <RecommendTherapyForm appointment={recommendData} onClose={() => setRecommendData(null)} />}
    </div>
  )
}

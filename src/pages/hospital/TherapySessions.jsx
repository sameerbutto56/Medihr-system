import { useState, useMemo } from 'react'
import { CalendarPlus, Search, PieChart, Users, MessageCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import StatCard from '../../components/shared/StatCard'
import SessionForm from '../../components/hospital/SessionForm'
import TherapyTimetable from '../../components/hospital/TherapyTimetable'
import { formatDate } from '../../utils/helpers'

export default function TherapySessions() {
  const { hosTherapySessions, hosTherapyRecommendations, hosInvoices } = useApp()
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [pendingRecId, setPendingRecId] = useState('')

  const pendingRecs = (hosTherapyRecommendations || []).filter(r => r.status === 'pending')

  const filtered = hosTherapySessions.filter(s =>
    [s.patientName, s.therapist, s.sessionType, s.status].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const stats = useMemo(() => {
    let monthly = 0
    let perSession = 0

    hosTherapySessions.forEach(s => {
      if (s.sessionType === 'Monthly') monthly++
      if (s.sessionType === 'Per Session') perSession++
    })

    return { monthly, perSession, total: hosTherapySessions.length }
  }, [hosTherapySessions])

  const columns = [
    { label: 'Patient',     key: 'patientName', render: s => {
        const waNumber = s.phone ? s.phone.replace(/[^0-9]/g, '') : ''
        const waMessage = encodeURIComponent(`Hello ${s.patientName}, your ${s.sessionType} therapy session with ${s.therapist} is scheduled for ${formatDate(s.date)} at ${s.time}.`)
        
        return (
          <div>
            <strong>{s.patientName}</strong>
            {s.phone && (
              <div className="text-muted text-xs mt-1">
                <a 
                  href={`whatsapp://send?phone=${waNumber}&text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  title="Send WhatsApp Message"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <MessageCircle size={12} /> {s.phone}
                </a>
              </div>
            )}
          </div>
        )
      }
    },
    { label: 'Therapist',   key: 'therapist' },
    { label: 'Type',        key: 'sessionType', render: s => (
        <span className={`badge ${s.sessionType === 'Monthly' ? 'status-active' : 'status-info'}`}>
          {s.sessionType}
        </span>
      )
    },
    { label: 'Date',        key: 'date', render: s => formatDate(s.date) },
    { label: 'Time',        key: 'time' },
    { label: 'Notes',       key: 'notes', render: s => <span className="text-muted text-sm truncate" style={{ maxWidth: 150, display: 'inline-block' }}>{s.notes || '-'}</span> },
    {
      label: 'Status', key: 'status',
      render: s => <span className={`badge ${s.status}`}>{s.status}</span>,
    },
    {
      label: 'Billing', key: 'billing',
      render: s => {
        const fee = s.fee || 0
        const inv = hosInvoices.find(i => 
          i.patientName === s.patientName && 
          i.items.some(item => item.description.includes('Therapy') && item.description.includes(s.therapist))
        )
        
        return (
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 600 }}>PKR {fee}</div>
            {inv ? (
              <span className={`badge ${inv.status}`} style={{ fontSize: '9px', marginTop: '4px' }}>
                Invoice: {inv.status}
              </span>
            ) : (
              fee > 0 && <span className="text-muted" style={{ fontSize: '9px' }}>Not Invoiced</span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Therapy Sessions</h1>
        <p>Manage monthly and per-session therapy patients</p>
      </div>

      <div className="stats-grid mb-6">
        <StatCard 
          label="Total Sessions" 
          value={stats.total} 
          icon={Users} 
          color="indigo" 
        />
        <StatCard 
          label="Monthly Plans" 
          value={stats.monthly} 
          sub="Recurring patients" 
          icon={PieChart} 
          color="emerald" 
        />
        <StatCard 
          label="Per Session" 
          value={stats.perSession} 
          sub="Pay-as-you-go" 
          icon={CalendarPlus} 
          color="amber" 
        />
      </div>

      <div className="section-header mb-4">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient, therapist, or type…"
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button 
              style={{ padding: '6px 12px', background: view === 'list' ? 'var(--primary-light)' : 'transparent', color: view === 'list' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              onClick={() => setView('list')}
            >
              List View
            </button>
            <button 
              style={{ padding: '6px 12px', background: view === 'timetable' ? 'var(--primary-light)' : 'transparent', color: view === 'timetable' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              onClick={() => setView('timetable')}
            >
              Timetable
            </button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setPendingRecId(''); setShowForm(true); }}>
          <CalendarPlus size={15} /> Schedule Session
        </button>
      </div>

      {pendingRecs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--primary)' }}>Pending Doctor Recommendations</h3>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {pendingRecs.map(rec => (
              <div key={rec.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{rec.patientName}</strong>
                  <span className="badge status-warning text-xs">Pending</span>
                </div>
                <div className="text-sm">
                  Recommended by: <strong>{rec.doctor}</strong><br/>
                  Advised Sessions: <strong>{rec.advisedSessions}</strong>
                </div>
                {rec.notes && <div className="text-xs text-muted" style={{ fontStyle: 'italic' }}>"{rec.notes}"</div>}
                <button 
                  className="btn btn-ghost btn-sm text-primary mt-2" 
                  style={{ alignSelf: 'flex-start', padding: '4px 8px' }}
                  onClick={() => { setPendingRecId(rec.id); setShowForm(true); }}
                >
                  <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Schedule Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' ? (
        <DataTable columns={columns} rows={filtered} emptyMsg="No therapy sessions found." />
      ) : (
        <TherapyTimetable sessions={hosTherapySessions} />
      )}

      {showForm && <SessionForm onClose={() => { setShowForm(false); setPendingRecId(''); }} initialRecId={pendingRecId} />}
    </div>
  )
}

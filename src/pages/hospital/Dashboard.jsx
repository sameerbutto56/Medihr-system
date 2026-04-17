import { useMemo } from 'react'
import { Activity, Users, Calendar, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import StatCard from '../../components/shared/StatCard'
import { formatDate } from '../../utils/helpers'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const STATUS_COLORS = { admitted: '#3b82f6', discharged: '#22c55e', critical: '#ef4444' }

export default function HospitalDashboard() {
  const { hosPatients, hosAppointments, hosMedicalRecords } = useApp()

  const admitted   = hosPatients.filter(p => p.status === 'admitted').length
  const discharged = hosPatients.filter(p => p.status === 'discharged').length
  const critical   = hosPatients.filter(p => p.condition === 'Critical').length

  const todayAppts = hosAppointments.filter(a =>
    a.date === '2026-03-13' && a.status === 'scheduled'
  ).length

  const pieData = [
    { name: 'Admitted',   value: admitted   },
    { name: 'Discharged', value: discharged },
    { name: 'Critical',   value: critical   },
  ]

  const recentAppts = hosAppointments.slice(0, 5)

  return (
    <div>
      <div className="page-header">
        <h1>Terteeb Rehabilitation Center</h1>
        <p>Real-time overview of rehabilitation operations</p>
      </div>

      <div className="grid-4 mb-4">
        <StatCard label="Total Patients"       value={hosPatients.length}        sub="all time"       icon={Users}     color="indigo" />
        <StatCard label="Currently Admitted"   value={admitted}                  sub="active wards"   icon={Activity}  color="blue"   />
        <StatCard label="Today's Appointments" value={todayAppts}                sub="Mar 13, 2026"   icon={Calendar}  color="cyan"   />
        <StatCard label="Medical Records"      value={hosMedicalRecords.length}  sub="total entries"  icon={FileText}  color="amber"  />
      </div>

      <div className="grid-2 mt-6">
        <div className="card p-6">
          <div className="section-header">
            <div>
              <div className="section-title">Patient Status Breakdown</div>
              <div className="section-sub">Current distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={Object.values(STATUS_COLORS)[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="section-header">
            <div className="section-title">Upcoming Appointments</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentAppts.map(a => (
              <div key={a.id} className="flex items-center gap-4">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--secondary)', flexShrink: 0 }}>
                  <Calendar size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.patientName}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{a.doctor} · {a.specialty}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.time}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{formatDate(a.date, 'MMM dd')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

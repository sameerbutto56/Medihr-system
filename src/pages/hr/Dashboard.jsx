import { useMemo } from 'react'
import { Users, UserCheck, DollarSign, Clock, AlertTriangle, ShieldCheck, Heart } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import StatCard from '../../components/shared/StatCard'
import { formatCurrency, statusColor } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const DEPT_COLORS = { Engineering: '#6366f1', HR: '#06b6d4', Finance: '#22c55e', Marketing: '#f59e0b', Operations: '#ec4899' }

export default function HRDashboard() {
  const { hrEmployees, hrAttendance, hrPayroll, hosTherapySessions } = useApp()

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const active   = hrEmployees.filter(e => e.status === 'active').length
    const present  = hrAttendance.filter(a => a.status === 'present' && a.date === todayStr).length
    const completedNet = hrPayroll.filter(p => p.status === 'paid').reduce((s, p) => s + p.net, 0)
    const pending  = hrPayroll.filter(p => p.status === 'pending').length
    return { total: hrEmployees.length, active, present, completedNet, pending }
  }, [hrEmployees, hrAttendance, hrPayroll])

  const burnoutStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const alerts = []
    const therapists = hrEmployees.filter(e => 
      ['therapist', 'doctor', 'physiotherapist'].some(r => (e.role || '').toLowerCase().includes(r))
    )
    
    therapists.forEach(t => {
      const todayCount = (hosTherapySessions || []).filter(s => s.therapistId === t.id && s.date === todayStr).length
      if (todayCount >= 5) {
        alerts.push({ id: t.id, name: t.name, type: 'Critical burnout risk', reason: 'Extreme patient load (5+ sessions)', color: 'var(--red)' })
      } else if (todayCount >= 3) {
        alerts.push({ id: t.id, name: t.name, type: 'Moderate fatigue', reason: 'High session volume', color: 'var(--amber)' })
      }
    })
    return alerts
  }, [hrEmployees, hosTherapySessions])

  const deptData = useMemo(() => {
    const map = {}
    hrEmployees.forEach(e => { map[e.department] = (map[e.department] ?? 0) + 1 })
    return Object.entries(map).map(([dept, count]) => ({ dept, count }))
  }, [hrEmployees])

  const recent = hrEmployees.slice(0, 5)

  return (
    <div>
      <div className="page-header">
        <h1>HR Dashboard</h1>
        <p>Overview of your workforce and HR operations</p>
      </div>

      <div className="grid-4 mb-4">
        <StatCard label="Total Employees" value={stats.total}  sub={`${stats.active} active`}  icon={Users}     color="indigo" to="/hr/employees" />
        <StatCard label="Present Today"   value={stats.present} sub={`of ${stats.active} active`} icon={UserCheck} color="green"  to="/hr/attendance" />
        <StatCard label="Disbursed Total" value={formatCurrency(stats.completedNet)} sub="complete payroll" icon={DollarSign} color="cyan"   to="/hr/payroll" />
        <StatCard label="Pending Payroll" value={stats.pending} sub="this month"  icon={Clock}     color="amber"  to="/hr/payroll" />
      </div>

      <div className="grid-2 mt-6">
        {/* Dept chart */}
        <div className="card p-6">
          <div className="section-header">
            <div>
              <div className="section-title">Employees by Department</div>
              <div className="section-sub">Headcount distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="count" radius={[6,6,0,0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent employees */}
        <div className="card p-6">
          <div className="section-header">
            <div className="section-title">Recent Employees</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent.map(emp => (
              <div key={emp.id} className="flex items-center gap-4">
                <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
                  {emp.name.split(' ').map(n=>n[0]).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                  <div className="text-muted text-sm">{emp.role} · {emp.department}</div>
                </div>
                <span className={`badge ${emp.status}`}>{emp.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Burnout Alerts Section */}
      <div className="mt-6">
        <div className="section-header mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart className="text-danger" size={20} />
            <h2 className="section-title" style={{ margin: 0 }}>Staff Health & Burnout Alerts</h2>
          </div>
          <p className="section-sub">Real-time monitoring of therapist workload and fatigue levels</p>
        </div>

        {burnoutStats.length > 0 ? (
          <div className="grid-3" style={{ gap: '16px' }}>
            {burnoutStats.map((alert, i) => (
              <div key={i} className="card p-4" style={{ 
                borderLeft: `4px solid ${alert.color}`,
                background: 'rgba(255,255,255,0.01)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    background: `${alert.color}15`, 
                    color: alert.color,
                    marginTop: '2px'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{alert.name}</div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: alert.color, marginTop: '2px' }}>{alert.type}</div>
                  <div className="text-muted text-xs mt-1">{alert.reason}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center" style={{ background: 'rgba(34,197,94,0.05)', border: '1px dashed rgba(34,197,94,0.2)' }}>
            <ShieldCheck size={40} style={{ color: 'var(--green)', margin: '0 auto 12px', opacity: 0.8 }} />
            <div style={{ fontWeight: 600, color: 'var(--green)' }}>All Staff Healthy</div>
            <p className="text-sm text-muted">No therapists are currently exceeding workload thresholds.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useMemo } from 'react'
import { TrendingUp, DollarSign, Activity, Target } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import { useApp } from '../../context/AppContext'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'

export default function PerformanceAnalytics({ employee }) {
  const { hosAppointments, hosTherapySessions, hrPayroll } = useApp()

  const data = useMemo(() => {
    // Filter hospital activities by this doctor
    const appts = hosAppointments.filter(a => a.doctorId === employee.id)
    const sessions = hosTherapySessions.filter(s => s.therapistId === employee.id)
    const payrolls = hrPayroll.filter(p => p.employeeId === employee.id)
    
    // Fees are stored as strings or numbers in the database
    const totalFees = [...appts, ...sessions].reduce((s, x) => s + (Number(x.fees || x.fee) || 0), 0)
    const totalEarnings = payrolls.reduce((s, p) => s + (Number(p.net) || 0), 0)
    const totalCount = appts.length + sessions.length
    
    // Monthly trend for the last 6 months
    const now = new Date()
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('default', { month: 'short' })
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
      
      const monthRevenue = [...appts, ...sessions]
        .filter(x => (x.date || '').startsWith(monthPrefix))
        .reduce((s, x) => s + (Number(x.fees || x.fee) || 0), 0)
      
      monthlyTrend.push({ name: monthName, revenue: monthRevenue })
    }

    return { totalFees, totalEarnings, totalCount, monthlyTrend }
  }, [employee, hosAppointments, hosTherapySessions, hrPayroll])

  const stats = [
    { label: 'Revenue Generated', value: formatCurrency(data.totalFees), icon: DollarSign, color: '#6366f1' },
    { label: 'Total Earnings', value: formatCurrency(data.totalEarnings), icon: TrendingUp, color: '#22c55e' },
    { label: 'Total Patients', value: data.totalCount, icon: Activity, color: '#06b6d4' },
    { label: 'Performance Rating', value: 'Excellent', icon: Target, color: '#f59e0b' },
  ]

  return (
    <div className="performance-analytics">
      <div className="grid-2 mb-6" style={{ gap: '16px' }}>
        {stats.map((s, i) => (
          <div key={i} className="card p-4" style={{ background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              background: `${s.color}20`, 
              color: s.color, 
              padding: '10px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-muted text-xs uppercase fw-600 mb-1">{s.label}</div>
              <div className="text-lg fw-800">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
        <div className="section-header mb-4">
          <div>
            <div className="section-title" style={{ fontSize: '14px' }}>Monthly Revenue Generation</div>
            <div className="section-sub">Tracking financial impact over the last 6 months</div>
          </div>
        </div>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f1f5f9' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

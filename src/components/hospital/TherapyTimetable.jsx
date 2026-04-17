import React from 'react'
import { format, parseISO, startOfWeek, addDays, getDay } from 'date-fns'
import { Clock } from 'lucide-react'

// Map date-fns getDay() (0=Sun, 1=Mon...6=Sat) to JS weekday strings used in form
const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TherapyTimetable({ sessions }) {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Start on Monday
  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM

  // Pre-calculate dates for current week headers
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(currentWeekStart, i)
    return {
      dateObj: d,
      dayStr: DAY_MAP[getDay(d)],           // "Mon"
      formatted: format(d, 'EEE, MMM d')    // "Mon, Mar 15"
    }
  })

  // Group sessions by day string ("Mon", "Tue", etc) and Hour (8, 9, 10...)
  const matrix = {}
  weekDays.forEach(wd => {
    matrix[wd.dayStr] = {}
    hours.forEach(h => matrix[wd.dayStr][h] = [])
  })

  sessions.forEach(session => {
    const sessionHour = parseInt(session.time.split(':')[0], 10)
    
    // Safety check if time is wildly out of 8-20 range, just skip or clamp
    if (sessionHour < 8 || sessionHour > 20) return

    if (session.sessionType === 'Monthly' && session.recurringDays) {
      // Plot on every selected recurring day
      session.recurringDays.forEach(day => {
        if (matrix[day]) {
          matrix[day][sessionHour].push(session)
        }
      })
    } else if (session.sessionType === 'Per Session' && session.date) {
      // Plot only if the session date falls in THIS week
      try {
        const sessionDateObj = parseISO(session.date)
        
        // Is it this week? Check if it matches any compiled day
        const matchedDay = weekDays.find(wd => 
          format(wd.dateObj, 'yyyy-MM-dd') === session.date
        )
        
        if (matchedDay) {
          matrix[matchedDay.dayStr][sessionHour].push(session)
        }
      } catch (e) {}
    }
  })

  return (
    <div className="timetable-container" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            <th style={{ width: '80px', padding: '16px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
              <Clock size={16} className="text-muted" style={{ margin: '0 auto' }} />
            </th>
            {weekDays.map(wd => (
              <th key={wd.dayStr} style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wd.dayStr}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(wd.dateObj, 'MMM d')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map(hour => (
            <tr key={hour}>
              <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                {hour}:00
              </td>
              {weekDays.map(wd => {
                const daySessions = matrix[wd.dayStr][hour] || []
                return (
                  <td key={wd.dayStr} style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', height: '100px', width: `${100/7}%` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {daySessions.map((s, i) => (
                        <div 
                          key={i} 
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            background: s.sessionType === 'Monthly' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            border: `1px solid ${s.sessionType === 'Monthly' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                            borderLeft: `3px solid ${s.sessionType === 'Monthly' ? 'var(--success)' : 'var(--primary)'}`
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{s.patientName}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>{s.therapist}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }}>
                              {s.time}
                            </span>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 600,
                              color: s.sessionType === 'Monthly' ? 'var(--success)' : 'var(--primary)' 
                            }}>
                              {s.sessionType === 'Monthly' ? '↻ Recur' : 'One-time'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

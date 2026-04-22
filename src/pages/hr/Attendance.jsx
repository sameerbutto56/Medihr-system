import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import StatCard from '../../components/shared/StatCard'
import AttendanceForm from '../../components/hr/AttendanceForm'
import AttendanceUpload from '../../components/hr/AttendanceUpload'
import { UserCheck, UserX, Clock, Plus, Upload, X, CalendarDays, TrendingUp, Timer, CheckCircle2, ChevronRight, Pencil, ChevronLeft, Search } from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { db } from '../../firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

/* ── Helper: get worked minutes from checkIn/checkOut ─────────────────── */
function getWorkedMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null
  const [h1, m1] = checkIn.split(':').map(Number)
  const [h2, m2] = checkOut.split(':').map(Number)
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
  return diff > 0 ? diff : null
}

/* ── Helper: render work status badge ─────────────────────────────────── */
function WorkStatusBadge({ checkIn, checkOut, requiredHrs }) {
  const worked = getWorkedMinutes(checkIn, checkOut)
  if (worked === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>

  const requiredMin = (requiredHrs || 480)
  const diff = worked - requiredMin

  if (diff > 0) {
    const oh = Math.floor(diff / 60)
    const om = diff % 60
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
        background: 'rgba(99,102,241,0.1)', color: 'var(--primary)'
      }}>
        <Timer size={12} />
        OT {oh > 0 ? `${oh}h ` : ''}{om}m
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
      background: 'rgba(34,197,94,0.1)', color: 'var(--green)'
    }}>
      <CheckCircle2 size={12} />
      Complete
    </span>
  )
}

const formatTime12 = (t) => {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hr = parseInt(h, 10)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
  return `${h12}:${m} ${ampm}`
}

export default function Attendance() {
  const { hrAttendance, hrEmployees } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [manualMarkEmp, setManualMarkEmp] = useState(null)
  
  // Filtering state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const categories = ['All', 'Doctors', 'Therapists', 'Staff']

  // Month/Year filter — default to current month
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}` // e.g. "2026-01"
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

  // Filter attendance to selected month only
  const monthAttendance = useMemo(() =>
    hrAttendance.filter(a => a.date && a.date.startsWith(monthPrefix)),
    [hrAttendance, monthPrefix]
  )

  const goToPrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  // Group by employee using filtered data
  const employeeSummaries = useMemo(() => {
    const grouped = {}
    monthAttendance.forEach(a => {
      if (!grouped[a.employeeId]) grouped[a.employeeId] = { records: [] }
      grouped[a.employeeId].records.push(a)
    })

    return hrEmployees
      .filter(e => e.status === 'active')
      .map(emp => {
        const records = grouped[emp.id]?.records || []
        const presentCount = records.filter(r => r.status === 'present').length
        const absentCount = records.filter(r => r.status === 'absent').length
        const lateCount = records.filter(r => r.status === 'late').length
        const totalDays = records.length
        const rate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0

        const requiredMin = (emp.hrsPerDay || 480)
        let totalOTMin = 0
        records.forEach(r => {
          const worked = getWorkedMinutes(r.checkIn, r.checkOut)
          if (worked && worked > requiredMin) totalOTMin += worked - requiredMin
        })

        const today = new Date().toISOString().split('T')[0]
        const todayRecord = records.find(r => r.date === today)

        return {
          id: emp.id, employee: emp, name: emp.name,
          department: emp.department, employeeId: emp.employeeId,
          present: presentCount, absent: absentCount, late: lateCount,
          totalDays, rate, totalOTMin, todayRecord,
        }
      })
  }, [monthAttendance, hrEmployees])

  const filteredSummaries = useMemo(() => {
    return employeeSummaries.filter(e => {
      const matchesSearch = [e.name, e.department, e.employeeId].some(f =>
        (f || '').toLowerCase().includes(search.toLowerCase())
      )
      
      if (category === 'All') return matchesSearch
      
      const roleDept = `${e.employee.role} ${e.department}`.toLowerCase()
      if (category === 'Doctors') {
        return matchesSearch && (roleDept.includes('doctor') || roleDept.includes('dr'))
      }
      if (category === 'Therapists') {
        return matchesSearch && roleDept.includes('therapist')
      }
      if (category === 'Staff') {
        return matchesSearch && !roleDept.includes('doctor') && !roleDept.includes('dr') && !roleDept.includes('therapist')
      }
      return matchesSearch
    })
  }, [employeeSummaries, search, category])

  const totalPresent = filteredSummaries.reduce((s, e) => s + e.present, 0)
  const totalAbsent = filteredSummaries.reduce((s, e) => s + e.absent, 0)
  const totalLate = filteredSummaries.reduce((s, e) => s + e.late, 0)

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Daily attendance records for all employees</p>
      </div>

      {/* Month Selector */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', padding: '12px 20px',
        background: 'var(--bg-hover)', borderRadius: '12px', border: '1px solid var(--border)'
      }}>
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={goToPrevMonth}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>{MONTH_NAMES[selectedMonth]} {selectedYear}</div>
          <div className="text-xs text-muted">{daysInMonth} days in month</div>
        </div>
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={goToNextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="section-header mb-4">
        <div className="grid-3" style={{ flex: 1, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <StatCard label="Present" value={totalPresent} sub={`in ${MONTH_NAMES[selectedMonth]}`} icon={UserCheck} color="green" />
          <StatCard label="Absent" value={totalAbsent} sub={`in ${MONTH_NAMES[selectedMonth]}`} icon={UserX} color="red" />
          <StatCard label="Late" value={totalLate} sub={`in ${MONTH_NAMES[selectedMonth]}`} icon={Clock} color="amber" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" style={{ height: 'fit-content' }} onClick={() => setShowUpload(true)}>
            <Upload size={15} /> Import ZKTeco
          </button>
          <button className="btn btn-primary" style={{ height: 'fit-content' }} onClick={() => setShowForm(true)}>
            <Plus size={15} /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="section-header mb-4">
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, department, ID…"
          />
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                background: category === cat ? 'var(--primary)' : 'transparent',
                color: category === cat ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* One row per employee table */}
      <div className="table-wrap card">
        {employeeSummaries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No employees found.</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Late</th>
                <th style={{ textAlign: 'center' }}>Rate</th>
                <th style={{ textAlign: 'center' }}>Overtime</th>
                <th style={{ textAlign: 'center' }}>Today</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map(row => {
                const otH = Math.floor(row.totalOTMin / 60)
                const otM = row.totalOTMin % 60
                return (
                  <tr key={row.id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => setSelectedEmployee(row.employee)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '12px', flexShrink: 0
                        }}>
                          {row.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{row.name}</div>
                          <div className="text-xs text-muted">{row.department}</div>
                        </div>
                      </div>
                    </td>
                    <td onClick={() => setSelectedEmployee(row.employee)}>
                      <span className="text-xs text-muted">{row.employeeId}</span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={() => setSelectedEmployee(row.employee)}>
                      <span style={{
                        fontWeight: 700, fontSize: '14px', color: 'var(--green)',
                        background: 'rgba(34,197,94,0.08)', padding: '4px 12px', borderRadius: '8px'
                      }}>{row.present}</span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={() => setSelectedEmployee(row.employee)}>
                      <span style={{
                        fontWeight: 700, fontSize: '14px', color: 'var(--red)',
                        background: 'rgba(239,68,68,0.08)', padding: '4px 12px', borderRadius: '8px'
                      }}>{row.absent}</span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={() => setSelectedEmployee(row.employee)}>
                      <span style={{
                        fontWeight: 700, fontSize: '14px', color: 'var(--amber)',
                        background: 'rgba(245,158,11,0.08)', padding: '4px 12px', borderRadius: '8px'
                      }}>{row.late}</span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={() => setSelectedEmployee(row.employee)}>
                      <span style={{
                        fontWeight: 700, fontSize: '13px',
                        color: row.rate >= 80 ? 'var(--green)' : row.rate >= 60 ? 'var(--amber)' : 'var(--red)'
                      }}>{row.rate}%</span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={() => setSelectedEmployee(row.employee)}>
                      {row.totalOTMin > 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                          background: 'rgba(99,102,241,0.1)', color: 'var(--primary)'
                        }}>
                          <Timer size={11} />
                          {otH > 0 ? `${otH}h ` : ''}{otM}m
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.todayRecord ? (
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                          background: row.todayRecord.status === 'present' ? 'rgba(34,197,94,0.1)' :
                            row.todayRecord.status === 'absent' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: row.todayRecord.status === 'present' ? 'var(--green)' :
                            row.todayRecord.status === 'absent' ? 'var(--red)' : 'var(--amber)'
                        }}>
                          {row.todayRecord.status === 'present' ? '✓' : row.todayRecord.status === 'absent' ? '✗' : '⏱'}
                        </span>
                      ) : (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, gap: '4px' }}
                          onClick={(e) => { e.stopPropagation(); setManualMarkEmp(row.employee) }}
                          title="Mark attendance manually"
                        >
                          <Pencil size={12} /> Mark
                        </button>
                      )}
                    </td>
                    <td onClick={() => setSelectedEmployee(row.employee)}>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <AttendanceForm onClose={() => setShowForm(false)} />}
      {showUpload && <AttendanceUpload onClose={() => setShowUpload(false)} />}
      {selectedEmployee && (
        <EmployeeAttendanceDetail
          employee={selectedEmployee}
          attendance={monthAttendance}
          monthLabel={`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
          monthPrefix={monthPrefix}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {manualMarkEmp && (
        <QuickManualMark
          employee={manualMarkEmp}
          onClose={() => setManualMarkEmp(null)}
        />
      )}
    </div>
  )
}

/* ── Quick Manual Mark Modal (for online/remote employees) ─────────────── */
function QuickManualMark({ employee, onClose }) {
  const { activeBranchId } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [checkIn, setCheckIn] = useState('09:00')
  const [checkOut, setCheckOut] = useState('17:00')
  const [status, setStatus] = useState('present')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        employeeId: employee.id,
        date,
        checkIn: status === 'absent' ? null : checkIn,
        checkOut: status === 'absent' ? null : checkOut,
        status,
        branchId: activeBranchId
      }

      const attendanceRef = collection(db, 'attendance')
      const q = query(
        attendanceRef, 
        where('employeeId', '==', employee.id), 
        where('date', '==', date),
        where('branchId', '==', activeBranchId)
      )
      const snap = await getDocs(q)

      if (!snap.empty) {
        await updateDoc(doc(db, 'attendance', snap.docs[0].id), payload)
      } else {
        await addDoc(attendanceRef, payload)
      }

      setSaved(true)
      setTimeout(() => onClose(), 800)
    } catch (err) {
      console.error('Error marking attendance:', err)
      alert('Failed to mark attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '14px'
            }}>
              {employee.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '15px' }}>Manual Attendance</h2>
              <p className="text-xs text-muted">{employee.name} • {employee.department}</p>
            </div>
          </div>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {saved ? (
          <div className="modal-body" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Attendance Marked!</h3>
          </div>
        ) : (
          <>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['present', 'late', 'absent'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                        background: status === s
                          ? s === 'present' ? 'rgba(34,197,94,0.1)' : s === 'absent' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                          : 'transparent',
                        borderColor: status === s
                          ? s === 'present' ? 'var(--green)' : s === 'absent' ? 'var(--red)' : 'var(--amber)'
                          : 'var(--border)',
                        color: status === s
                          ? s === 'present' ? 'var(--green)' : s === 'absent' ? 'var(--red)' : 'var(--amber)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {s === 'present' ? '✓ ' : s === 'absent' ? '✗ ' : '⏱ '}{s}
                    </button>
                  ))}
                </div>
              </div>

              {status !== 'absent' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Check In</label>
                    <input type="time" className="form-control" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Check Out</label>
                    <input type="time" className="form-control" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                type="button" className="btn btn-primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Employee Attendance Detail Modal ──────────────────────────────────── */
function EmployeeAttendanceDetail({ employee, attendance, monthLabel, monthPrefix, onClose }) {
  const { hrPayroll, updateDoc, updateAttendance } = useApp()
  const payroll = hrPayroll.find(p => 
    p.employeeId === employee.id && 
    (p.startDate.startsWith(monthPrefix) || p.endDate.startsWith(monthPrefix))
  )
  const [acting, setActing] = useState(false)
  const requiredMin = employee.hrsPerDay || 480
  const [showManualMark, setShowManualMark] = useState(false)

  const empRecords = useMemo(() =>
    attendance
      .filter(a => a.employeeId === employee.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [attendance, employee.id]
  )

  const presentCount = empRecords.filter(a => a.status === 'present').length
  const absentCount  = empRecords.filter(a => a.status === 'absent').length
  const lateCount    = empRecords.filter(a => a.status === 'late').length
  const totalDays    = empRecords.length
  const attendanceRate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0

  const overtimeData = empRecords
    .map(a => {
      const worked = getWorkedMinutes(a.checkIn, a.checkOut)
      return { worked, overtime: worked > requiredMin ? worked - requiredMin : 0 }
    })

  const totalOvertimeMin = overtimeData.reduce((s, d) => s + d.overtime, 0)
  const remOTMin = Math.max(0, totalOvertimeMin - (payroll?.otUsedMin || 0))
  const overtimeDays = overtimeData.filter(d => d.overtime > 0).length
  const otHrs = Math.floor(totalOvertimeMin / 60)
  const otMins = totalOvertimeMin % 60

  const handleCompensate = async () => {
    if (!payroll || remOTMin < requiredMin || absentCount <= 0) return
    setActing(true)
    try {
      await updateDoc(doc(db, 'payroll', payroll.id), {
        absencesOffset: (payroll.absencesOffset || 0) + 1,
        otUsedMin: (payroll.otUsedMin || 0) + requiredMin
      })
      alert('1 Absent day compensated using 8h of overtime.')
    } catch (err) { console.error(err); alert('Failed to compensate.') }
    setActing(false)
  }

  const handleMergeOT = async () => {
    if (!payroll || remOTMin <= 0) return
    setActing(true)
    try {
      const hourlyRate = (Number(employee.salary) / 12) / 160
      const otAmount = (remOTMin / 60) * hourlyRate * 1.5
      await updateDoc(doc(db, 'payroll', payroll.id), {
        overtimePay: (payroll.overtimePay || 0) + otAmount,
        otUsedMin: (payroll.otUsedMin || 0) + remOTMin
      })
      alert(`OT merged to salary: +${Math.round(otAmount)}`)
    } catch (err) { console.error(err); alert('Failed to merge OT.') }
    setActing(false)
  }

  if (showManualMark) {
    return <QuickManualMark employee={employee} onClose={() => setShowManualMark(false)} />
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '16px'
            }}>
              {employee.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>{employee.name}</h2>
              <p className="text-xs text-muted">{employee.role} • {employee.department} • Required: {requiredHrs}h/day • {monthLabel}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, gap: '4px' }}
              onClick={() => setShowManualMark(true)}
            >
              <Pencil size={13} /> Mark Manually
            </button>
            <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Summary stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '14px 12px', borderRadius: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center' }}>
              <UserCheck size={18} style={{ color: 'var(--green)', marginBottom: '4px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>{presentCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Present</div>
            </div>
            <div style={{ padding: '14px 12px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
              <UserX size={18} style={{ color: 'var(--red)', marginBottom: '4px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)' }}>{absentCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Absent</div>
            </div>
            <div style={{ padding: '14px 12px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center' }}>
              <Clock size={18} style={{ color: 'var(--amber)', marginBottom: '4px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--amber)' }}>{lateCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Late</div>
            </div>
            <div style={{ padding: '14px 12px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{attendanceRate}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Rate</div>
            </div>
            <div style={{ padding: '14px 12px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', textAlign: 'center' }}>
              <Timer size={18} style={{ color: 'var(--primary-light)', marginBottom: '4px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{otHrs}h {otMins}m</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total OT ({overtimeDays}d)</div>
            </div>
          </div>

          {/* Attendance rate bar */}
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Attendance Rate</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: attendanceRate >= 80 ? 'var(--green)' : attendanceRate >= 60 ? 'var(--amber)' : 'var(--red)' }}>{attendanceRate}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${attendanceRate}%`,
                height: '100%',
                borderRadius: '4px',
                background: attendanceRate >= 80 ? 'var(--green)' : attendanceRate >= 60 ? 'var(--amber)' : 'var(--red)',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span className="text-xs text-muted">{totalDays} total days tracked</span>
              <span className="text-xs text-muted">{presentCount + lateCount} days worked</span>
            </div>
          </div>

          {/* Overtime Actions Section */}
          {employee.compensationType === 'salary' && payroll && (
            <div style={{
              marginBottom: '20px', padding: '16px', background: 'rgba(99,102,241,0.03)',
              borderRadius: '12px', border: '1px dashed var(--primary-light)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Timer size={16} style={{ color: 'var(--primary)' }} /> Monthly Overtime Actions
                  </h4>
                  <p className="text-xs text-muted">Manage OT balance for {monthLabel}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                    {Math.floor(remOTMin / 60)}h {remOTMin % 60}m
                  </div>
                  <div className="text-xs text-muted">Remaining Balance</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={acting || remOTMin < requiredMin || absentCount <= (payroll.absencesOffset || 0)}
                  className="btn btn-ghost"
                  style={{ flex: 1, fontSize: '12px', gap: '6px', background: 'white', border: '1px solid var(--border)' }}
                  onClick={handleCompensate}
                  title={remOTMin < requiredMin ? 'Unsufficient balance' : 'Use OT to cancel 1 absent day'}
                >
                  <CheckCircle2 size={14} style={{ color: 'var(--green)' }} /> Compensate Absent
                </button>
                <button
                  disabled={acting || remOTMin <= 0}
                  className="btn btn-ghost"
                  style={{ flex: 1, fontSize: '12px', gap: '6px', background: 'white', border: '1px solid var(--border)' }}
                  onClick={handleMergeOT}
                  title="Convert all OT balance to salary bonus"
                >
                  <TrendingUp size={14} style={{ color: 'var(--primary)' }} /> Merge into Salary
                </button>
              </div>

              {payroll.absencesOffset > 0 && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                  ✓ {payroll.absencesOffset} absent day(s) already compensated this month.
                </div>
              )}
              {payroll.overtimePay > 0 && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                  ✓ {formatCurrency(payroll.overtimePay)} overtime bonus merged to salary.
                </div>
              )}
            </div>
          )}

          {/* Attendance history table */}
          <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays size={14} /> Attendance History
          </h4>
          {empRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <CalendarDays size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No attendance records found for this employee.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-light)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Check In</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Check Out</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Work Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empRecords.map((rec, i) => (
                    <tr key={rec.id || i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{formatDate(rec.date)}</td>
                      <td style={{ padding: '10px 12px' }}>{formatTime12(rec.checkIn)}</td>
                      <td style={{ padding: '10px 12px' }}>{formatTime12(rec.checkOut)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <WorkStatusBadge checkIn={rec.checkIn} checkOut={rec.checkOut} requiredHrs={requiredHrs} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background:
                            rec.status === 'present' ? 'rgba(34,197,94,0.1)' :
                            rec.status === 'absent' ? 'rgba(239,68,68,0.1)' :
                            'rgba(245,158,11,0.1)',
                          color:
                            rec.status === 'present' ? 'var(--green)' :
                            rec.status === 'absent' ? 'var(--red)' :
                            'var(--amber)'
                        }}>
                          {rec.status === 'present' ? '✓ Present' : rec.status === 'absent' ? '✗ Absent' : '⏱ Late'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

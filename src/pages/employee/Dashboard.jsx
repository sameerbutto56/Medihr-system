import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Calendar, DollarSign, Clock, ShieldAlert, TrendingUp, CheckCircle2, XCircle, AlertTriangle, Briefcase, Timer } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import { db } from '../../firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore'

export default function EmployeeDashboard() {
  const { currentUser } = useAuth()
  const [myProfile, setMyProfile] = useState(null)
  const [myAttendance, setMyAttendance] = useState([])
  const [myPayroll, setMyPayroll] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  // Fetch employee profile globally without relying on `activeBranchId`
  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to profile
    const qEmp = query(collection(db, 'employees'), where('authUid', '==', currentUser.uid));
    const unsubEmp = onSnapshot(qEmp, (snap) => {
      if (!snap.empty) {
        setMyProfile({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } else {
        setMyProfile(null)
      }
      setLoading(false)
    })

    return () => unsubEmp()
  }, [currentUser])

  // Fetch attendance and payroll for this employee
  useEffect(() => {
    if (!myProfile) return;

    const qAtt = query(collection(db, 'attendance'), where('employeeId', '==', myProfile.id))
    const unsubAtt = onSnapshot(qAtt, (snap) => {
      setMyAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const qPay = query(collection(db, 'payroll'), where('employeeId', '==', myProfile.id))
    const unsubPay = onSnapshot(qPay, (snap) => {
      setMyPayroll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubAtt()
      unsubPay()
    }
  }, [myProfile])

  const { stats, todayRecord } = useMemo(() => {
    const present = myAttendance.filter(a => a.status === 'present').length;
    const absent = myAttendance.filter(a => a.status === 'absent').length;
    const late = myAttendance.filter(a => a.status === 'late').length;
    const total = myAttendance.length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    const totalEarned = myPayroll.reduce((sum, p) => sum + (p.net || 0), 0);
    const latestPayslip = myPayroll.length > 0 
      ? myPayroll.sort((a, b) => (b.month || '').localeCompare(a.month || ''))[0] 
      : null;

    const todayDate = new Date().toISOString().split('T')[0]
    const todayRec = myAttendance.find(a => a.date === todayDate)

    return { 
      stats: { present, absent, late, total, attendanceRate, totalEarned, latestPayslip, payslipCount: myPayroll.length },
      todayRecord: todayRec
    };
  }, [myAttendance, myPayroll])

  const handleCheckInOut = async () => {
    if (!myProfile) return;
    setCheckingIn(true)
    try {
      const todayDate = new Date().toISOString().split('T')[0]
      const now = new Date()
      // e.g. "09:30"
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      if (todayRecord) {
        // Checking out
        await updateDoc(doc(db, 'attendance', todayRecord.id), {
          checkOut: timeString
        })
      } else {
        // Checking in
        await addDoc(collection(db, 'attendance'), {
          employeeId: myProfile.id,
          branchId: myProfile.branchId, // Ensure it aligns with branch
          date: todayDate,
          checkIn: timeString,
          checkOut: null,
          status: 'present' // default to present, could implement logic for 'late' based on time
        })
      }
    } catch (err) {
      console.error(err)
      alert("Failed to mark attendance")
    }
    setCheckingIn(false)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your dashboard...</div>
  }

  if (!myProfile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card p-6 text-center" style={{ maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--amber)', margin: '0 auto 16px' }} />
          <h2 className="section-title" style={{ marginBottom: '8px' }}>Profile Not Linked</h2>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            Your login account has not been linked to an employee record yet. Please contact your HR manager to link your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome Back, {myProfile.name}</h1>
          <p>{myProfile.role} · {myProfile.department}</p>
        </div>
        {/* Attendance Action Box */}
        <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-hover)' }}>
          <div>
            <div className="text-xs text-muted mb-1">Today's Attendance</div>
            <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!todayRecord ? (
                <span style={{ color: 'var(--text-muted)' }}>Not marked yet</span>
              ) : todayRecord.checkOut ? (
                <span className="text-green flex items-center gap-1"><CheckCircle2 size={16} /> Completed</span>
              ) : (
                <span className="text-amber flex items-center gap-1"><Timer size={16} /> Working</span>
              )}
            </div>
            {todayRecord && (
              <div className="text-xs text-muted mt-1">
                In: {todayRecord.checkIn || '—'} {todayRecord.checkOut ? `• Out: ${todayRecord.checkOut}` : ''}
              </div>
            )}
          </div>
          <button 
            className="btn btn-primary" 
            disabled={checkingIn || (todayRecord && todayRecord.checkOut)}
            onClick={handleCheckInOut}
          >
            {checkingIn ? '...' : !todayRecord ? 'Check In Now' : todayRecord.checkOut ? 'Checked Out' : 'Check Out Now'}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'var(--brand-gradient)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, flexShrink: 0
          }}>
            {myProfile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{myProfile.name}</div>
            <div className="text-muted" style={{ fontSize: '14px' }}>{myProfile.role} · {myProfile.department}</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className={`badge ${myProfile.status}`}>{myProfile.status}</span>
              <span className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} /> ID: {myProfile.employeeId || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 className="text-green" /></div>
          <div className="stat-value">{stats.present}</div>
          <div className="stat-label">Days Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><XCircle className="text-red" /></div>
          <div className="stat-value">{stats.absent}</div>
          <div className="stat-label">Days Absent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle className="text-amber" /></div>
          <div className="stat-value">{stats.late}</div>
          <div className="stat-label">Late Arrivals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp className="text-primary" /></div>
          <div className="stat-value">{stats.attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid-2 gap-6 mb-8">
        {/* Attendance Analytics */}
        <div className="card p-6">
          <h3 className="section-title text-sm mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} className="text-primary" /> Attendance Overview
          </h3>
          
          {stats.total > 0 ? (
            <div>
              {/* Attendance Bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-sm text-muted">Attendance Rate</span>
                  <span className="fw-600" style={{ color: stats.attendanceRate >= 80 ? 'var(--green)' : stats.attendanceRate >= 60 ? 'var(--amber)' : 'var(--red)' }}>
                    {stats.attendanceRate}%
                  </span>
                </div>
                <div style={{ height: '10px', background: 'var(--bg-hover)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stats.attendanceRate}%`, 
                    background: stats.attendanceRate >= 80 ? 'var(--green)' : stats.attendanceRate >= 60 ? 'var(--amber)' : 'var(--red)',
                    borderRadius: '5px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>

              {/* Stats Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                    Present
                  </span>
                  <span className="fw-600">{stats.present} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)' }} />
                    Late
                  </span>
                  <span className="fw-600">{stats.late} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)' }} />
                    Absent
                  </span>
                  <span className="fw-600">{stats.absent} days</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-sm text-muted">Total Records</span>
                  <span className="fw-600">{stats.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted" style={{ padding: '40px 0' }}>
              <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p className="text-sm">No attendance records yet.</p>
            </div>
          )}
        </div>

        {/* Payroll Analytics */}
        <div className="card p-6">
          <h3 className="section-title text-sm mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} className="text-green" /> Payroll Summary
          </h3>
          
          {stats.payslipCount > 0 ? (
            <div>
              {/* Total Earned */}
              <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                <div className="text-xs text-muted mb-1">Total Earned</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>
                  {formatCurrency(stats.totalEarned)}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                  across {stats.payslipCount} payslip{stats.payslipCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Latest Payslip */}
              {stats.latestPayslip && (
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-hover)' }}>
                  <div className="text-xs text-muted mb-2">Latest Payslip</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="fw-600">{stats.latestPayslip.month}</span>
                    <span className={`badge ${stats.latestPayslip.status}`}>{stats.latestPayslip.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-sm text-muted">Net Pay</span>
                    <span className="fw-600" style={{ color: 'var(--green)' }}>{formatCurrency(stats.latestPayslip.net)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted" style={{ padding: '40px 0' }}>
              <DollarSign size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p className="text-sm">No payslips generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

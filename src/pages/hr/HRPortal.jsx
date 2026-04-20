import React, { useState, useMemo } from 'react'
import { Search, Hash, Phone, User, Eye, Copy, Trash2, BarChart2, Info, Activity, MapPin, RefreshCw, Plus } from 'lucide-react'
import { db } from '../../firebase'
import { collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/shared/DataTable'
import { formatDate, calcAge, formatCurrency } from '../../utils/helpers'
import PerformanceAnalytics from '../../components/hr/PerformanceAnalytics'

// Management tools moved to CEO Portal

export default function HRPortal() {
  const { hrEmployees, hrAttendance, hrPayroll } = useApp()
  const { userRole } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  const filtered = hrEmployees.filter(e =>
    [e.employeeId, e.name, e.phone, e.department, e.role].some(f =>
      (f || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  // Get employee detail data
  const empDetail = useMemo(() => {
    if (!selectedEmp) return null
    const attendance = hrAttendance.filter(a => a.employeeId === selectedEmp.id)
    const payroll = hrPayroll.filter(p => p.employeeId === selectedEmp.id)
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    return { attendance, payroll, present, absent, late }
  }, [selectedEmp, hrAttendance, hrPayroll])

  const columns = [
    { label: 'Employee ID', key: 'employeeId', render: e => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '1px' }}>
          {e.employeeId || '—'}
        </span>
      )
    },
    { label: 'Name', key: 'name' },
    { label: 'Phone', key: 'phone', render: e => e.phone || '—' },
    { label: 'Department', key: 'department' },
    { label: 'Role', key: 'role' },
    { label: 'Status', key: 'status', render: e => <span className={`badge ${e.status}`}>{e.status}</span> },
    { label: 'Actions', key: 'id', render: e => (
        <button className="btn btn-ghost btn-sm text-primary" onClick={() => { setSelectedEmp(e); setActiveTab('info'); }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Eye size={14} /> Details
        </button>
      )
    },
  ]

  const copyId = (id) => {
    navigator.clipboard.writeText(id)
  }

  // Management and Developer tools moved to dedicated CEO Portal

  return (
    <div>
      <div className="page-header">
        <h1>HR Portal — Employee Directory</h1>
        <p>Search employees by ID, name, or phone number</p>
      </div>

      <div className="section-header mb-4">
        <div className="search-bar" style={{ minWidth: 350 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID (TRB-0001), name, or phone…"
          />
        </div>
      </div>


      <DataTable columns={columns} rows={filtered} emptyMsg="No employees found." />

      {/* Management and Developer tools moved to dedicated CEO Portal */}

      {/* Employee Detail Modal */}
      {selectedEmp && empDetail && (
        <div className="modal-overlay" onClick={() => setSelectedEmp(null)}>
          <div className="modal-content" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ paddingBottom: 10 }}>
              <h2 className="section-title">Employee Portfolio</h2>
              <button className="toggle-btn" onClick={() => setSelectedEmp(null)}>✕</button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '24px', padding: '0 24px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <button 
                onClick={() => setActiveTab('info')}
                style={{ 
                  padding: '12px 0', 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'info' ? 'var(--primary-light)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'info' ? '2px solid var(--primary)' : 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Info size={16} /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('performance')}
                style={{ 
                  padding: '12px 0', 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'performance' ? 'var(--primary-light)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'performance' ? '2px solid var(--primary)' : 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BarChart2 size={16} /> Performance & ROI
              </button>
            </div>

            <div className="modal-body" style={{ paddingTop: 0 }}>
              {activeTab === 'info' ? (
                <>
                  {/* ID Banner */}
                  <div style={{ textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '3px', fontFamily: 'monospace' }}>
                      {selectedEmp.employeeId || '—'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '6px' }}>{selectedEmp.name}</div>
                    <div className="text-muted text-sm">{selectedEmp.role} · {selectedEmp.department}</div>
                    <button className="btn btn-ghost btn-sm mt-2" onClick={() => copyId(selectedEmp.employeeId)} style={{ fontSize: '12px' }}>
                      <Copy size={12} /> Copy ID
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid-2 mb-6">
                    <div>
                      <div className="text-muted text-xs mb-1">Phone</div>
                      <div className="fw-600">{selectedEmp.phone || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs mb-1">Status</div>
                      <span className={`badge ${selectedEmp.status}`}>{selectedEmp.status}</span>
                    </div>
                    <div>
                      <div className="text-muted text-xs mb-1">Compensation</div>
                      <div className="fw-600" style={{ textTransform: 'capitalize' }}>
                        {selectedEmp.compensationType === 'percentage' 
                          ? `${selectedEmp.percentageRate}% of revenue` 
                          : `Salary: ${formatCurrency((selectedEmp.salary || 0) / 12)}/mo`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted text-xs mb-1">Schedule</div>
                      <div className="fw-600">{selectedEmp.hrsPerDay} mins/day · {selectedEmp.daysPerWeek} d/week</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs mb-1">Age</div>
                      <div className="fw-600">{calcAge(selectedEmp.dob)}</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs mb-1">Joined</div>
                      <div className="fw-600">{formatDate(selectedEmp.joined)}</div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="card p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="section-title mb-2" style={{ fontSize: '14px' }}>Attendance Summary</div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div><span style={{ fontWeight: 700, color: 'var(--green)' }}>{empDetail.present}</span> <span className="text-muted text-xs">Present</span></div>
                      <div><span style={{ fontWeight: 700, color: 'var(--red)' }}>{empDetail.absent}</span> <span className="text-muted text-xs">Absent</span></div>
                      <div><span style={{ fontWeight: 700, color: 'var(--amber)' }}>{empDetail.late}</span> <span className="text-muted text-xs">Late</span></div>
                      <div><span style={{ fontWeight: 700 }}>{empDetail.attendance.length}</span> <span className="text-muted text-xs">Total Records</span></div>
                    </div>
                  </div>

                  {/* Payroll Summary */}
                  <div className="card p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="section-title mb-2" style={{ fontSize: '14px' }}>Payroll Records</div>
                    {empDetail.payroll.length > 0 ? (
                      <table className="text-sm" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ background: 'none', border: 'none', padding: '6px 0', textAlign: 'left' }}>Month</th>
                            <th style={{ background: 'none', border: 'none', padding: '6px 0', textAlign: 'right' }}>Gross</th>
                            <th style={{ background: 'none', border: 'none', padding: '6px 0', textAlign: 'right' }}>Net</th>
                            <th style={{ background: 'none', border: 'none', padding: '6px 0', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empDetail.payroll.map(p => (
                            <tr key={p.id}>
                              <td style={{ padding: '6px 0' }}>{p.month}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(p.gross)}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(p.net)}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right' }}><span className={`badge ${p.status}`}>{p.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-muted text-sm">No payroll records yet.</div>
                    )}
                  </div>
                </>
              ) : (
                <PerformanceAnalytics employee={selectedEmp} />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedEmp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

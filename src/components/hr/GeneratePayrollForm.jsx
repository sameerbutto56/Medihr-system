import React, { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function GeneratePayrollForm({ onClose }) {
  const { hrEmployees, hrPayroll, addPayroll, hrAttendance, hosAppointments, hosTherapySessions } = useApp()

  const todayStr = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [generating, setGenerating] = useState(false)

  // Find employees that do NOT have payroll for the selected range
  // Target employees based on selection
  const targetPool = useMemo(() => {
    if (!selectedEmployeeId) return hrEmployees.filter(e => e.status === 'active')
    return hrEmployees.filter(e => e.id === selectedEmployeeId)
  }, [hrEmployees, selectedEmployeeId])

  const alreadyGenerated = useMemo(() => {
    return hrPayroll.filter(p => p.startDate === startDate && p.endDate === endDate).map(p => p.employeeId)
  }, [hrPayroll, startDate, endDate])

  const remaining = targetPool.filter(e => !alreadyGenerated.includes(e.id))

  const handleGenerate = async () => {
    if (remaining.length === 0) {
      if (selectedEmployeeId) {
        alert('Payroll already generated for this employee for this range.')
      } else {
        alert('Payroll already generated for all active employees for this range.')
      }
      return
    }

    setGenerating(true)
    try {
      for (const emp of remaining) {
        let gross = 0;
        let deductions = 0;
        let net = 0;

        // Custom duration logic: filter by range inclusive
        const isInRange = (d) => d >= startDate && d <= endDate

        if (emp.compensationType === 'percentage') {
          const doctorAppts = hosAppointments.filter(a => 
            a.doctor === emp.name && a.status === 'completed' && isInRange(a.date)
          );
          const doctorSessions = hosTherapySessions.filter(s => 
            s.therapist === emp.name && s.status === 'completed' && isInRange(s.date)
          );
          const revenueGenerated = doctorAppts.reduce((sum, a) => sum + (Number(a.fee) || 1000), 0) +
                                  doctorSessions.reduce((sum, s) => sum + (Number(s.fee) || 1000), 0);
          gross = (revenueGenerated * (Number(emp.percentageRate) || 0)) / 100;
          net = gross;
        } else if (emp.compensationType === 'dailyRate') {
          const daysWorked = hrAttendance.filter(a => 
            a.employeeId === emp.id && (a.status === 'present' || a.status === 'late') && isInRange(a.date)
          ).length;
          gross = (Number(emp.dailyRate) || 0) * daysWorked;
          net = gross;
        } else {
          const monSalary = (Number(emp.salary) || 0) / 12;
          const absents = hrAttendance.filter(a => 
            a.employeeId === emp.id && a.status === 'absent' && isInRange(a.date)
          ).length;
          // Note: deduction still assumes 30 day month for simplicity of base calculation
          deductions = (monSalary / 30) * absents;
          gross = monSalary;
          net = Math.max(0, monSalary - deductions);
        }

        await addPayroll({
          employeeId: emp.id,
          startDate,
          endDate,
          gross,
          deductions,
          net,
          overtimePay: 0,
          absencesOffset: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      }
      alert(`Payroll generated for ${remaining.length} employee(s).`)
      onClose()
    } catch (err) {
      console.error('Error generating payroll:', err)
      alert('Failed to generate payroll.')
    }
    setGenerating(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Generate Payroll</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Employee</label>
            <select 
              className="form-control" 
              value={selectedEmployeeId} 
              onChange={e => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">All Active Employees</option>
              {hrEmployees.filter(e => e.status === 'active').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: '8px', marginTop: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>{remaining.length}</strong> payroll entr{remaining.length === 1 ? 'y' : 'ies'} to generate
            </p>
            {selectedEmployeeId === "" && (
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                Skipping {alreadyGenerated.length} employees who already have records for this range
              </p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate} 
            disabled={generating || remaining.length === 0}
          >
            {generating ? 'Generating…' : `Generate for ${remaining.length} Employees`}
          </button>
        </div>
      </div>
    </div>
  )
}

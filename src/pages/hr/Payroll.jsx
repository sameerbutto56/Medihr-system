import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import StatCard from '../../components/shared/StatCard'
import SalarySlip from '../../components/hr/SalarySlip'
import GeneratePayrollForm from '../../components/hr/GeneratePayrollForm'
import { DollarSign, CheckCircle, AlertCircle, Eye, PlusCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function Payroll() {
  const { hrPayroll, hrEmployees, hrAttendance, hosAppointments, hosTherapySessions } = useApp()
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const enriched = useMemo(() =>
    hrPayroll.map(p => {
      const employee = hrEmployees.find(e => e.id === p.employeeId)
      
      const isInRange = (d) => d >= p.startDate && d <= p.endDate
      const rawAbsents = hrAttendance.filter(a => a.employeeId === p.employeeId && a.status === 'absent' && isInRange(a.date)).length
      const absences = Math.max(0, rawAbsents - (p.absencesOffset || 0))
      
      let gross = 0
      let deduction = 0
      let net = 0
      let revenueGenerated = 0

      if (employee?.compensationType === 'percentage') {
        const doctorAppts = hosAppointments.filter(a => 
          a.doctor === employee.name && a.status === 'completed' && isInRange(a.date)
        )
        const doctorSessions = hosTherapySessions.filter(s => 
          s.therapist === employee.name && s.status === 'completed' && isInRange(s.date)
        )
        revenueGenerated = doctorAppts.reduce((sum, a) => sum + (a.fee || 1000), 0) +
                          doctorSessions.reduce((sum, s) => sum + (s.fee || 1000), 0)
        gross = (revenueGenerated * (employee.percentageRate || 0)) / 100
        net = gross
      } else if (employee?.compensationType === 'dailyRate') {
        const daysWorked = hrAttendance.filter(a => 
          a.employeeId === p.employeeId && (a.status === 'present' || a.status === 'late') && isInRange(a.date)
        ).length
        gross = (employee.dailyRate || 0) * daysWorked
        net = gross
      } else {
        const monSalary = (employee?.salary || 0) / 12
        deduction = (monSalary / 30) * absences
        gross = monSalary
        net = monSalary - deduction + (p.overtimePay || 0)
      }

      return {
        ...p,
        employee,
        employeeName: employee?.name ?? p.employeeId,
        absents: absences,
        gross,
        deductions: deduction,
        net,
        revenueGenerated
      }
    }),
    [hrPayroll, hrEmployees, hrAttendance, hosAppointments, hosTherapySessions]
  )

  const totalGross = enriched.reduce((s, p) => s + p.gross, 0)
  const totalPaid  = enriched.filter(p => p.status === 'paid').reduce((s, p) => s + p.net, 0)
  const paid       = hrPayroll.filter(p => p.status === 'paid').length
  const pending    = hrPayroll.filter(p => p.status === 'pending').length

  const columns = [
    { label: 'Employee',    key: 'employeeName' },
    { label: 'Type',        key: 'employee', render: r => (
        <span className={`badge ${r.employee?.compensationType === 'percentage' ? 'status-info' : r.employee?.compensationType === 'dailyRate' ? 'status-warning' : 'status-active'}`}>
          {r.employee?.compensationType === 'percentage' ? 'Perc %' : r.employee?.compensationType === 'dailyRate' ? 'Daily Rate' : 'Salary'}
        </span>
      )
    },
    { label: 'Period',      key: 'startDate', render: r => (
        <span className="text-xs" style={{ whiteSpace: 'nowrap' }}>
          {r.startDate} to {r.endDate}
        </span>
      )
    },
    { label: 'Gross',       key: 'gross',      render: r => formatCurrency(r.gross) },
    { label: 'Absents',     key: 'absents',    render: r => <span>{r.absents}d {r.absencesOffset > 0 && <small style={{color:'var(--green)'}}>(Comp: {r.absencesOffset}d)</small>}</span> },
    { label: 'Deductions',  key: 'deductions', render: r => <span style={{ color: 'var(--red)' }}>-{formatCurrency(r.deductions)}</span> },
    { label: 'Overtime',    key: 'overtimePay', render: r => <span style={{ color: r.overtimePay > 0 ? 'var(--primary)' : '' }}>+{formatCurrency(r.overtimePay || 0)}</span> },
    { label: 'Net Pay',     key: 'net',        render: r => <strong>{formatCurrency(r.net)}</strong> },
    { label: 'Status',      key: 'status',     render: r => <span className={`badge ${r.status}`}>{r.status === 'paid' ? 'Complete' : r.status}</span> },
    {
      label: 'Actions', key: 'id',
      render: r => (
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSlip(r)}>
          <Eye size={14} /> Slip
        </button>
      )
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Payroll</h1>
        <p>Monthly payroll records and disbursement status</p>
      </div>

      <div className="grid-4 mb-4">
        <StatCard label="Total Gross"  value={formatCurrency(totalGross)} sub="This cycle"     icon={DollarSign}   color="indigo" />
        <StatCard label="Total Paid"   value={formatCurrency(totalPaid)}  sub="Disbursed"      icon={DollarSign}   color="cyan"   />
        <StatCard label="Complete"     value={paid}                       sub="employees"    icon={CheckCircle}  color="green"  />
        <StatCard label="Pending"      value={pending}                    sub="awaiting"     icon={AlertCircle}  color="amber"  />
      </div>

      <div className="section-header mb-4">
        <div></div>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <PlusCircle size={15} /> Generate Payroll
        </button>
      </div>

      <DataTable columns={columns} rows={enriched} />

      {selectedSlip && (
        <SalarySlip 
          employee={selectedSlip.employee} 
          payroll={selectedSlip} 
          absences={selectedSlip.absents}
          onClose={() => setSelectedSlip(null)} 
        />
      )}

      {showGenerate && <GeneratePayrollForm onClose={() => setShowGenerate(false)} />}
    </div>
  )
}

import React, { useState } from 'react'
import { UserPlus, Search, Edit3, Eye, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import EmployeeForm from '../../components/hr/EmployeeForm'
import EmployeeDetails from '../../components/hr/EmployeeDetails'
import { avatarInitials, formatDate, calcAge, formatCurrency } from '../../utils/helpers'

export default function Employees() {
  const { hrEmployees, deleteEmployee } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [viewEmployee, setViewEmployee] = useState(null)
  const [category, setCategory] = useState('All')

  const filtered = hrEmployees.filter(e => {
    const matchesSearch = [e.name, e.department, e.role, e.employeeId, e.phone, e.cnic].some(f =>
      (f || '').toLowerCase().includes(search.toLowerCase())
    )
    
    if (category === 'All') return matchesSearch
    
    const roleDept = `${e.role} ${e.department}`.toLowerCase()
    if (category === 'Doctors') {
      return matchesSearch && (roleDept.includes('doctor') || roleDept.includes('dr'))
    }
    if (category === 'Therapists') {
      return matchesSearch && roleDept.includes('therapist')
    }
    if (category === 'Managers') {
      return matchesSearch && e.isManager
    }
    if (category === 'Staff') {
      return matchesSearch && !roleDept.includes('doctor') && !roleDept.includes('dr') && !roleDept.includes('therapist') && !e.isManager
    }
    return matchesSearch
  })

  const categories = ['All', 'Managers', 'Doctors', 'Therapists', 'Staff']

  const handleEdit = (emp) => {
    setSelectedEmployee(emp)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this employee record?")) {
      deleteEmployee(id)
    }
  }

  const columns = [
    { label: 'Machine ID', key: 'employeeId', render: e => (
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '1px', fontSize: '14px' }}>
          {e.employeeId || '—'}
        </span>
      )
    },
    {
      label: 'Employee Name',
      key: 'name',
      render: (e) => (
        <div 
          className="flex items-center gap-2" 
          style={{ cursor: 'pointer' }}
          onClick={() => setViewEmployee(e)}
        >
          <div className="avatar" style={{ width:34, height:34, fontSize:12 }}>
            {avatarInitials(e.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{e.department}</div>
          </div>
        </div>
      ),
    },
    { label: 'CNIC / ID', key: 'cnic', render: e => <span className="text-muted">{e.cnic || '—'}</span> },
    { label: 'Role',       key: 'role' },
    { label: 'Status', key: 'status',
      render: (e) => <span className={`badge ${e.status}`}>{e.status}</span>,
    },
    {
      label: 'Credentials',
      key: 'loginEmail',
      render: (e) => (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div className="fw-700" style={{ color: 'var(--primary-light)' }}>{e.loginEmail || 'No Email'}</div>
          <div className="text-muted" style={{ fontFamily: 'monospace' }}>{e.loginPassword || '••••••••'}</div>
        </div>
      )
    },
    {
      label: 'Actions', key: 'id',
      render: (e) => (
        <div className="flex gap-2">
          <button className="btn-icon" title="View Profile" onClick={() => setViewEmployee(e)}>
            <Eye size={16} style={{ color: 'var(--primary)' }} />
          </button>
          <button className="btn-icon" title="Edit Employee" onClick={() => handleEdit(e)}>
            <Edit3 size={16} />
          </button>
          <button className="btn-icon" title="Delete" onClick={() => handleDelete(e.id)}>
            <Trash2 size={16} style={{ color: 'var(--red)' }} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>HR Portal - Employees</h1>
        <p>Register, edit and manage employee identity records</p>
      </div>

      <div className="section-header mb-4">
        <div className="search-bar">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, machine ID, CNIC…"
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
        <button className="btn btn-primary" onClick={() => { setSelectedEmployee(null); setShowForm(true); }}>
          <UserPlus size={15} /> Register Employee
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMsg="No employees found. Register a new employee to get started." />

      {showForm && (
        <EmployeeForm 
          employee={selectedEmployee} 
          onClose={() => { setShowForm(false); setSelectedEmployee(null); }} 
        />
      )}

      {viewEmployee && (
        <EmployeeDetails 
          employee={viewEmployee} 
          onClose={() => setViewEmployee(null)} 
        />
      )}
    </div>
  )
}

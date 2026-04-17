import { useState } from 'react'
import { UserPlus, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import { formatDate } from '../../utils/helpers'
import PatientForm from '../../components/hospital/PatientForm'
import PatientDetails from '../../components/hospital/PatientDetails'
import { Eye } from 'lucide-react'

export default function Patients() {
  const { hosPatients } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)

  const filtered = hosPatients.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(s) ||
      p.patientId?.toLowerCase().includes(s) ||
      p.ward?.toLowerCase().includes(s) ||
      p.condition?.toLowerCase().includes(s) ||
      p.status?.toLowerCase().includes(s)
    )
  })

  const columns = [
    { label: 'ID',          key: 'patientId', render: p => p.patientId || p.id.slice(-6).toUpperCase() },
    { label: 'Name',        key: 'name', render: p => <strong>{p.name}</strong> },
    { label: 'Age / Gender',key: 'age',  render: p => `${p.age} · ${p.gender}` },
    { label: 'Blood Type',  key: 'bloodType' },
    { label: 'Program / Unit', key: 'ward' },
    { label: 'Enrolled On', key: 'admittedOn', render: p => formatDate(p.admittedOn) },
    { label: 'Condition',   key: 'condition',
      render: p => {
        const color = { Critical: 'red', Serious: 'amber', Stable: 'green', Recovered: 'green' }[p.condition] ?? 'blue'
        return <span className={`badge ${p.condition.toLowerCase()}`}>{p.condition}</span>
      }
    },
    {
      label: 'Status', key: 'status',
      render: p => <span className={`badge ${p.status}`}>{p.status}</span>,
    },
    {
      label: 'Actions', key: 'actions',
      render: p => (
        <button 
          className="btn btn-ghost btn-sm text-primary" 
          onClick={() => setSelectedProfile(p)}
          title="Overview Profile"
        >
          <Eye size={14} style={{ marginRight: '6px' }} /> View Profile
        </button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Patients</h1>
        <p>View and manage patient enrollment and therapy programs</p>
      </div>

      <div className="section-header mb-4">
        <div className="search-bar">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, program, status…"
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <UserPlus size={15} /> Enroll Patient
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMsg="No patients found." />

      {showForm && <PatientForm onClose={() => setShowForm(false)} />}
      {selectedProfile && <PatientDetails patient={selectedProfile} onClose={() => setSelectedProfile(null)} />}
    </div>
  )
}

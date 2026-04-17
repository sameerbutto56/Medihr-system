import { useState } from 'react'
import { FilePlus, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import { formatDate } from '../../utils/helpers'
import AddMedicalRecordForm from '../../components/hospital/AddMedicalRecordForm'

export default function MedicalRecords() {
  const { hosMedicalRecords, hosPatients } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const enriched = hosMedicalRecords.map(r => ({
    ...r,
    patientName: hosPatients.find(p => p.id === r.patientId)?.name ?? r.patientId,
  }))

  const filtered = enriched.filter(r =>
    [r.patientName, r.type, r.doctor, r.description].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const columns = [
    { label: 'Record ID',   key: 'id' },
    { label: 'Patient',     key: 'patientName', render: r => <strong>{r.patientName}</strong> },
    { label: 'Date',        key: 'date', render: r => formatDate(r.date) },
    {
      label: 'Type', key: 'type',
      render: r => {
        const colors = { Diagnosis: 'indigo', Surgery: 'red', 'Lab Result': 'cyan', Prescription: 'amber', Treatment: 'green' }
        const cls = colors[r.type] ?? 'info'
        return <span className={`badge scheduled`} style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)' }}>{r.type}</span>
      },
    },
    { label: 'Doctor',      key: 'doctor' },
    { label: 'Description', key: 'description', render: r => <span className="text-muted text-sm">{r.description}</span> },
    {
      label: 'Files', key: 'attachments',
      render: r => r.attachments.length > 0
        ? <span style={{ color: 'var(--secondary)', fontSize: 12 }}>📎 {r.attachments.length}</span>
        : <span className="text-muted" style={{ fontSize: 12 }}>—</span>,
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Medical Records</h1>
        <p>Complete history of diagnoses, surgeries, and treatments</p>
      </div>

      <div className="section-header mb-4">
        <div className="search-bar">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, type, doctor…"
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <FilePlus size={15} /> Add Record
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMsg="No medical records found." />

      {showForm && <AddMedicalRecordForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

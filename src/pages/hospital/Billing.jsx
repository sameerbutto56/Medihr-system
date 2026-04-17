import { useState, useMemo } from 'react'
import { PlusCircle, Search, DollarSign, Eye, AlertCircle, FileText, CheckCircle, Printer } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DataTable from '../../components/shared/DataTable'
import StatCard from '../../components/shared/StatCard'
import InvoiceForm from '../../components/hospital/InvoiceForm'
import InvoiceSlip from '../../components/hospital/InvoiceSlip'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function Billing() {
  const { hosInvoices, updateInvoice } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const handleMarkPaid = async (inv) => {
    if (window.confirm(`Mark invoice #${inv.id.slice(-6).toUpperCase()} as Paid?`)) {
      try {
        await updateInvoice(inv.id, {
          status: 'paid',
          amountPaid: inv.totalAmount,
          balance: 0,
          paidOn: new Date().toISOString()
        })
      } catch (err) {
        console.error("Error marking as paid:", err)
        alert("Failed to update status.")
      }
    }
  }

  const invoicesList = hosInvoices || []

  const filtered = invoicesList.filter(inv =>
    inv.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.id?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date))

  const stats = useMemo(() => {
    let totalRevenue = 0
    let totalCollected = 0
    let pendingBalance = 0

    invoicesList.forEach(inv => {
      totalRevenue += Number(inv.totalAmount) || 0
      totalCollected += Number(inv.amountPaid) || 0
      pendingBalance += Number(inv.balance) || 0
    })

    return { totalRevenue, totalCollected, pendingBalance }
  }, [invoicesList])

  const columns = [
    { label: 'Invoice #',   key: 'id',          render: inv => <span style={{ fontFamily: 'monospace' }}>{inv.id.slice(-6).toUpperCase()}</span> },
    { label: 'Date',        key: 'date',        render: inv => formatDate(inv.date) },
    { label: 'Patient Name',key: 'patientName', render: inv => <strong>{inv.patientName}</strong> },
    { label: 'Total',       key: 'totalAmount', render: inv => formatCurrency(inv.totalAmount) },
    { label: 'Paid',        key: 'amountPaid',  render: inv => <span className="text-green">{formatCurrency(inv.amountPaid)}</span> },
    { label: 'Balance',     key: 'balance',     render: inv => <span style={{ color: inv.balance > 0 ? 'var(--red)' : '' }}>{formatCurrency(inv.balance)}</span> },
    { label: 'Status',      key: 'status',      render: inv => {
        let sc = 'status-warning'
        if(inv.status === 'paid') sc = 'status-active'
        if(inv.status === 'unpaid') sc = 'status-danger'
        return <span className={`badge ${sc}`}>{inv.status}</span>
    }},
    {
      label: 'Actions', key: 'actions',
      render: inv => (
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => setSelectedInvoice(inv)}
            title="View & Print"
          >
            <Eye size={14} />
          </button>
          
          {inv.status !== 'paid' && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleMarkPaid(inv)}
              title="Mark as Paid"
              style={{ background: 'var(--green)', border: 'none' }}
            >
              <CheckCircle size={14} />
            </button>
          )}

          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => setSelectedInvoice(inv)}
            title="Print"
          >
            <Printer size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Billing & Invoices</h1>
        <p>Manage patient payments, generate invoices, and track revenue seamlessly.</p>
      </div>

      <div className="grid-3 mb-6">
        <StatCard 
          label="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          sub="Expected total from all invoices" 
          icon={DollarSign} 
          color="indigo" 
        />
        <StatCard 
          label="Total Collected" 
          value={formatCurrency(stats.totalCollected)} 
          sub="Actual amount received" 
          icon={CheckCircle} 
          color="emerald" 
        />
        <StatCard 
          label="Pending Balance" 
          value={formatCurrency(stats.pendingBalance)} 
          sub="Yet to be collected" 
          icon={AlertCircle} 
          color="red" 
        />
      </div>

      <div className="section-header mb-4">
        <div className="search-bar">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or invoice ID…"
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <PlusCircle size={15} /> Create Invoice
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMsg="No invoices found." />

      {showForm && <InvoiceForm onClose={() => setShowForm(false)} />}
      {selectedInvoice && <InvoiceSlip invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  )
}

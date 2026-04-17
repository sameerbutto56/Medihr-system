import React, { useRef } from 'react'
import { X, Printer, Phone, Mail, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function InvoiceSlip({ invoice, onClose }) {
  const printRef = useRef()

  if (!invoice) return null

  const handlePrint = () => {
    const printContent = printRef.current
    const originalContents = document.body.innerHTML
    
    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload()
  }

  // Pre-calculated or metadata-driven fields matching the screenshot
  const regNumber = invoice.patientRegNumber || invoice.patientId?.slice(-6).toUpperCase() || "CNS-001"
  const planType = invoice.type || "Consultation"
  const dueDate = invoice.dueDate || "Paid" // Defaulting to Paid if not specified
  const ntn = "NTN-83045262"

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 900, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: '16px' }}>Print Therapy Invoice</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ background: '#f5f5f5', padding: '30px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .printable-slip, .printable-slip * { visibility: visible; }
              .printable-slip { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
            }
            .printable-slip td, .printable-slip th, .printable-slip span, .printable-slip div, .printable-slip strong, .printable-slip h1, .printable-slip h3 {
              color: black !important;
            }
            .printable-slip td, .printable-slip th { border: 1px solid #000; padding: 6px 10px; }
            .printable-slip .header-info td { border: none !important; padding: 2px 0; }
            .bank-table td { border: none !important; padding: 1px 0; font-size: 11px; }
          `}</style>

          <div 
            ref={printRef}
            className="printable-slip" 
            style={{ 
              background: 'white', 
              color: 'black', 
              padding: '40px', 
              fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
             {/* Header */}
             <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                 <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>TERTEEB REHABILITATION</h1>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                <div style={{ fontWeight: 'bold' }}>Invoice #: {invoice.id?.slice(-8).toUpperCase() || 'INV-TEMP'}</div>
                <div style={{ fontWeight: 'bold' }}>{ntn}</div>
             </div>

             <table className="header-info" style={{ width: '100%', fontSize: '13px', background: '#f5f0ff', padding: '10px', borderRadius: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '150px' }}>Name:</td>
                    <td><strong>{invoice.patientName}</strong></td>
                  </tr>
                  <tr>
                    <td>Plan:</td>
                    <td>{planType} {invoice.planType ? `(${invoice.planType})` : ''}</td>
                  </tr>
                  <tr>
                    <td>Registration number:</td>
                    <td>{regNumber}</td>
                  </tr>
                  <tr>
                    <td>Issue Date:</td>
                    <td>{formatDate(invoice.date)}</td>
                  </tr>
                  <tr>
                    <td>Due Date:</td>
                    <td><strong style={{ color: dueDate === 'Paid' ? '#008000' : '#ff0000' }}>{dueDate}</strong></td>
                  </tr>
                </tbody>
             </table>

             <div style={{ color: '#0056b3', fontSize: '13px', fontWeight: 'bold', fontStyle: 'italic', marginTop: '10px', marginBottom: '20px' }}>
               Helping children & teens achieve their true potential
             </div>

             {/* Bank Details */}
             <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', textDecoration: 'underline' }}>Bank details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                   <div>
                      <strong style={{ fontSize: '12px' }}>Meezan Bank</strong>
                      <table className="bank-table" style={{ width: '100%' }}>
                        <tbody>
                          <tr><td style={{ width: '70px' }}>Name:</td><td><strong>Terteeb</strong></td></tr>
                          <tr><td>Type:</td><td>Current</td></tr>
                          <tr><td>AC #:</td><td><strong>2750110249561</strong></td></tr>
                          <tr><td>IBAN:</td><td>PK59MEZN0002750110249561</td></tr>
                          <tr><td>Swift Code:</td><td>MEZPKKAGRD</td></tr>
                        </tbody>
                      </table>
                   </div>
                   <div>
                      <strong style={{ fontSize: '12px' }}>Allied Bank Limited: <span style={{ fontWeight: 'normal', color: '#0056b3' }}>(For other then PKR payments)</span></strong>
                      <table className="bank-table" style={{ width: '100%' }}>
                        <tbody>
                          <tr><td style={{ width: '70px' }}>Name:</td><td><strong>Farheen Naz Anis</strong></td></tr>
                          <tr><td>Type:</td><td>Saving</td></tr>
                          <tr><td>AC #:</td><td><strong>10125512490-013</strong></td></tr>
                          <tr><td>IBAN:</td><td>PK59ABPA0010125512490013</td></tr>
                          <tr><td>Swift Code:</td><td>ABPAPKK</td></tr>
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>

             {/* Therapy Table */}
             <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
                <thead style={{ background: '#f0f0f0' }}>
                   <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Therapy</th>
                      <th style={{ textAlign: 'center', width: '150px' }}>RUPEES</th>
                   </tr>
                </thead>
                <tbody>
                   {invoice.items?.map((item, idx) => (
                     <tr key={idx}>
                        <td style={{ padding: '8px' }}>{item.description}</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>{item.total}</td>
                     </tr>
                   ))}
                   {/* Spacing rows if few items */}
                   {Array.from({ length: Math.max(0, 5 - (invoice.items?.length || 0)) }).map((_, i) => (
                     <tr key={`empty-${i}`} style={{ height: '30px' }}><td /><td /></tr>
                   ))}
                   <tr>
                      <td style={{ padding: '8px' }}>Previous Balance</td><td style={{ textAlign: 'right', padding: '8px' }}>0</td>
                   </tr>
                   <tr>
                      <td style={{ padding: '8px' }}>Discount</td><td style={{ textAlign: 'right', padding: '8px' }}>{invoice.discount || 0}</td>
                   </tr>
                   <tr style={{ background: '#000', color: 'white' }}>
                      <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', color: 'white !important' }}>Total Payment</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontSize: '14px', fontWeight: 'bold', color: 'white !important' }}>{invoice.totalAmount}</td>
                   </tr>
                </tbody>
             </table>

             {/* Footer Notes */}
             <div style={{ marginTop: '20px', background: '#f5f0ff', padding: '15px', borderRadius: '4px', fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '600' }}>A- All amounts are in rupees</div>
                <div style={{ fontWeight: '600' }}>B- You will get invoice a week befor last session.</div>
                <div style={{ fontWeight: '600' }}>C- Attendence for insurance will cost you 5000/</div>
                <div style={{ fontWeight: '600' }}>D- WhatsApp proof of payment to Dr Farheen directly (For online)</div>
             </div>

             {/* Contacts */}
             <div style={{ marginTop: '20px', fontSize: '11px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '5px' }}>
                  <span><strong>Email:</strong> <span style={{ color: '#0056b3', textDecoration: 'underline' }}>drfarheen@terteeb.org</span></span>
                  <span><strong>Contact:</strong> 0092-333-484-4926</span>
                </div>
                <div style={{ color: '#000' }}>
                  Lower Ground, Garden Heights, 101 Aibak St, Aibak Block Garden Town, Lahore, 54000
                </div>
             </div>
          </div>
        </div>
        
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '15px 20px' }}>
          <button className="btn btn-ghost" onClick={handlePrint}>
            <Printer size={16} style={{ marginRight: '8px' }} /> Print High-Fidelity Invoice
          </button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

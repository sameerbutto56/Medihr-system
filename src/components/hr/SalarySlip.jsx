import React, { useRef } from 'react'
import { X, Printer, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/helpers'

function numberToWords(num) {
  if (!num) return 'Zero';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'Overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

export default function SalarySlip({ employee, payroll, absences, onClose }) {
  const { updatePayroll } = useApp();
  const printRef = useRef();

  if (!employee || !payroll) return null;

  const isPercentage = employee.compensationType === 'percentage';
  const isDailyRate = employee.compensationType === 'dailyRate';
  
  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;
    
    // Quick printing hack for this specific layout
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React app state after print hack
  };
  
  const handlePaid = async () => {
    try {
      await updatePayroll(payroll.id, { 
        status: 'paid',
        paidOn: new Date().toISOString()
      })
      onClose()
    } catch (err) {
      console.error('Error marking as paid:', err)
      alert('Failed to mark payroll as paid.')
    }
  }

  const grossEarned = isPercentage ? (payroll.gross || 0) : isDailyRate ? (payroll.gross || 0) : ((employee.salary || 0) / 12);
  const deductions = payroll.deductions || 0;
  const netSalary = payroll.net || 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      {/* 
        This modal is styled to fit the printable document seamlessly.
        We increase max-width to simulate an A4 page width visually.
      */}
      <div className="modal-content" style={{ maxWidth: 800, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>View Salary Slip</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ background: '#e0e0e0', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          
          <style>{`
            .printable-slip td, .printable-slip th, .printable-slip span, .printable-slip p, .printable-slip div {
              color: black !important;
            }
          `}</style>

          {/* Printable Area: White A4-like container */}
          <div 
            ref={printRef}
            className="printable-slip" 
            style={{ 
              background: 'white', 
              color: 'black', 
              padding: '40px', 
              fontFamily: 'Arial, sans-serif',
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '5px' }}>
                    {/* Logo simulation based on image */}
                    <div style={{ color: '#4da6d4', fontSize: '32px', fontWeight: 'bold', fontFamily: 'sans-serif', letterSpacing: '-1px' }}>
                      Terteeb
                    </div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
                      TERTEEB REHABILITATION CENTER
                    </h2>
                 </div>
                 <p style={{ margin: 0, fontSize: '11px', color: '#333' }}>
                   Lower Ground, Garden Heights, 101 Aibak St, Aibak Block Garden Town, Lahore, 54000
                 </p>
             </div>

             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                 <h3 style={{ 
                   display: 'inline-block', 
                   margin: 0, 
                   paddingBottom: '2px', 
                   fontStyle: 'italic',
                   fontWeight: 'bold',
                   fontSize: '18px',
                   borderBottom: '2px solid black'
                 }}>
                   Salary Slip
                 </h3>
             </div>

             <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', marginBottom: '20px', fontSize: '12px' }}>
                <tbody>
                   <tr>
                       <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold', width: '25%' }}>Employee ID</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px', width: '25%' }}>{employee.employeeId || employee.id}</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold', width: '25%' }}>Employee Name</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px', width: '25%' }}>{employee.name}</td>
                   </tr>
                   <tr>
                       <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold' }}>Designation</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px' }}>{employee.role || employee.department}</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold' }}>Month / Year</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px' }}>{payroll.month}</td>
                   </tr>
                </tbody>
             </table>

             <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', marginBottom: '30px', fontSize: '12px', textAlign: 'center' }}>
                <thead>
                   <tr style={{ backgroundColor: '#e8e8e8' }}>
                      <th colSpan="2" style={{ border: '1px solid black', padding: '6px 8px', fontStyle: 'italic' }}>Earnings</th>
                      <th colSpan="2" style={{ border: '1px solid black', padding: '6px 8px', fontStyle: 'italic' }}>Deductions</th>
                   </tr>
                </thead>
                 <tbody>
                   <tr>
                      <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left', width: '25%' }}>
                        {isPercentage ? 'Revenue Share' : isDailyRate ? 'Daily Rate Earnings' : 'Basic Salary'}
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px 8px', width: '25%' }}>
                        {Math.round(grossEarned)}
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left', width: '25%' }}>
                        {!isPercentage && absences > 0 ? `Unpaid Leave (${absences})` : '0'}
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px 8px', width: '25%' }}>
                        {Math.round(deductions) || '0'}
                      </td>
                   </tr>
                   
                   {/* Empty rows to match the table height from the image */}
                   <tr>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                   </tr>
                   <tr>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                   </tr>
                   <tr>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                       <td style={{ border: '1px solid black', padding: '14px 8px' }}></td>
                   </tr>
 
                   {/* Totals */}
                   <tr>
                       <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left' }}>Total Additions</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px' }}>{Math.round(grossEarned)}</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left' }}>Total Deductions</td>
                       <td style={{ border: '1px solid black', padding: '6px 8px' }}>{Math.round(deductions)}</td>
                   </tr>
                   <tr style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                       <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left' }}>Net Salary</td>
                       <td colSpan="3" style={{ border: '1px solid black', padding: '6px 8px' }}>{Math.round(netSalary)}</td>
                   </tr>
                   <tr style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                       <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'left' }}>Salary in Words</td>
                       <td colSpan="3" style={{ border: '1px solid black', padding: '6px 8px' }}>
                           {numberToWords(Math.round(netSalary))} Rupees and No Paisas
                       </td>
                   </tr>
                 </tbody>
             </table>

             <div style={{ display: 'flex', alignItems: 'center', gap: '40px', fontSize: '12px', marginTop: '20px' }}>
                <span>Salary Paid By:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ margin: 0 }} /> Bank Transfer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ margin: 0 }} /> Cash
                </label>
             </div>
          </div>

        </div>
        
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '15px 20px' }}>
          {payroll.status === 'pending' && (
            <button className="btn btn-primary" style={{ background: 'var(--green)', color: 'white' }} onClick={handlePaid}>
              <CheckCircle size={16} style={{ marginRight: '8px' }} /> Mark as Complete
            </button>
          )}
          <button className="btn btn-ghost" onClick={handlePrint}>
            <Printer size={16} style={{ marginRight: '8px' }} /> Print Slip
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

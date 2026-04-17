import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function InvoiceForm({ onClose }) {
  const { addInvoice, hosPatients } = useApp()
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])
  const [amountPaid, setAmountPaid] = useState('')
  const [discount, setDiscount] = useState('0')
  const [suggestions, setSuggestions] = useState([])
  const [itemSuggestions, setItemSuggestions] = useState([])

  const REHAB_ITEM_SUGGESTIONS = [
    { description: 'Consultation (With Dr. Farheen)', unitPrice: 5000 },
    { description: 'Registration Fee', unitPrice: 2000 },
    { description: 'Admission Fee', unitPrice: 3000 },
    { description: 'Comprehensive Assessment (1-6 sessions)', unitPrice: 15000 },
    { description: 'Comprehensive therapeutic Plan (60 hrs/mo)', unitPrice: 25000 },
    { description: 'School Readiness plan (60 hrs/mo)', unitPrice: 25000 },
    { description: 'Speech Language therapy (40 mins each)', unitPrice: 3500 },
    { description: 'Behaviour Therapy (60 mins each)', unitPrice: 4000 },
    { description: 'Sensory integration (60 mins each)', unitPrice: 4000 },
    { description: 'Academic/ Remedial (60 mins each)', unitPrice: 3500 },
    { description: 'Counseling & Psychological (60 mins each)', unitPrice: 4500 }
  ]

  useEffect(() => {
    if (patientId) {
      const p = hosPatients.find(p => p.id === patientId)
      if (p) {
        setPatientName(p.name)
        setPhone(p.phone || '')
      }
    } else {
      setPatientName('')
      setPhone('')
    }
  }, [patientId, hosPatients])

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unitPrice)
    }
    setItems(newItems)

    if (field === 'description' && value.length > 1) {
      const matches = REHAB_ITEM_SUGGESTIONS.filter(s => 
        s.description.toLowerCase().includes(value.toLowerCase())
      )
      setItemSuggestions({ index, matches })
    } else if (field === 'description') {
      setItemSuggestions([])
    }
  }

  const selectItemSuggestion = (index, match) => {
    const newItems = [...items]
    newItems[index].description = match.description
    newItems[index].unitPrice = match.unitPrice
    newItems[index].total = Number(newItems[index].quantity) * Number(match.unitPrice)
    setItems(newItems)
    setItemSuggestions([])
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = [...items]
      newItems.splice(index, 1)
      setItems(newItems)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountVal = Number(discount) || 0
  const totalAmount = subtotal - discountVal
  const paid = Number(amountPaid) || 0
  const balance = totalAmount - paid
  const status = balance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')

  // Auto-fetch logic
  const handleNameChange = (val) => {
    setPatientName(val)
    if (!patientId && val.length > 2) {
      const matches = hosPatients.filter(p => p.name.toLowerCase().includes(val.toLowerCase()))
      setSuggestions(matches)
      // Auto fill if exact match
      const exact = hosPatients.find(p => p.name.toLowerCase() === val.toLowerCase())
      if (exact) {
        setPhone(exact.phone || '')
        setPatientId(exact.id)
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const handlePhoneChange = (val) => {
    setPhone(val)
    if (!patientId && val.length > 3) {
      const cleanInput = val.replace(/\D/g, '')
      const exact = hosPatients.find(p => (p.phone || '').replace(/\D/g, '') === cleanInput)
      if (exact) {
        setPatientName(exact.name)
        setPatientId(exact.id)
      }
    }
  }

  const selectSuggestedPatient = (p) => {
    setPatientId(p.id)
    setPatientName(p.name)
    setPhone(p.phone || '')
    setSuggestions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Filter out completely empty items
    const validItems = items.filter(i => i.description.trim() !== '' && i.total > 0)
    if (validItems.length === 0) {
      alert("Please add at least one valid item.")
      return
    }

    if (!patientName) {
      alert("Please select or enter a patient.")
      return
    }

    try {
      await addInvoice({
        patientName,
        patientId: patientId || null,
        phone,
        date,
        items: validItems,
        subtotal,
        discount: discountVal,
        totalAmount,
        amountPaid: paid,
        balance,
        status,
        createdAt: new Date().toISOString()
      })
      onClose()
    } catch (err) {
      console.error('Error creating invoice:', err)
      alert('Failed to save invoice.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Create New Invoice</h2>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select className="form-control" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  <option value="">-- Custom Patient --</option>
                  {hosPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" required className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {!patientId && (
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Patient Name</label>
                  <input type="text" required className="form-control" value={patientName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Type name to find patient..." />
                  {suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, 
                      background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                      borderRadius: '8px', zIndex: 100, maxHeight: '150px', overflowY: 'auto',
                      marginTop: '4px', boxShadow: 'var(--shadow-lg)'
                    }}>
                      {suggestions.map(p => (
                        <div 
                          key={p.id} className="p-2" style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                          onClick={() => selectSuggestedPatient(p)}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="03xx-xxxxxxx" />
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold', color: 'var(--primary)' }}>Invoice Items</h3>
              
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      <th style={{ padding: '10px' }}>Description</th>
                      <th style={{ padding: '10px', width: '80px' }}>Qty</th>
                      <th style={{ padding: '10px', width: '120px' }}>Unit Price</th>
                      <th style={{ padding: '10px', width: '120px' }}>Total</th>
                      <th style={{ padding: '10px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px', position: 'relative' }}>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. Session 1" 
                            required 
                            style={{ padding: '6px' }} 
                            value={item.description} 
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)} 
                          />
                          {itemSuggestions.index === idx && itemSuggestions.matches?.length > 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: '6px', right: '6px', 
                              background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                              borderRadius: '8px', zIndex: 100, maxHeight: '150px', overflowY: 'auto',
                              marginTop: '2px', boxShadow: 'var(--shadow-lg)'
                            }}>
                              {itemSuggestions.matches.map((m, i) => (
                                <div 
                                  key={i} className="p-2" style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                  onClick={() => selectItemSuggestion(idx, m)}
                                  onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                  <span style={{ fontSize: '11px' }}>{m.description}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--green)' }}>Rs. {m.unitPrice}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input type="number" min="1" className="form-control" required style={{ padding: '6px' }} value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input type="number" min="0" className="form-control" required style={{ padding: '6px' }} value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} />
                        </td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                          {item.total}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: items.length === 1 ? 'not-allowed' : 'pointer', opacity: items.length === 1 ? 0.5 : 1 }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addItem} className="btn btn-ghost" style={{ marginTop: '10px', fontSize: '12px' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Another Item
              </button>
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <span>Subtotal:</span>
                <strong>{subtotal}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', alignItems: 'center' }}>
                <span>Discount:</span>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="form-control" style={{ width: '120px', padding: '6px' }} placeholder="0" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span>Total Amount:</span>
                <strong>{totalAmount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', alignItems: 'center' }}>
                <span>Amount Paid:</span>
                <input type="number" min="0" max={totalAmount || undefined} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="form-control" style={{ width: '120px', padding: '6px' }} placeholder="0" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', color: balance > 0 ? 'var(--red)' : 'var(--green)', fontSize: '16px' }}>
                <strong>Balance Due:</strong>
                <strong>{balance}</strong>
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Invoice</button>
          </div>
        </form>
      </div>
    </div>
  )
}

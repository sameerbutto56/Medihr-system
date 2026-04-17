import React, { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Loader2, Image as ImageIcon, Search, UserCheck, UserX } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createWorker } from 'tesseract.js'
import { useApp } from '../../context/AppContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, limit } from 'firebase/firestore'

export default function AttendanceUpload({ onClose }) {
  const { hrEmployees, activeBranchId } = useApp()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') // idle | parsing | ocr | reviewing | uploading | success | error
  const [ocrProgress, setOcrProgress] = useState(0)
  const [reviewData, setReviewData] = useState({ present: [], absent: [], unmatched: [], dates: [] })
  const [stats, setStats] = useState({ total: 0, updated: 0, failed: 0, absentMarked: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStatus('idle')
    }
  }

  const parseAndSync = async () => {
    if (!file) return
    setLoading(true)
    
    if (file.type.startsWith('image/')) {
      await processImageWithOCR()
    } else {
      await processExcelFile()
    }
  }

  const processExcelFile = async () => {
    setStatus('parsing')
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            throw new Error('The sheet appears to be empty.')
          }

          buildReviewData(jsonData)
        } catch (err) {
          console.error('Parsing error:', err)
          setErrorMsg(err.message)
          setStatus('error')
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error('Parsing error:', err)
      setErrorMsg(err.message)
      setStatus('error')
      setLoading(false)
    }
  }

  const processImageWithOCR = async () => {
    setStatus('ocr')
    setOcrProgress(0)
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100))
        }
      })

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const parsed = parseOCRText(text)
      if (parsed.length === 0) {
        throw new Error('Could not find any attendance data in the image. Please ensure the image is clear.')
      }

      buildReviewData(parsed)
    } catch (err) {
      console.error('OCR error:', err)
      setErrorMsg(err.message)
      setStatus('error')
      setLoading(false)
    }
  }

  const parseOCRText = (text) => {
    const lines = text.split('\n')
    const results = []
    
    const rowRegex = /(\d+)\s+(.*?)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s+\d{1,2}:\d{2}\s*[AP]M)\s+(C\/(?:In|Out))/i
    lines.forEach(line => {
      const match = line.match(rowRegex)
      if (match) {
        results.push({
          'AC-No.': match[1],
          'Name': match[2].trim(),
          'Time': match[3],
          'State': match[4]
        })
      }
    })
    return results
  }

  /* ── Core: Build preview data from parsed rows ───────────────────────── */
  const buildReviewData = (data) => {
    const grouped = {}
    const allDatesSet = new Set()
    const unmatchedRows = []

    data.forEach(row => {
      const acNo = String(row['AC-No.'] || row['ID'] || row['User ID'] || row['Employee ID'] || '').trim()
      const rowName = String(row['Name'] || row['Employee Name'] || '').trim()
      const timeVal = row['Time'] || row['Check Time'] || row['Attendance Time']
      const state = String(row['State'] || row['Status'] || '').trim()

      if (!acNo && !rowName) return
      if (!timeVal) return

      let dateStr, timeStr
      if (typeof timeVal === 'string' && timeVal.includes(' ')) {
        const parts = timeVal.trim().split(/\s+/)
        dateStr = normalizeDate(parts[0])
        timeStr = convertTo24Hour(parts.slice(1).join(' '))
      } else if (typeof timeVal === 'number') {
        const dt = excelSerialToDate(timeVal)
        dateStr = dt.date
        timeStr = dt.time
      } else {
        dateStr = normalizeDate(row['Date'] || row['Attendance Date'] || timeVal)
        timeStr = convertTo24Hour(timeVal)
      }

      if (!dateStr || !timeStr) return

      allDatesSet.add(dateStr)

      // Match employee by AC-No. first
      let employee = findEmployeeByACNo(acNo)

      // Fallback: match by name if AC-No. didn't work
      if (!employee && rowName) {
        employee = findEmployeeByName(rowName)
      }

      if (!employee) {
        unmatchedRows.push({ acNo, name: rowName, date: dateStr, time: timeStr, state })
        return
      }

      const key = `${employee.id}_${dateStr}`
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeMachineId: employee.employeeId,
          acNo,
          sheetName: rowName,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          times: []
        }
      }

      // Use the State column to determine check-in vs check-out
      const isCheckIn = /c\/in/i.test(state) || /check.?in/i.test(state)
      const isCheckOut = /c\/out/i.test(state) || /check.?out/i.test(state)

      if (isCheckIn) {
        if (!grouped[key].checkIn || timeStr < grouped[key].checkIn) {
          grouped[key].checkIn = timeStr
        }
      }
      if (isCheckOut) {
        if (!grouped[key].checkOut || timeStr > grouped[key].checkOut) {
          grouped[key].checkOut = timeStr
        }
      }

      // If no State column matched, fallback to time-sorting
      if (!isCheckIn && !isCheckOut) {
        grouped[key].times.push(timeStr)
      }
    })

    // For records that didn't have a State column, use time sorting
    Object.values(grouped).forEach(rec => {
      if (rec.times.length > 0 && !rec.checkIn && !rec.checkOut) {
        const sorted = rec.times.sort((a, b) => a.localeCompare(b))
        rec.checkIn = sorted[0]
        rec.checkOut = sorted.length > 1 ? sorted[sorted.length - 1] : null
      }
    })

    const allDates = Array.from(allDatesSet).sort()
    const presentRecords = Object.values(grouped)

    // Build absent records: for each active employee, check each date in the sheet
    // If the employee has no record for that date, mark them absent
    const absentRecords = []
    const activeEmployees = hrEmployees.filter(e => e.status === 'active')

    allDates.forEach(date => {
      activeEmployees.forEach(emp => {
        const key = `${emp.id}_${date}`
        if (!grouped[key]) {
          absentRecords.push({
            employeeId: emp.id,
            employeeName: emp.name,
            employeeMachineId: emp.employeeId,
            date,
            checkIn: null,
            checkOut: null,
            status: 'absent'
          })
        }
      })
    })

    setReviewData({
      present: presentRecords,
      absent: absentRecords,
      unmatched: unmatchedRows,
      dates: allDates
    })
    setStatus('reviewing')
    setLoading(false)
  }

  /* ── Employee matching helpers ───────────────────────────────────────── */
  const findEmployeeByACNo = (acNo) => {
    if (!acNo) return null
    const searchId = String(acNo).trim()
    return hrEmployees.find(e => {
      const targetId = String(e.employeeId || '').trim()
      return targetId === searchId ||
        targetId === `TRB-${searchId.padStart(4, '0')}` ||
        targetId === `TRB-${searchId}` ||
        targetId.replace(/^TRB-0*/, '') === searchId
    })
  }

  const findEmployeeByName = (name) => {
    if (!name) return null
    const titles = ['dr.', 'ms.', 'mr.', 'mrs.', 'sir']
    const cleanName = (n) => {
      let s = String(n).toLowerCase().trim()
      titles.forEach(t => s = s.replace(t, ''))
      return s.replace(/[^a-z0-9]/g, '').trim()
    }
    const searchName = cleanName(name)
    return hrEmployees.find(e => {
      const targetName = cleanName(e.name)
      return targetName.includes(searchName) || searchName.includes(targetName) ||
        (searchName.length > 3 && targetName.length > 3 && targetName.substring(0, 5) === searchName.substring(0, 5))
    })
  }

  /* ── Upload confirmed data to Firebase ───────────────────────────────── */
  const startUpload = async () => {
    setLoading(true)
    setStatus('uploading')

    let updatedCount = 0
    let failedCount = 0
    let absentCount = 0
    const allRecords = [
      ...reviewData.present.map(r => ({
        employeeId: r.employeeId,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: 'present'
      })),
      ...reviewData.absent.map(r => ({
        employeeId: r.employeeId,
        date: r.date,
        checkIn: null,
        checkOut: null,
        status: 'absent'
      }))
    ]

    const totalCount = allRecords.length
    setStats({ total: totalCount, updated: 0, failed: 0, absentMarked: 0 })

    for (const record of allRecords) {
      try {
        const attendanceRef = collection(db, 'attendance')
        const q = query(
          attendanceRef, 
          where('employeeId', '==', record.employeeId), 
          where('date', '==', record.date),
          where('branchId', '==', activeBranchId)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          await updateDoc(doc(db, 'attendance', querySnapshot.docs[0].id), { ...record, branchId: activeBranchId })
        } else {
          await addDoc(attendanceRef, { ...record, branchId: activeBranchId })
        }

        if (record.status === 'absent') {
          absentCount++
        } else {
          updatedCount++
        }
        setStats(prev => ({ ...prev, updated: updatedCount, absentMarked: absentCount }))
      } catch (err) {
        console.error('Error processing record:', err)
        failedCount++
      }
    }

    setStats({ total: totalCount, updated: updatedCount, failed: failedCount, absentMarked: absentCount })
    setStatus('success')
    setLoading(false)
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const convertTo24Hour = (time) => {
    if (!time || typeof time !== 'string') return time
    const cleanTime = time.trim()
    if (!cleanTime.toUpperCase().includes('AM') && !cleanTime.toUpperCase().includes('PM')) return cleanTime

    const parts = cleanTime.split(/\s+/)
    const modifier = parts[parts.length - 1].toUpperCase()
    let [hours, minutes] = parts[0].split(':')
    hours = parseInt(hours, 10)
    if (modifier === 'AM' && hours === 12) hours = 0
    if (modifier === 'PM' && hours !== 12) hours += 12
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const normalizeDate = (val) => {
    if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    if (typeof val === 'string') {
      const cleaned = val.trim().split(' ')[0].replace(/\//g, '-')
      const parts = cleaned.split('-')
      if (parts.length !== 3) return null
      if (parts[0].length === 4) return cleaned
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
      const month = parts[0].padStart(2, '0')
      const day = parts[1].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return val
  }

  const excelSerialToDate = (serial) => {
    const totalDays = Math.floor(serial)
    const timeFraction = serial - totalDays
    const date = new Date((totalDays - 25569) * 86400 * 1000)
    const totalMinutes = Math.round(timeFraction * 24 * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return {
      date: date.toISOString().split('T')[0],
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const formatTime12 = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hr = parseInt(h, 10)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
    return `${h12}:${m} ${ampm}`
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: status === 'reviewing' ? '850px' : '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-box" style={{ background: 'var(--primary-light)', color: 'white', padding: '8px', borderRadius: '8px' }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Import Attendance</h2>
              <p className="text-xs text-muted">Upload ZKTeco sheet — matches by AC-No. &amp; Name, auto-marks absent</p>
            </div>
          </div>
          <button className="toggle-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* ── IDLE / ERROR: File picker ─────────────────────────── */}
          {(status === 'idle' || status === 'error') && (
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(99,102,241,0.05)' : 'transparent'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file" ref={fileInputRef} onChange={handleFileChange}
                accept=".xlsx, .xls, .csv, .jpg, .jpeg, .png" style={{ display: 'none' }}
              />
              <div style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <Upload size={32} />
                <ImageIcon size={32} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                {file ? file.name : 'Select Sheet or Photo'}
              </h3>
              <p className="text-xs text-muted">Supports Excel (.xlsx, .xls), CSV, and Image files (OCR)</p>
              <p className="text-xs text-muted" style={{ marginTop: '8px', opacity: 0.7 }}>
                Expected columns: <strong>AC-No.</strong>, <strong>Name</strong>, <strong>Time</strong>, <strong>State</strong> (C/In, C/Out)
              </p>
            </div>
          )}

          {/* ── OCR progress ─────────────────────────────────────── */}
          {status === 'ocr' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Reading Image (OCR)...</h3>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
                <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
              </div>
              <p className="text-sm text-muted" style={{ marginTop: '8px' }}>{ocrProgress}% complete</p>
            </div>
          )}

          {/* ── REVIEWING: Show matched, absent, unmatched ────── */}
          {status === 'reviewing' && (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px', padding: '12px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <UserCheck size={16} style={{ color: 'var(--green)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--green)' }}>Present</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{reviewData.present.length}</span>
                  <span className="text-xs text-muted" style={{ marginLeft: '6px' }}>records</span>
                </div>
                <div style={{ flex: 1, minWidth: '120px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <UserX size={16} style={{ color: 'var(--red)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--red)' }}>Absent</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{reviewData.absent.length}</span>
                  <span className="text-xs text-muted" style={{ marginLeft: '6px' }}>records</span>
                </div>
                {reviewData.unmatched.length > 0 && (
                  <div style={{ flex: 1, minWidth: '120px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <AlertCircle size={16} style={{ color: 'var(--amber)' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--amber)' }}>Unmatched</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 800 }}>{reviewData.unmatched.length}</span>
                    <span className="text-xs text-muted" style={{ marginLeft: '6px' }}>rows</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted" style={{ marginBottom: '12px' }}>
                Dates found: <strong>{reviewData.dates.map(d => {
                  const [y, m, dd] = d.split('-')
                  return `${dd}/${m}/${y}`
                }).join(', ')}</strong>
              </p>

              {/* Present records table */}
              {reviewData.present.length > 0 && (
                <>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '12px 0 6px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={14} /> Present Records
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--bg-light)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left' }}>AC-No.</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Sheet Name</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Matched Employee</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Check In</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewData.present.map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{row.acNo}</td>
                            <td style={{ padding: '8px' }}>{row.sheetName}</td>
                            <td style={{ padding: '8px', color: 'var(--green)' }}>
                              ✓ {row.employeeName}
                              <span className="text-xs text-muted" style={{ marginLeft: '4px' }}>({row.employeeMachineId})</span>
                            </td>
                            <td style={{ padding: '8px' }}>{row.date}</td>
                            <td style={{ padding: '8px' }}>{formatTime12(row.checkIn)}</td>
                            <td style={{ padding: '8px' }}>{formatTime12(row.checkOut)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Absent records table */}
              {reviewData.absent.length > 0 && (
                <>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '12px 0 6px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserX size={14} /> Will Be Marked Absent (no record in sheet)
                  </h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--bg-light)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Employee</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Machine ID</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewData.absent.map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px' }}>{row.employeeName}</td>
                            <td style={{ padding: '8px' }}>{row.employeeMachineId}</td>
                            <td style={{ padding: '8px' }}>{row.date}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: '11px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px' }}>ABSENT</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Unmatched rows */}
              {reviewData.unmatched.length > 0 && (
                <>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '12px 0 6px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> Unmatched Rows (AC-No. not found in employees)
                  </h4>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '12px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--bg-light)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left' }}>AC-No.</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewData.unmatched.map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px', fontWeight: 600, color: 'var(--amber)' }}>{row.acNo}</td>
                            <td style={{ padding: '8px' }}>{row.name}</td>
                            <td style={{ padding: '8px' }}>{row.date}</td>
                            <td style={{ padding: '8px' }}>{row.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="alert alert-danger" style={{ fontSize: '12px', padding: '10px 14px' }}>
                    <AlertCircle size={14} />
                    <span>These rows could not be matched. Make sure the AC-No. on the ZKTeco machine matches the employee's Machine Sync ID in the system.</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PARSING / UPLOADING ──────────────────────────────── */}
          {(status === 'parsing' || status === 'uploading') && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                {status === 'parsing' ? 'Reading Sheet...' : 'Syncing Records to Firebase...'}
              </h3>
              {status === 'uploading' && (
                <p className="text-sm text-muted" style={{ marginTop: '8px' }}>
                  {stats.updated + stats.absentMarked} / {stats.total} processed
                </p>
              )}
            </div>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────── */}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Import Successful!</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>{stats.updated}</div>
                  <div className="text-xs text-muted">Present Synced</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red)' }}>{stats.absentMarked}</div>
                  <div className="text-xs text-muted">Marked Absent</div>
                </div>
                {stats.failed > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--amber)' }}>{stats.failed}</div>
                    <div className="text-xs text-muted">Errors</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ERROR message ────────────────────────────────────── */}
          {status === 'error' && (
            <div className="alert alert-danger" style={{ marginTop: '16px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>
          {status === 'reviewing' && (
            <button type="button" className="btn btn-primary" onClick={startUpload}>
              Confirm &amp; Save ({reviewData.present.length + reviewData.absent.length} records)
            </button>
          )}
          {(status === 'idle' || status === 'error') && (
            <button type="button" className="btn btn-primary" disabled={!file || loading} onClick={parseAndSync}>
              Start Import
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

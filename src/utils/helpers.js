import { format, parseISO, differenceInYears, differenceInDays } from 'date-fns'

export const formatDate = (dateStr, fmt = 'MMM dd, yyyy') => {
  try { return format(parseISO(dateStr), fmt) }
  catch { return dateStr }
}

export const formatCurrency = (amount, currency = 'PKR') =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount)

export const calcAge = (dob) => differenceInYears(new Date(), parseISO(dob))

export const daysBetween = (a, b) =>
  Math.abs(differenceInDays(parseISO(a), parseISO(b)))

export const statusColor = (status) => {
  const map = {
    active: 'status-active',
    inactive: 'status-inactive',
    present: 'status-active',
    absent: 'status-danger',
    late: 'status-warning',
    paid: 'status-active',
    pending: 'status-warning',
    cancelled: 'status-danger',
    scheduled: 'status-info',
    completed: 'status-active',
    admitted: 'status-info',
    discharged: 'status-active',
    critical: 'status-danger',
  }
  return map[status?.toLowerCase()] ?? 'status-default'
}

export const avatarInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

export const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )

export const calcDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null
  const [h1, m1] = checkIn.split(':').map(Number)
  const [h2, m2] = checkOut.split(':').map(Number)
  const start = h1 * 60 + m1
  const end = h2 * 60 + m2
  const diff = end - start
  if (diff < 0) return null
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}h ${m}m`
}

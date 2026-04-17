import { parseISO, getDay } from 'date-fns'

/**
 * Checks if a new appointment/session conflicts with existing ones for the same doctor.
 * 
 * @param {Object} newEntry { doctor: string, date: string|null, time: string, recurringDays: string[]|null }
 * @param {Array} allAppointments Existing appointments
 * @param {Array} allSessions Existing therapy sessions
 * @returns {Object|null} The conflicting entry or null
 */
export function findScheduleConflict(newEntry, allAppointments, allSessions) {
  const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 }
  
  const newDoctor = newEntry.doctor || newEntry.therapist
  const newTime = newEntry.time
  const newDate = newEntry.date // YYYY-MM-DD
  const newDays = newEntry.recurringDays || [] // ['Mon', 'Tue', ...]

  // 1. Check against Appointments
  for (const appt of allAppointments) {
    if (appt.doctor === newDoctor && appt.time === newTime && appt.status !== 'cancelled') {
      // If new entry is one-time
      if (newDate && appt.date === newDate) return appt
      
      // If new entry is recurring
      if (newDays.length > 0) {
        const apptDay = getDay(parseISO(appt.date))
        const conflictDays = newDays.map(d => dayMap[d])
        if (conflictDays.includes(apptDay)) return appt
      }
    }
  }

  // 2. Check against Therapy Sessions
  for (const sess of allSessions) {
    const sessDoctor = sess.therapist || sess.doctor
    if (sessDoctor === newDoctor && sess.time === newTime && sess.status !== 'cancelled') {
      
      // Case A: New is one-time, Existing is one-time
      if (newDate && sess.date && sess.date === newDate) return sess
      
      // Case B: New is one-time, Existing is recurring
      if (newDate && sess.recurringDays?.length > 0) {
        const newDay = getDay(parseISO(newDate))
        const sessDays = sess.recurringDays.map(d => dayMap[d])
        if (sessDays.includes(newDay)) return sess
      }

      // Case C: New is recurring, Existing is one-time
      if (newDays.length > 0 && sess.date) {
        const sessDay = getDay(parseISO(sess.date))
        const newDaysIdx = newDays.map(d => dayMap[d])
        if (newDaysIdx.includes(sessDay)) return sess
      }

      // Case D: New is recurring, Existing is recurring
      if (newDays.length > 0 && sess.recurringDays?.length > 0) {
        const overlap = newDays.some(d => sess.recurringDays.includes(d))
        if (overlap) return sess
      }
    }
  }

  return null
}

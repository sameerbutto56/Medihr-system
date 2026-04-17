// ─── HR Mock Data ──────────────────────────────────────────────────────────────
export const employees = [
  { id: 'E001', employeeId: '1', name: 'Dr. Farheen Naz',    department: 'Clinical',     role: 'Specialist Educator', salary: 120000, status: 'active',   dob: '1982-04-12', joined: '2015-07-01', email: 'drfarheen@terteeb.org', phone: '0333-4844926', avatar: null },
  { id: 'E002', employeeId: '2', name: 'Zohaib Hassan',     department: 'Therapy',      role: 'ABA Therapist',       salary: 85000,  status: 'active',   dob: '1990-09-23', joined: '2019-03-15', email: 'zohaib@terteeb.org',  phone: '0321-1234567', avatar: null },
  { id: 'E003', employeeId: '3', name: 'Mariam Safdar',     department: 'Speech',       role: 'Speech Pathologist', salary: 90000,  status: 'active',   dob: '1992-01-07', joined: '2020-11-10', email: 'mariam@terteeb.org',  phone: '0333-3333333', avatar: null },
  { id: 'E004', employeeId: '4', name: 'Usman Ghani',       department: 'Sensory',      role: 'OT Specialist',      salary: 82000,  status: 'active',   dob: '1988-06-30', joined: '2018-01-20', email: 'usman@terteeb.org',   phone: '0300-4444444', avatar: null },
  { id: 'E005', employeeId: '5', name: 'Alina Khan',        department: 'Clinical',     role: 'Psychologist',       salary: 95000,  status: 'active',   dob: '1994-11-15', joined: '2021-05-03', email: 'alina@terteeb.org',   phone: '0345-5555555', avatar: null },
  { id: 'E006', employeeId: '6', name: 'Bilal Ahmed',       department: 'Admin',        role: 'Center Manager',     salary: 75000,  status: 'active',   dob: '1985-03-28', joined: '2016-08-22', email: 'bilal@terteeb.org',   phone: '0322-6666666', avatar: null },
]

export const attendance = [
  { id: 'A001', employeeId: 'E001', date: '2026-04-10', checkIn: '08:58', checkOut: '17:05', status: 'present' },
  { id: 'A002', employeeId: 'E002', date: '2026-04-10', checkIn: '09:32', checkOut: '17:00', status: 'late'    },
  { id: 'A004', employeeId: 'E004', date: '2026-04-10', checkIn: '08:45', checkOut: '18:20', status: 'present' },
]

export const payroll = [
  { id: 'P001', employeeId: 'E001', month: '2026-03', gross: 10000.00, deductions: 1000.00, net: 9000.00, status: 'paid',    paidOn: '2026-04-01' },
]

// ─── Rehabilitation Mock Data ────────────────────────────────────────────────────────
export const patients = [
  { id: 'PT001', name: 'Zayan Ahmed',     age: 7,  gender: 'Male',   bloodType: 'B+',  phone: '0300-1111111', email: 'zayan@email.com',  address: 'Gulberg Lahore', status: 'active',     ward: 'Autism Unit',   admittedOn: '2026-01-08', condition: 'Stable'   },
  { id: 'PT002', name: 'Eshal Fatima',    age: 5,  gender: 'Female', bloodType: 'O+',  phone: '0321-2222222', email: 'eshal@email.com',  address: 'DHA Stage 5',   status: 'active',     ward: 'Speech Unit',   admittedOn: '2026-02-20', condition: 'Improving'},
  { id: 'PT003', name: 'Arham Khan',      age: 9,  gender: 'Male',   bloodType: 'A-',  phone: '0345-3333333', email: 'arham@email.com',  address: 'Model Town',     status: 'active',     ward: 'ABA Unit',      admittedOn: '2026-03-11', condition: 'Progressing' },
]

export const appointments = [
  { id: 'AP001', patientId: 'PT001', patientName: 'Zayan Ahmed',   doctor: 'Dr. Farheen Naz',  specialty: 'Clinical Assessment', date: '2026-04-14', time: '09:00', status: 'scheduled', notes: 'Initial intake'       },
  { id: 'AP002', patientId: 'PT003', patientName: 'Arham Khan',     doctor: 'Alina Khan',        specialty: 'Behavior Assessment', date: '2026-04-13', time: '11:30', status: 'scheduled', notes: 'Parent interview'   },
]

export const medicalRecords = [
  { id: 'MR001', patientId: 'PT001', date: '2026-04-08', type: 'Initial Consultation', doctor: 'Dr. Farheen Naz', description: 'Suspected ASD Level 2. Recommended ABA and Speech therapy.', attachments: [] },
]

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/shared/Layout'
import AuthPage from './pages/AuthPage'

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard'

// HR Pages
import HRDashboard   from './pages/hr/Dashboard'
import Employees     from './pages/hr/Employees'
import Attendance    from './pages/hr/Attendance'
import Payroll       from './pages/hr/Payroll'
import HRPortal      from './pages/hr/HRPortal'
import CEOPortal     from './pages/hr/CEOPortal'
import ManagerPortal from './pages/hr/ManagerPortal'

// Hospital Pages
import HospitalDashboard from './pages/hospital/Dashboard'
import Patients          from './pages/hospital/Patients'
import Appointments      from './pages/hospital/Appointments'
import MedicalRecords    from './pages/hospital/MedicalRecords'
import TherapySessions   from './pages/hospital/TherapySessions'
import Billing           from './pages/hospital/Billing'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { currentUser, userRole } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/auth" element={!currentUser ? <AuthPage /> : <Navigate to={userRole === 'employee' ? '/me' : (userRole === 'manager' ? '/hr/manager' : '/hr')} replace />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Default redirect */}
                <Route path="/" element={<Navigate to={userRole === 'employee' ? '/me' : (userRole === 'manager' ? '/hr/manager' : '/hr')} replace />} />

                {/* My Profile - Accessible by everyone */}
                <Route path="me" element={<EmployeeDashboard />} />

                {/* HR Module */}
                {userRole !== 'employee' && (
                  <>
                    <Route path="hr"            element={<HRDashboard />} />
                    <Route path="hr/employees"  element={<Employees />} />
                    <Route path="hr/attendance" element={<Attendance />} />
                    <Route path="hr/payroll"    element={<Payroll />} />
                    <Route path="hr/portal"     element={<HRPortal />} />
                    <Route path="hr/ceo"        element={userRole === 'owner' ? <CEOPortal /> : <Navigate to="/hr" replace />} />
                    <Route path="hr/manager"    element={<ManagerPortal />} />

                    {/* Hospital Module */}
                    <Route path="hospital"              element={<HospitalDashboard />} />
                    <Route path="hospital/patients"     element={<Patients />} />
                    <Route path="hospital/appointments" element={<Appointments />} />
                    <Route path="hospital/therapy"      element={<TherapySessions />} />
                    <Route path="hospital/billing"      element={<Billing />} />
                    <Route path="hospital/records"      element={<MedicalRecords />} />
                  </>
                )}

                {/* Fallback */}
                <Route path="*" element={<Navigate to={userRole === 'employee' ? '/me' : '/hr'} replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

import { Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'
import AddPatientPage from './pages/AddPatientPage'
import DashboardPage from './pages/DashboardPage'
import EditPatientPage from './pages/EditPatientPage'
import NotFoundPage from './pages/NotFoundPage'
import PatientsPage from './pages/PatientsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/new" element={<AddPatientPage />} />
        <Route path="/patients/:id/edit" element={<EditPatientPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

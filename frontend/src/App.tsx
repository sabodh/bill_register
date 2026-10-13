import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './layout/AppShell';
import { BillingPage } from './modules/billing/BillingPage';
import { DoctorFormPage } from './modules/doctors/DoctorFormPage';
import { DoctorsListPage } from './modules/doctors/DoctorsListPage';
import { PatientFormPage } from './modules/patients/PatientFormPage';
import { PatientsListPage } from './modules/patients/PatientsListPage';
import { RegistrationWorkspacePage } from './modules/patients/RegistrationWorkspacePage';
import { StaffFormPage } from './modules/staff/StaffFormPage';
import { StaffListPage } from './modules/staff/StaffListPage';
import { UserFormPage } from './modules/users/UserFormPage';
import { UsersListPage } from './modules/users/UsersListPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/new" element={<UserFormPage />} />
            <Route path="users/:id" element={<UserFormPage />} />
            <Route path="patients" element={<PatientsListPage />} />
            <Route path="registration" element={<RegistrationWorkspacePage />} />
            <Route path="patients/new" element={<RegistrationWorkspacePage />} />
            <Route path="patients/:id" element={<PatientFormPage />} />
            <Route path="doctors" element={<DoctorsListPage />} />
            <Route path="doctors/new" element={<DoctorFormPage />} />
            <Route path="doctors/:id" element={<DoctorFormPage />} />
            <Route path="staff" element={<StaffListPage />} />
            <Route path="staff/new" element={<StaffFormPage />} />
            <Route path="staff/:id" element={<StaffFormPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="coming-soon/:module" element={<ComingSoonPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

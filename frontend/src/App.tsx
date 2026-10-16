import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LabBillReportsPage } from './modules/reports/LabBillReportsPage';
import { LabTestCountReportPage } from './modules/reports/LabTestCountReportPage';
import { ReportsIndexRedirect, ReportsLabBillsLayout } from './modules/reports/ReportsLabBillsLayout';

import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './layout/AppShell';
import { BillingPage } from './modules/billing/BillingPage';
import { LabAllTestsPage } from './modules/lab/LabAllTestsPage';
import { LabResultPrintFormatsPage } from './modules/lab/LabResultPrintFormatsPage';
import { LabResultsPage } from './modules/lab/LabResultsPage';
import { LabTestDepartmentWorkspacePage } from './modules/lab/LabTestDepartmentWorkspacePage';
import { LabWorkspaceLayout } from './modules/lab/LabWorkspaceLayout';
import { LabPackagesWorkspacePage } from './modules/lab/LabPackagesWorkspacePage';
import { LabTestsWorkspacePage } from './modules/lab/LabTestsWorkspacePage';
import { DoctorDepartmentWorkspacePage } from './modules/departments/DoctorDepartmentWorkspacePage';
import { StaffDepartmentWorkspacePage } from './modules/departments/StaffDepartmentWorkspacePage';
import { DoctorsWorkspacePage } from './modules/doctors/DoctorsWorkspacePage';
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
            <Route path="doctor-departments" element={<DoctorDepartmentWorkspacePage />} />
            <Route path="doctor-departments/new" element={<DoctorDepartmentWorkspacePage />} />
            <Route path="doctor-departments/:id" element={<DoctorDepartmentWorkspacePage />} />
            <Route path="doctors" element={<DoctorsWorkspacePage />} />
            <Route path="doctors/new" element={<DoctorsWorkspacePage />} />
            <Route path="doctors/:id" element={<DoctorsWorkspacePage />} />
            <Route path="staff-departments" element={<StaffDepartmentWorkspacePage />} />
            <Route path="staff-departments/new" element={<StaffDepartmentWorkspacePage />} />
            <Route path="staff-departments/:id" element={<StaffDepartmentWorkspacePage />} />
            <Route path="staff" element={<StaffListPage />} />
            <Route path="staff/new" element={<StaffFormPage />} />
            <Route path="staff/:id" element={<StaffFormPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="lab/results" element={<LabResultsPage />} />
            <Route path="lab/result-print-formats" element={<LabResultPrintFormatsPage />} />
            <Route path="lab/all-tests" element={<LabAllTestsPage />} />
            <Route element={<LabWorkspaceLayout />}>
              <Route path="lab/tests" element={<LabTestsWorkspacePage />} />
              <Route path="lab/tests/new" element={<LabTestsWorkspacePage />} />
              <Route path="lab/tests/:id" element={<LabTestsWorkspacePage />} />
              <Route path="lab/packages" element={<LabPackagesWorkspacePage />} />
              <Route path="lab/packages/:id" element={<LabPackagesWorkspacePage />} />
            </Route>
            <Route path="lab/test-departments" element={<LabTestDepartmentWorkspacePage />} />
            <Route path="lab/test-departments/new" element={<LabTestDepartmentWorkspacePage />} />
            <Route path="lab/test-departments/:id" element={<LabTestDepartmentWorkspacePage />} />
            <Route path="reports" element={<ReportsIndexRedirect />} />
            <Route path="reports/lab-bills" element={<ReportsLabBillsLayout />}>
              <Route index element={<LabBillReportsPage mode="all" />} />
              <Route path="doctor" element={<LabBillReportsPage mode="doctor" />} />
              <Route path="hospital" element={<LabBillReportsPage mode="hospital" />} />
              <Route path="test-count" element={<LabTestCountReportPage />} />
            </Route>
            <Route
              path="reports/lab-test-count"
              element={<Navigate to="/reports/lab-bills/test-count" replace />}
            />
            <Route path="coming-soon/:module" element={<ComingSoonPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

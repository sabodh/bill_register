import { Navigate } from 'react-router-dom';

/** Legacy route — doctors use workspace at /doctors/:id */
export function DoctorFormPage() {
  return <Navigate to="/doctors/new" replace />;
}

import { Navigate } from 'react-router-dom';

/** Doctors table list replaced by workspace; keep route alias. */
export function DoctorsListPage() {
  return <Navigate to="/doctors/new" replace />;
}

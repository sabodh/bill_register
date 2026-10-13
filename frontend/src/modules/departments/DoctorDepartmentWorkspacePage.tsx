import { DepartmentWorkspacePage } from './DepartmentWorkspacePage';

const config = {
  apiPath: '/doctor-departments/',
  queryKey: 'doctor-departments',
  pageTitle: 'Doctor departments',
  entityLabel: 'department',
  listTitle: 'Departments',
  basePath: '/doctor-departments',
  breadcrumbs: [{ title: 'Registration' }, { title: 'Doctor departments' }],
};

export function DoctorDepartmentWorkspacePage() {
  return <DepartmentWorkspacePage config={config} />;
}

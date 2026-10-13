import { DepartmentWorkspacePage } from './DepartmentWorkspacePage';

const config = {
  apiPath: '/staff-departments/',
  queryKey: 'staff-departments',
  pageTitle: 'Staff departments',
  entityLabel: 'department',
  listTitle: 'Departments',
  basePath: '/staff-departments',
  breadcrumbs: [{ title: 'Registration' }, { title: 'Staff departments' }],
};

export function StaffDepartmentWorkspacePage() {
  return <DepartmentWorkspacePage config={config} />;
}

import { DepartmentWorkspacePage } from '../departments/DepartmentWorkspacePage';

const config = {
  apiPath: '/lab/test-departments/',
  queryKey: 'lab-test-departments',
  pageTitle: 'Test departments',
  entityLabel: 'department',
  listTitle: 'Departments',
  basePath: '/lab/test-departments',
  breadcrumbs: [{ title: 'Lab' }, { title: 'Test departments' }],
};

export function LabTestDepartmentWorkspacePage() {
  return <DepartmentWorkspacePage config={config} />;
}

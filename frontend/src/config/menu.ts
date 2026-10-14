import type { ReactNode } from 'react';

export type MenuItemConfig = {
  key: string;
  label: string;
  path?: string;
  permission?: string;
  comingSoon?: boolean;
  children?: MenuItemConfig[];
};

export const menuConfig: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/',
    permission: 'dashboard.view_dashboard',
  },
  {
    key: 'registration',
    label: 'Registration',
    children: [
      {
        key: 'registration-desk',
        label: 'Registration desk',
        path: '/registration',
        permission: 'core.add_patient',
      },
      {
        key: 'patients',
        label: 'Patients',
        path: '/patients',
        permission: 'core.view_patient',
      },
      {
        key: 'doctor-departments',
        label: 'Doctor departments',
        path: '/doctor-departments',
        permission: 'core.view_doctor',
      },
      {
        key: 'doctors',
        label: 'Doctors',
        path: '/doctors',
        permission: 'core.view_doctor',
      },
      {
        key: 'staff-departments',
        label: 'Staff departments',
        path: '/staff-departments',
        permission: 'core.view_staff',
      },
      {
        key: 'staff',
        label: 'Staff',
        path: '/staff',
        permission: 'core.view_staff',
      },
    ],
  },
  {
    key: 'lab',
    label: 'Lab',
    children: [
      {
        key: 'lab-billing',
        label: 'Billing',
        path: '/billing',
        permission: 'billing.view_bill',
      },
      {
        key: 'lab-results',
        label: 'Result',
        path: '/lab/results',
        permission: 'lab.view_test',
      },
      {
        key: 'lab-tests',
        label: 'Test',
        path: '/lab/tests',
        permission: 'lab.view_test',
      },
      {
        key: 'lab-packages',
        label: 'Package',
        path: '/lab/packages',
        permission: 'lab.view_test',
      },
      {
        key: 'lab-all-tests',
        label: 'All tests',
        path: '/lab/all-tests',
        permission: 'lab.view_test',
      },
      {
        key: 'lab-test-departments',
        label: 'Test department',
        path: '/lab/test-departments',
        permission: 'lab.view_test',
      },
    ],
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    path: '/coming-soon/pharmacy',
    permission: 'pharmacy.view_prescription',
    comingSoon: true,
  },
  {
    key: 'facesheet',
    label: 'Face sheet',
    path: '/coming-soon/facesheet',
    permission: 'clinical.view_facesheet',
    comingSoon: true,
  },
  {
    key: 'reports',
    label: 'Reports',
    permission: 'reports.view_report',
    children: [
      {
        key: 'reports-lab-bills',
        label: 'Lab bill reports',
        children: [
          {
            key: 'reports-lab-bills-all',
            label: 'All bills',
            path: '/reports/lab-bills',
            permission: 'reports.view_report',
          },
          {
            key: 'reports-lab-bills-doctor',
            label: 'Doctor wise',
            path: '/reports/lab-bills/doctor',
            permission: 'reports.view_report',
          },
          {
            key: 'reports-lab-bills-hospital',
            label: 'Hospital wise',
            path: '/reports/lab-bills/hospital',
            permission: 'reports.view_report',
          },
        ],
      },
    ],
  },
  {
    key: 'users',
    label: 'User management',
    path: '/users',
    permission: 'core.view_user',
  },
];

export function filterMenuByPermissions(
  items: MenuItemConfig[],
  permissions: Set<string>,
): MenuItemConfig[] {
  return items
    .map((item) => {
      if (item.children) {
        const children = filterMenuByPermissions(item.children, permissions);
        if (children.length === 0) {
          return null;
        }
        return { ...item, children };
      }
      if (item.permission && !permissions.has(item.permission)) {
        return null;
      }
      return item;
    })
    .filter(Boolean) as MenuItemConfig[];
}

export type BreadcrumbItem = { title: ReactNode; path?: string };

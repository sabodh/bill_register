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
        key: 'patients',
        label: 'Patients',
        path: '/patients',
        permission: 'core.view_patient',
      },
      {
        key: 'doctors',
        label: 'Doctors',
        path: '/doctors',
        permission: 'core.view_doctor',
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
    key: 'billing',
    label: 'Billing',
    path: '/billing',
    permission: 'billing.view_bill',
  },
  {
    key: 'lab',
    label: 'Lab',
    path: '/coming-soon/lab',
    permission: 'lab.view_test',
    comingSoon: true,
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
    path: '/coming-soon/reports',
    permission: 'reports.view_report',
    comingSoon: true,
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

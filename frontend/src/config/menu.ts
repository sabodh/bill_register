import type { ReactNode } from 'react';

export type MenuItemConfig = {
  key: string;
  label: string;
  path?: string;
  permission?: string;
  comingSoon?: boolean;
  children?: MenuItemConfig[];
};

export type MenuSectionConfig = {
  key: string;
  /** Shown as small caps heading (e.g. Registration, Lab). */
  title: string;
  /** When set, the whole section is hidden unless the user has this permission. */
  sectionPermission?: string;
  items: MenuItemConfig[];
};

export const menuSections: MenuSectionConfig[] = [
  {
    key: 'overview',
    title: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/',
        permission: 'dashboard.view_dashboard',
      },
    ],
  },
  {
    key: 'registration',
    title: 'Registration',
    items: [
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
    key: 'laboratory',
    title: 'Laboratory',
    items: [
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
    key: 'modules',
    title: 'More modules',
    items: [
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
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    sectionPermission: 'reports.view_report',
    items: [
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
          {
            key: 'reports-lab-bills-test-count',
            label: 'Test count',
            path: '/reports/lab-bills/test-count',
            permission: 'reports.view_report',
          },
        ],
      },
    ],
  },
  {
    key: 'administration',
    title: 'Administration',
    items: [
      {
        key: 'users',
        label: 'User management',
        path: '/users',
        permission: 'core.view_user',
      },
    ],
  },
];

/** Flat list for path resolution and legacy use. */
export const menuConfig: MenuItemConfig[] = menuSections.flatMap((section) => section.items);

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

export function filterMenuSections(
  sections: MenuSectionConfig[],
  permissions: Set<string>,
): MenuSectionConfig[] {
  return sections
    .map((section) => {
      if (section.sectionPermission && !permissions.has(section.sectionPermission)) {
        return null;
      }
      const items = filterMenuByPermissions(section.items, permissions);
      if (items.length === 0) {
        return null;
      }
      return { ...section, items };
    })
    .filter(Boolean) as MenuSectionConfig[];
}

export function resolveMenuPath(items: MenuItemConfig[], key: string): string | undefined {
  for (const item of items) {
    if (item.key === key) {
      return item.path;
    }
    if (item.children) {
      const nested = resolveMenuPath(item.children, key);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

export function menuItemTreeContainsKey(items: MenuItemConfig[], key: string): boolean {
  for (const item of items) {
    if (item.key === key) {
      return true;
    }
    if (item.children && menuItemTreeContainsKey(item.children, key)) {
      return true;
    }
  }
  return false;
}

export function flattenMenuLinks(items: MenuItemConfig[]): MenuItemConfig[] {
  const out: MenuItemConfig[] = [];
  const walk = (list: MenuItemConfig[]) => {
    for (const item of list) {
      if (item.path) {
        out.push(item);
      }
      if (item.children) {
        walk(item.children);
      }
    }
  };
  walk(items);
  return out;
}

export function flattenSectionLinks(sections: MenuSectionConfig[]): MenuItemConfig[] {
  return sections.flatMap((section) => flattenMenuLinks(section.items));
}

export function findSelectedMenuKey(
  items: MenuItemConfig[],
  pathname: string,
): string | undefined {
  let best: { key: string; pathLen: number } | undefined;
  const visit = (list: MenuItemConfig[]) => {
    for (const item of list) {
      if (item.path) {
        const exact = pathname === item.path;
        const nested = pathname.startsWith(`${item.path}/`);
        if (exact || nested) {
          const pathLen = item.path.length;
          if (!best || pathLen > best.pathLen) {
            best = { key: item.key, pathLen };
          }
        }
      }
      if (item.children) {
        visit(item.children);
      }
    }
  };
  visit(items);
  return best?.key;
}

export type BreadcrumbItem = { title: ReactNode; path?: string };

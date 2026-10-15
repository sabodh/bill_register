import type { ReactNode } from 'react';
import {
  BarChartOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FormOutlined,
  InboxOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

const ICON_BY_KEY: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  'registration-desk': <FormOutlined />,
  patients: <UserOutlined />,
  'doctor-departments': <MedicineBoxOutlined />,
  doctors: <MedicineBoxOutlined />,
  'staff-departments': <TeamOutlined />,
  staff: <TeamOutlined />,
  'lab-billing': <DollarOutlined />,
  'lab-results': <ExperimentOutlined />,
  'lab-tests': <ExperimentOutlined />,
  'lab-packages': <InboxOutlined />,
  'lab-all-tests': <ExperimentOutlined />,
  'lab-test-departments': <MedicineBoxOutlined />,
  pharmacy: <MedicineBoxOutlined />,
  facesheet: <FileTextOutlined />,
  'reports-lab-bills-all': <BarChartOutlined />,
  'reports-lab-bills-doctor': <BarChartOutlined />,
  'reports-lab-bills-hospital': <BarChartOutlined />,
  'reports-lab-bills-test-count': <BarChartOutlined />,
  users: <TeamOutlined />,
};

function initialsFromLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function menuItemGlyph(key: string, label: string): ReactNode {
  const icon = ICON_BY_KEY[key];
  if (icon) {
    return <span className="app-shell-nav-glyph-icon">{icon}</span>;
  }
  return <span className="app-shell-nav-glyph-letters">{initialsFromLabel(label)}</span>;
}

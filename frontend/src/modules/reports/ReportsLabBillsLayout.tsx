import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';

const TAB_ITEMS = [
  { key: '/reports/lab-bills', label: 'All bills' },
  { key: '/reports/lab-bills/doctor', label: 'Doctor wise' },
  { key: '/reports/lab-bills/hospital', label: 'Hospital wise' },
  { key: '/reports/lab-bills/test-count', label: 'Test count' },
];

export function ReportsLabBillsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/reports/lab-bills' || location.pathname === '/reports/lab-bills/') {
    // default child route handled by index redirect
  }

  const activeKey =
    TAB_ITEMS.find((tab) => location.pathname === tab.key)?.key ?? '/reports/lab-bills';

  return (
    <div className="reports-lab-bills-layout">
      <Tabs
        activeKey={activeKey}
        onChange={(key) => navigate(key)}
        items={TAB_ITEMS.map((tab) => ({ key: tab.key, label: tab.label }))}
        style={{ marginBottom: 0 }}
      />
      <Outlet />
    </div>
  );
}

export function ReportsIndexRedirect() {
  return <Navigate to="/reports/lab-bills" replace />;
}

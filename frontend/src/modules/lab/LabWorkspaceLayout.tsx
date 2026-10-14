import { Outlet } from 'react-router-dom';

import { LabWorkspaceProvider } from './labWorkspaceContext';

export function LabWorkspaceLayout() {
  return (
    <LabWorkspaceProvider>
      <Outlet />
    </LabWorkspaceProvider>
  );
}

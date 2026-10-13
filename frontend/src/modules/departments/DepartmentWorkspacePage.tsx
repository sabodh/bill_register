import { PlusOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import { DepartmentFormPanel } from './DepartmentFormPanel';
import { DepartmentListPanel } from './DepartmentListPanel';

export type DepartmentWorkspaceConfig = {
  apiPath: string;
  queryKey: string;
  pageTitle: string;
  entityLabel: string;
  listTitle: string;
  basePath: string;
  breadcrumbs: { title: string }[];
};

type DepartmentWorkspacePageProps = {
  config: DepartmentWorkspaceConfig;
};

export function DepartmentWorkspacePage({ config }: DepartmentWorkspacePageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewRoute = id === 'new' || !id;
  const departmentId = isNewRoute ? undefined : Number(id);
  const [newFormKey, setNewFormKey] = useState(0);

  return (
    <>
      <PageHeader
        title={config.pageTitle}
        subtitle={`Add or edit on the left; pick from the list on the right.`}
        breadcrumbs={config.breadcrumbs}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setNewFormKey((k) => k + 1);
              navigate(`${config.basePath}/new`);
            }}
          >
            New {config.entityLabel}
          </Button>
        }
      />
      <Card styles={{ body: { paddingTop: 16 } }}>
        <div className="registration-desk-layout">
          <div className="registration-tab-panels">
            <DepartmentFormPanel
              key={departmentId ?? `new-${newFormKey}`}
              apiPath={config.apiPath}
              queryKey={config.queryKey}
              departmentId={departmentId}
              entityLabel={config.entityLabel}
              autoFocusName={isNewRoute}
              onCancel={() => {
                setNewFormKey((k) => k + 1);
                navigate(`${config.basePath}/new`);
              }}
              onSuccess={(_record, action) => {
                if (action === 'created') {
                  setNewFormKey((k) => k + 1);
                  navigate(`${config.basePath}/new`);
                  return;
                }
              }}
            />
          </div>
          <DepartmentListPanel
            apiPath={config.apiPath}
            queryKey={config.queryKey}
            title={config.listTitle}
            selectedId={departmentId}
            onSelect={(selectedId) => navigate(`${config.basePath}/${selectedId}`)}
          />
        </div>
      </Card>
    </>
  );
}

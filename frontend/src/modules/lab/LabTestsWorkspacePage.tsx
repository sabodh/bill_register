import { PlusOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import { LabTestFormPanel, LabTestListPanel } from './LabTestFormPanel';

export function LabTestsWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewRoute = id === 'new' || !id;
  const testId = isNewRoute ? undefined : Number(id);
  const [newFormKey, setNewFormKey] = useState(0);

  return (
    <>
      <PageHeader
        title="Lab tests"
        subtitle="Create, edit, or remove tests (soft delete via save inactive later)."
        breadcrumbs={[{ title: 'Lab' }, { title: 'Tests' }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setNewFormKey((k) => k + 1);
              navigate('/lab/tests/new');
            }}
          >
            New test
          </Button>
        }
      />
      <Card styles={{ body: { paddingTop: 16 } }}>
        <div className="registration-desk-layout">
          <div className="registration-tab-panels">
            <LabTestFormPanel
              key={testId ?? `new-${newFormKey}`}
              testId={testId}
              autoFocusName={isNewRoute}
              onCancel={() => {
                setNewFormKey((k) => k + 1);
                navigate('/lab/tests/new');
              }}
              onSuccess={(_test, action) => {
                if (action === 'created') {
                  setNewFormKey((k) => k + 1);
                  navigate('/lab/tests/new');
                  return;
                }
              }}
            />
          </div>
          <LabTestListPanel
            selectedTestId={testId}
            onSelectTest={(selectedId) => navigate(`/lab/tests/${selectedId}`)}
          />
        </div>
      </Card>
    </>
  );
}

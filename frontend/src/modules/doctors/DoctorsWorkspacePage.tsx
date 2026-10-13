import { PlusOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import { DoctorFormPanel } from './DoctorFormPanel';
import { DoctorListPanel } from './DoctorListPanel';

export function DoctorsWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewRoute = id === 'new' || !id;
  const doctorId = isNewRoute ? undefined : Number(id);

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle="Add or edit on the left; pick a doctor from the list on the right."
        breadcrumbs={[{ title: 'Registration' }, { title: 'Doctors' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/doctors/new')}>
            New doctor
          </Button>
        }
      />
      <Card className="doctor-workspace-card" styles={{ body: { paddingTop: 16 } }}>
        <div className="registration-desk-layout">
          <div className="registration-tab-panels">
            <DoctorFormPanel
              key={doctorId ?? 'new'}
              doctorId={doctorId}
              autoFocusName={isNewRoute}
              onCancel={() => navigate(isNewRoute ? '/doctors' : '/doctors/new')}
              onSuccess={(doctor) => navigate(`/doctors/${doctor.id}`)}
            />
          </div>
          <DoctorListPanel
            selectedDoctorId={doctorId}
            onSelectDoctor={(selectedId) => navigate(`/doctors/${selectedId}`)}
          />
        </div>
      </Card>
    </>
  );
}

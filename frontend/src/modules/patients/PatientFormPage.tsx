import { Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import { PatientRegistrationPanel } from './PatientRegistrationPanel';

/** Single-patient edit screen (from patient list). New registrations use /registration tabs. */
export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patientId = id ? Number(id) : undefined;

  return (
    <>
      <PageHeader
        title="Edit patient"
        breadcrumbs={[{ title: 'Registration' }, { title: 'Patients' }, { title: 'Edit' }]}
      />
      <Card>
        <PatientRegistrationPanel
          patientId={patientId}
          autoFocusName
          showCancel
          onCancel={() => navigate('/patients')}
          onSuccess={() => navigate('/patients')}
        />
      </Card>
    </>
  );
}

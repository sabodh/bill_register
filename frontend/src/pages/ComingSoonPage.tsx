import { Card, Typography } from 'antd';
import { useParams } from 'react-router-dom';

import { PageHeader } from '../components/PageHeader';

export function ComingSoonPage() {
  const { module } = useParams();
  const title = module ? module.charAt(0).toUpperCase() + module.slice(1) : 'Module';

  return (
    <>
      <PageHeader title={title} subtitle="This module is not built yet" breadcrumbs={[{ title }]} />
      <Card>
        <Typography.Paragraph>
          You have permission to access {title}. Implementation will arrive in a future sprint.
        </Typography.Paragraph>
      </Card>
    </>
  );
}

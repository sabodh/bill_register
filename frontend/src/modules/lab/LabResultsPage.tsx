import { Card, Typography } from 'antd';

import { PageHeader } from '../../components/PageHeader';

export function LabResultsPage() {
  return (
    <>
      <PageHeader
        title="Lab results"
        subtitle="Result entry and reporting"
        breadcrumbs={[{ title: 'Lab' }, { title: 'Result' }]}
      />
      <Card>
        <Typography.Paragraph>
          Lab result workflow is not implemented yet. You can manage tests and billing from the other Lab menu items.
        </Typography.Paragraph>
      </Card>
    </>
  );
}

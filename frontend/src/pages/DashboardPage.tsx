import { Card, Col, Row } from 'antd';

import { PageHeader } from '../components/PageHeader';

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of hospital operations (modules coming soon)"
        breadcrumbs={[{ title: 'Dashboard' }]}
      />
      <Row gutter={[16, 16]}>
        {['Registrations today', 'Lab orders', 'Billing', 'OP visits'].map((title) => (
          <Col xs={24} sm={12} lg={6} key={title}>
            <Card title={title}>
              <p style={{ color: '#94a3b8', margin: 0 }}>Placeholder metrics</p>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}

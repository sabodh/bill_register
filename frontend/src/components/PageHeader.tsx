import { Breadcrumb, Typography } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  breadcrumbs: { title: ReactNode }[];
  extra?: ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumbs, extra }: Props) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '0.5rem' }} />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
          {subtitle && (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {subtitle}
            </Typography.Paragraph>
          )}
        </div>
        {extra}
      </div>
    </div>
  );
}

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useState } from 'react';

import type { LabPackageRecord } from '../../api/types/models';
import { formatMoney } from '../patients/patientRegistrationSchema';
import { LabCatalogCardActions } from './LabCatalogCardActions';
import { LabPackageCatalogView } from './LabPackageCatalogView';

export function LabPackageCatalogCard({ package: pkg }: { package: LabPackageRecord }) {
  const [expanded, setExpanded] = useState(false);
  const testCount = pkg.items.length;

  return (
    <div
      id={`lab-full-form-package-${pkg.id}`}
      className={`lab-test-full-form-card lab-package-catalog-card${
        expanded ? ' lab-package-catalog-card--expanded' : ' lab-package-catalog-card--collapsed'
      }`}
    >
      <div className="lab-package-catalog-card-header">
        <button
          type="button"
          className="lab-package-catalog-card-summary"
          onClick={() => setExpanded((open) => !open)}
        >
          <Typography.Text strong className="lab-package-catalog-card-name">{pkg.name}</Typography.Text>
          <Typography.Text type="secondary" className="lab-package-catalog-card-meta">
            {testCount} test{testCount === 1 ? '' : 's'} · {formatMoney(Number(pkg.package_amount))}
          </Typography.Text>
        </button>
        <div className="lab-package-catalog-card-actions">
          <LabCatalogCardActions kind="package" id={pkg.id} name={pkg.name} />
          <Button
            type="text"
            size="small"
            className="lab-package-catalog-card-toggle"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse package' : 'Expand package'}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="lab-package-catalog-card-body">
          <LabPackageCatalogView package={pkg} hideHeader />
        </div>
      ) : null}
    </div>
  );
}

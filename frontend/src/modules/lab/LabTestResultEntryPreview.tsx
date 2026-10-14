import { Input, Table, Typography } from 'antd';

import type { LabResultEntryLayout, LabTestType } from '../../api/types/models';
import { formatVariantDisplayText } from './labVariantDisplay';
import { resolveResultEntryLayout, type DraftRange } from './labResultEntryLayout';

export function LabTestResultEntryPreview({
  layout,
  testType,
  title,
  methodName,
  draftRanges,
}: {
  layout?: LabResultEntryLayout | null;
  testType: LabTestType;
  title: string;
  methodName: string;
  draftRanges: DraftRange[];
}) {
  const spec = resolveResultEntryLayout(layout, testType, title.trim() || 'Test name', methodName, draftRanges);

  if (spec.layout === 'billing_only') {
    return null;
  }

  const multiVariants = spec.layout === 'multi_reference' ? spec.variants : [];

  return (
    <div className="lab-result-entry-preview">
      <Typography.Text type="secondary" className="lab-result-entry-preview-label">
        Result entry preview (staff type only in the <strong>Result</strong> fields)
      </Typography.Text>

      {spec.layout === 'single' && (
        <div className="lab-result-preview-single">
          <Typography.Text strong>{spec.title}</Typography.Text>
          {spec.method_name ? (
            <Typography.Text type="secondary"> · {spec.method_name}</Typography.Text>
          ) : null}
          <div className="lab-result-preview-single-row">
            <Input placeholder="Result" disabled className="lab-result-preview-input" />
            <span>{spec.unit || 'unit'}</span>
            {spec.reference ? (
              <Typography.Text type="secondary">Ref: {spec.reference}</Typography.Text>
            ) : null}
          </div>
        </div>
      )}

      {spec.layout === 'panel' && (
        <>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {spec.panel_title || spec.title}
          </Typography.Text>
          <Table
            size="small"
            pagination={false}
            className="billing-tests-table"
            rowKey="result_key"
            dataSource={spec.layout === 'panel' ? spec.rows : []}
            columns={[
              { title: 'Subtest names', dataIndex: 'subtest_name' },
              {
                title: 'Result',
                render: () => <Input placeholder="—" disabled size="small" />,
              },
              { title: 'Biological reference range (min–max)', dataIndex: 'reference' },
              { title: 'Unit', dataIndex: 'unit', width: 72 },
            ]}
          />
        </>
      )}

      {spec.layout === 'multi_reference' && (
        <div className="lab-result-preview-multi-table">
          <div className="lab-result-preview-multi-grid lab-result-preview-multi-grid--header">
            <span>Test name</span>
            <span>Result</span>
            <span>Biological reference range</span>
          </div>
          <div className="lab-result-preview-multi-grid">
            <div className="lab-result-preview-col-name">{spec.title}</div>
            <div className="lab-result-preview-col-result">
              <Input placeholder="110" disabled size="small" className="lab-result-preview-input" />
              <span className="lab-result-preview-unit">{spec.unit}</span>
            </div>
            <div className="lab-result-preview-col-ref">
              {multiVariants.length === 0 ? (
                <span className="lab-result-preview-ref-line">—</span>
              ) : (
                multiVariants.map((v) => (
                  <div key={v.label} className="lab-result-preview-ref-line">
                    {v.display_text ??
                      formatVariantDisplayText(
                        v.label,
                        v.reference_low,
                        v.reference_high,
                        v.unit,
                      )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Input, Typography } from 'antd';

import type { LabTestRecord, LabTestReferenceRange } from '../../api/types/models';
import { formatMoney } from '../patients/patientRegistrationSchema';
import { formatVariantDisplayText } from './labVariantDisplay';
import { LabCatalogCardActions } from './LabCatalogCardActions';
import { resolveResultEntryLayout, type DraftRange } from './labResultEntryLayout';

export function rangesToDraft(ranges: LabTestReferenceRange[]): DraftRange[] {
  return ranges.map((row) => ({
    reference_text: row.reference_text ?? '',
    low_value: row.low_value != null && row.low_value !== '' ? Number(row.low_value) : null,
    high_value: row.high_value != null && row.high_value !== '' ? Number(row.high_value) : null,
    unit: row.unit ?? '',
  }));
}

function ResultValueField({ unit }: { unit?: string }) {
  return (
    <span className="lab-result-preview-col-result">
      <span className="lab-result-bracket">[</span>
      <Input placeholder="110" disabled size="small" className="lab-result-preview-input" />
      <span className="lab-result-bracket">]</span>
      {unit ? <span className="lab-result-preview-unit">{unit}</span> : null}
    </span>
  );
}

function FormGridHeader() {
  return (
    <div className="lab-result-preview-multi-grid lab-result-preview-multi-grid--header">
      <span>Test name</span>
      <span>Result</span>
      <span>Biological reference range</span>
    </div>
  );
}

function TestMetaFooter({ test }: { test: LabTestRecord }) {
  const method = test.method_name?.trim() ?? '';
  let codeMethodLine: string | null = null;
  if (test.code) {
    codeMethodLine = `Code: ${test.code}`;
    if (method) {
      codeMethodLine += ` - Method: ${method}`;
    }
  } else if (method) {
    codeMethodLine = `Method: ${method}`;
  }
  const dept = test.department_detail?.name?.trim() ?? '';
  const amount = formatMoney(Number(test.default_rate));

  return (
    <div className="lab-test-full-form-footer">
      {codeMethodLine ? (
        <Typography.Text type="secondary" className="doctor-list-card-meta">
          {codeMethodLine}
        </Typography.Text>
      ) : null}
      <div className="lab-test-list-card-dept-row">
        <Typography.Text type="secondary" className="doctor-list-card-meta">
          {dept || '—'}
        </Typography.Text>
        <Typography.Text type="secondary" className="doctor-list-card-meta lab-test-list-card-amount">
          {amount}
        </Typography.Text>
      </div>
    </div>
  );
}

export function LabTestFullFormDisplay({
  test,
  highlighted,
}: {
  test: LabTestRecord;
  highlighted?: boolean;
}) {
  const spec = resolveResultEntryLayout(
    test.result_entry_layout,
    test.test_category,
    test.name,
    test.method_name ?? '',
    rangesToDraft(test.reference_ranges ?? []),
  );

  const notes = (test.interpretations ?? []).map((n) => n.note?.trim()).filter(Boolean);

  return (
    <article
      id={`lab-full-form-test-${test.id}`}
      className={`lab-test-full-form-card${highlighted ? ' lab-test-full-form-card--highlight' : ''}`}
    >
      <LabCatalogCardActions kind="test" id={test.id} name={test.name} />
      {spec.layout === 'billing_only' ? (
        <Typography.Title level={5} style={{ marginTop: 0 }}>{spec.title}</Typography.Title>
      ) : (
        <div className="lab-result-preview-multi-table">
          <FormGridHeader />
          {spec.layout === 'multi_reference' && (
            <div className="lab-result-preview-multi-grid">
              <div className="lab-result-preview-col-name">{spec.title}</div>
              <ResultValueField unit={spec.unit} />
              <div className="lab-result-preview-col-ref">
                {spec.variants.length === 0 ? (
                  <span className="lab-result-preview-ref-line">—</span>
                ) : (
                  spec.variants.map((v) => (
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
          )}
          {spec.layout === 'single' && (
            <div className="lab-result-preview-multi-grid">
              <div className="lab-result-preview-col-name">{spec.title}</div>
              <ResultValueField unit={spec.unit} />
              <div className="lab-result-preview-col-ref">
                <span className="lab-result-preview-ref-line">
                  {spec.reference ?? '—'}
                </span>
              </div>
            </div>
          )}
          {spec.layout === 'panel' &&
            spec.rows.map((row) => (
              <div key={row.result_key} className="lab-result-preview-multi-grid lab-test-full-form-panel-row">
                <div className="lab-result-preview-col-name lab-result-preview-col-name--subtest">
                  {row.subtest_name}
                </div>
                <ResultValueField unit={row.unit} />
                <div className="lab-result-preview-col-ref">
                  <span className="lab-result-preview-ref-line">{row.reference ?? '—'}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      <TestMetaFooter test={test} />

      {notes.length > 0 && (
        <div className="lab-test-full-form-notes">
          {notes.map((note, index) => (
            <Typography.Paragraph key={index} style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}>
              {note}
            </Typography.Paragraph>
          ))}
        </div>
      )}
    </article>
  );
}

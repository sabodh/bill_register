import { Input, Typography } from 'antd';

import type { LabResultEntryLayout, LabTestCategory } from '../../api/types/models';
import {
  isResultOutsideReference,
  pickReferenceBandForPatient,
  type ReferenceBand,
} from './labResultReferenceCheck';
import { formatVariantDisplayText } from './labVariantDisplay';
import { resolveResultEntryLayout, type DraftRange } from './labResultEntryLayout';

type ResultGridRow = {
  key: string;
  name: string;
  resultKey: string;
  unit: string;
  refLines: string[];
  methodName?: string;
  departmentName?: string;
  isSubtest?: boolean;
  referenceBand?: ReferenceBand | null;
  referenceBands?: ReferenceBand[];
};

const RESULT_FIELD_SELECTOR =
  '.billing-tab-panel:not([hidden]) .lab-results-detail-panel .lab-result-preview-textarea textarea:not([disabled])';

function focusNextResultField(current: HTMLTextAreaElement) {
  const fields = Array.from(document.querySelectorAll<HTMLTextAreaElement>(RESULT_FIELD_SELECTOR));
  const index = fields.indexOf(current);
  if (index < 0 || index >= fields.length - 1) {
    return;
  }
  const next = fields[index + 1];
  next.focus();
  const len = next.value.length;
  next.setSelectionRange(len, len);
}

function LabResultEntryGrid({
  rows,
  editable,
  values,
  onValueChange,
}: {
  rows: ResultGridRow[];
  editable: boolean;
  values: Record<string, string>;
  onValueChange?: (resultKey: string, value: string) => void;
}) {
  const resultInput = (row: ResultGridRow, placeholder?: string) => {
    const value = values[row.resultKey] ?? '';
    const abnormal =
      editable &&
      isResultOutsideReference(value, row.referenceBand ?? null, row.referenceBands);
    if (!editable) {
      return (
        <Input
          placeholder={placeholder ?? 'Result'}
          disabled
          className="lab-result-preview-input"
          value={value}
          size="small"
        />
      );
    }
    return (
      <div className="lab-result-preview-result-field">
        <Input.TextArea
          placeholder={placeholder ?? 'Result'}
          className="lab-result-preview-input lab-result-preview-textarea"
          value={value}
          status={abnormal ? 'warning' : undefined}
          onChange={(e) => onValueChange?.(row.resultKey, e.target.value)}
          size="small"
          autoSize={{ minRows: 1, maxRows: 6 }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey) {
              return;
            }
            e.preventDefault();
            focusNextResultField(e.currentTarget);
          }}
        />
        {abnormal ? (
          <Typography.Text type="warning" className="lab-result-abnormal-hint">
            Outside biological reference range — not normal
          </Typography.Text>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="lab-result-preview-multi-grid lab-result-preview-multi-grid--header">
        <span>Test name</span>
        <span>Result</span>
        <span>Biological reference range</span>
      </div>
      {rows.map((row) => (
        <div key={row.key} className="lab-result-preview-multi-grid lab-result-preview-multi-grid--row">
          <div
            className={`lab-result-preview-col-name${
              row.isSubtest ? ' lab-result-preview-col-name--subtest' : ''
            }`}
          >
            <span className="lab-result-preview-test-name">{row.name}</span>
            {row.methodName ? (
              <Typography.Text type="secondary" className="lab-result-preview-method">
                {row.methodName}
              </Typography.Text>
            ) : null}
            {row.departmentName ? (
              <Typography.Text type="secondary" className="lab-result-preview-department">
                {row.departmentName}
              </Typography.Text>
            ) : null}
          </div>
          <div className="lab-result-preview-col-result">
            {resultInput(row)}
            {row.unit ? <span className="lab-result-preview-unit">{row.unit}</span> : null}
          </div>
          <div className="lab-result-preview-col-ref">
            {row.refLines.length === 0 ? (
              <span className="lab-result-preview-ref-line">—</span>
            ) : (
              row.refLines.map((line, index) => (
                <div key={`${row.key}-ref-${index}`} className="lab-result-preview-ref-line">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function rowsFromLayout(
  spec: LabResultEntryLayout,
  methodName: string,
  departmentName: string,
  showDepartmentOnRows: boolean,
  patientGender?: string | null,
): ResultGridRow[] {
  const dept = departmentName.trim() || undefined;
  const rowDept = showDepartmentOnRows ? dept : undefined;

  if (spec.layout === 'single') {
    return [
      {
        key: spec.result_key,
        name: spec.title,
        resultKey: spec.result_key,
        unit: spec.unit || '',
        methodName: spec.method_name || methodName || undefined,
        departmentName: rowDept,
        refLines: spec.reference ? [spec.reference] : [],
        referenceBand: {
          referenceLow: spec.reference_low,
          referenceHigh: spec.reference_high,
        },
      },
    ];
  }

  if (spec.layout === 'multi_reference') {
    const refLines =
      spec.variants.length === 0
        ? []
        : spec.variants.map(
            (v) =>
              v.display_text ??
              formatVariantDisplayText(v.label, v.reference_low, v.reference_high, v.unit),
          );
    return [
      {
        key: spec.result_key,
        name: spec.title,
        resultKey: spec.result_key,
        unit: spec.unit || '',
        methodName: spec.method_name || methodName || undefined,
        departmentName: rowDept,
        refLines,
        referenceBand: pickReferenceBandForPatient(spec.variants, patientGender),
        referenceBands: spec.variants.map((v) => ({
          referenceLow: v.reference_low,
          referenceHigh: v.reference_high,
        })),
      },
    ];
  }

  if (spec.layout === 'panel') {
    return spec.rows.map((row) => ({
      key: row.result_key,
      name: row.subtest_name,
      resultKey: row.result_key,
      unit: row.unit || '',
      refLines: row.reference ? [row.reference] : [],
      isSubtest: true,
      referenceBand: {
        referenceLow: row.reference_low,
        referenceHigh: row.reference_high,
      },
    }));
  }

  return [];
}

export function LabTestResultEntryPreview({
  layout,
  testCategory,
  title,
  methodName,
  draftRanges,
  departmentName = '',
  patientGender = null,
  editable = false,
  values = {},
  onValueChange,
}: {
  layout?: LabResultEntryLayout | null;
  testCategory: LabTestCategory;
  title: string;
  methodName: string;
  draftRanges: DraftRange[];
  departmentName?: string;
  patientGender?: string | null;
  editable?: boolean;
  values?: Record<string, string>;
  onValueChange?: (resultKey: string, value: string) => void;
}) {
  const spec = resolveResultEntryLayout(
    layout,
    testCategory,
    title.trim() || 'Test name',
    methodName,
    draftRanges,
  );

  if (spec.layout === 'billing_only') {
    return null;
  }

  const isPanel = spec.layout === 'panel';
  const rows = rowsFromLayout(spec, methodName, departmentName, !isPanel, patientGender);
  const panelTitle = isPanel ? spec.panel_title || spec.title : null;
  const panelDept = departmentName.trim();

  return (
    <div className="lab-result-entry-preview">
      {!editable ? (
        <Typography.Text type="secondary" className="lab-result-entry-preview-label">
          Result entry preview (staff type only in the <strong>Result</strong> fields)
        </Typography.Text>
      ) : null}
      {panelTitle ? (
        <div className="lab-result-preview-panel-heading">
          <Typography.Text strong className="lab-result-preview-panel-title">
            {panelTitle}
          </Typography.Text>
          {panelDept ? (
            <Typography.Text type="secondary" className="lab-result-preview-department">
              {panelDept}
            </Typography.Text>
          ) : null}
        </div>
      ) : null}
      <div
        className={`lab-result-preview-multi-table${
          isPanel ? ' lab-result-preview-multi-table--panel' : ''
        }`}
      >
        <LabResultEntryGrid
          rows={rows}
          editable={editable}
          values={values}
          onValueChange={onValueChange}
        />
      </div>
    </div>
  );
}

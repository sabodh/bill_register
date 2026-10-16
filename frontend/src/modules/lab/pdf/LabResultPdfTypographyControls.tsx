import { Button, Col, Collapse, InputNumber, Row, Select, Typography } from 'antd';

import type { LabResultPrintFormatTemplate } from './labResultPrintFormats';
import type { LabResultPdfRenderOptions } from './labResultPdfRender';
import {
  defaultTypographyPt,
  LAB_RESULT_PDF_TYPOGRAPHY_ROLE_LABELS,
  LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS,
  LAB_RESULT_PDF_TYPOGRAPHY_TUNABLE_ROLES,
  type LabResultPdfTypography,
  type LabResultPdfTypographyRole,
  type LabResultPdfTypographySize,
} from './labResultPdfTypography';

type LabResultPdfTypographyControlsProps = {
  template: LabResultPrintFormatTemplate;
  typographySize: LabResultPdfTypographySize;
  fontSizesPt?: Partial<LabResultPdfTypography>;
  onChange: (patch: Partial<LabResultPdfRenderOptions>) => void;
};

export function LabResultPdfTypographyControls({
  template,
  typographySize,
  fontSizesPt,
  onChange,
}: LabResultPdfTypographyControlsProps) {
  const hasOverrides = fontSizesPt != null && Object.keys(fontSizesPt).length > 0;

  const setRolePt = (role: LabResultPdfTypographyRole, value: number | null) => {
    const next = { ...(fontSizesPt ?? {}) };
    const scaledDefault = defaultTypographyPt(template, role, typographySize);
    if (value == null || value === scaledDefault) {
      delete next[role];
    } else {
      next[role] = value;
    }
    onChange({
      fontSizesPt: Object.keys(next).length > 0 ? next : undefined,
    });
  };

  const resetAllSizes = () => {
    onChange({ fontSizesPt: undefined });
  };

  return (
    <div className="bill-pdf-preview-typography">
      <div className="bill-pdf-preview-format-row bill-pdf-preview-format-row--compact">
        <Typography.Text type="secondary" className="bill-pdf-preview-controls-label">
          Text size
        </Typography.Text>
        <Select
          style={{ minWidth: 140 }}
          value={typographySize}
          onChange={(size: LabResultPdfTypographySize) => onChange({ typographySize: size })}
          options={LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Scales patient block, departments, tests, methods, and footers together.
        </Typography.Text>
      </div>
      <Collapse
        size="small"
        ghost
        items={[
          {
            key: 'sizes',
            label: 'Fine-tune font sizes (pt)',
            children: (
              <>
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                  Set point sizes per section. Values apply on top of{' '}
                  <Typography.Text strong>Text size</Typography.Text> above. Leave blank to use the
                  scaled default for each row.
                </Typography.Paragraph>
                <Row gutter={[12, 8]}>
                  {LAB_RESULT_PDF_TYPOGRAPHY_TUNABLE_ROLES.map((role) => {
                    const scaledDefault = defaultTypographyPt(template, role, typographySize);
                    const value = fontSizesPt?.[role] ?? scaledDefault;
                    const isOverride = fontSizesPt?.[role] != null;
                    return (
                      <Col xs={24} sm={12} key={role}>
                        <div className="bill-pdf-preview-typography-field">
                          <Typography.Text className="bill-pdf-preview-typography-field-label">
                            {LAB_RESULT_PDF_TYPOGRAPHY_ROLE_LABELS[role]}
                          </Typography.Text>
                          <InputNumber
                            size="small"
                            min={6}
                            max={16}
                            step={0.5}
                            value={value}
                            onChange={(next) => setRolePt(role, next)}
                          />
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {isOverride ? `default ${scaledDefault}` : 'default'}
                          </Typography.Text>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
                {hasOverrides ? (
                  <Button type="link" size="small" onClick={resetAllSizes} style={{ paddingLeft: 0 }}>
                    Reset section sizes to defaults
                  </Button>
                ) : null}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

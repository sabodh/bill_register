import { Checkbox, Col, Row, Typography } from 'antd';

import type { LabResultPdfRenderOptions } from './labResultPdfRender';

type LabResultPdfOptionsBarProps = {
  options: LabResultPdfRenderOptions;
  onChange: (patch: Partial<LabResultPdfRenderOptions>) => void;
};

export function LabResultPdfOptionsBar({ options, onChange }: LabResultPdfOptionsBarProps) {
  return (
    <div className="bill-pdf-preview-controls bill-pdf-preview-controls--grid">
      <Typography.Text type="secondary" className="bill-pdf-preview-controls-label">
        Layout
      </Typography.Text>
      <Row gutter={[12, 8]} className="bill-pdf-preview-options-grid">
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeLetterhead}
            onChange={(e) => onChange({ includeLetterhead: e.target.checked })}
          >
            Include header
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeDepartmentHeadings}
            onChange={(e) => onChange({ includeDepartmentHeadings: e.target.checked })}
          >
            Department headings
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeAuthorizedSignature}
            onChange={(e) => onChange({ includeAuthorizedSignature: e.target.checked })}
          >
            Authorized signature line
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeHospitalName}
            onChange={(e) => onChange({ includeHospitalName: e.target.checked })}
          >
            Include Hospital name
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeMethodLines}
            onChange={(e) => onChange({ includeMethodLines: e.target.checked })}
          >
            Test method lines
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includePathologistDesignation}
            onChange={(e) => onChange({ includePathologistDesignation: e.target.checked })}
          >
            Pathologist designation line
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeSampleCollectionTime}
            onChange={(e) => onChange({ includeSampleCollectionTime: e.target.checked })}
          >
            Sample collection date &amp; time
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.omitTestsWithoutResults}
            onChange={(e) => onChange({ omitTestsWithoutResults: e.target.checked })}
          >
            Omit tests with no result
          </Checkbox>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Checkbox
            checked={options.includeInterpretation}
            onChange={(e) => onChange({ includeInterpretation: e.target.checked })}
          >
            Interpretation
          </Checkbox>
        </Col>
      </Row>
    </div>
  );
}

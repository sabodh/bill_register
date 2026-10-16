import { Select, Typography } from 'antd';

import {
  getLabResultPrintFormat,
  LAB_RESULT_PRINT_FORMATS,
  type LabResultPrintFormatId,
} from './labResultPrintFormats';

type LabResultPrintFormatSelectProps = {
  value: LabResultPrintFormatId;
  onChange: (formatId: LabResultPrintFormatId) => void;
};

export function LabResultPrintFormatSelect({ value, onChange }: LabResultPrintFormatSelectProps) {
  const selected = getLabResultPrintFormat(value);

  return (
    <div className="bill-pdf-preview-format-row">
      <Typography.Text type="secondary" className="bill-pdf-preview-controls-label">
        Print format
      </Typography.Text>
      <Select
        style={{ minWidth: 220 }}
        value={value}
        onChange={onChange}
        options={LAB_RESULT_PRINT_FORMATS.map((format) => ({
          value: format.id,
          label: format.label,
        }))}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {selected.description}
      </Typography.Text>
    </div>
  );
}

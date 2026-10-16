import { Select, Typography } from 'antd';

import {
  LAB_RESULT_PDF_FONT_PRESETS,
  labResultPdfFontPresetLabel,
  type LabResultPdfFontPreset,
} from './labResultPdfFonts';

type LabResultPdfFontSelectProps = {
  value: LabResultPdfFontPreset;
  onChange: (preset: LabResultPdfFontPreset) => void;
};

export function LabResultPdfFontSelect({ value, onChange }: LabResultPdfFontSelectProps) {
  return (
    <div className="bill-pdf-preview-format-row">
      <Typography.Text type="secondary" className="bill-pdf-preview-controls-label">
        Font
      </Typography.Text>
      <Select
        style={{ minWidth: 200 }}
        value={value}
        onChange={onChange}
        options={LAB_RESULT_PDF_FONT_PRESETS.map((preset) => ({
          value: preset.id,
          label: preset.label,
        }))}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {labResultPdfFontPresetLabel(value)} — built-in PDF fonts; custom files can be added later.
      </Typography.Text>
    </div>
  );
}

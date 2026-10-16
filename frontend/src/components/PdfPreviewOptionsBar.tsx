import { Checkbox, Space, Typography } from 'antd';

type PdfPreviewOptionsBarProps = {
  showHeader: boolean;
  onShowHeaderChange: (checked: boolean) => void;
};

/** Bill PDF preview — result reports use {@link LabResultPdfOptionsBar}. */
export function PdfPreviewOptionsBar({ showHeader, onShowHeaderChange }: PdfPreviewOptionsBarProps) {
  return (
    <div className="bill-pdf-preview-controls">
      <Typography.Text type="secondary" className="bill-pdf-preview-controls-label">
        Layout
      </Typography.Text>
      <Space wrap size="large">
        <Checkbox checked={showHeader} onChange={(e) => onShowHeaderChange(e.target.checked)}>
          Hospital, patient &amp; bill details
        </Checkbox>
      </Space>
    </div>
  );
}

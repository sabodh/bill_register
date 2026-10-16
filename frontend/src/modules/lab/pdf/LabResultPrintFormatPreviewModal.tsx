import { Button, Modal } from 'antd';

import { LabResultPrintFormatPreview } from './LabResultPrintFormatPreview';
import type { LabResultPrintFormat } from './labResultPrintFormats';

type LabResultPrintFormatPreviewModalProps = {
  open: boolean;
  format: LabResultPrintFormat | null;
  onClose: () => void;
};

export function LabResultPrintFormatPreviewModal({
  open,
  format,
  onClose,
}: LabResultPrintFormatPreviewModalProps) {
  return (
    <Modal
      title={format ? `Sample preview — ${format.label}` : 'Sample preview'}
      open={open}
      onCancel={onClose}
      width={920}
      centered
      className="bill-pdf-preview-modal"
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {format ? <LabResultPrintFormatPreview format={format} /> : null}
    </Modal>
  );
}

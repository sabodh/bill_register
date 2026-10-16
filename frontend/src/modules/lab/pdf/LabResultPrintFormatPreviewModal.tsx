import { Button, Modal } from 'antd';
import { useEffect, useState } from 'react';

import { LabResultPdfOptionsBar } from './LabResultPdfOptionsBar';
import { LabResultPrintFormatPreview } from './LabResultPrintFormatPreview';
import type { LabResultPrintFormat } from './labResultPrintFormats';
import {
  labResultPdfRenderOptionsForFormat,
  persistLabResultPdfPreferencesFromRenderOptions,
} from './labResultPdfPreferences';
import {
  normalizeLabResultPdfRenderOptions,
  type LabResultPdfRenderOptions,
} from './labResultPdfRender';

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
  const [renderOptions, setRenderOptions] = useState<LabResultPdfRenderOptions>(() =>
    format ? labResultPdfRenderOptionsForFormat(format.id) : normalizeLabResultPdfRenderOptions(),
  );

  useEffect(() => {
    if (open && format) {
      setRenderOptions(labResultPdfRenderOptionsForFormat(format.id));
    }
  }, [open, format?.id]);

  const handleRenderOptionsChange = (patch: Partial<LabResultPdfRenderOptions>) => {
    setRenderOptions((prev) => {
      const next = normalizeLabResultPdfRenderOptions({ ...prev, ...patch });
      persistLabResultPdfPreferencesFromRenderOptions(next);
      return next;
    });
  };

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
      {format ? (
        <>
          <LabResultPdfOptionsBar
            template={format.template}
            options={renderOptions}
            onChange={handleRenderOptionsChange}
          />
          <LabResultPrintFormatPreview format={format} renderOptions={renderOptions} />
        </>
      ) : null}
    </Modal>
  );
}

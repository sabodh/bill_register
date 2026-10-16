import { Button, Modal } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PdfPreviewFrame } from '../../../components/PdfPreviewFrame';
import { usePdfPreviewRegeneration } from '../../../hooks/usePdfPreviewRegeneration';
import { PdfPreviewOptionsBar } from '../../../components/PdfPreviewOptionsBar';
import { billPdfPageSizeLabel, downloadBillPdf } from './downloadBillPdf';
import { createBillPdfBlobUrl } from './createBillPdfBlobUrl';
import { DEFAULT_BILL_PDF_RENDER_OPTIONS, type BillPdfRenderOptions } from './billPdfRender';
import type { BillPdfSnapshot } from './billPdfTypes';

type BillPdfPreviewModalProps = {
  open: boolean;
  snapshot: BillPdfSnapshot | null;
  onClose: () => void;
};

export function BillPdfPreviewModal({ open, snapshot, onClose }: BillPdfPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [renderOptions, setRenderOptions] = useState<BillPdfRenderOptions>(
    DEFAULT_BILL_PDF_RENDER_OPTIONS,
  );

  const snapshotKey = snapshot
    ? `${snapshot.bill_number}:${snapshot.total}:${snapshot.lines.length}`
    : '';

  useEffect(() => {
    if (open) {
      setRenderOptions(DEFAULT_BILL_PDF_RENDER_OPTIONS);
    }
  }, [open, snapshotKey]);

  const regenerateKey = useMemo(
    () => `${snapshotKey}:${renderOptions.includeLetterhead ? '1' : '0'}`,
    [snapshotKey, renderOptions.includeLetterhead],
  );

  const generate = useCallback(() => {
    if (!snapshot) {
      return Promise.reject(new Error('No snapshot'));
    }
    return createBillPdfBlobUrl(snapshot, renderOptions);
  }, [snapshot, renderOptions]);

  const { previewUrl, loading, error } = usePdfPreviewRegeneration(
    open && snapshot != null,
    regenerateKey,
    generate,
  );

  const pageSize = snapshot ? billPdfPageSizeLabel(snapshot) : '';

  const handleDownload = async () => {
    if (!snapshot) {
      return;
    }
    setDownloading(true);
    try {
      await downloadBillPdf(snapshot, renderOptions);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      title={snapshot ? `Bill preview — ${snapshot.bill_number} (${pageSize})` : 'Bill preview'}
      open={open}
      onCancel={onClose}
      width={920}
      centered
      className="bill-pdf-preview-modal"
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button
          key="download"
          loading={downloading}
          disabled={!snapshot || Boolean(error)}
          onClick={() => void handleDownload()}
        >
          Download PDF
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {snapshot ? (
        <PdfPreviewOptionsBar
          showHeader={renderOptions.includeLetterhead}
          onShowHeaderChange={(checked) =>
            setRenderOptions((prev) => ({ ...prev, includeLetterhead: checked }))
          }
        />
      ) : null}
      <PdfPreviewFrame
        previewUrl={previewUrl}
        loading={loading}
        error={error}
        title="Bill PDF preview"
      />
    </Modal>
  );
}

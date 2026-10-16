import { Button, Modal } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PdfPreviewFrame } from '../../../components/PdfPreviewFrame';
import { usePdfPreviewRegeneration } from '../../../hooks/usePdfPreviewRegeneration';
import { createLabResultPdfBlobUrl } from './createLabResultPdfBlobUrl';
import { downloadLabResultPdf, printLabResultPdf } from './downloadLabResultPdf';
import { LabResultPdfOptionsBar } from './LabResultPdfOptionsBar';
import {
  DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
  labResultPdfOptionsKey,
  labResultPdfSnapshotForRender,
  type LabResultPdfRenderOptions,
} from './labResultPdfRender';
import type { LabResultPdfSnapshot } from './labResultPdfTypes';

type LabResultPdfPreviewModalProps = {
  open: boolean;
  snapshot: LabResultPdfSnapshot | null;
  onClose: () => void;
};

export function LabResultPdfPreviewModal({
  open,
  snapshot,
  onClose,
}: LabResultPdfPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [renderOptions, setRenderOptions] = useState<LabResultPdfRenderOptions>(
    DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
  );

  const snapshotKey = snapshot
    ? `${snapshot.bill_number}:${snapshot.sections.length}:${snapshot.reported_at}`
    : '';

  useEffect(() => {
    if (open) {
      setRenderOptions(DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS);
    }
  }, [open, snapshotKey]);

  const regenerateKey = useMemo(
    () => `${snapshotKey}:${labResultPdfOptionsKey(renderOptions)}`,
    [snapshotKey, renderOptions],
  );

  const generate = useCallback(() => {
    if (!snapshot) {
      return Promise.reject(new Error('No snapshot'));
    }
    return createLabResultPdfBlobUrl(snapshot, renderOptions);
  }, [snapshot, renderOptions]);

  const { previewUrl, loading, error } = usePdfPreviewRegeneration(
    open && snapshot != null,
    regenerateKey,
    generate,
  );

  const noTestsAfterFilter =
    snapshot != null &&
    labResultPdfSnapshotForRender(snapshot, renderOptions).sections.every(
      (section) => section.tests.length === 0,
    );

  const handleDownload = async () => {
    if (!snapshot) {
      return;
    }
    setDownloading(true);
    try {
      await downloadLabResultPdf(snapshot, renderOptions);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!previewUrl) {
      return;
    }
    printLabResultPdf(previewUrl);
  };

  return (
    <Modal
      title={snapshot ? `Result report — ${snapshot.bill_number} (A4)` : 'Result report'}
      open={open}
      onCancel={onClose}
      width={920}
      centered
      className="bill-pdf-preview-modal"
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button key="print" disabled={!previewUrl || Boolean(error) || noTestsAfterFilter} onClick={handlePrint}>
          Print
        </Button>,
        <Button
          key="download"
          loading={downloading}
          disabled={!snapshot || Boolean(error) || noTestsAfterFilter}
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
        <LabResultPdfOptionsBar
          options={renderOptions}
          onChange={(patch) => setRenderOptions((prev) => ({ ...prev, ...patch }))}
        />
      ) : null}
      <PdfPreviewFrame
        previewUrl={noTestsAfterFilter ? null : previewUrl}
        loading={loading}
        error={error}
        emptyMessage={
          noTestsAfterFilter
            ? 'No tests with results to show. Turn off “Omit tests with no result” or enter results first.'
            : null
        }
        title="Lab result PDF preview"
      />
    </Modal>
  );
}

import { Button, Modal } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PdfPreviewFrame } from '../../../components/PdfPreviewFrame';
import { usePdfPreviewRegeneration } from '../../../hooks/usePdfPreviewRegeneration';
import { createLabResultPdfBlobUrl } from './createLabResultPdfBlobUrl';
import { downloadLabResultPdf, printLabResultPdf } from './downloadLabResultPdf';
import { LabResultPdfOptionsBar } from './LabResultPdfOptionsBar';
import { LabResultPrintFormatSelect } from './LabResultPrintFormatSelect';
import {
  getLabResultPrintFormat,
  getStoredLabResultPrintFormatId,
  setStoredLabResultPrintFormatId,
  type LabResultPrintFormatId,
} from './labResultPrintFormats';
import {
  labResultPdfRenderOptionsForFormat,
  persistLabResultPdfPreferencesFromRenderOptions,
} from './labResultPdfPreferences';
import {
  labResultPdfOptionsKey,
  labResultPdfSnapshotForRender,
  normalizeLabResultPdfRenderOptions,
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
  const [formatId, setFormatId] = useState<LabResultPrintFormatId>(
    getStoredLabResultPrintFormatId(),
  );
  const [renderOptions, setRenderOptions] = useState<LabResultPdfRenderOptions>(() =>
    labResultPdfRenderOptionsForFormat(getStoredLabResultPrintFormatId()),
  );

  const snapshotKey = snapshot
    ? `${snapshot.bill_number}:${snapshot.sections.length}:${snapshot.reported_at}`
    : '';

  useEffect(() => {
    if (open) {
      const storedId = getStoredLabResultPrintFormatId();
      setFormatId(storedId);
      setRenderOptions(labResultPdfRenderOptionsForFormat(storedId));
    }
  }, [open, snapshotKey]);

  const handleFormatChange = (nextFormatId: LabResultPrintFormatId) => {
    setFormatId(nextFormatId);
    setRenderOptions(labResultPdfRenderOptionsForFormat(nextFormatId));
    setStoredLabResultPrintFormatId(nextFormatId);
  };

  const handleRenderOptionsChange = (patch: Partial<LabResultPdfRenderOptions>) => {
    setRenderOptions((prev) => {
      const next = normalizeLabResultPdfRenderOptions({ ...prev, ...patch });
      persistLabResultPdfPreferencesFromRenderOptions(next);
      return next;
    });
  };

  const regenerateKey = useMemo(
    () => `${snapshotKey}:${formatId}:${labResultPdfOptionsKey(renderOptions)}`,
    [snapshotKey, formatId, renderOptions],
  );

  const generate = useCallback(() => {
    if (!snapshot) {
      return Promise.reject(new Error('No snapshot'));
    }
    const format = getLabResultPrintFormat(formatId);
    return createLabResultPdfBlobUrl(snapshot, renderOptions, format.template);
  }, [snapshot, renderOptions, formatId]);

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
      const format = getLabResultPrintFormat(formatId);
      await downloadLabResultPdf(snapshot, renderOptions, format.template);
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
        <>
          <LabResultPrintFormatSelect value={formatId} onChange={handleFormatChange} />
          <LabResultPdfOptionsBar
            template={getLabResultPrintFormat(formatId).template}
            options={renderOptions}
            onChange={handleRenderOptionsChange}
          />
        </>
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

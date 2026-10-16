import { Alert, Button, Modal, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { createLabResultPdfBlobUrl } from './createLabResultPdfBlobUrl';
import { downloadLabResultPdf, printLabResultPdf } from './downloadLabResultPdf';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const urlRef = useRef<string | null>(null);

  const snapshotKey = snapshot
    ? `${snapshot.bill_number}:${snapshot.sections.length}:${snapshot.reported_at}`
    : '';

  useEffect(() => {
    if (!open || !snapshot) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setPreviewUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    void createLabResultPdfBlobUrl(snapshot)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        urlRef.current = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not generate report PDF.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, snapshotKey, snapshot]);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  const handleDownload = async () => {
    if (!snapshot) {
      return;
    }
    setDownloading(true);
    try {
      await downloadLabResultPdf(snapshot);
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
        <Button key="print" disabled={!previewUrl || Boolean(error)} onClick={handlePrint}>
          Print
        </Button>,
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
      <div className="bill-pdf-preview-body">
        {loading ? (
          <div className="bill-pdf-preview-loading">
            <Spin tip="Generating PDF…" />
          </div>
        ) : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}
        {!loading && !error && previewUrl ? (
          <iframe className="bill-pdf-preview-frame" src={previewUrl} title="Lab result PDF preview" />
        ) : null}
      </div>
    </Modal>
  );
}

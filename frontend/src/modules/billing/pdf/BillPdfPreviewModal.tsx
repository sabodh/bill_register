import { Alert, Button, Modal, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { billPdfPageSizeLabel, downloadBillPdf } from './downloadBillPdf';
import { createBillPdfBlobUrl } from './createBillPdfBlobUrl';
import type { BillPdfSnapshot } from './billPdfTypes';

type BillPdfPreviewModalProps = {
  open: boolean;
  snapshot: BillPdfSnapshot | null;
  onClose: () => void;
};

export function BillPdfPreviewModal({ open, snapshot, onClose }: BillPdfPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const urlRef = useRef<string | null>(null);

  const snapshotKey = snapshot
    ? `${snapshot.bill_number}:${snapshot.total}:${snapshot.lines.length}`
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

    void createBillPdfBlobUrl(snapshot)
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
          setError('Could not generate PDF preview.');
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

  const pageSize = snapshot ? billPdfPageSizeLabel(snapshot) : '';

  const handleDownload = async () => {
    if (!snapshot) {
      return;
    }
    setDownloading(true);
    try {
      await downloadBillPdf(snapshot);
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
      <div className="bill-pdf-preview-body">
        {loading ? (
          <div className="bill-pdf-preview-loading">
            <Spin tip="Generating PDF…" />
          </div>
        ) : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}
        {!loading && !error && previewUrl ? (
          <iframe className="bill-pdf-preview-frame" src={previewUrl} title="Bill PDF preview" />
        ) : null}
      </div>
    </Modal>
  );
}

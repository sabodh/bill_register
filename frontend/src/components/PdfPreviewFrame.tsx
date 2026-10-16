import { Alert, Spin } from 'antd';

type PdfPreviewFrameProps = {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  emptyMessage?: string | null;
  title: string;
};

export function PdfPreviewFrame({
  previewUrl,
  loading,
  error,
  emptyMessage,
  title,
}: PdfPreviewFrameProps) {
  return (
    <div className="bill-pdf-preview-body">
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {emptyMessage ? <Alert type="info" showIcon message={emptyMessage} /> : null}
      <div className="bill-pdf-preview-frame-wrap">
        {previewUrl && !emptyMessage ? (
          <iframe
            className={`bill-pdf-preview-frame${loading ? ' bill-pdf-preview-frame--loading' : ''}`}
            src={previewUrl}
            title={title}
          />
        ) : null}
        {loading ? (
          <div className="bill-pdf-preview-loading-overlay" aria-busy="true">
            <Spin tip="Updating preview…" />
          </div>
        ) : null}
        {!previewUrl && !loading && !error && !emptyMessage ? (
          <div className="bill-pdf-preview-loading">
            <Spin tip="Generating PDF…" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

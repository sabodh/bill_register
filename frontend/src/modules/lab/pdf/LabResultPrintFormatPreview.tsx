import { useEffect, useState } from 'react';

import { PdfPreviewFrame } from '../../../components/PdfPreviewFrame';
import { createLabResultPdfBlobUrl } from './createLabResultPdfBlobUrl';
import { LAB_RESULT_PRINT_FORMAT_SAMPLE_SNAPSHOT } from './labResultPrintFormatSampleSnapshot';
import type { LabResultPrintFormat } from './labResultPrintFormats';
import { labResultPdfOptionsKey } from './labResultPdfRender';

type LabResultPrintFormatPreviewProps = {
  format: LabResultPrintFormat;
};

export function LabResultPrintFormatPreview({ format }: LabResultPrintFormatPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const optionsKey = labResultPdfOptionsKey(format.renderOptions);

  useEffect(() => {
    let activeUrl: string | null = null;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    createLabResultPdfBlobUrl(
      LAB_RESULT_PRINT_FORMAT_SAMPLE_SNAPSHOT,
      format.renderOptions,
      format.template,
    )
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        activeUrl = url;
        setPreviewUrl(url);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not generate preview');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [format.id, optionsKey]);

  return (
    <PdfPreviewFrame
      previewUrl={previewUrl}
      loading={loading}
      error={error}
      title={`${format.label} sample preview`}
    />
  );
}

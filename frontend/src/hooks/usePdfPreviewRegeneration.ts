import { useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from './useDebouncedValue';

/**
 * Regenerates a PDF blob URL when inputs change, with debounce and without clearing
 * the iframe until the next PDF is ready (reduces flicker).
 */
export function usePdfPreviewRegeneration(
  enabled: boolean,
  regenerateKey: string,
  generate: () => Promise<string>,
  debounceMs = 320,
): { previewUrl: string | null; loading: boolean; error: string | null } {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const debouncedKey = useDebouncedValue(regenerateKey, debounceMs);
  const generateRef = useRef(generate);
  generateRef.current = generate;

  useEffect(() => {
    if (!enabled) {
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

    void generateRef.current()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
        }
        urlRef.current = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not generate PDF.');
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
  }, [enabled, debouncedKey]);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  return { previewUrl, loading, error };
}

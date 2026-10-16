function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'));
    reader.readAsDataURL(blob);
  });
}

/** react-pdf supports raster images in data URLs; SVG and bare URLs often fail. */
export async function resolveLetterheadImageForPdf(url: string | null | undefined): Promise<string | null> {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('data:image/png') || trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg')) {
    return trimmed;
  }
  if (trimmed.toLowerCase().endsWith('.svg') || trimmed.includes('.svg?')) {
    return null;
  }
  try {
    const response = await fetch(trimmed);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const type = (blob.type || '').toLowerCase();
    if (type.includes('svg')) {
      return null;
    }
    if (!type.startsWith('image/')) {
      return null;
    }
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

export function rasterDataUrlSize(
  dataUrl: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

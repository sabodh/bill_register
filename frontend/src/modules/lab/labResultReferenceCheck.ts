export type ReferenceBand = {
  referenceLow?: string | null;
  referenceHigh?: string | null;
};

/** Parse the first numeric value from a result field (ignores surrounding text). */
export function parseResultNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(/,/g, '');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const n = Number.parseFloat(match[0]);
  return Number.isFinite(n) ? n : null;
}

function parseBound(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') {
    return null;
  }
  const n = Number.parseFloat(String(raw).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function isValueWithinBand(
  value: number,
  band: ReferenceBand,
): boolean | null {
  const low = parseBound(band.referenceLow);
  const high = parseBound(band.referenceHigh);
  if (low == null && high == null) {
    return null;
  }
  if (low != null && value < low) {
    return false;
  }
  if (high != null && value > high) {
    return false;
  }
  return true;
}

export function pickReferenceBandForPatient(
  variants: { label: string; reference_low?: string | null; reference_high?: string | null }[],
  patientGender?: string | null,
): ReferenceBand | null {
  const withBounds = variants.filter(
    (v) => (v.reference_low != null && v.reference_low !== '') || (v.reference_high != null && v.reference_high !== ''),
  );
  if (withBounds.length === 0) {
    return null;
  }

  const gender = (patientGender ?? '').toUpperCase();
  if (gender) {
    const match = withBounds.find((v) => {
      const label = v.label.toLowerCase();
      if (gender === 'M') {
        return label.includes('male') && !label.includes('female');
      }
      if (gender === 'F') {
        return label.includes('female');
      }
      return false;
    });
    if (match) {
      return { referenceLow: match.reference_low, referenceHigh: match.reference_high };
    }
  }

  if (withBounds.length === 1) {
    const only = withBounds[0];
    return { referenceLow: only.reference_low, referenceHigh: only.reference_high };
  }

  return null;
}

export function isResultOutsideReference(
  rawValue: string,
  band: ReferenceBand | null,
  fallbackBands?: ReferenceBand[],
): boolean {
  const value = parseResultNumber(rawValue);
  if (value === null) {
    return false;
  }

  if (band) {
    const within = isValueWithinBand(value, band);
    return within === false;
  }

  if (fallbackBands && fallbackBands.length > 0) {
    const checks = fallbackBands
      .map((b) => isValueWithinBand(value, b))
      .filter((r): r is boolean => r !== null);
    if (checks.length === 0) {
      return false;
    }
    return !checks.some(Boolean);
  }

  return false;
}

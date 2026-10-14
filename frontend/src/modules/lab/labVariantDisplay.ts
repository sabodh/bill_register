export function formatVariantDisplayText(
  label: string,
  low?: string | null,
  high?: string | null,
  unit?: string,
): string {
  const unitS = (unit || '').trim();
  let valuePart = '';
  if (low && high && low === high) {
    valuePart = `${low} ${unitS}`.trim();
  } else if (low && high) {
    valuePart = `${low} – ${high} ${unitS}`.trim();
  } else if (low || high) {
    valuePart = `${low || high} ${unitS}`.trim();
  } else {
    valuePart = unitS;
  }
  if (label) {
    return `${label} - ${valuePart}`.trim();
  }
  return valuePart;
}

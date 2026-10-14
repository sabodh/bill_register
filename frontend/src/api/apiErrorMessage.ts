import type { AxiosError } from 'axios';

export function apiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<Record<string, unknown>>;
  const data = axiosError.response?.data;
  if (data && typeof data === 'object') {
    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
    const parts: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.map(String).join(' ')}`);
      } else if (typeof val === 'string') {
        parts.push(key === 'non_field_errors' ? val : `${key}: ${val}`);
      }
    }
    if (parts.length > 0) {
      return parts.join(' · ');
    }
  }
  return fallback;
}

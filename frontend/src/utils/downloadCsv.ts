function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Download tabular data as a UTF-8 CSV file (Excel-friendly BOM). */
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
  ];
  const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

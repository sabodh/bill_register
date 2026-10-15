import type { Dayjs } from 'dayjs';

import { downloadCsv } from '../../utils/downloadCsv';

type TestCountRow = Record<string, unknown>;

function dateSlug(from: Dayjs, to: Dayjs): string {
  return `${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
}

export function downloadLabTestCountCsv(
  rows: TestCountRow[],
  dateFrom: Dayjs,
  dateTo: Dayjs,
): void {
  const headers = ['Test', 'Code', 'Department', 'Test type', 'Test count'];
  const dataRows = rows.map((row) => [
    String(row.test_name ?? ''),
    String(row.test_code ?? ''),
    String(row.department_name ?? ''),
    String(row.test_type_label ?? row.test_type ?? ''),
    String(row.test_count ?? ''),
  ]);
  downloadCsv(
    `lab-test-count-${dateSlug(dateFrom, dateTo)}.csv`,
    headers,
    dataRows,
  );
}

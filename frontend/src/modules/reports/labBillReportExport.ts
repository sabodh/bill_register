import type { Dayjs } from 'dayjs';

import { formatMoney } from '../patients/patientRegistrationSchema';
import { downloadCsv } from '../../utils/downloadCsv';
export type LabBillReportMode = 'all' | 'doctor' | 'hospital';

type ExportColumn = {
  header: string;
  value: (row: Record<string, unknown>) => string;
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function moneyCell(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? formatMoney(n) : String(v);
}

function exportColumns(mode: LabBillReportMode): ExportColumn[] {
  if (mode === 'doctor') {
    return [
      { header: 'Doctor', value: (r) => String(r.doctor_name ?? '') },
      { header: 'Bills', value: (r) => String(r.bill_count ?? '') },
      { header: 'Total', value: (r) => moneyCell(r.total_amount) },
      { header: 'Advance', value: (r) => moneyCell(r.advance_paid) },
      { header: 'Balance', value: (r) => moneyCell(r.balance_due) },
    ];
  }
  if (mode === 'hospital') {
    return [
      { header: 'Hospital', value: (r) => String(r.hospital_name ?? '') },
      { header: 'Bills', value: (r) => String(r.bill_count ?? '') },
      { header: 'Total', value: (r) => moneyCell(r.total_amount) },
      { header: 'Advance', value: (r) => moneyCell(r.advance_paid) },
      { header: 'Balance', value: (r) => moneyCell(r.balance_due) },
    ];
  }
  return [
    { header: 'Bill no.', value: (r) => String(r.bill_number ?? '') },
    { header: 'Patient', value: (r) => String(r.patient_name ?? '') },
    { header: 'UHID', value: (r) => String(r.patient_uhid ?? '') },
    { header: 'Doctor', value: (r) => String(r.doctor_name ?? '') },
    { header: 'Hospital', value: (r) => String(r.hospital_name ?? '') },
    {
      header: 'Sample collected',
      value: (r) => {
        const v = r.sample_collected_at;
        if (!v || typeof v !== 'string') return '';
        return DATE_FMT.format(new Date(v));
      },
    },
    { header: 'Total', value: (r) => moneyCell(r.total_amount) },
    { header: 'Advance', value: (r) => moneyCell(r.advance_paid) },
    { header: 'Balance', value: (r) => moneyCell(r.balance_due) },
  ];
}

function slugForFilename(mode: LabBillReportMode): string {
  if (mode === 'doctor') return 'doctor-wise';
  if (mode === 'hospital') return 'hospital-wise';
  return 'all-bills';
}

function dateSlug(from: Dayjs, to: Dayjs): string {
  return `${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
}

export function downloadLabBillReportCsv(
  mode: LabBillReportMode,
  rows: Record<string, unknown>[],
  dateFrom: Dayjs,
  dateTo: Dayjs,
): void {
  const cols = exportColumns(mode);
  const headers = cols.map((c) => c.header);
  const dataRows = rows.map((row) => cols.map((c) => c.value(row)));
  const filename = `lab-bills-${slugForFilename(mode)}-${dateSlug(dateFrom, dateTo)}.csv`;
  downloadCsv(filename, headers, dataRows);
}

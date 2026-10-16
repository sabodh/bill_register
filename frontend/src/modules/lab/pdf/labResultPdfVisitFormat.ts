export function formatPatientNameWithAgeGender(
  name: string,
  ageYears: number | null,
  gender: 'M' | 'F' | 'O',
): string {
  const agePart = ageYears != null ? `${ageYears} Y` : '— Y';
  return `${name} (${agePart}/ ${gender})`;
}

export function formatDoctorForReport(doctorName: string): string {
  const trimmed = doctorName.trim();
  if (!trimmed || trimmed === '—') {
    return 'Self';
  }
  if (/^dr\.?\s/i.test(trimmed)) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
}

export function isHospitalNamePresent(hospitalName: string): boolean {
  const trimmed = hospitalName.trim();
  return trimmed.length > 0 && trimmed !== '—';
}

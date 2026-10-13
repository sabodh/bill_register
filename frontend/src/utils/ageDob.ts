/** Compute age in full years from ISO date string (YYYY-MM-DD). */
export function ageFromDob(dob: string): number | null {
  if (!dob) {
    return null;
  }
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** Estimate DOB from age (uses today's month/day, clamped for leap years). */
export function dobFromAge(age: number): string {
  const today = new Date();
  const targetYear = today.getFullYear() - age;
  const d = new Date(targetYear, today.getMonth(), today.getDate());
  if (d.getMonth() !== today.getMonth()) {
    d.setDate(0);
  }
  return d.toISOString().slice(0, 10);
}

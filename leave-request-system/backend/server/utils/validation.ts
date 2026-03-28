export function validateBalance(
  requested: number,
  remaining: number,
): string | null {
  if (requested > remaining) {
    return `Insufficient leave balance. Remaining: ${remaining} day(s), Requested: ${requested} day(s)`;
  }
  return null;
}

export function hasOverlap(
  newStart: Date,
  newEnd: Date,
  existing: { start_date: string; end_date: string; status: string }[],
): boolean {
  return existing
    .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
    .some((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      return newStart <= e && newEnd >= s;
    });
}

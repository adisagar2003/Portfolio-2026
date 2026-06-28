// Pure helpers for the GitHub contribution grid, extracted so the fiddly
// date-offset and total-extraction logic is testable and timezone-safe.

export interface ContribDay {
  date: string;
  count?: number;
  level?: number;
}

/**
 * Number of empty leading cells before the first day, so the grid's columns
 * line up by weekday. Uses UTC so the alignment is deterministic regardless of
 * the viewer's timezone (the API dates are UTC calendar days).
 */
export function leadingBlanks(firstDateISO: string): number {
  const d = new Date(firstDateISO);
  const day = d.getUTCDay();
  return Number.isNaN(day) ? 0 : day;
}

/**
 * Resolve the "last year" contribution total from the API's `total` object,
 * preferring `lastYear`, then any first value, then summing the days.
 */
export function contributionTotal(
  total: Record<string, number> | undefined,
  days: ContribDay[],
): number {
  if (total) {
    if (total.lastYear != null) return total.lastYear;
    const first = Object.values(total)[0];
    if (first != null) return first;
  }
  return days.reduce((a, b) => a + (b.count || 0), 0);
}

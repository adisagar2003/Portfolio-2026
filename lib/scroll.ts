/**
 * Fraction (0..1) of a scrollable region that has been scrolled past.
 * Guards the no-scroll case (content shorter than viewport) and clamps.
 */
export function scrollProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const max = scrollHeight - clientHeight;
  if (max <= 0) return 0;
  const p = scrollTop / max;
  return Math.min(1, Math.max(0, p));
}

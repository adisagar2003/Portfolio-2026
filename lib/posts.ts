// Pure helpers for ordering and displaying posts by their publish date.
// Kept dependency-free and UTC-based so behaviour is deterministic everywhere
// (server, client, and tests).

export interface DatedPost {
  /** real publish timestamp (ISO) — the reliable sort key */
  createdAt?: string;
  /** optional human display date authored in the editor */
  date?: string;
}

/** Best-effort publish timestamp: createdAt first, then the display date, else 0. */
export function postTimestamp(p: DatedPost): number {
  const fromCreated = p.createdAt ? Date.parse(p.createdAt) : NaN;
  if (!Number.isNaN(fromCreated)) return fromCreated;
  const fromDate = p.date ? Date.parse(p.date) : NaN;
  if (!Number.isNaN(fromDate)) return fromDate;
  return 0;
}

/** Newest-first, without mutating the input. */
export function sortPostsByDateDesc<T extends DatedPost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => postTimestamp(b) - postTimestamp(a));
}

const FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Consistent "Mon D, YYYY"; empty string when unparseable. */
export function formatPostDate(value: string): string {
  if (!value) return "";
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "";
  return FMT.format(new Date(ts));
}

import { slugify, uniqueSlug } from "./post-utils";

export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

/**
 * Extract h2/h3 headings from markdown for a table of contents, skipping
 * fenced code blocks. ids match what the Markdown renderer assigns (slugify),
 * so the TOC links line up with the rendered sections.
 */
/**
 * Given heading positions (sorted by `top` ascending) and the current scroll
 * offset, return the id of the section currently in view. Pure + tested.
 */
export function activeHeadingId(
  positions: { id: string; top: number }[],
  scrollY: number,
  offset = 100,
): string | null {
  if (positions.length === 0) return null;
  let active = positions[0].id;
  for (const p of positions) {
    if (p.top - offset <= scrollY) active = p.id;
    else break;
  }
  return active;
}

export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  const seen: string[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const text = m[2].trim();
      const id = uniqueSlug(slugify(text), seen);
      seen.push(id);
      out.push({ level: m[1].length as 2 | 3, text, id });
    }
  }
  return out;
}

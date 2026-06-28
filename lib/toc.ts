import { slugify } from "./post-utils";

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
export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
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
      out.push({ level: m[1].length as 2 | 3, text, id: slugify(text) });
    }
  }
  return out;
}

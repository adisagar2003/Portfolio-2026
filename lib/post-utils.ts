// Small pure helpers for the blog editor. No deps so they run on client & server.

/** "My Post Title!" -> "my-post-title" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Word count of markdown body (strips syntax noise roughly). */
export function wordCount(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> label
    .replace(/[#>*_~`-]/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Reading time in minutes, min 1, at ~200 wpm. */
export function readTime(md: string): number {
  return Math.max(1, Math.ceil(wordCount(md) / 200));
}

/** Flatten React-ish children (string | array | {props.children}) to plain text. */
export function flattenText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return flattenText(props?.children);
  }
  return "";
}

/** True for absolute http(s) links — those should open in a new, safe tab. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/** "Jun 27, 2026" — the display date format used across the site. */
export function displayDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Jun 27, 2026 · 4 min read" — the article meta line. */
export function buildMeta(date: string, md: string): string {
  return `${date} · ${readTime(md)} min read`;
}

/** First ~155 chars of plain text, for an auto excerpt. */
export function autoExcerpt(md: string, max = 155): string {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

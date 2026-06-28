// Lightweight markdown quality checks surfaced in the editor before publishing.

/** Return human-readable warnings about a post body (empty array = all good). */
export function lintPostBody(md: string): string[] {
  const warnings: string[] = [];

  // Images with empty alt text: ![](url) — bad for accessibility + SEO.
  const noAlt = (md.match(/!\[\s*\]\([^)]*\)/g) || []).length;
  if (noAlt > 0) {
    warnings.push(
      `${noAlt} image${noAlt > 1 ? "s are" : " is"} missing alt text.`,
    );
  }

  // Links left with the toolbar's placeholder URL: [text](https://)
  const placeholder = (md.match(/\]\(https:\/\/\)/g) || []).length;
  if (placeholder > 0) {
    warnings.push(
      `${placeholder} link${placeholder > 1 ? "s" : ""} still ha${placeholder > 1 ? "ve" : "s"} a placeholder URL.`,
    );
  }

  // Empty link text: [](url)
  const emptyLink = (md.match(/(^|[^!])\[\s*\]\([^)]*\)/g) || []).length;
  if (emptyLink > 0) {
    warnings.push(
      `${emptyLink} link${emptyLink > 1 ? "s have" : " has"} no text.`,
    );
  }

  return warnings;
}

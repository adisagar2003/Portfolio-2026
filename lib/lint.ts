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

  // Images with a relative path won't resolve on the article page.
  let relative = 0;
  const imgRe = /!\[[^\]]*\]\(\s*([^)\s]+)/g;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(md)) !== null) {
    const src = im[1];
    if (!/^(https?:\/\/|\/|data:)/.test(src)) relative++;
  }
  if (relative > 0) {
    warnings.push(
      `${relative} image${relative > 1 ? "s use" : " uses"} a relative path that may not resolve.`,
    );
  }

  // A top-level H1 in the body: the post title is already the page's H1.
  let inFence = false;
  let hasH1 = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^#\s+\S/.test(line)) hasH1 = true;
  }
  if (hasH1) {
    warnings.push("Body has an H1 (#) — the title is the page heading; use ## instead.");
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

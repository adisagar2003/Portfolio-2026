import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  isExternalHref,
  flattenText,
  slugify,
  uniqueSlug,
} from "@/lib/post-utils";

/**
 * Single markdown renderer shared by the public article page and the /admin
 * editor preview, so what the writer previews is exactly what ships.
 *
 * Customizations:
 * - body images load lazily and decode async (keeps long posts light)
 * - external links open in a new tab with rel="noopener noreferrer"
 * - headings get slug ids so sections are deep-linkable
 */
export default function Markdown({ body }: { body: string }) {
  // fresh per render so repeated heading text gets unique ids (setup, setup-2),
  // matching the order-based dedupe in extractHeadings() used by the TOC.
  const used: string[] = [];
  const headingId = (children: unknown) => {
    const id = uniqueSlug(slugify(flattenText(children)), used);
    used.push(id);
    return id;
  };

  const components: Components = {
    h2: (p) => <h2 id={headingId(p.children)}>{p.children}</h2>,
    h3: (p) => <h3 id={headingId(p.children)}>{p.children}</h3>,
    img(props) {
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
      return <img {...props} loading="lazy" decoding="async" />;
    },
    a(props) {
      const href = String(props.href ?? "");
      if (isExternalHref(href)) {
        return <a {...props} target="_blank" rel="noopener noreferrer" />;
      }
      return <a {...props} />;
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </ReactMarkdown>
  );
}

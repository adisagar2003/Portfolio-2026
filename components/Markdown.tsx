import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { isExternalHref, flattenText, slugify } from "@/lib/post-utils";

/**
 * Single markdown renderer shared by the public article page and the /admin
 * editor preview, so what the writer previews is exactly what ships.
 *
 * Customizations:
 * - body images load lazily and decode async (keeps long posts light)
 * - external links open in a new tab with rel="noopener noreferrer"
 * - headings get slug ids so sections are deep-linkable
 */
const components: Components = {
  h2: (p) => <h2 id={slugify(flattenText(p.children))}>{p.children}</h2>,
  h3: (p) => <h3 id={slugify(flattenText(p.children))}>{p.children}</h3>,
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

export default function Markdown({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </ReactMarkdown>
  );
}

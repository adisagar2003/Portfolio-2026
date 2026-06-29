import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "@/components/CodeBlock";
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
    h2: (p) => {
      const id = headingId(p.children);
      return (
        <h2 id={id}>
          {p.children}
          <a href={`#${id}`} className="heading-link" aria-label="Link to this section">
            #
          </a>
        </h2>
      );
    },
    h3: (p) => {
      const id = headingId(p.children);
      return (
        <h3 id={id}>
          {p.children}
          <a href={`#${id}`} className="heading-link" aria-label="Link to this section">
            #
          </a>
        </h3>
      );
    },
    img(props) {
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
      return <img {...props} loading="lazy" decoding="async" />;
    },
    table(props) {
      // wrap so wide tables scroll instead of breaking the layout on mobile
      return (
        <div className="table-wrap">
          <table {...props} />
        </div>
      );
    },
    pre: (props) => <CodeBlock {...props} />,
    a(props) {
      const href = String(props.href ?? "");
      if (isExternalHref(href)) {
        return <a {...props} target="_blank" rel="noopener noreferrer" />;
      }
      return <a {...props} />;
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  );
}

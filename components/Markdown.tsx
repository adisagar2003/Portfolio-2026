import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Single markdown renderer shared by the public article page and the /admin
 * editor preview, so what the writer previews is exactly what ships.
 */
export default function Markdown({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
  );
}

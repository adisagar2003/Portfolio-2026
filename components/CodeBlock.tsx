"use client";

import { useRef, useState } from "react";

/** <pre> with a hover "Copy" button that copies the code block's text. */
export default function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="code-wrap">
      <button
        type="button"
        className="code-copy"
        onClick={copy}
        aria-label="Copy code"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={ref} {...props} />
    </div>
  );
}

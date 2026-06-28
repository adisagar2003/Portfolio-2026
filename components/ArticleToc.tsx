"use client";

import { useEffect, useState } from "react";
import { activeHeadingId, type Heading } from "@/lib/toc";

/** Table of contents with scroll-spy highlighting of the section in view. */
export default function ArticleToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const positions = headings
        .map((h) => {
          const el = document.getElementById(h.id);
          return el
            ? { id: h.id, top: el.getBoundingClientRect().top + window.scrollY }
            : null;
        })
        .filter((p): p is { id: string; top: number } => p !== null);
      setActive(activeHeadingId(positions, window.scrollY));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [headings]);

  return (
    <nav className="article-toc" aria-label="Table of contents">
      <div className="article-toc-label">On this page</div>
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "article-toc-sub" : undefined}>
            <a
              href={`#${h.id}`}
              className={active === h.id ? "article-toc-active" : undefined}
              aria-current={active === h.id ? "true" : undefined}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

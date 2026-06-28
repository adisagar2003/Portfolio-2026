"use client";

import { useEffect, useState } from "react";
import { scrollProgress } from "@/lib/scroll";

/** Thin copper bar at the very top showing how far through the article you are. */
export default function ReadingProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      setP(scrollProgress(el.scrollTop, el.scrollHeight, el.clientHeight));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <div
        className="reading-progress-bar"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}

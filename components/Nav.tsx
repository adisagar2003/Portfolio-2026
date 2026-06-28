"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

type Theme = "dark" | "light";

export default function Nav({ initials }: { initials: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // sync state with whatever the <html data-theme> attribute already is
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#top" className="nav-logo metal">
          {initials}
        </a>
        <div className="nav-links">
          <a href="#writing" className="nav-link">
            Writing
          </a>
          <a href="#work" className="nav-link">
            Work
          </a>
          <a href="#projects" className="nav-link">
            Projects
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle light and dark mode"
            className="theme-btn"
          >
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
}

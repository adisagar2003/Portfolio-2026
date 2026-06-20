"use client";

import { useEffect, useRef, useState } from "react";

interface Cell {
  bg: string;
  title: string;
}

const LEVEL_COLORS = [
  "rgba(255,255,255,0.05)",
  "#4a221c",
  "#8a3327",
  "#c2452f",
  "#ee6f4f",
];

function colorFor(level: number): string {
  return LEVEL_COLORS[level] ?? LEVEL_COLORS[0];
}

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Deterministic placeholder so the grid is full before/if the API call fails. */
function buildFallback(): { cells: Cell[]; total: number } {
  const cells: Cell[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 370);
  const offset = start.getDay();
  for (let i = 0; i < offset; i++) cells.push({ bg: "transparent", title: "" });

  let total = 0;
  for (let i = 0; i < 371; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wd = d.getDay();
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const r = s - Math.floor(s);
    const weekday = wd !== 0 && wd !== 6;
    let lvl: number;
    if (r < (weekday ? 0.12 : 0.4)) lvl = 0;
    else if (r < (weekday ? 0.4 : 0.66)) lvl = 1;
    else if (r < (weekday ? 0.7 : 0.86)) lvl = 2;
    else if (r < (weekday ? 0.9 : 0.97)) lvl = 3;
    else lvl = 4;
    const count = lvl === 0 ? 0 : Math.round(lvl * 2 + r * 6);
    total += count;
    cells.push({
      bg: colorFor(lvl),
      title: count
        ? `${count} contributions on ${fmt(d)}`
        : `No contributions on ${fmt(d)}`,
    });
  }
  return { cells, total };
}

export default function ContributionGrid({
  username,
}: {
  username: string;
}) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [total, setTotal] = useState<string>("…");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRight = useRef(true);

  // keep the grid pinned to its right edge (latest commits) until the user
  // scrolls it themselves
  function scrollRight() {
    const go = () => {
      const el = scrollRef.current;
      if (el && pinnedRight.current) el.scrollLeft = el.scrollWidth;
    };
    requestAnimationFrame(() => requestAnimationFrame(go));
    const t1 = setTimeout(go, 120);
    const t2 = setTimeout(go, 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }

  useEffect(() => {
    const el = scrollRef.current;
    const onScroll = () => {
      if (!el) return;
      if (el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
        pinnedRight.current = false;
    };
    el?.addEventListener("scroll", onScroll, { passive: true });

    let cancelled = false;

    // 1) show deterministic fallback immediately
    const fb = buildFallback();
    setCells(fb.cells);
    setTotal(fb.total.toLocaleString());

    // 2) replace with live data when it arrives
    (async () => {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
        );
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        const days: { date: string; count?: number; level?: number }[] =
          data.contributions || [];
        if (!days.length) throw new Error("empty");
        if (cancelled) return;

        const next: Cell[] = [];
        const first = new Date(days[0].date);
        const offset = first.getDay();
        for (let i = 0; i < offset; i++)
          next.push({ bg: "transparent", title: "" });
        for (const day of days) {
          const c = day.count || 0;
          next.push({
            bg: colorFor(day.level || 0),
            title: c
              ? `${c} contributions on ${fmt(new Date(day.date))}`
              : `No contributions on ${fmt(new Date(day.date))}`,
          });
        }
        let sum = 0;
        if (data.total)
          sum =
            data.total.lastYear != null
              ? data.total.lastYear
              : Object.values(data.total)[0];
        if (!sum) sum = days.reduce((a, b) => a + (b.count || 0), 0);

        setCells(next);
        setTotal(Number(sum).toLocaleString());
      } catch {
        /* keep fallback */
      }
    })();

    return () => {
      cancelled = true;
      el?.removeEventListener("scroll", onScroll);
    };
  }, [username]);

  // re-pin to latest whenever the cells change
  useEffect(() => {
    if (cells.length) return scrollRight();
  }, [cells]);

  return (
    <div className="contrib-card" data-reveal>
      <div className="contrib-head">
        <div>
          <div className="contrib-title">Commit activity</div>
          <div className="contrib-sub">
            github.com/{username} · most recent →
          </div>
        </div>
        <div className="contrib-total">
          <b>{total}</b> contributions · last year
        </div>
      </div>
      <div className="contrib-scroll" ref={scrollRef}>
        <div className="contrib-grid">
          {cells.map((cell, i) => (
            <div
              key={i}
              className="contrib-cell"
              title={cell.title}
              style={{ background: cell.bg }}
            />
          ))}
        </div>
      </div>
      <div className="contrib-legend">
        <span>Less</span>
        <span className="swatch" style={{ background: "rgba(255,255,255,0.05)" }} />
        <span className="swatch" style={{ background: "#4a221c" }} />
        <span className="swatch" style={{ background: "#8a3327" }} />
        <span className="swatch" style={{ background: "#c2452f" }} />
        <span className="swatch" style={{ background: "#ee6f4f" }} />
        <span>More</span>
      </div>
    </div>
  );
}

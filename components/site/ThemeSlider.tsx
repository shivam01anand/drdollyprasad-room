"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Roll, { type RollItem } from "./Roll";

export type Theme = { t: string; series: string; href: string; d: string; roll: RollItem[] };

/**
 * The threads of her work in one tile: words on one half, her paintings
 * rolling on the other, sliding on to the next thread by itself while on
 * screen. Tabs and arrows move it by hand; still for reduced motion.
 */
export default function ThemeSlider({ themes, every = 9000 }: { themes: Theme[]; every?: number }) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const n = themes.length;

  useEffect(() => {
    setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen || still || n < 2) return;
    const t = setTimeout(() => setI((k) => (k + 1) % n), every);
    return () => clearTimeout(t);
  }, [seen, still, i, n, every]);

  return (
    <div className="themes" ref={root} role="region" aria-roledescription="carousel" aria-label="The threads of her work">
      <div className="themes-tabs" role="tablist">
        {themes.map((t, k) => (
          <button key={t.t} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}>
            <span>{String(k + 1).padStart(2, "0")}</span>{t.t}
          </button>
        ))}
        <span className="themes-arrows">
          <button type="button" aria-label="Previous" onClick={() => setI((i - 1 + n) % n)}>‹</button>
          <button type="button" aria-label="Next" onClick={() => setI((i + 1) % n)}>›</button>
        </span>
      </div>
      <div className="themes-window">
        <div className="themes-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {themes.map((t, k) => (
            <div key={t.t} className="theme" aria-hidden={k !== i} inert={k !== i}>
              <div className="ab-txt">
                <p className="eyebrow">{t.series}</p>
                <h2>{t.t}</h2>
                <p className="ab-p">{t.d}</p>
                <Link className="btn" href={t.href}>The collection: {t.series}</Link>
              </div>
              <Roll label={`${t.t}: paintings from ${t.series}`} items={t.roll} />
            </div>
          ))}
        </div>
      </div>
      {!still && seen && <span className="themes-timer" key={i} aria-hidden="true" style={{ animationDuration: `${every}ms` }} />}
    </div>
  );
}

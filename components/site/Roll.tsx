"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type RollItem = { src: string; title: string; sub?: string; href?: string; framed?: boolean };

/**
 * A few paintings or photographs, one at a time, fading slowly from one to
 * the next, each with a short caption. Moves on its own while on screen; still
 * for anyone who has asked for reduced motion (the dots still work).
 */
export default function Roll({ items, label, every = 3800, shape = "square" }: { items: RollItem[]; label: string; every?: number; shape?: "square" | "wide" }) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen || still || items.length < 2) return;
    const t = setTimeout(() => setI((k) => (k + 1) % items.length), every);
    return () => clearTimeout(t);
  }, [seen, still, i, items.length, every]);

  const it = items[i];
  return (
    <div className="roll" ref={root} role="region" aria-roledescription="carousel" aria-label={label}>
      <div className={`roll-stage is-${shape}`}>
        {/* a blurred copy of the current painting behind it, so the stage reads as frosted glass in its colours */}
        {items.map((x, k) => (
          <span key={`bg-${x.src}`} className={`roll-bg${k === i ? " on" : ""}`} aria-hidden="true" style={{ backgroundImage: `url(${x.src})` }} />
        ))}
        {items.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.src} src={x.src} alt={k === i ? x.title : ""} aria-hidden={k !== i}
               className={`${x.framed === false ? "" : "framed"}${k === i ? " on" : ""}`} loading="lazy" decoding="async" />
        ))}
      </div>
      <div className="roll-cap" aria-live="polite">
        {it.href ? <Link href={it.href}><b>{it.title}</b></Link> : <b>{it.title}</b>}
        {it.sub && <span>{it.sub}</span>}
      </div>
      {items.length > 1 && (
        <div className="roll-dots">
          {items.map((x, k) => (
            <button key={x.src} type="button" aria-label={`Show ${x.title}`} aria-current={k === i || undefined} onClick={() => setI(k)} />
          ))}
        </div>
      )}
    </div>
  );
}

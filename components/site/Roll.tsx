"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { swipe } from "@/lib/drift";

export type RollItem = { src: string; title: string; sub?: string; href?: string; framed?: boolean };

/**
 * A few paintings or photographs, one at a time, fading slowly from one to
 * the next, each with a short caption. Moves on its own while on screen; still
 * for anyone who has asked for reduced motion (the dots still work). Swipe or
 * drag to move it by hand; click or tap the picture to open it.
 */
export default function Roll({ items, label, every = 3800, shape = "square" }: { items: RollItem[]; label: string; every?: number; shape?: "square" | "wide" }) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const [held, setHeld] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = stage.current, n = items.length;
    if (!el || n < 2) return;
    return swipe(el, (d) => { setI((k) => (((k + d) % n) + n) % n); setHeld((h) => h + 1); });
  }, [items.length]);

  useEffect(() => {
    if (!seen || still || items.length < 2) return;
    const t = setTimeout(() => { setHeld(0); setI((k) => (k + 1) % items.length); }, held ? every + 2500 : every);
    return () => clearTimeout(t);
  }, [seen, still, i, items.length, every, held]);

  const it = items[i];
  return (
    <div className="roll" ref={root} role="region" aria-roledescription="carousel" aria-label={label}>
      <div className={`roll-stage is-${shape}${it.href ? " is-link" : ""}`} ref={stage}
           onClick={it.href ? (e) => { if (!(e.target as Element).closest("a,button")) router.push(it.href!); } : undefined}>
        {/* a blurred copy of the current painting behind it, so the stage reads as frosted glass in its colours */}
        {items.map((x, k) => (
          <span key={`bg-${x.src}`} className={`roll-bg${k === i ? " on" : ""}`} aria-hidden="true" style={{ backgroundImage: `url(${x.src})` }} />
        ))}
        {items.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.src} src={x.src} alt={k === i ? x.title : ""} aria-hidden={k !== i} draggable={false}
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

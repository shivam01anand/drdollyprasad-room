"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Gallery from "./Gallery";
import { dims } from "@/lib/images";
import { swipe } from "@/lib/drift";
import type { Photo } from "@/lib/site";

const sm = (src: string) => src.replace("/site/ex/", "/site/ex/sm/");
const ROLL_MS = 3200; // each photograph stays this long when nobody is touching it
const HOLD_MS = 6000; // after a swipe or a tap the roll waits this long

/**
 * One exhibition's photographs: one large in its thin black frame that rolls on
 * by itself (a little faster than before, Shubham 20 Oct), swipes or drags by
 * hand, and a strip of every photograph under it that scrolls by hand with
 * normal momentum (a fast flick goes fast). The current photograph is kept in
 * view in the strip. Click the large one to open the show full screen. For
 * anyone who has asked for reduced motion nothing rolls by itself.
 */
export default function ShowMedia({ photos, label }: { photos: Photo[]; label: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const [held, setHeld] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const userAt = useRef(0); // when the visitor last touched or scrolled the strip
  const n = photos.length;
  const p = photos[i];

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  // swipe or drag the large photograph
  useEffect(() => {
    const el = hero.current;
    if (!el || n < 2) return;
    return swipe(el, (d) => { setI((k) => (((k + d) % n) + n) % n); setHeld((h) => h + 1); });
  }, [n]);

  // the visitor's own hand on the strip: the roll and the strip's auto-scroll wait
  useEffect(() => {
    const s = strip.current;
    if (!s) return;
    const mark = () => { userAt.current = performance.now(); setHeld((h) => h + 1); };
    s.addEventListener("pointerdown", mark);
    s.addEventListener("wheel", mark, { passive: true });
    s.addEventListener("touchstart", mark, { passive: true });
    s.addEventListener("keydown", mark);
    return () => {
      s.removeEventListener("pointerdown", mark); s.removeEventListener("wheel", mark);
      s.removeEventListener("touchstart", mark); s.removeEventListener("keydown", mark);
    };
  }, []);

  // it rolls on by itself while it is on screen
  const rolling = seen && !still && open === null && n > 1;
  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => { setHeld(0); go(i + 1); }, held ? HOLD_MS : ROLL_MS);
    return () => clearTimeout(t);
  }, [rolling, i, go, held]);

  // the next photograph is fetched ahead, so a change never shows an empty frame
  useEffect(() => {
    if (n < 2) return;
    const im = new Image();
    im.decoding = "async";
    im.src = photos[(i + 1) % n].src;
  }, [i, n, photos]);

  // keep the current photograph in view in the strip (sideways only; the page never jumps),
  // but only when it has gone out of view, and never while the visitor is using the strip
  useEffect(() => {
    const s = strip.current;
    const b = s?.children[i] as HTMLElement | undefined;
    if (!s || !b) return;
    if (performance.now() - userAt.current < HOLD_MS) return;
    const out = b.offsetLeft < s.scrollLeft || b.offsetLeft + b.offsetWidth > s.scrollLeft + s.clientWidth;
    if (!out) return;
    const left = b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2;
    s.scrollTo({ left: Math.max(0, left), behavior: still ? "auto" : "smooth" });
  }, [i, still]);

  return (
    <div className="sm-media" ref={root}>
      <button type="button" className="sm-hero" ref={hero} onClick={() => setOpen(i)} aria-label={`Open full screen: ${p.alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={p.src} src={p.src} alt={p.alt} loading="eager" decoding="async" draggable={false} {...dims(p.src)} />
      </button>
      <p className="sm-cap" aria-live="off">{p.alt}</p>
      {n > 1 && (
        <div className="sm-strip" ref={strip} role="group" aria-label={`${label}: photographs`}>
          {photos.map((x, k) => (
            <button key={x.src} type="button" aria-current={k === i || undefined}
                    onClick={() => { setI(k); setHeld((h) => h + 1); }}
                    aria-label={`Show photograph ${k + 1} of ${n}: ${x.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sm(x.src)} alt="" loading="lazy" decoding="async" draggable={false} {...dims(sm(x.src))} />
            </button>
          ))}
        </div>
      )}
      {open !== null && (
        <Gallery label={label} start={open} onClose={() => setOpen(null)} shots={photos.map((x) => ({ src: x.src, alt: x.alt, line: x.alt }))} />
      )}
    </div>
  );
}

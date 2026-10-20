"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Gallery from "./Gallery";
import { dims } from "@/lib/images";
import { swipe } from "@/lib/drift";
import type { Photo } from "@/lib/site";
import {
  PHOTO_FADE_MS_REDUCED, PHOTO_HOLD_MS, PHOTO_ROLL_MS, PHOTO_ROLL_MS_REDUCED, REDUCED_KEEPS_MOVING,
} from "@/lib/motion-rules";

const sm = (src: string) => src.replace("/site/ex/", "/site/ex/sm/");

/**
 * One exhibition's photographs: one large in its thin black frame that rolls on
 * by itself every 3.5 s, swipes or drags by hand, and a strip of every photograph
 * under it that scrolls by hand with normal momentum (a fast flick goes fast).
 * The large photograph sits in a stage of one fixed height, so nothing below it
 * moves when a portrait follows a landscape. Click it to open the show full screen.
 *
 * The roll waits while a visitor is swiping, tapping or scrolling the strip,
 * while a key has focus inside it, while it is off screen and while the tab is
 * hidden. The strip is only scrolled for the visitor when the current
 * photograph has gone out of its view, and never within 6 s of their own touch.
 * Under "Reduce motion" (lib/motion-rules) it changes every 5 s as a crossfade.
 */
export default function ShowMedia({ photos, label }: { photos: Photo[]; label: string }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const userAt = useRef(0); // when the visitor last touched or scrolled the strip
  const last = useRef(0);
  const n = photos.length;
  const p = photos[i];

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const set = () => setHidden(document.hidden);
    set();
    document.addEventListener("visibilitychange", set);
    return () => document.removeEventListener("visibilitychange", set);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    // a keyboard visitor inside the block holds the roll (a mouse click does not)
    const fin = (e: FocusEvent) => { if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true); };
    const fout = (e: FocusEvent) => { if (!el.contains(e.relatedTarget as Node)) { setFocused(false); setHeld((h) => h + 1); } };
    el.addEventListener("focusin", fin);
    el.addEventListener("focusout", fout);
    return () => { io.disconnect(); el.removeEventListener("focusin", fin); el.removeEventListener("focusout", fout); };
  }, []);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  // swipe or drag the large photograph; pressing on it holds the roll
  useEffect(() => {
    const el = hero.current;
    if (!el || n < 2) return;
    const press = () => setHeld((h) => h + 1);
    el.addEventListener("pointerdown", press);
    const stop = swipe(el, (d) => { setI((k) => (((k + d) % n) + n) % n); setHeld((h) => h + 1); });
    return () => { el.removeEventListener("pointerdown", press); stop(); };
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
  const rolling = seen && !hidden && !focused && open === null && n > 1 && (!reduced || REDUCED_KEEPS_MOVING);
  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => { setHeld(0); go(i + 1); }, held ? PHOTO_HOLD_MS : reduced ? PHOTO_ROLL_MS_REDUCED : PHOTO_ROLL_MS);
    return () => clearTimeout(t);
  }, [rolling, i, go, held, reduced]);

  // under "Reduce motion" the last photograph fades out under the new one
  useEffect(() => {
    const was = last.current;
    last.current = i;
    if (!reduced || was === i) { setPrev(null); return; }
    setPrev(was);
    const t = setTimeout(() => setPrev(null), PHOTO_FADE_MS_REDUCED);
    return () => clearTimeout(t);
  }, [i, reduced]);

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
    if (performance.now() - userAt.current < PHOTO_HOLD_MS) return;
    const out = b.offsetLeft < s.scrollLeft || b.offsetLeft + b.offsetWidth > s.scrollLeft + s.clientWidth;
    if (!out) return;
    const left = b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2;
    s.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [i, reduced]);

  const q = prev !== null ? photos[prev] : null;
  return (
    <div className="sm-media" ref={root}>
      <button type="button" className={`sm-hero${reduced ? " is-fade" : ""}`} ref={hero} onClick={() => setOpen(i)} aria-label={`Open full screen: ${p.alt}`}
              style={{ ["--sm-fade" as string]: `${PHOTO_FADE_MS_REDUCED}ms` }}>
        {q && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`out-${q.src}`} className="sm-out" src={q.src} alt="" aria-hidden="true" decoding="async" draggable={false} {...dims(q.src)} />
        )}
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

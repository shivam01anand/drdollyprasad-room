"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Album } from "@/lib/site";

/**
 * Photographs from a show, rolling slowly one into the next. Every photograph
 * is shown whole (never cropped). It keeps moving on its own while on screen,
 * has a pause button, and never moves by itself for anyone who has asked for
 * reduced motion.
 */
export default function Slideshow({ albums, label }: { albums: Album[]; label: string }) {
  const [a, setA] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const album = albums[a];
  const n = album.photos.length;

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
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  const rolling = playing && seen && !still && n > 1;
  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => go(i + 1), 4200);
    return () => clearTimeout(t);
  }, [rolling, i, go]);

  const pick = (k: number) => { setA(k); setI(0); };

  return (
    <div className="slides" ref={root} role="region" aria-roledescription="slideshow" aria-label={label}
         onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}>
      {albums.length > 1 && (
        <div className="slides-tabs" role="tablist" aria-label={`${label}: parts of the show`}>
          {albums.map((x, k) => (
            <button key={x.title} type="button" role="tab" aria-selected={k === a} onClick={() => pick(k)}>
              {x.title}<span>{x.photos.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="slides-stage">
        {album.photos.map((p, k) => (
          <span key={`bg-${p.src}`} className={`slides-bg${k === i ? " on" : ""}`} aria-hidden="true"
                style={{ backgroundImage: k === i || k === (i + 1) % n ? `url("${p.src}")` : undefined }} />
        ))}
        {album.photos.map((p, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.src} src={p.src} alt={k === i ? p.alt : ""} aria-hidden={k !== i}
               className={k === i ? "on" : undefined} loading={k === 0 ? "eager" : "lazy"} decoding="async" />
        ))}
        {n > 1 && (
          <>
            <button type="button" className="slides-arrow prev" onClick={() => go(i - 1)} aria-label="Previous photograph">‹</button>
            <button type="button" className="slides-arrow next" onClick={() => go(i + 1)} aria-label="Next photograph">›</button>
          </>
        )}
        {rolling && <span className="slides-timer" key={`${a}-${i}`} aria-hidden="true" />}
      </div>

      <div className="slides-bar">
        <p className="slides-cap" aria-live="polite">
          <b>{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</b> {album.photos[i].alt}
        </p>
        {n > 1 && !still && (
          <button type="button" className="chip" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
      </div>

      {n > 1 && (
        <div className="slides-thumbs" role="group" aria-label="All photographs">
          {album.photos.map((p, k) => (
            <button key={p.src} type="button" aria-current={k === i || undefined} onClick={() => go(k)}
                    aria-label={`Photograph ${k + 1}: ${p.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

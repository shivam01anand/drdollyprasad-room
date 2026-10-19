"use client";

import dynamic from "next/dynamic";
import { dims } from "@/lib/images";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Album } from "@/lib/site";
import { swipe } from "@/lib/drift";

// the full-screen look (pinch and wheel to go closer) loads only when a photograph is opened
const Zoom = dynamic(() => import("./Zoom"), { ssr: false });

/**
 * Photographs from a show, rolling slowly one into the next. Every photograph
 * is shown whole (never cropped), in a thin black frame with a soft shadow,
 * like the paintings. It keeps moving on its own while on screen, has a pause
 * button, and never moves by itself for anyone who has asked for reduced
 * motion. Swipe or drag it to move by hand (it rolls on again a moment later);
 * click or tap the photograph to open it full screen.
 */
export default function Slideshow({ albums, label }: { albums: Album[]; label: string }) {
  const [a, setA] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
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

  // a swipe or drag moves it by hand; it waits a little before rolling on
  useEffect(() => {
    const el = stage.current;
    if (!el || n < 2) return;
    return swipe(el, (d) => { setI((k) => (((k + d) % n) + n) % n); setHeld((h) => h + 1); });
  }, [n]);

  const rolling = playing && seen && !still && !open && n > 1;
  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => { setHeld(0); go(i + 1); }, held ? 6000 : 4200);
    return () => clearTimeout(t);
  }, [rolling, i, go, held]);

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

      <div className="slides-stage" ref={stage}>
        {album.photos.map((p, k) => (
          <span key={`bg-${p.src}`} className={`slides-bg${k === i ? " on" : ""}`} aria-hidden="true"
                style={{ backgroundImage: k === i || k === (i + 1) % n ? `url("${p.src}")` : undefined }} />
        ))}
        {album.photos.map((p, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.src} src={p.src} alt={k === i ? p.alt : ""} aria-hidden={k !== i} draggable={false}
               className={k === i ? "on" : undefined} loading={k === 0 ? "eager" : "lazy"} decoding="async" {...dims(p.src)} />
        ))}
        <button type="button" className="slides-open" onClick={() => setOpen(true)} aria-label={`Open full screen: ${album.photos[i].alt}`} />
        {n > 1 && (
          <>
            <button type="button" className="slides-arrow prev" onClick={() => go(i - 1)} aria-label="Previous photograph">‹</button>
            <button type="button" className="slides-arrow next" onClick={() => go(i + 1)} aria-label="Next photograph">›</button>
          </>
        )}
        {rolling && <span className="slides-timer" key={`${a}-${i}-${held}`} aria-hidden="true" style={held ? { animationDuration: "6s" } : undefined} />}
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

      {open && <Zoom id="" src={album.photos[i].src} alt={album.photos[i].alt} title={album.photos[i].alt} onClose={() => setOpen(false)} />}

      {n > 1 && (
        <div className="slides-thumbs" role="group" aria-label="All photographs">
          {album.photos.map((p, k) => (
            <button key={p.src} type="button" aria-current={k === i || undefined} onClick={() => go(k)}
                    aria-label={`Photograph ${k + 1}: ${p.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src.replace("/site/ex/", "/site/ex/sm/")} alt="" loading="lazy" decoding="async" {...dims(p.src.replace("/site/ex/", "/site/ex/sm/"))} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

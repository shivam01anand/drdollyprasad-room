"use client";

import { useEffect, useRef, useState } from "react";
import { swipe } from "@/lib/drift";

export type Shot = { src: string; alt: string; title?: string; line?: string; source?: string; video?: boolean; poster?: string };

/**
 * A quiet full-screen look at a set of photographs (the press collage and the
 * exhibition chapters, CR-005): the photograph whole on a dark ground, its
 * caption under it, previous and next (buttons, arrow keys, swipe or drag),
 * Esc or the close button to return. Focus goes to the close button and comes
 * back to whatever opened it; the page beneath stays still. Nothing animates
 * for reduced motion.
 */
export default function Gallery({ shots, start, label, onClose }: { shots: Shot[]; start: number; label: string; onClose(): void }) {
  const [i, setI] = useState(start);
  const n = shots.length;
  const shut = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const done = useRef(onClose);
  done.current = onClose;
  const go = (d: number) => setI((k) => (((k + d) % n) + n) % n);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const was = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    shut.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") done.current();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", key);
    return () => { removeEventListener("keydown", key); document.documentElement.style.overflow = was; opener?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el || n < 2) return;
    return swipe(el, (d) => go(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const s = shots[i];
  return (
    <div className="gal" role="dialog" aria-modal="true" aria-label={label}
         onClick={(e) => { if (e.target === e.currentTarget) done.current(); }}>
      <div className="gal-stage" ref={stage} onClick={(e) => { if (e.target === e.currentTarget) done.current(); }}>
        {s.video ? (
          // a television excerpt (press row, R3): it plays here, muted, with its controls; sound is a tap away
          <video key={s.src} src={s.src} poster={s.poster} aria-label={s.alt} controls muted autoPlay playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.src} src={s.src} alt={s.alt} draggable={false} />
        )}
      </div>
      <div className="gal-bar">
        <p className="gal-cap" aria-live="polite">
          {s.source && <em>{s.source}</em>}
          {s.title && <b>{s.title}</b>}
          <span>{s.line ?? s.alt}</span>
        </p>
        {n > 1 && <span className="gal-n">{i + 1} / {n}</span>}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="gal-arrow prev" onClick={() => go(-1)} aria-label="Previous photograph">‹</button>
          <button type="button" className="gal-arrow next" onClick={() => go(1)} aria-label="Next photograph">›</button>
        </>
      )}
      <button ref={shut} type="button" className="gal-x" onClick={() => done.current()} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" /></svg>
      </button>
    </div>
  );
}

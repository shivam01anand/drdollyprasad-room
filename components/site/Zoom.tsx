"use client";

import { useEffect, useRef } from "react";
import { CloseLook } from "@/lib/closelook";
import { XL } from "@/lib/xl";
import { reducedMotion } from "@/lib/motion";

/**
 * A painting full screen, to look closely: the studio lightbox's close look
 * (lib/closelook) on the painting page. A click or tap goes close to the
 * brushwork under it; the wheel, a trackpad pinch or two fingers set how
 * close; one finger or the pointer travels across the canvas. Esc, the close
 * button or the phone's back gesture return to the page. The largest file
 * there is loads on the first zoom.
 */
export default function Zoom({ id, src, alt, title, sub, onClose }: {
  id: string; src: string; alt: string; title: string; sub?: string; onClose(): void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const shut = useRef<HTMLButtonElement>(null);
  const done = useRef(onClose);
  done.current = onClose;

  useEffect(() => {
    const touch = matchMedia("(pointer: coarse)").matches;
    const look = new CloseLook(frame.current!, img.current!, bar.current!, reducedMotion(), () => {
      if (!XL.has(id)) return;
      const hi = new Image();
      hi.src = `/art/xl/${id}.jpg`;
      hi.decode().then(() => { if (img.current) img.current.src = hi.src; }).catch(() => {});
    }, touch);
    look.enable(true);

    // the back gesture closes the viewer instead of leaving the page
    history.pushState({ zoom: true }, "");
    let popped = false;
    const onPop = () => { popped = true; done.current(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") done.current(); };
    addEventListener("popstate", onPop);
    addEventListener("keydown", onKey);
    const was = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    shut.current?.focus();
    return () => {
      look.dispose();
      removeEventListener("popstate", onPop);
      removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = was;
      if (!popped && history.state?.zoom) history.back();
    };
  }, [id]);

  return (
    <div className="zoom" role="dialog" aria-modal="true" aria-label={`${title}, full screen`}>
      <div className="zoom-stage">
        <div className="zoom-frame" ref={frame} data-cursor="Look closer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={img} src={src} alt={alt} draggable={false} />
        </div>
        <div className="lb-zoombar" ref={bar} aria-hidden="true"><i /><span /></div>
      </div>
      <div className="zoom-bar">
        <p><b>{title}</b>{sub && <span>{sub}</span>}</p>
        <p className="zoom-hint">Tap or pinch to look closer</p>
        <button ref={shut} type="button" className="zoom-close" onClick={() => done.current()} aria-label="Close the full-screen view">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </div>
    </div>
  );
}

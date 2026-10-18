"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A painting, full screen. Opens from a tap on the painting; a second tap (or
 * a pinch on a phone) goes close to the brushwork, and the picture can then be
 * moved around. Escape, the close button or the back gesture closes it.
 */
export default function Zoom({ src, alt, title, sub, onClose }: { src: string; alt: string; title: string; sub?: string; onClose(): void }) {
  const [close, setClose] = useState(false);
  const pane = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    btn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", key);
    // the phone's back gesture closes the picture rather than leaving the page
    history.pushState({ zoom: 1 }, "");
    const back = () => onClose();
    addEventListener("popstate", back);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", key);
      removeEventListener("popstate", back);
      if (history.state?.zoom) history.back();
    };
  }, [onClose]);

  const toggle = (e: React.MouseEvent<HTMLImageElement>) => {
    const p = pane.current;
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    setClose((c) => {
      if (!c && p) requestAnimationFrame(() => {
        p.scrollLeft = fx * p.scrollWidth - p.clientWidth / 2;
        p.scrollTop = fy * p.scrollHeight - p.clientHeight / 2;
      });
      return !c;
    });
  };

  return (
    <div className="zoom" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={pane} className={`zoom-pane${close ? " is-close" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} onClick={toggle} />
      </div>
      <div className="zoom-cap">
        <b>{title}</b>
        {sub && <span>{sub}</span>}
        <small>{close ? "Tap to see it whole" : "Tap the painting to look closer"}</small>
      </div>
      <button ref={btn} type="button" className="zoom-x" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" /></svg>
      </button>
    </div>
  );
}

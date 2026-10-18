"use client";

import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/motion";
import { CHAPTERS } from "@/lib/chapters";
import { EMAIL, INSTAGRAM } from "@/lib/works";

/**
 * The phone's menu: a sheet from the bottom edge, in reach of the thumb.
 * It holds the walk as a list of its stops — where you are, and any other
 * to go to — then the rest of the house: the contact, her mail
 * and her Instagram. A tap on the veil, a drag down on the sheet, or Escape
 * puts it away.
 */
import type { WorksFilter } from "./Works";

export default function Stops({ open, active, onClose, onGo, onContact, onWorks }: {
  open: boolean;
  active: number;
  onClose(): void;
  onGo(i: number): void;
  onContact(): void;
  onWorks(f: WorksFilter): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = root.current, p = panel.current;
    if (!el || !p) return;
    const quick = reducedMotion();
    if (open) {
      el.dataset.open = "1";
      gsap.fromTo(p, { yPercent: 100, y: 0 }, { yPercent: 0, y: 0, duration: quick ? 0 : 0.5, ease: "genEase" });
      gsap.fromTo(el.querySelector(".sheet-veil"), { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.35 });
      first.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      addEventListener("keydown", onKey);
      return () => removeEventListener("keydown", onKey);
    }
    if (el.dataset.open !== "1") return;
    gsap.to(p, { yPercent: 100, y: 0, duration: quick ? 0 : 0.35, ease: "power2.in" });
    gsap.to(el.querySelector(".sheet-veil"), {
      autoAlpha: 0, duration: quick ? 0 : 0.3,
      onComplete: () => { el.dataset.open = "0"; },
    });
  }, [open, onClose]);

  // a drag down the sheet puts it away
  useEffect(() => {
    const p = panel.current;
    if (!p) return;
    let y0 = -1, dy = 0;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a")) return;
      y0 = e.clientY; dy = 0;
      p.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (y0 < 0) return;
      dy = Math.max(0, e.clientY - y0);
      gsap.set(p, { y: dy });
    };
    const up = () => {
      if (y0 < 0) return;
      y0 = -1;
      if (dy > 70) { gsap.set(p, { y: 0 }); onClose(); }
      else gsap.to(p, { y: 0, duration: 0.25, ease: "power2.out" });
    };
    p.addEventListener("pointerdown", down);
    p.addEventListener("pointermove", move);
    p.addEventListener("pointerup", up);
    p.addEventListener("pointercancel", up);
    return () => {
      p.removeEventListener("pointerdown", down);
      p.removeEventListener("pointermove", move);
      p.removeEventListener("pointerup", up);
      p.removeEventListener("pointercancel", up);
    };
  }, [onClose]);

  return (
    <div className="sheet" ref={root} data-open="0" aria-hidden={!open}>
      <div className="sheet-veil" onClick={onClose} />
      <div className="sheet-panel" ref={panel} role="dialog" aria-modal="true" aria-label="The house" data-lenis-prevent="">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <p className="lab">The house · {CHAPTERS.length} stops</p>
          <button type="button" className="sheet-x lab" onClick={onClose}>Close</button>
        </div>
        <ol className="sheet-stops">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button type="button" ref={i === 0 ? first : undefined} aria-current={i === active || undefined}
                      onClick={() => { onClose(); onGo(i); }}>
                <span className="lab sheet-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="sheet-stop">{c.stop}</span>
                {c.room && <span className="lab sheet-room">{c.room}</span>}
              </button>
            </li>
          ))}
        </ol>
        <p className="lab sheet-h">Her work</p>
        <div className="sheet-works">
          <button type="button" className="pill pill-solid" onClick={() => { onClose(); onWorks("all"); }}>All her work</button>
          <button type="button" className="pill" onClick={() => { onClose(); onWorks("available"); }}>Available</button>
          <button type="button" className="pill" onClick={() => { onClose(); onWorks("sold"); }}>Sold</button>
        </div>
        <div className="sheet-actions">
          <a className="pill pill-solid" href="/">← The website</a>
          <button type="button" className="pill" onClick={() => { onClose(); onContact(); }}>Contact</button>
          <a className="pill" href={`mailto:${EMAIL}`}>Write to me</a>
          <a className="pill" href={INSTAGRAM.url} target="_blank" rel="noreferrer">Instagram ↗</a>
        </div>
      </div>
    </div>
  );
}

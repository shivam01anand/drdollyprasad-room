"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/motion";
import { CHAPTERS } from "@/lib/chapters";
import { WORKS } from "@/lib/works";
import type { WorksFilter } from "./Works";

/**
 * Quick access, for a visitor who would rather not walk: a quiet tab on the
 * left edge that is always there, and the panel it opens — every stop of the
 * house, and her work as a whole, all of it, what is available, what is sold
 * — then the exhibitions and the way to reach her. The walk stays the front
 * door; this is the side door. (On a phone the dock's sheet does the same.)
 */
export default function QuickIndex({ active, live, onStop, onWorks, onPlan, onContact }: {
  active: number;
  live: boolean;
  onStop(i: number): void;
  onWorks(f: WorksFilter): void;
  onPlan(): void;
  onContact(): void;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const p = panel.current;
    if (!p) return;
    const quick = reducedMotion();
    // the panel's place is GSAP's alone (a CSS transform would be read as pixels)
    if (!p.dataset.ready) { gsap.set(p, { x: 0, xPercent: -102 }); p.dataset.ready = "1"; }
    gsap.to(p, { xPercent: open ? 0 : -102, duration: quick ? 0 : open ? 0.55 : 0.35, ease: open ? "genEase" : "power2.in" });
    if (!open) return;
    p.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); tab.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!p.contains(t) && !tab.current?.contains(t)) setOpen(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown, true);
    return () => { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown, true); };
  }, [open]);

  const n = (f: WorksFilter) => WORKS.filter((w) => f === "all" || (f === "sold" ? w.status === "Sold" : w.status !== "Sold")).length;
  const go = (fn: () => void) => () => { setOpen(false); fn(); };
  const walk = CHAPTERS.filter((c) => c.id !== "featured" && c.id !== "plan");

  return (
    <div className="qi" data-live={live ? "1" : "0"}>
      <button type="button" className="qi-tab lab" ref={tab} aria-expanded={open} aria-controls="qi-panel"
              onClick={() => setOpen((o) => !o)}>Index</button>
      <div className="qi-panel" id="qi-panel" ref={panel} role="dialog" aria-label="Index" aria-hidden={!open}>
        <div className="qi-head">
          <p className="lab">Index</p>
          <button type="button" className="qi-x lab" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p className="lab qi-h">Her work</p>
        <div className="qi-works">
          <button type="button" onClick={go(() => onWorks("all"))}>All her work <span>{n("all")}</span></button>
          <button type="button" onClick={go(() => onWorks("available"))}>Available <span>{n("available")}</span></button>
          <button type="button" onClick={go(() => onWorks("sold"))}>Sold <span>{n("sold")}</span></button>
        </div>
        <p className="lab qi-h">The house</p>
        <ol className="qi-stops">
          {walk.map((c) => {
            const i = CHAPTERS.indexOf(c);
            return (
              <li key={c.id}>
                <button type="button" aria-current={i === active || undefined} onClick={go(() => onStop(i))}>
                  <span className="lab">{String(i + 1).padStart(2, "0")}</span>{c.stop}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="qi-more">
          <button type="button" className="pill" onClick={go(() => onStop(CHAPTERS.findIndex((c) => c.id === "featured")))}>Featured</button>
          <button type="button" className="pill" onClick={go(onPlan)}>Exhibitions</button>
          <button type="button" className="pill" onClick={go(onContact)}>Contact</button>
        </div>
      </div>
    </div>
  );
}

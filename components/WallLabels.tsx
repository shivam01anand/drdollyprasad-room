"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { BY_ID, details, quoted, statusLabel } from "@/lib/works";
import { gsap, reducedMotion, scrambleTo } from "@/lib/motion";
import type { Room } from "@/lib/room/Room";

/**
 * The wall labels. Each canvas in a chapter's framing gets a small printed
 * card on the wall beside it, as a gallery hangs one: the title, then the
 * medium, size and year, then the status. They type in once the camera has
 * landed, follow the wall while the pointer sways the view, and go as soon
 * as the walk moves on. A card opens its painting.
 *
 * Placement is a gallery's: to the right of the frame, its foot on the
 * frame's foot; failing that, to the left; failing that, below. A card never
 * covers a painting, another card, the copy or the header, and a canvas that
 * is not wholly on screen gets none.
 */

const IDS = [...new Set(CHAPTERS.flatMap((c) => c.labels ?? []))];
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Side = "right" | "left" | "below";
const GAP = 18;

const overlaps = (a: Rect, b: Rect, m = 8) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

function spot(side: Side, f: Rect, w: number, h: number) {
  if (side === "right") return { x: f.x1 + GAP, y: f.y1 - h };
  if (side === "left") return { x: f.x0 - GAP - w, y: f.y1 - h };
  return { x: f.x0, y: f.y1 + GAP * 0.75 };
}

export default function WallLabels({ room, active, live, onOpen }: {
  room: React.RefObject<Room | null>;
  active: number;
  live: boolean;
  onOpen(id: string): void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const ids = CHAPTERS[active]?.labels ?? [];
    if (!el || !live || !ids.length) return;
    const quick = reducedMotion();
    const nodes = new Map(ids.map((id) => [id, el.querySelector<HTMLElement>(`[data-label='${id}']`)!]));
    let placed: Map<string, Side> | null = null;
    let reveal: gsap.core.Timeline | null = null;
    let fade: gsap.core.Tween | null = null;

    const hide = (instant = false) => {
      reveal?.kill(); reveal = null;
      const on = [...nodes.values()].filter((n) => n.dataset.on === "1");
      on.forEach((n) => (n.dataset.on = "0"));
      placed = null;
      if (!on.length) return;
      fade?.kill();
      fade = gsap.to(on, { autoAlpha: 0, duration: instant || quick ? 0 : 0.2, ease: "power1.in" });
    };

    /** choose each card's side once, when the camera lands */
    const place = (rects: Map<string, Rect>) => {
      const vw = innerWidth, vh = innerHeight;
      const gut = Math.max(16, Math.min(30, vw * 0.022));
      const avoid: Rect[] = [];
      document.querySelectorAll<HTMLElement>(".copy-panel[data-on='1'], .brand, .hud-meta, .hud-mail, .diya-btn, .hud-bottom")
        .forEach((n) => { const b = n.getBoundingClientRect(); if (b.width && b.height) avoid.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      const frames = [...rects.values()];
      const out = new Map<string, Side>();
      const taken: Rect[] = [];
      // left to right, as the eye reads a wall: each canvas claims the space on its right first
      for (const [id, f] of [...rects].sort((a, b) => a[1].x0 - b[1].x0)) {
        const n = nodes.get(id)!;
        const w = n.offsetWidth, h = n.offsetHeight;
        for (const side of ["right", "left", "below"] as Side[]) {
          const p = spot(side, f, w, h);
          const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
          if (r.x0 < gut || r.x1 > vw - gut || r.y0 < gut || r.y1 > vh - gut) continue;
          if (frames.some((o) => overlaps(r, o)) || taken.some((o) => overlaps(r, o)) || avoid.some((o) => overlaps(r, o, 6))) continue;
          out.set(id, side);
          taken.push(r);
          break;
        }
      }
      return out;
    };

    const tick = () => {
      const R = room.current;
      if (!R) return;
      const here = R.landed && Math.abs(R.at * (CHAPTERS.length - 1) - active) < 0.04;
      if (!here) { if (placed) hide(); return; }
      const rects = new Map<string, Rect>();
      for (const id of ids) {
        const f = R.artRect(id);
        // only a canvas wholly on screen is labelled
        if (f && f.x0 > 0 && f.y0 > 0 && f.x1 < innerWidth && f.y1 < innerHeight) rects.set(id, f);
      }
      if (!placed) {
        placed = place(rects);
        reveal = gsap.timeline();
        let k = 0;
        for (const [id, side] of placed) {
          const n = nodes.get(id)!;
          n.dataset.on = "1";
          n.dataset.side = side;
          const at = k++ * 0.12;
          reveal.fromTo(n, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: quick ? 0 : 0.45, ease: "power2.out" }, at);
          if (!quick)
            n.querySelectorAll<HTMLElement>("[data-cap]").forEach((t, i) =>
              reveal!.add(scrambleTo(t, t.dataset.cap!, { speed: 2, duration: 0.7 }), at + i * 0.06));
        }
      }
      // the cards stay on the wall while the view sways
      for (const [id, side] of placed) {
        const f = rects.get(id), n = nodes.get(id)!;
        if (!f) continue;
        const p = spot(side, f, n.offsetWidth, n.offsetHeight);
        n.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      hide(true);
      nodes.forEach((n) => n.querySelectorAll<HTMLElement>("[data-cap]").forEach((t) => { t.textContent = t.dataset.cap ?? ""; }));
    };
  }, [active, live, room]);

  return (
    <div className="wall-labels" ref={root} aria-hidden="true">
      {IDS.map((id) => {
        const w = BY_ID.get(id);
        if (!w) return null;
        const line = [w.medium, details(w)].filter(Boolean).join(" · ");
        const status = statusLabel(w);
        return (
          <button type="button" className="wall-label" data-label={id} key={id} tabIndex={-1}
                  data-cursor="View" onClick={() => onOpen(id)}>
            <span className="cap-title" data-cap={quoted(w.title)}>{quoted(w.title)}</span>
            <span className="cap-details" data-cap={line}>{line}</span>
            <span className={`cap-status is-${w.status.toLowerCase()}`} data-cap={status}>{status}</span>
          </button>
        );
      })}
    </div>
  );
}

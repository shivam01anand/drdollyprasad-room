"use client";

import { useEffect, useRef } from "react";
import { BY_ID, quoted, statusLabel } from "@/lib/works";
import { WALK_ORDER, type Stop } from "@/lib/stops";
import { gsap, reducedMotion } from "@/lib/motion";
import type { Room } from "@/lib/room/Room";

/**
 * Wall plaques (art direction V3, 29 Oct 2026): quiet lettering under each painting, title and
 * status, no box. A wide screen has them at every stop; a phone only at the opening (Woman with
 * Poppies), since its dock is the caption. They come on when the camera arrives (0.2 s) and go
 * as the next move starts. If a plaque cannot sit under (or over) its own frame clear of the
 * other paintings and the chrome, the wall's names go into the dock instead (onStrip).
 */
type Rect = { x0: number; y0: number; x1: number; y1: number };
const IDS = [...new Set(WALK_ORDER)];
const GAP = 10;
const OFF = "translate3d(-9999px, -9999px, 0)";
const overlaps = (a: Rect, b: Rect, m = 4) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

export default function WallLabels({ room, stops, stop, arrived, live, phone, onOpen, onStrip }: {
  room: React.RefObject<Room | null>;
  stops: Stop[];
  stop: number;
  /** the camera is at this stop (plaques show); false while a move runs */
  arrived: boolean;
  live: boolean;
  /** the phone's chrome */
  phone: boolean;
  onOpen(id: string): void;
  onStrip(on: boolean): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const cb = useRef({ onStrip });
  cb.current = { onStrip };
  const s = stops[stop];
  const ids = (s && (!phone || s.id === "presence") ? s.works : []).filter((id) => BY_ID.has(id));
  const key = `${s?.id}|${ids.join(",")}`;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const quick = reducedMotion();
    const shown = [...el.querySelectorAll<HTMLElement>("[data-label]")].filter((n) => n.dataset.on === "1");
    if (shown.length) {
      shown.forEach((n) => (n.dataset.on = "0"));
      gsap.to(shown, { autoAlpha: 0, duration: quick ? 0 : 0.12, ease: "power1.in", overwrite: true });
    }
    if (!live || !arrived) return;
    if (!ids.length) { cb.current.onStrip(false); return; }
    const cards = new Map(ids.map((id) => [id, el.querySelector<HTMLElement>(`[data-label='${id}']`)!]));
    let lastView = -1, dirty = true, revealed = false, decided = false;
    const onResize = () => { dirty = true; lastView = -1; };
    addEventListener("resize", onResize);

    const chrome = (): Rect[] => {
      const out: Rect[] = [];
      document.querySelectorAll<HTMLElement>(".vhead a, .vhead button, .vdock[data-on='1'], .ocard[data-on='1'], .walk-panel[data-on='1'], .wall-letter[data-on='1']")
        .forEach((n) => { const b = n.getBoundingClientRect(); if (b.width && b.height) out.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      return out;
    };
    const qa: { why: Record<string, string> } | null = /[?&]qa=1/.test(location.search) ? { why: {} } : null;
    if (qa) (window as unknown as { __labels: typeof qa }).__labels = qa;

    const tick = () => {
      const R = room.current;
      if (!R || !R.landed) return;
      if (!dirty && lastView === R.viewVersion) return;
      lastView = R.viewVersion;
      const vw = innerWidth, vh = innerHeight;
      const frames = stops.filter((x) => x.space === s?.space).flatMap((x) => x.works)
        .map((id) => R.artRect(id)).filter((r): r is Rect => !!r);
      const avoid = chrome();
      const taken: Rect[] = [];
      let all = true;
      for (const id of ids) {
        const n = cards.get(id)!, f = R.artRect(id);
        if (!f) { n.style.transform = OFF; all = false; continue; }
        const w = n.offsetWidth, h = n.offsetHeight, cx = (f.x0 + f.x1) / 2;
        const tries = [{ x: cx - w / 2, y: f.y1 + GAP }, { x: cx - w / 2, y: f.y0 - GAP - h }];
        const q = tries.find((p) => {
          const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
          return r.x0 >= 8 && r.x1 <= vw - 8 && r.y0 >= 60 && r.y1 <= vh - 8
            && !frames.some((o) => overlaps(r, o)) && !taken.some((o) => overlaps(r, o)) && !avoid.some((o) => overlaps(r, o));
        });
        if (qa) qa.why[id] = q ? "ok" : `none (frame ${Math.round(f.x0)},${Math.round(f.y0)}-${Math.round(f.x1)},${Math.round(f.y1)})`;
        if (q) { taken.push({ x0: q.x, y0: q.y, x1: q.x + w, y1: q.y + h }); n.style.transform = `translate3d(${Math.round(q.x)}px, ${Math.round(q.y)}px, 0)`; }
        else { n.style.transform = OFF; all = false; }
      }
      if (!decided) { decided = true; cb.current.onStrip(!all && !phone); }
      if (!revealed) {
        revealed = true;
        const nodes = ids.map((id) => cards.get(id)!);
        nodes.forEach((n) => (n.dataset.on = "1"));
        gsap.fromTo(nodes, { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.2, ease: "power2.out", overwrite: true });
      }
      dirty = false;
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); removeEventListener("resize", onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, arrived, live, phone, room]);

  return (
    <div className="wall-labels" ref={root} aria-hidden="true">
      {IDS.map((id) => {
        const w = BY_ID.get(id);
        if (!w) return null;
        return (
          <button type="button" className="plaque" data-label={id} key={id} tabIndex={-1} data-cursor="View" onClick={() => onOpen(id)}>
            <span className="pl-title">{quoted(w.title)}</span>
            <span className={`pl-status is-${w.status === "Sold" ? "sold" : w.status === "Available" ? "available" : "other"}`}>{statusLabel(w)}</span>
          </button>
        );
      })}
    </div>
  );
}

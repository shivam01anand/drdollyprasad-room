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
 * covers a painting, her photograph on its easel, another card, the copy or
 * the header, and a canvas that is not wholly on screen gets none.
 */

const IDS = [...new Set(CHAPTERS.flatMap((c) => c.labels ?? []))];
/** captions for what is not her work (her photograph on its easel), keyed chapter:anchor */
const ASIDES = CHAPTERS.flatMap((c) => (c.asides ?? []).map((a) => ({ key: `${c.id}:${a.anchor}`, chapter: c.id, ...a })));
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Side = "right" | "left" | "below" | "above";
const GAP = 18;

const overlaps = (a: Rect, b: Rect, m = 8) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

/** where a card stands by its canvas; `centred` puts one below a canvas in the middle of it,
 *  as a hang in one line wants (the gallery's walls) */
function spot(side: Side, f: Rect, w: number, h: number, centred = false) {
  if (side === "right") return { x: f.x1 + GAP, y: f.y1 - h };
  if (side === "left") return { x: f.x0 - GAP - w, y: f.y1 - h };
  if (side === "above") return { x: centred ? (f.x0 + f.x1) / 2 - w / 2 : f.x0, y: f.y0 - GAP * 0.75 - h };
  return { x: centred ? (f.x0 + f.x1) / 2 - w / 2 : f.x0, y: f.y1 + GAP * 0.75 };
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
    const asides = ASIDES.filter((a) => a.chapter === CHAPTERS[active]?.id);
    if (!el || !live || (!ids.length && !asides.length)) return;
    const quick = reducedMotion();
    const nodes = new Map([...ids.map((id) => [id, el.querySelector<HTMLElement>(`[data-label='${id}']`)!] as const),
      ...asides.map((a) => [a.key, el.querySelector<HTMLElement>(`[data-label='${a.key}']`)!] as const)]);
    let placed: Map<string, Side> | null = null;
    // a chapter that hangs its works in one line has narrower cards, centred below them
    const centred = CHAPTERS[active]?.labelSide === "below";
    el.dataset.dense = centred ? "1" : "";
    /** where each aside last fitted: it holds there while the view sways, never jumps to the corner */
    const asideAt = new Map<string, { x: number; y: number }>();
    let reveal: gsap.core.Timeline | null = null;
    let fade: gsap.core.Tween | null = null;

    const hide = (instant = false) => {
      reveal?.kill(); reveal = null;
      const on = [...nodes.values()].filter((n) => n.dataset.on === "1");
      on.forEach((n) => (n.dataset.on = "0"));
      placed = null;
      asideAt.clear();
      if (!on.length) return;
      fade?.kill();
      fade = gsap.to(on, { autoAlpha: 0, duration: instant || quick ? 0 : 0.2, ease: "power1.in" });
    };

    /** choose each card's side once, when the camera lands */
    const place = (rects: Map<string, Rect>, others: Rect[]) => {
      const vw = innerWidth, vh = innerHeight;
      const gut = Math.max(16, Math.min(30, vw * 0.022));
      const avoid: Rect[] = [];
      document.querySelectorAll<HTMLElement>(".copy-panel[data-on='1'], .brand, .hud-meta, .hud-mail, .diya-btn, .hud-bottom > *")
        .forEach((n) => { const b = n.getBoundingClientRect(); if (b.width && b.height) avoid.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      const frames = [...rects.values(), ...others];
      const out = new Map<string, Side>();
      const taken: Rect[] = [];
      // left to right, as the eye reads a wall: each canvas claims the space on its right first
      for (const [id, f] of [...rects].sort((a, b) => a[1].x0 - b[1].x0)) {
        const n = nodes.get(id)!;
        const w = n.offsetWidth, h = n.offsetHeight;
        const first = CHAPTERS[active]?.labelSide;
        // a work with another hung close beneath it (the top row of a group in two rows) takes its card above
        const under = frames.some((o) => o.x0 < f.x1 && o.x1 > f.x0 && o.y0 >= f.y1 && o.y0 - f.y1 < h + GAP * 2);
        const pref: Side | undefined = first === "below" && under ? "above" : first;
        const sides: Side[] = ["right", "left", "below", "above"];
        const why: string[] = [];
        for (const side of pref ? [pref, ...sides.filter((x) => x !== pref)] : sides) {
          const p = spot(side, f, w, h, centred);
          const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
          if (r.x0 < gut || r.x1 > vw - gut || r.y0 < gut || r.y1 > vh - gut) { why.push(`${side}: off screen`); continue; }
          if (frames.some((o) => overlaps(r, o))) { why.push(`${side}: a painting`); continue; }
          if (taken.some((o) => overlaps(r, o))) { why.push(`${side}: a card`); continue; }
          if (avoid.some((o) => overlaps(r, o, 6))) { why.push(`${side}: the header or words`); continue; }
          out.set(id, side);
          taken.push(r);
          break;
        }
        if (!out.has(id) && process.env.NODE_ENV !== "production") console.debug("[labels] no room for", id, why.join("; "));
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
      // the works' labels first, their sides chosen once, as the camera lands
      const things = asides.map((a) => R.anchorRect(a.anchor, a.size[0], a.size[1])).filter((x): x is Rect => !!x);
      // her, at her easel (house.json's "dolly"): no card may cover her
      const her = R.anchorRect("dolly", 0.73, 0.64);
      if (her) things.push(her);
      const first = !placed;
      if (!placed) placed = place(rects, [...R.artRects(), ...things]);
      // the works' labels, where they stand this frame, and the chapter's words and the
      // header: an aside must crowd none of them
      const labelRects: Rect[] = [];
      document.querySelectorAll<HTMLElement>(".copy-panel[data-on='1'], .brand, .hud-meta, .hud-mail, .diya-btn, .hud-bottom > *, .dock")
        .forEach((x) => { const b = x.getBoundingClientRect(); if (b.width && b.height) labelRects.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      for (const [id, side] of placed) {
        const f = rects.get(id), n = nodes.get(id)!;
        if (!f) continue;
        const p = spot(side, f, n.offsetWidth, n.offsetHeight, centred);
        labelRects.push({ x0: p.x, y0: p.y, x1: p.x + n.offsetWidth, y1: p.y + n.offsetHeight });
      }
      // an aside sits beside the thing it names, clear of it: right of it, left, or below
      for (const a of asides) {
        const b = R.anchorRect(a.anchor, a.size[0], a.size[1]), n = nodes.get(a.key)!;
        if (!b || b.x1 < 0 || b.x0 > innerWidth || b.y1 < 0 || b.y0 > innerHeight) continue;
        const w = n.offsetWidth, h = n.offsetHeight, cx = (b.x0 + b.x1) / 2, under = b.y1 + GAP * 0.75;
        const tries = [{ x: b.x1 + GAP, y: b.y1 - h }, { x: b.x0 - GAP - w, y: b.y1 - h },
          { x: cx - w / 2, y: under }, { x: cx - 24, y: under }, { x: cx - w + 24, y: under }];
        const fits = (q: { x: number; y: number }) => {
          const r = { x0: q.x, y0: q.y, x1: q.x + w, y1: q.y + h };
          // (the header and the controls along the foot are in labelRects already)
          return q.x > 16 && q.x + w < innerWidth - 16 && q.y > 70 && q.y + h < innerHeight - 16
            && ![...rects.values(), ...labelRects, ...things].some((f) => overlaps(r, f, 10));
        };
        const q = tries.find(fits);
        if (q) asideAt.set(a.key, q);
      }
      if (first) {
        for (const k of asideAt.keys()) placed.set(k, "right");
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
        const n = nodes.get(id)!;
        const q = asideAt.get(id);
        if (q) { n.style.transform = `translate3d(${Math.round(q.x)}px, ${Math.round(q.y)}px, 0)`; continue; }
        const f = rects.get(id);
        if (!f) continue;
        const p = spot(side, f, n.offsetWidth, n.offsetHeight, centred);
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
      {ASIDES.map((a) => (
        <div className="wall-label is-aside" data-label={a.key} key={a.key}>
          <span className="cap-title" data-cap={a.title}>{a.title}</span>
          <span className="cap-details" data-cap={a.line}>{a.line}</span>
        </div>
      ))}
    </div>
  );
}

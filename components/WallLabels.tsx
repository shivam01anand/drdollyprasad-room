"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { BY_ID, details, quoted, statusLabel, type Work } from "@/lib/works";
import { gsap, reducedMotion, scrambleTo } from "@/lib/motion";
import type { Room } from "@/lib/room/Room";
import { clearWalkEdges } from "@/lib/walk-edges";
import { fitCaptionAt, inkFor } from "@/lib/caption-fit";

/**
 * The wall labels. Each canvas in a chapter's framing gets its label set on the wall itself, as a
 * gallery letters one: the title, then the medium, size and year, then the status. No card: ink on
 * the wall, dark on a light wall and light on a dark one (read from the room as drawn). They come in
 * once the camera has landed, follow the wall while the pointer sways the view, and go as soon as
 * the walk moves on. A label opens its painting.
 *
 * Placement is one rule for the whole wall: every label under its frame, its left edge on the
 * frame's left edge. Only where a wall cannot take them all there (something stands under a frame)
 * do they all go above instead. A label never covers a painting, her photograph on its easel,
 * another label, the copy or the header, and a canvas that is not wholly on screen gets none. When
 * the window changes size the labels are placed again, as they would have been.
 *
 * A crowded wall (four works or more, or frames too close for full labels) carries titles only;
 * the rest is a tap away, on the painting's card. A work that still finds no room is named in a
 * line along the foot, "Also here", so every work in view is named at its stop.
 */

const IDS = [...new Set(CHAPTERS.flatMap((c) => c.labels ?? []))];
/** works hung in the gallery's close line: their label's second line is size and year only */
const DENSE = new Set(CHAPTERS.filter((c) => c.room === "The gallery").flatMap((c) => c.labels ?? []));
/** a wall with this many works or more is lettered with titles alone */
const CROWDED = 4;
/** a label is as wide as its frame, but never narrower than this */
const MIN_W = 132;
/** captions for what is not her work (her photograph on its easel), keyed chapter:anchor */
const ASIDES = CHAPTERS.flatMap((c) => (c.asides ?? []).map((a) => ({ key: `${c.id}:${a.anchor}`, chapter: c.id, ...a })));
/** the medium, on a close group's short card, only where it is not the usual oil on canvas */
const denseLine = (w: Work) => [w.medium === "Oil on canvas" ? "" : w.medium, details(w)].filter(Boolean).join(" · ");
/** what a label must stand clear of (with the chapter's words, which are fitted first: lib/caption-fit): the header, the controls, the side tab, the walk's edge arrows */
const CHROME = ".brand, .hud-meta, .hud-mail, .diya-btn, .studio-exit, .hud-bottom > *, .qi[data-live='1'] .qi-tab, .walk-edge:not(:disabled), .walk-hint";
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Side = "below" | "above";
const GAP = 18;
/** from a frame's foot (or head) to its label */
const OFF = 9;

const overlaps = (a: Rect, b: Rect, m = 8) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

/** where a label stands by its canvas: under it (or over it), its left edge on the frame's left edge.
 *  A canvas near the screen's edge keeps its label, slid in from the edge */
function spot(side: Side, f: Rect, w: number, h: number) {
  const gut = Math.max(16, Math.min(30, innerWidth * 0.022));
  const x = Math.max(gut, Math.min(innerWidth - gut - w, f.x0));
  return { x, y: side === "above" ? f.y0 - OFF - h : f.y1 + OFF };
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
    /** the works in view with no room for a card: named in the line along the foot */
    let rest: string[] = [];
    const restEl = el.querySelector<HTMLElement>(".label-rest")!;
    /** where each aside last fitted: it holds there while the view sways, never jumps to the corner */
    const asideAt = new Map<string, { x: number; y: number }>();
    let reveal: gsap.core.Timeline | null = null;
    let fade: gsap.core.Tween | null = null;
    /** the window has changed size (a moment ago): the cards are placed again */
    let resized = false;
    let lastView = -1;
    /** whether she can be seen from here, looked up when the cards are placed */
    let herSeen = false;
    /** frames until the labels' ink is read (0: not due) */
    let inkDue = 0;
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { resized = true; }, 140); };
    addEventListener("resize", onResize);
    const show = (n: HTMLElement) => {
      n.dataset.on = "1";
      gsap.fromTo(n, { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.3, ease: "power2.out", overwrite: true });
    };
    const drop = (n: HTMLElement) => {
      n.dataset.on = "0";
      gsap.to(n, { autoAlpha: 0, duration: quick ? 0 : 0.2, ease: "power1.in", overwrite: true });
    };

    const hide = (instant = false) => {
      reveal?.kill(); reveal = null;
      const on = [...nodes.values()].filter((n) => n.dataset.on === "1");
      on.forEach((n) => (n.dataset.on = "0"));
      placed = null;
      asideAt.clear();
      rest = [];
      if (restEl.dataset.on === "1") {
        restEl.dataset.on = "0";
        gsap.to(restEl, { autoAlpha: 0, duration: instant || quick ? 0 : 0.2, ease: "power1.in", overwrite: true });
      }
      if (!on.length) return;
      fade?.kill();
      fade = gsap.to(on, { autoAlpha: 0, duration: instant || quick ? 0 : 0.2, ease: "power1.in" });
    };

    /** the line along the foot that names the works with no card: above the chapter's words and
     *  the controls, clear of every card */
    const putRest = (cards: Rect[]) => {
      restEl.querySelectorAll<HTMLElement>("[data-rest]").forEach((b) => { b.hidden = !rest.includes(b.dataset.rest!); });
      const was = restEl.dataset.on === "1";
      if (!rest.length) {
        if (was) { restEl.dataset.on = "0"; gsap.to(restEl, { autoAlpha: 0, duration: quick ? 0 : 0.2, overwrite: true }); }
        return;
      }
      const gut = Math.max(16, Math.min(30, innerWidth * 0.022));
      let floor = innerHeight - gut;
      document.querySelectorAll<HTMLElement>(`.copy-panel[data-i='${active}'], .dock, .hud-bottom > *`).forEach((n) => {
        const b = n.getBoundingClientRect();
        if (b.width && b.height && b.top > innerHeight * 0.4) floor = Math.min(floor, b.top);
      });
      restEl.style.maxWidth = `${innerWidth - gut * 2}px`;
      const w = restEl.offsetWidth, h = restEl.offsetHeight;
      let y = floor - 16 - h;
      for (let k = 0; k < cards.length + 1; k++) {
        const hit = cards.find((r) => overlaps({ x0: gut, y0: y, x1: gut + w, y1: y + h }, r, 4));
        if (!hit) break;
        y = hit.y0 - 10 - h;
      }
      restEl.style.transform = `translate3d(${Math.round(gut)}px, ${Math.round(Math.max(gut, y))}px, 0)`;
      if (!was) {
        restEl.dataset.on = "1";
        gsap.fromTo(restEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.45, delay: quick ? 0 : 0.3, ease: "power2.out", overwrite: true });
      }
    };

    /** one side for the whole wall, chosen once, when the camera lands: below, full labels, where
     *  every work fits so; else titles alone; else the same two above. A wall that takes them all
     *  no way keeps the arrangement that names the most */
    const place = (rects: Map<string, Rect>, others: Rect[]) => {
      const vw = innerWidth, vh = innerHeight;
      const gut = Math.max(16, Math.min(30, vw * 0.022));
      const avoid: Rect[] = [];
      // the chapter's words first take their place clear of the frames; the labels then stand clear of them
      const words = room.current ? fitCaptionAt(room.current, active) : null;
      if (words) avoid.push(words);
      document.querySelectorAll<HTMLElement>(CHROME)
        .forEach((n) => { const b = n.getBoundingClientRect(); if (b.width && b.height) avoid.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      const frames = [...rects.values(), ...others];
      // left to right, as the eye reads a wall
      const order = [...rects].sort((a, b) => a[1].x0 - b[1].x0);
      const dress = (compact: boolean) => {
        for (const [id, f] of order) {
          const n = nodes.get(id)!;
          n.dataset.compact = compact ? "1" : "";
          n.style.maxWidth = `${Math.round(Math.max(f.x1 - f.x0, MIN_W))}px`;
        }
      };
      const attempt = (side: Side, compact: boolean) => {
        dress(compact);
        const out = new Map<string, Side>();
        const taken: Rect[] = [];
        for (const [id, f] of order) {
          const n = nodes.get(id)!;
          const w = n.offsetWidth, h = n.offsetHeight;
          // (a full label squeezed into a narrow frame's width runs to a column of broken lines: titles alone, then)
          if (!compact && h > 62) continue;
          const p = spot(side, f, w, h);
          const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
          if (r.x0 < gut || r.x1 > vw - gut || r.y0 < gut || r.y1 > vh - gut) continue;
          if (frames.some((o) => overlaps(r, o, 3))) continue;
          if (taken.some((o) => overlaps(r, o, 6))) continue;
          if (avoid.some((o) => overlaps(r, o, 6))) continue;
          out.set(id, side);
          taken.push(r);
        }
        return out;
      };
      const crowded = order.length >= CROWDED;
      const tries: [Side, boolean][] = crowded
        ? [["below", true], ["above", true]]
        : [["below", false], ["below", true], ["above", false], ["above", true]];
      let best: { out: Map<string, Side>; compact: boolean } | null = null;
      for (const [side, compact] of tries) {
        const out = attempt(side, compact);
        if (out.size === order.length) { best = { out, compact }; break; }
        // a wall that cannot take every label is lettered with titles alone, under the frames if as many fit there
        if (compact && (!best || out.size > best.out.size)) best = { out, compact };
      }
      dress(best?.compact ?? false);
      for (const id of ids) if (!rects.has(id)) nodes.get(id)!.dataset.compact = "";
      const out = best?.out ?? new Map<string, Side>();
      if (process.env.NODE_ENV !== "production" && out.size < order.length)
        console.debug("[labels] no room for", order.filter(([id]) => !out.has(id)).map(([id]) => id).join(", "));
      // the works left without a label (no room, or not wholly in view), in the order the stop lists them
      rest = ids.filter((id) => !out.has(id));
      return out;
    };

    /** each label's ink, from the wall behind it as the room has drawn it: dark on a light wall,
     *  light on a dark one */
    const inks = () => {
      const R = room.current;
      if (!R) return;
      const all = [...nodes.entries()].filter(([, n]) => n.dataset.on === "1");
      if (restEl.dataset.on === "1") all.push(["rest", restEl]);
      all.forEach(([key, n], k) => {
        const b = n.getBoundingClientRect();
        if (!b.width || !b.height) return;
        R.readLumaBehind(`label:${key}`, { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }, (l, range) => {
          n.dataset.ink = inkFor(l, range) ? "light" : "dark";
        }, k === 0);
      });
    };

    const tick = () => {
      const R = room.current;
      if (!R) return;
      const here = R.landed && Math.abs(R.at * (CHAPTERS.length - 1) - active) < 0.04;
      if (!here) { if (placed) hide(); lastView = -1; return; }
      if (placed && !resized && !inkDue && lastView === R.viewVersion && !reveal?.isActive()) return;
      lastView = R.viewVersion;
      const rects = new Map<string, Rect>();
      for (const id of ids) {
        const f = R.artRect(id);
        // only a canvas wholly on screen is labelled
        if (f && f.x0 > 0 && f.y0 > 0 && f.x1 < innerWidth && f.y1 < innerHeight) rects.set(id, f);
      }
      // the works' labels first, their sides chosen once, as the camera lands
      const things = asides.map((a) => R.anchorRect(a.anchor, a.size[0], a.size[1])).filter((x): x is Rect => !!x);
      // her, at her easel (the room's "dolly" anchor): no card may cover her
      const her = R.anchorRect("dolly", 0.85, 1.35);        // allow room for either figure's silhouette
      // (only where she can be seen: from the next room she is behind a wall)
      if (!placed || resized) herSeen = R.anchorSeen("dolly");
      if (her && herSeen) things.push(her);
      const first = !placed;
      const redo = !!placed && resized;
      resized = false;
      // (the walk's arrows first find their place, so the cards stand clear of it)
      if (!placed || redo) clearWalkEdges(R.artRects());
      if (!placed) placed = place(rects, [...R.artRects(), ...things]);
      else if (redo) {
        // placed again for the new size: a card that no longer fits goes, one that now fits comes
        reveal?.progress(1);
        const next = place(rects, [...R.artRects(), ...things]);
        for (const id of ids) {
          const n = nodes.get(id)!;
          if (placed.has(id) && !next.has(id)) drop(n);
          if (!placed.has(id) && next.has(id)) show(n);
          if (next.has(id)) n.dataset.side = next.get(id)!;
        }
        for (const a of asides) if (placed.has(a.key)) next.set(a.key, "below");
        placed = next;
        asideAt.clear();
      }
      // the works' labels, where they stand this frame, and the chapter's words and the
      // header: an aside must crowd none of them
      const labelRects: Rect[] = [];
      document.querySelectorAll<HTMLElement>(`${CHROME}, .dock, .copy-panel[data-i='${active}']`)
        .forEach((x) => { const b = x.getBoundingClientRect(); if (b.width && b.height) labelRects.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      for (const [id, side] of placed) {
        const f = rects.get(id), n = nodes.get(id)!;
        if (!f) continue;
        const p = spot(side, f, n.offsetWidth, n.offsetHeight);
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
      if (redo) {
        for (const a of asides) {
          const n = nodes.get(a.key)!;
          if (asideAt.has(a.key) && !placed.has(a.key)) { placed.set(a.key, "below"); show(n); }
          if (!asideAt.has(a.key) && placed.has(a.key)) { placed.delete(a.key); drop(n); }
        }
      }
      if (first) {
        for (const k of asideAt.keys()) placed.set(k, "below");
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
      if (first || redo) {
        const cards: Rect[] = [];
        for (const [id, side] of placed) {
          const f = rects.get(id), n = nodes.get(id)!;
          const q = asideAt.get(id);
          if (q) { cards.push({ x0: q.x, y0: q.y, x1: q.x + n.offsetWidth, y1: q.y + n.offsetHeight }); continue; }
          if (!f) continue;
          const p = spot(side, f, n.offsetWidth, n.offsetHeight);
          cards.push({ x0: p.x, y0: p.y, x1: p.x + n.offsetWidth, y1: p.y + n.offsetHeight });
        }
        putRest(cards);
        inkDue = 2;
      }
      // the labels stay on the wall while the view sways
      for (const [id, side] of placed) {
        const n = nodes.get(id)!;
        const q = asideAt.get(id);
        if (q) { n.style.transform = `translate3d(${Math.round(q.x)}px, ${Math.round(q.y)}px, 0)`; continue; }
        const f = rects.get(id);
        if (!f) continue;
        const p = spot(side, f, n.offsetWidth, n.offsetHeight);
        n.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
      }
      // (their ink, once they stand where they will: asked a frame after they are placed)
      if (inkDue > 0 && --inkDue === 0) inks();
    };

    // the diya lit or put out: the walls change under the labels, so their ink is read again as they do
    const modeTimers: number[] = [];
    const mo = new MutationObserver(() => {
      modeTimers.forEach(clearTimeout);
      modeTimers.length = 0;
      for (const ms of [450, 900, 1500]) modeTimers.push(window.setTimeout(() => { if (placed) inks(); }, ms));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      mo.disconnect();
      modeTimers.forEach(clearTimeout);
      removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      hide(true);
      nodes.forEach((n) => n.querySelectorAll<HTMLElement>("[data-cap]").forEach((t) => { t.textContent = t.dataset.cap ?? ""; }));
    };
  }, [active, live, room]);

  return (
    <div className="wall-labels" ref={root} aria-hidden="true">
      {IDS.map((id) => {
        const w = BY_ID.get(id);
        if (!w) return null;
        const line = DENSE.has(id) ? denseLine(w) : [w.medium, details(w)].filter(Boolean).join(" · ");
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
      <div className="label-rest" data-on="0">
        <span className="lab label-rest-h">Also here</span>
        {IDS.map((id) => {
          const w = BY_ID.get(id);
          return w ? (
            <button type="button" key={id} data-rest={id} tabIndex={-1} hidden data-cursor="View" onClick={() => onOpen(id)}>
              {quoted(w.title)}
            </button>
          ) : null;
        })}
      </div>
      {ASIDES.map((a) => (
        <div className="wall-label is-aside" data-label={a.key} key={a.key}>
          <span className="cap-title" data-cap={a.title}>{a.title}</span>
          <span className="cap-details" data-cap={a.line}>{a.line}</span>
        </div>
      ))}
    </div>
  );
}

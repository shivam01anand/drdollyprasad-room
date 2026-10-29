"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { BY_ID, quoted, statusLabel } from "@/lib/works";
import { askPath } from "@/lib/studio-ask";
import { gsap, reducedMotion } from "@/lib/motion";
import type { Room } from "@/lib/room/Room";

/**
 * Names on the wall (UX spec "One wall at a time", 29 Oct 2026). They come on when the camera
 * arrives (all at once, a 0.2 s fade) and go as the next move starts.
 *
 * Phone: a numbered pin on each frame's top-left corner, matching the dock's strip.
 * Desktop: a small caption centred under each frame (title, status, "Ask about this painting"),
 * visible at rest. If any caption on a wall cannot be placed clear of the paintings, the header
 * and the dock, the wall switches to pins and the dock shows its strip (onStrip). A caption is
 * never parked anywhere but beside its own frame; one that has nowhere to go waits off screen.
 * The top 64 px of the screen stay clear of everything (the name in the header).
 */

const IDS = [...new Set(CHAPTERS.flatMap((c) => c.labels ?? []))];
const ASIDES = CHAPTERS.flatMap((c) => (c.asides ?? []).map((a) => ({ key: `${c.id}:${a.anchor}`, chapter: c.id, ...a })));
type Rect = { x0: number; y0: number; x1: number; y1: number };
const TOP = 64;
const GAP = 12;
const OFF = "translate3d(-9999px, -9999px, 0)";
const overlaps = (a: Rect, b: Rect, m = 6) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

export default function WallLabels({ room, stop, arrived, live, phone, order, onOpen, onStrip }: {
  room: React.RefObject<Room | null>;
  stop: number;
  /** the camera is at this stop (labels show); false while a move runs */
  arrived: boolean;
  live: boolean;
  phone: boolean;
  /** this wall's works, left to right (their numbers) */
  order: string[];
  onOpen(id: string): void;
  /** desktop: this wall reads by pins and the dock's strip (true), or by captions (false) */
  onStrip(on: boolean): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const cb = useRef({ onStrip });
  cb.current = { onStrip };
  const key = order.join(",");

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const quick = reducedMotion();
    const all = [...el.querySelectorAll<HTMLElement>("[data-label], [data-pin]")];
    const shown = all.filter((n) => n.dataset.on === "1");
    // a move has begun (or the wall changed): everything goes, quickly
    if (shown.length) {
      shown.forEach((n) => (n.dataset.on = "0"));
      gsap.to(shown, { autoAlpha: 0, duration: quick ? 0 : 0.12, ease: "power1.in", overwrite: true });
    }
    if (!live || !arrived) return;
    const ids = order.filter((id) => BY_ID.has(id));
    const asides = phone ? [] : ASIDES.filter((a) => a.chapter === CHAPTERS[stop]?.id);
    if (!ids.length && !asides.length) { cb.current.onStrip(false); return; }

    const pins = new Map(ids.map((id) => [id, el.querySelector<HTMLElement>(`[data-pin='${id}']`)!]));
    const cards = new Map(ids.map((id) => [id, el.querySelector<HTMLElement>(`[data-label='${id}']`)!]));
    const notes = new Map(asides.map((a) => [a.key, el.querySelector<HTMLElement>(`[data-label='${a.key}']`)!]));
    ids.forEach((id, i) => { pins.get(id)!.firstChild!.textContent = String(i + 1); });

    let mode: "pins" | "cards" | "" = phone ? "pins" : "";
    let lastView = -1;
    let dirty = true;
    let revealed = false;
    const onResize = () => { dirty = true; lastView = -1; };
    addEventListener("resize", onResize);

    const dockTop = () => {
      const d = document.querySelector<HTMLElement>(".sdock[data-on='1']")?.getBoundingClientRect();
      return d && d.height ? d.top : innerHeight;
    };
    const chrome = () => {
      const out: Rect[] = [];
      document.querySelectorAll<HTMLElement>(".copy-panel[data-on='1'], .hud .brand, .hud-map, .music-btn, .studio-exit, .walk-panel[data-on='1']")
        .forEach((n) => { const b = n.getBoundingClientRect(); if (b.width && b.height) out.push({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); });
      return out;
    };

    // ?qa=1: why a caption did not fit (window.__labels)
    type QA = { why: Record<string, string>; frames?: number };
    const qa: QA | null = /[?&]qa=1/.test(location.search) ? { why: {} } : null;
    if (qa) (window as unknown as { __labels: QA }).__labels = qa;
    /** each caption's spot: centred below its frame, else above, else right, else left; or null */
    const placeCards = (R: Room) => {
      const vw = innerWidth, bottom = dockTop() - 10, gut = 16;
      // the paintings that can be in view: this wall's and its neighbours' (every canvas in front of the
      // camera would include ones behind walls, in other rooms, and block captions that are clear)
      const near = [stop - 1, stop, stop + 1]
        .filter((i) => i === stop || CHAPTERS[i]?.space === CHAPTERS[stop]?.space)
        .flatMap((i) => CHAPTERS[i]?.labels ?? []);
      const frames = near.map((id) => R.artRect(id)).filter((r): r is Rect => !!r);
      // her, at her easel: only where she can be seen (the courtyard), not projected through walls
      const her = CHAPTERS[stop]?.space === "aangan" ? R.anchorRect("dolly", 0.85, 1.35) : null;
      if (her) frames.push(her);
      if (qa) qa.frames = frames.length;
      const avoid = chrome();
      const taken: Rect[] = [];
      const out = new Map<string, { x: number; y: number } | null>();
      for (const id of ids) {
        const f = R.artRect(id), n = cards.get(id)!;
        if (!f || f.x0 < 0 || f.x1 > vw || f.y0 < TOP || f.y1 > bottom) { out.set(id, null); continue; }
        const w = n.offsetWidth, h = n.offsetHeight, cx = (f.x0 + f.x1) / 2;
        const tries = [{ x: cx - w / 2, y: f.y1 + GAP }, { x: cx - w / 2, y: f.y0 - GAP - h },
          { x: f.x1 + GAP, y: f.y1 - h }, { x: f.x0 - GAP - w, y: f.y1 - h }];
        const q = tries.find((p) => {
          const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
          return r.x0 >= gut && r.x1 <= vw - gut && r.y0 >= TOP && r.y1 <= bottom
            && !frames.some((o) => overlaps(r, o)) && !taken.some((o) => overlaps(r, o)) && !avoid.some((o) => overlaps(r, o));
        });
        out.set(id, q ?? null);
        if (qa) qa.why[id] = q ? "ok" : `none (frame ${Math.round(f.x0)},${Math.round(f.y0)}-${Math.round(f.x1)},${Math.round(f.y1)}; bottom ${Math.round(bottom)})`;
        if (q) taken.push({ x0: q.x, y0: q.y, x1: q.x + w, y1: q.y + h });
      }
      return { out, taken, frames, avoid };
    };

    const show = (nodes: HTMLElement[]) => {
      nodes.forEach((n) => (n.dataset.on = "1"));
      gsap.fromTo(nodes, { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.2, ease: "power2.out", overwrite: true });
    };

    const tick = () => {
      const R = room.current;
      if (!R || !R.landed) return;
      if (!dirty && lastView === R.viewVersion) return;
      lastView = R.viewVersion;
      const bottom = dockTop();

      if (mode !== "pins") {
        const { out, taken, frames, avoid } = placeCards(R);
        if (!mode) {
          // the first look at this wall decides: captions if every one fits, else pins and the strip
          mode = [...out.values()].every(Boolean) ? "cards" : "pins";
          cb.current.onStrip(mode === "pins");
        }
        // a caption that cannot place after all (a crowded wall): the numbered strip, so no name is ever missing
        if (mode === "cards" && [...out.values()].some((q) => !q)) {
          mode = "pins";
          cb.current.onStrip(true);
          if (revealed) { revealed = false; const on = [...el.querySelectorAll<HTMLElement>("[data-label]")]; on.forEach((n) => (n.dataset.on = "0")); gsap.set(on, { autoAlpha: 0 }); }
        }
        if (mode === "cards") {
          for (const [id, q] of out) cards.get(id)!.style.transform = q ? `translate3d(${Math.round(q.x)}px, ${Math.round(q.y)}px, 0)` : OFF;
          // what is not her work (her photograph on its easel): beside it, clear of everything, or not at all
          for (const a of asides) {
            const n = notes.get(a.key)!, b = R.anchorRect(a.anchor, a.size[0], a.size[1]);
            let q: { x: number; y: number } | undefined;
            if (b) {
              const w = n.offsetWidth, h = n.offsetHeight, cx = (b.x0 + b.x1) / 2;
              q = [{ x: cx - w / 2, y: b.y1 + GAP }, { x: b.x1 + GAP, y: b.y1 - h }, { x: b.x0 - GAP - w, y: b.y1 - h }].find((p) => {
                const r = { x0: p.x, y0: p.y, x1: p.x + w, y1: p.y + h };
                return r.x0 >= 16 && r.x1 <= innerWidth - 16 && r.y0 >= TOP && r.y1 <= bottom - 10
                  && ![...frames, ...taken, ...avoid].some((o) => overlaps(r, o));
              });
            }
            n.style.transform = q ? `translate3d(${Math.round(q.x)}px, ${Math.round(q.y)}px, 0)` : OFF;
          }
          if (!revealed) { revealed = true; show([...ids.map((id) => cards.get(id)!), ...notes.values()]); }
          dirty = false;
          return;
        }
      }

      // pins: on each frame's top-left corner (or the corner of the part of it that is in view)
      for (const id of ids) {
        const n = pins.get(id)!, f = R.artRect(id);
        if (!f) { n.style.transform = OFF; continue; }
        const x = Math.max(f.x0, 6), y = Math.max(f.y0, TOP);
        const seen = x < Math.min(f.x1, innerWidth) - 14 && y < Math.min(f.y1, bottom) - 14;
        n.style.transform = seen ? `translate3d(${Math.round(x - 11)}px, ${Math.round(y - 11)}px, 0)` : OFF;
      }
      if (!revealed) { revealed = true; show(ids.map((id) => pins.get(id)!)); }
      dirty = false;
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, arrived, live, phone, key, room]);

  return (
    <div className="wall-labels" ref={root} aria-hidden="true">
      {IDS.map((id) => {
        const w = BY_ID.get(id);
        if (!w) return null;
        return (
          <button type="button" className="wall-pin" data-pin={id} key={`p-${id}`} tabIndex={-1} onClick={() => onOpen(id)}>
            <span>1</span>
          </button>
        );
      })}
      {IDS.map((id) => {
        const w = BY_ID.get(id);
        if (!w) return null;
        return (
          <div className="wall-label" data-label={id} key={id} data-cursor="View" onClick={() => onOpen(id)}>
            <span className="cap-title">{quoted(w.title)}</span>
            <span className={`cap-status is-${w.status.toLowerCase()}`}>{statusLabel(w)}</span>
            <a className="cap-ask" href={askPath(id)} tabIndex={-1} data-analytics-source="studio_wall_label"
               onClick={(e) => e.stopPropagation()}>Ask about this painting</a>
          </div>
        );
      })}
      {ASIDES.map((a) => (
        <div className="wall-label is-aside" data-label={a.key} key={a.key}>
          <span className="cap-title">{a.title}</span>
          <span className="cap-details">{a.line}</span>
        </div>
      ))}
    </div>
  );
}

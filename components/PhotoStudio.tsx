"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lightbox, { type LightboxHandle } from "./Lightbox";
import KnowMore, { OpeningCard } from "./AboutHer";
import Desk from "./Desk";
import * as music from "@/lib/music";
import { BY_ID } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";
import { WALLS, WALL_ORDER, SPACE, ROOM_ORDER, roomLine, type Wall } from "@/lib/studio-walls";

type Dims = Record<string, { w: number; h: number }>;
type Stop = { kind: "open" } | { kind: "wall"; wall: Wall } | { kind: "desk" };
type Method = "next" | "prev" | "swipe" | "wheel" | "key" | "rail" | "enter" | "link";
type Frame = { s: number; ox: number; oy: number; iw: number; ih: number; W: number; H: number };

const HOME = "/";
const [IW, IH] = SPACE;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const STOPS: Stop[] = [{ kind: "open" }, ...WALLS.map((wall) => ({ kind: "wall" as const, wall })), { kind: "desk" }];
const WALL_COUNT = WALLS.length;

/** the room names along the dock: each room with a wall, then her desk */
const RAIL = [
  ...ROOM_ORDER.filter((r) => WALLS.some((w) => w.room === r)).map((r) => ({ label: r as string, to: STOPS.findIndex((s) => s.kind === "wall" && s.wall.room === r) })),
  { label: "Her desk", to: STOPS.length - 1 },
];

const isPhone = (W: number) => W <= 760;

/**
 * Where the photograph sits on this screen. It covers the screen where it can; where the group of
 * paintings would then be cropped (a phone held upright), it shrinks until the whole group, its
 * plaques and a little wall fit across, and the photograph's own blurred light fills above and below.
 */
function frameFor(wall: Wall, W: number, H: number): Frame {
  const phone = isPhone(W);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const w of wall.works) for (const [x, y, bw, bh] of [w.bbox, w.plaque]) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + bw); y1 = Math.max(y1, y + bh);
  }
  const padX = phone ? 20 : 140, padY = phone ? 40 : 110;
  x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  const short = H < 520;
  const top = phone ? 150 : short ? 52 : 64;
  const bottom = phone ? 150 : short ? 84 : 150;
  const availH = Math.max(120, H - top - bottom);
  const cover = Math.max(W / IW, H / IH);
  const contain = Math.min(W / IW, H / IH);
  const s = Math.max(contain, Math.min(cover, W / (x1 - x0), availH / (y1 - y0)));
  const iw = IW * s, ih = IH * s;
  let ox = W / 2 - ((x0 + x1) / 2) * s;
  let oy = top + availH / 2 - ((y0 + y1) / 2) * s;
  ox = iw >= W ? clamp(ox, W - iw, 0) : (W - iw) / 2;
  oy = ih >= H ? clamp(oy, H - ih, 0) : clamp(oy, 0, H - ih);
  return { s, ox, oy, iw, ih, W, H };
}

const srcFor = (wall: Wall, f: Frame | null) => {
  const dpr = typeof window === "undefined" ? 2 : Math.min(3, devicePixelRatio || 1);
  return `${wall.image}-${f && f.iw * dpr <= 1700 ? 1600 : 2400}.webp`;
};

/**
 * The studio as photographs (Shubham, 8 Nov 2026): one wall of a series per screen, hung as she
 * would hang it, with a title plaque under each painting. Tap a painting to open it as on the
 * website. Swipe, the arrow keys, Previous and Next, or a room's name move one wall or straight
 * to a room; the walk opens on About her and ends at her desk. "Exit to home" is always there.
 */
export default function PhotoStudio({ dims }: { dims: Dims }) {
  const lbRef = useRef<LightboxHandle>(null);
  const [stop, setStop] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [vp, setVp] = useState<{ W: number; H: number } | null>(null);
  const [more, setMore] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState({ z: 1, x: 0, y: 0 });
  const stopRef = useRef(0);
  const holds = useRef(new Set<string>());
  const hold = useCallback((reason: string, on: boolean) => {
    if (on) holds.current.add(reason); else holds.current.delete(reason);
  }, []);

  // the screen
  useEffect(() => {
    const on = () => setVp({ W: innerWidth, H: innerHeight });
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  // the music: on by default, soft, from the visitor's first tap or key (browsers block autoplay)
  useEffect(() => music.onChange(setPlaying), []);
  useEffect(() => {
    const events = ["pointerup", "touchend", "keydown", "click"] as const;
    const off = () => events.forEach((e) => removeEventListener(e, wake, true));
    const wake = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".music-btn")) return;
      if (!music.wanted()) { off(); return; }
      if (!music.isPlaying()) music.start();
      setTimeout(() => { if (music.wake()) off(); }, 250);
    };
    if (music.wanted()) events.forEach((e) => addEventListener(e, wake, true));
    return off;
  }, []);

  // the page itself never scrolls: the studio is one screen
  useEffect(() => {
    const h = document.documentElement;
    h.dataset.photoStudio = "1";
    return () => { delete h.dataset.photoStudio; };
  }, []);

  const leaveT = useRef(0);
  const go = useCallback((to: number, method: Method) => {
    const from = stopRef.current;
    to = clamp(to, 0, STOPS.length - 1);
    if (to === from) return;
    track("studio_step", { from, to, method });
    stopRef.current = to;
    setDir(to > from ? 1 : -1);
    setLeaving(from);
    setStop(to);
    setZoom({ z: 1, x: 0, y: 0 });
    clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => setLeaving(null), 600);
  }, []);

  const step = useCallback((d: 1 | -1, method: Method) => {
    if (holds.current.size) return;
    const last = STOPS.length - 1;
    if (d > 0 && stopRef.current >= last) return;
    go(stopRef.current + d, method);
  }, [go]);

  const openWork = useCallback((id: string) => {
    const w = BY_ID.get(id);
    if (!w) return;
    track("painting_clicked", { ...paintingProperties(w), source: "studio_photo_wall" });
    lbRef.current?.open(id, null, WALL_ORDER);
  }, []);

  // keys: the arrows, Page Up and Down, the space bar; Escape lets go of a zoom
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || holds.current.size) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], dialog[open]")) return;
      if (e.key === "Escape" && zoomRef.current.z > 1) { setZoom({ z: 1, x: 0, y: 0 }); return; }
      const next = ["ArrowRight", "ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !t?.closest?.("button, a"));
      const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
      if (!next && !prev) return;
      e.preventDefault();
      if (!e.repeat) step(next ? 1 : -1, "key");
    };
    // a wheel or a trackpad flick: one wall, then a pause
    let acc = 0, locked = false, quiet = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || holds.current.size) return;
      if ((e.target as Element | null)?.closest?.(".walk-panel, .lb, .ps-rail")) return;
      e.preventDefault();
      clearTimeout(quiet);
      quiet = window.setTimeout(() => { acc = 0; locked = false; }, 260);
      if (locked) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      acc += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
      if (Math.abs(acc) >= 60) { const d = acc > 0 ? 1 : -1; acc = 0; locked = true; step(d, "wheel"); }
    };
    addEventListener("keydown", onKey);
    addEventListener("wheel", onWheel, { passive: false });
    return () => { removeEventListener("keydown", onKey); removeEventListener("wheel", onWheel); clearTimeout(quiet); };
  }, [step]);

  /* touch and pointer on a wall: a swipe moves one wall; two fingers pinch; one finger pans a zoomed
     wall; a double tap zooms in or out; a tap on a painting opens it */
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gest = useRef({ x: 0, y: 0, t: 0, moved: false, pinch: 0, z0: 1, px: 0, py: 0, mx: 0, my: 0, lastTap: 0 });
  const dragged = useRef(false);
  const frameNow = useRef<Frame | null>(null);

  const clampZoom = useCallback((z: number, x: number, y: number) => {
    const f = frameNow.current;
    if (!f || z <= 1.001) return { z: 1, x: 0, y: 0 };
    const fit = (o: number, size: number, view: number, p: number) => {
      const a = o * z + p, b = (o + size) * z + p;
      if (size * z <= view) return (o + size / 2) - (o + size / 2) * z; // centred as it was
      if (a > 0) return p - a;
      if (b < view) return p + (view - b);
      return p;
    };
    return { z, x: fit(f.ox, f.iw, f.W, x), y: fit(f.oy, f.ih, f.H, y) };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (holds.current.size) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest.current;
    if (ptrs.current.size === 1) {
      Object.assign(g, { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, px: zoomRef.current.x, py: zoomRef.current.y });
      dragged.current = false;
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      Object.assign(g, { pinch: Math.hypot(a.x - b.x, a.y - b.y), z0: zoomRef.current.z, px: zoomRef.current.x, py: zoomRef.current.y,
        mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, moved: true });
      dragged.current = true;
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest.current;
    if (ptrs.current.size >= 2 && g.pinch) {
      const [a, b] = [...ptrs.current.values()];
      const z = clamp(g.z0 * Math.hypot(a.x - b.x, a.y - b.y) / g.pinch, 1, 3.5);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      // the point under the fingers stays under them
      const x = mx - (g.mx - g.px) * (z / g.z0), y = my - (g.my - g.py) * (z / g.z0);
      setZoom(clampZoom(z, x, y));
      return;
    }
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (Math.hypot(dx, dy) > 8) { g.moved = true; dragged.current = true; }
    if (zoomRef.current.z > 1 && g.moved && e.pointerType !== "mouse") setZoom(clampZoom(zoomRef.current.z, g.px + dx, g.py + dy));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.delete(e.pointerId);
    const g = gest.current;
    if (ptrs.current.size > 0) return;
    if (g.pinch) { g.pinch = 0; return; }
    const dx = e.clientX - g.x, dy = e.clientY - g.y, dt = Math.max(1, performance.now() - g.t);
    if (zoomRef.current.z <= 1 && g.moved) {
      const across = Math.abs(dx) > Math.abs(dy);
      const far = across ? Math.abs(dx) > 45 : Math.abs(dy) > 60;
      const fast = Math.max(Math.abs(dx), Math.abs(dy)) / dt > 0.4 && Math.max(Math.abs(dx), Math.abs(dy)) > 24;
      if (far || fast) step((across ? dx : dy) < 0 ? 1 : -1, "swipe");
      return;
    }
    // a double tap on the wall (not on a painting): look closer, or back
    if (!g.moved && e.pointerType !== "mouse" && !(e.target as Element).closest(".ps-hit")) {
      const now = performance.now();
      if (now - g.lastTap < 320) {
        g.lastTap = 0;
        const zc = zoomRef.current;
        if (zc.z > 1) setZoom({ z: 1, x: 0, y: 0 });
        else { const z = 2.2; setZoom(clampZoom(z, e.clientX - (e.clientX - zc.x) * z, e.clientY - (e.clientY - zc.y) * z)); }
      } else g.lastTap = now;
    }
  };
  const onPointerCancel = (e: React.PointerEvent) => { ptrs.current.delete(e.pointerId); gest.current.pinch = 0; };

  // a link to one painting (/studio#work=<id>): to its wall, and open it there
  useEffect(() => {
    const m = /^#work=([a-z0-9-]+)$/.exec(location.hash);
    if (!m || !BY_ID.has(m[1])) return;
    history.replaceState(null, "", location.pathname + location.search);
    const i = STOPS.findIndex((s) => s.kind === "wall" && s.wall.works.some((w) => w.id === m[1]));
    if (i >= 0) go(i, "link");
    setTimeout(() => lbRef.current?.open(m[1], null, WALL_ORDER), i >= 0 ? 450 : 0);
  }, [go]);

  // which wall is in front: for the reader's analytics
  useEffect(() => {
    const s = STOPS[stop];
    const t = setTimeout(() => track("studio_chapter_viewed", {
      chapter_id: s.kind === "wall" ? s.wall.id : s.kind, chapter_name: s.kind === "wall" ? s.wall.room : s.kind === "open" ? "About her" : "Her desk",
      room: s.kind === "wall" ? s.wall.room : s.kind === "open" ? "About her" : "Her desk", chapter_number: stop + 1,
    }), 700);
    return () => clearTimeout(t);
  }, [stop]);

  const onLightbox = useCallback((open: boolean) => { hold("lightbox", open); setLbOpen(open); }, [hold]);
  useEffect(() => { hold("more", more); }, [more, hold]);
  const closeMore = useCallback(() => setMore(false), []);
  const enter = useCallback(() => { setMore(false); hold("more", false); go(1, "enter"); }, [go, hold]);

  const here = STOPS[stop];
  const frames = useMemo(() => (vp ? STOPS.map((s) => (s.kind === "wall" ? frameFor(s.wall, vp.W, vp.H) : null)) : []), [vp]);
  frameNow.current = frames[stop] ?? null;
  const phone = vp ? isPhone(vp.W) : false;
  const wallIndex = here.kind === "wall" ? WALLS.indexOf(here.wall) : -1;
  const roomNow = here.kind === "wall" ? here.wall.room : here.kind === "desk" ? "Her desk" : "";
  const tone = here.kind === "wall" ? here.wall.tone : "dark";
  const nextStop = STOPS[stop + 1];
  const nextLabel = !nextStop ? "" : nextStop.kind === "desk" ? "Her desk"
    : nextStop.kind === "wall" && here.kind === "wall" && nextStop.wall.room === here.wall.room ? "Next wall"
    : nextStop.kind === "wall" ? nextStop.wall.room : "Next";
  const prevStop = STOPS[stop - 1];
  const prevLabel = !prevStop ? "" : prevStop.kind === "open" ? "About her" : prevStop.kind === "wall" ? prevStop.wall.room : "";

  return (
    <div className="ps" data-tone={tone} data-stop={here.kind} data-phone={phone ? "1" : "0"} data-zoomed={zoom.z > 1 ? "1" : "0"}>
      <div className="ps-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
           onPointerCancel={onPointerCancel}>
        {STOPS.map((s, i) => {
          const on = i === stop;
          // mounted: the wall in front, the one being left, and the next one (its photo loads ahead)
          if (!(on || i === leaving || i === stop + 1)) return null;
          const state = on ? "on" : i === leaving ? "off" : "next";
          if (s.kind === "open") return (
            <section key="open" className="ps-scene ps-open" data-state={state} aria-hidden={!on}>
              <p className="ps-welcome"><span lang="hi">नमस्ते</span><span>Welcome to my studio</span></p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ps-open-art" src="/art/large/woman-with-poppies.jpg" alt="Woman with Poppies, oil on canvas"
                   width={1100} height={784} decoding="async" fetchPriority="high" onClick={() => { if (dragged.current) { dragged.current = false; return; } openWork("woman-with-poppies"); }} />
            </section>
          );
          if (s.kind === "desk") return (
            <section key="desk" className="ps-scene ps-desk" data-state={state} aria-hidden={!on}>
              {WALLS.length > 0 && on && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ps-desk-bg" src={srcFor(WALLS[WALLS.length - 1], frames[STOPS.length - 2] ?? null)} alt="" aria-hidden="true" />
              )}
            </section>
          );
          const f = frames[i];
          if (!f) return null;
          const src = srcFor(s.wall, f);
          const z = on ? zoom : { z: 1, x: 0, y: 0 };
          const covered = f.iw >= f.W - 1 && f.ih >= f.H - 1;
          // a plaque's widest: the space between its neighbours' centres
          const cx = s.wall.works.map((w) => (w.plaque[0] + w.plaque[2] / 2) * f.s + f.ox);
          const pitch = cx.length > 1 ? Math.min(...cx.slice(1).map((c, k) => c - cx[k])) : f.W;
          const fs = clamp(22 * f.s, 11, 16);
          return (
            <section key={s.wall.id} className="ps-scene ps-wall" data-state={state} data-dir={dir} data-tone={s.wall.tone}
                     aria-hidden={!on} aria-label={`${s.wall.room}, wall ${WALLS.indexOf(s.wall) + 1} of ${WALL_COUNT}`}>
              {!covered && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ps-fill" src={src} alt="" aria-hidden="true" decoding="async" />
              )}
              <div className="ps-layer" style={{ transform: `translate3d(${z.x}px,${z.y}px,0) scale(${z.z})` }} data-zoomed={z.z > 1 ? "1" : "0"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ps-photo" src={src} alt="" decoding="async" draggable={false}
                     style={{ left: f.ox, top: f.oy, width: f.iw, height: f.ih }} />
                {s.wall.works.map((w) => {
                  const work = BY_ID.get(w.id)!;
                  const [bx, by, bw, bh] = w.bbox, [px, py, pw] = w.plaque;
                  return (
                    <div key={w.id}>
                      <button type="button" className="ps-hit" tabIndex={on ? 0 : -1}
                              aria-label={`Open ${work.title}`}
                              style={{ left: bx * f.s + f.ox, top: by * f.s + f.oy, width: bw * f.s, height: bh * f.s }}
                              onClick={() => { if (dragged.current) { dragged.current = false; return; } openWork(w.id); }} />
                      <p className="ps-plaque" aria-hidden="true"
                         style={{ left: (px + pw / 2) * f.s + f.ox, top: py * f.s + f.oy, fontSize: fs, maxWidth: Math.max(80, pitch - 10) }}>
                        {work.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* always there: the way out, and the music */}
      <header className="ps-head">
        <a className="ps-exit" href={HOME} aria-label="Exit the studio to the home page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6.5L5.5 12l5.5 5.5" /></svg>
          <span>Exit to home</span>
        </a>
        <button type="button" className="ps-music music-btn" aria-pressed={playing}
                aria-label={playing ? "Pause the music" : "Play the music"} onClick={() => music.toggle()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M6 9v6M10 6v12M14 8v8M18 10v4" /> : <path d="M6 12h12" />}
          </svg>
          <span>{playing ? "Music on" : "Music off"}</span>
        </button>
      </header>

      {/* the room's name and its line (ours, never hers): above the wall on a phone, in the dock on a wide screen */}
      {here.kind === "wall" && phone && (
        <div className="ps-title" key={`t-${here.wall.room}`}>
          <h1 className="ps-room">{here.wall.room}</h1>
          {roomLine(here.wall.room) && <p className="ps-line">{roomLine(here.wall.room)}</p>}
        </div>
      )}

      {/* wide screens: a quiet arrow at each side */}
      {!phone && here.kind !== "open" && !lbOpen && (
        <>
          <button type="button" className="ps-side ps-side-prev" onClick={() => step(-1, "prev")} aria-label={`Previous: ${prevLabel}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
          </button>
          {nextStop && (
            <button type="button" className="ps-side ps-side-next" onClick={() => step(1, "next")} aria-label={`Next: ${nextLabel}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" /></svg>
            </button>
          )}
        </>
      )}

      <OpeningCard open={here.kind === "open" && !more} onEnter={enter} onMore={() => setMore(true)} />
      <KnowMore open={more} onClose={closeMore} onEnter={enter} />
      <div className="ps-deskwrap"><Desk open={here.kind === "desk"} /></div>

      {/* the dock: where you are, Previous and Next, and every room by name */}
      <nav className="ps-dock" data-on={here.kind !== "open" && !lbOpen && !more ? "1" : "0"} aria-label="Rooms of the studio"
           inert={here.kind === "open"}>
        <div className="ps-row">
          <button type="button" className="ps-arrow" onClick={() => step(-1, "prev")} disabled={stop === 0} aria-label={`Previous: ${prevLabel}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6.5L5.5 12l5.5 5.5" /></svg>
          </button>
          <div className="ps-cap" aria-live="polite">
            {!phone && here.kind === "wall" && (
              <>
                <span className="ps-cap-room">{roomNow}</span>
                {roomLine(roomNow) && <span className="ps-cap-line">{roomLine(roomNow)}</span>}
              </>
            )}
            {!phone && here.kind === "desk" && <span className="ps-cap-room">Her desk</span>}
            <span className="ps-cap-count">
              {here.kind === "wall" ? `Wall ${wallIndex + 1} of ${WALL_COUNT}` : here.kind === "desk" ? "The end of the walk" : ""}
              {phone && here.kind === "wall" ? " · Tap a painting" : ""}
            </span>
          </div>
          <button type="button" className="ps-arrow ps-arrow-next" onClick={() => step(1, "next")} disabled={!nextStop}
                  aria-label={nextStop ? `Next: ${nextLabel}` : "Next"}>
            {!phone && nextStop && <span>{nextLabel}</span>}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" /></svg>
          </button>
        </div>
        <ol className="ps-rail">
          {RAIL.map((r) => (
            <li key={r.label}>
              <button type="button" aria-current={roomNow === r.label ? "location" : undefined} onClick={() => go(r.to, "rail")}>
                {r.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Lightbox ref={lbRef} dims={dims} onOpenChange={onLightbox} />
    </div>
  );
}

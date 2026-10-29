"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@/lib/room/Room";
import { motion, gsap, reducedMotion } from "@/lib/motion";
import Preloader, { type PreloaderHandle } from "./Preloader";
import Lightbox, { type LightboxHandle } from "./Lightbox";
import Cursor, { roomCursorLabel } from "./Cursor";
import WallLabels from "./WallLabels";
import Until from "./Until";
import RoomMap from "./RoomMap";
import Dock, { roomAt } from "./Dock";
import AboutHer from "./AboutHer";
import Desk from "./Desk";
import { WORKS_FILTER, type WorksFilter } from "./Works";
import * as music from "@/lib/music";
import { CHAPTERS, ROOM_LINE, WALK_ORDER, stopOf, type RoomName } from "@/lib/chapters";
import { activeVariant } from "@/lib/room/variants";
import { BY_ID } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";

type Dims = Record<string, { w: number; h: number }>;
type Method = "next" | "prev" | "swipe" | "wheel" | "key" | "map" | "strip" | "link" | "qa";

const N = CHAPTERS.length;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progressOf = (i: number) => i / Math.max(1, N - 1);
const LABEL_ORDER = CHAPTERS.map((c) => [...(c.labels ?? [])]);
/** a framing that the camera passes through on its way in (a doorway, a turn): such a step is a cut */
const turns = (to: number) => !!CHAPTERS[to]?.via;

/**
 * The studio, one wall at a time (UX spec Option A, 29 Oct 2026). The visitor is always at one
 * stop; every input (a swipe in any direction, one wheel or trackpad flick, an arrow key, the
 * dock's Previous and Next, a room in the list, a name in the strip) moves exactly one stop or
 * goes straight to one. Within a room the camera makes one short move (0.7 s); between rooms
 * the page dips to Kajal and cuts (0.6 s). Scroll no longer drives the camera: the house is a
 * fixed stage, and the page under it (every painting, then contact) scrolls as a page.
 */
export default function Studio({ dims }: { dims: Dims }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const villageRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<PreloaderHandle>(null);
  const lbRef = useRef<LightboxHandle>(null);
  const roomRef = useRef<Room | null>(null);
  /** every reason input is held: the lightbox, the room list */
  const holds = useRef(new Set<string>());
  const hold = useCallback((reason: string, on: boolean) => {
    if (on) holds.current.add(reason); else holds.current.delete(reason);
    if (holds.current.size) document.documentElement.dataset.hold = "1";
    else delete document.documentElement.dataset.hold;
  }, []);

  const [pct, setPct] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  /** the welcome has begun to fade: the dock and the names come with the house */
  const [entered, setEntered] = useState(false);
  /** the house is taking a long time: the dock shows the names over the welcome */
  const [slow, setSlow] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">(activeVariant().startDark ? "dark" : "light");
  const [mapOpen, setMapOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stop, setStop] = useState(0);
  const [arrived, setArrived] = useState(true);
  const [orders, setOrders] = useState<string[][]>(LABEL_ORDER);
  const [phone, setPhone] = useState(false);
  const [stripWanted, setStripWanted] = useState(false);
  const [below, setBelow] = useState(false);
  const [pulse, setPulse] = useState(false);
  const stopRef = useRef(0);
  const moving = useRef(false);
  const queued = useRef<number | null>(null);
  const afterArrive = useRef<(() => void) | null>(null);

  useEffect(() => music.onChange(setPlaying), []);
  // Music is on by default, at low volume, and starts on the visitor's first tap, key or click
  // (a browser starts sound only from a real gesture). A stored "off" is respected.
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

  useEffect(() => {
    const q = matchMedia("(max-width: 760px)");
    const on = () => setPhone(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!ready || failed) return;
    const chapter = CHAPTERS[stop];
    const timer = setTimeout(() => track("studio_chapter_viewed", {
      chapter_id: chapter.id, chapter_name: chapter.stop, room: chapter.room, chapter_number: stop + 1,
    }), 700);
    return () => clearTimeout(timer);
  }, [stop, ready, failed]);

  /* ------------------------------------------------------------------------
     Moving: the only way from one stop to another.
  ------------------------------------------------------------------------ */
  const arrive = useCallback((to: number) => {
    moving.current = false;
    setArrived(true);
    performance.mark?.("step-arrive");
    roomRef.current?.drawFrieze(CHAPTERS[to]?.room, CHAPTERS[to]?.space);
    const after = afterArrive.current;
    afterArrive.current = null;
    after?.();
    const q = queued.current;
    queued.current = null;
    if (q !== null && q !== to) moveRef.current(q, "next");
  }, []);

  const moveRef = useRef<(to: number, method: Method) => void>(() => {});
  moveRef.current = (to: number, method: Method) => {
    const from = stopRef.current;
    to = Math.max(0, Math.min(N - 1, to));
    if (to === from) { afterArrive.current?.(); afterArrive.current = null; return; }
    if (moving.current) { if (queued.current === null) queued.current = to; return; }
    const r = roomRef.current;
    const live = !!r && r.introDone;
    const sameRoom = CHAPTERS[to].room === CHAPTERS[from].room;
    const still = CHAPTERS[to].view === CHAPTERS[from].view;
    const quick = reducedMotion();
    const kind: "still" | "walk" | "cut" = still ? "still"
      : sameRoom && Math.abs(to - from) === 1 && !turns(Math.max(to, from)) && !quick ? "walk" : "cut";
    track("studio_step", { from, to, method });
    performance.mark?.("step-start");
    stopRef.current = to;
    moving.current = true;
    setStop(to);
    setArrived(false);
    if (!live || kind === "still") {
      if (live) r!.goStop(to, "cut", () => {});
      // (a sheet over the same view: the next frame has it)
      requestAnimationFrame(() => arrive(to));
      return;
    }
    if (kind === "walk") { r!.goStop(to, "walk", () => arrive(to), 0.7); return; }
    // a cut: a dip to Kajal, the room's name on it when the room changes, and out
    const veil = veilRef.current!;
    const name = veil.querySelector<HTMLElement>(".veil-name");
    if (name) name.textContent = sameRoom ? "" : roomAt(to).name;
    gsap.killTweensOf(veil);
    gsap.timeline()
      .to(veil, { autoAlpha: 1, duration: quick ? 0 : 0.22, ease: "power1.in" })
      .add(() => r!.goStop(to, "cut", () => {}))
      .to(veil, { autoAlpha: 0, duration: quick ? 0 : 0.32, ease: "power1.out" }, quick ? undefined : "+=0.06")
      .add(() => arrive(to));
  };

  const goWorks = useCallback(() => {
    const el = document.getElementById("works");
    if (el) scrollTo({ top: el.offsetTop, behavior: reducedMotion() ? "auto" : "smooth" });
  }, []);

  /** one stop on (+1) or back (−1); past the desk, the page of all her paintings */
  const step = useCallback((d: 1 | -1, method: Method) => {
    if (holds.current.size) return;
    const base = moving.current ? (queued.current ?? stopRef.current) : stopRef.current;
    if (d > 0 && base >= N - 1) { if (!moving.current) goWorks(); return; }
    if (moving.current) { if (queued.current === null) queued.current = Math.max(0, Math.min(N - 1, base + d)); return; }
    moveRef.current(stopRef.current + d, method);
  }, [goWorks]);

  /* ------------------------------------------------------------------------
     The room, and the one loop that draws it.
  ------------------------------------------------------------------------ */
  useEffect(() => {
    motion();
    const prevRestoration = history.scrollRestoration;
    const html = document.documentElement;
    const prevData = { room: html.dataset.room, hud: html.dataset.hud };
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    const reduce = reducedMotion();
    const canvas = canvasRef.current!;
    let room: Room | null = null;
    let killed = false;
    let dead = false;

    const frame = () => {
      if (document.hidden || dead) return;
      try { room?.renderFrame(performance.now()); } catch (error) { fail(error); }
    };
    gsap.ticker.add(frame);

    const loadStarted = performance.now();
    track("studio_load_started");
    const fail = (why: unknown) => {
      if (killed || dead) return;
      track("studio_load_failed", { reason: why instanceof Error && why.message === "timed out" ? "timeout" : "asset_or_render_error", duration_ms: Math.round(performance.now() - loadStarted) });
      dead = true;
      console.error("[room]", why);
      room?.dispose();
      if (roomRef.current === room) roomRef.current = null;
      room = null;
      html.dataset.room = "off";
      html.dataset.hud = "";
      setFailed(true);
    };
    const timeout = setTimeout(() => fail(new Error("timed out")), 60_000);
    const slowT = setTimeout(() => { if (!killed) setSlow(true); }, 6_000);

    const order = () => { if (room && !dead) setOrders(room.wallOrder()); };
    import("@/lib/room/Room").then(({ Room }) => {
      if (killed || dead) return;
      const r = new Room();
      room = r;
      roomRef.current = r;
      return r.init(canvas, {
        manifestUrl: "/art/manifest.json",
        reducedMotion: reduce,
        onProgress: (p) => { if (!killed && !dead) setPct(Math.round(p * 100)); },
        onIntroFinished: () => {
          if (killed || dead) return;
          // a visitor who moved on over the welcome (the house was slow) is where they went
          if (stopRef.current !== 0) r.goStop(stopRef.current, "cut", () => {});
          track("studio_ready", { duration_ms: Math.round(performance.now() - loadStarted) });
          setReady(true);
        },
        onArtwork: (id) => {
          const w = BY_ID.get(id);
          if (w) track("painting_clicked", { ...paintingProperties(w), source: "studio_canvas" });
          lbRef.current?.open(id, null, WALK_ORDER);
        },
        onHoverArt: (id) => roomCursorLabel(id ? "View" : null),
      }).then(() => {
        if (killed || dead) return;
        clearTimeout(timeout);
        clearTimeout(slowT);
        setLoaded(true);
        order();
        if (process.env.NODE_ENV !== "production" || new URLSearchParams(location.search).has("qa")) devSwitches();
      });
    }).catch((e) => { clearTimeout(timeout); fail(e); });

    /* ?qa=1: the screenshot driver's handle. go(id) lands on a stop at once; step(±1) is a real step. */
    const devSwitches = () => {
      const q = new URLSearchParams(location.search);
      (window as unknown as { __studio?: object }).__studio = {
        go(id: string) {
          const i = CHAPTERS.findIndex((c) => c.id === id);
          if (i < 0) return false;
          moving.current = false; queued.current = null;
          stopRef.current = i;
          setStop(i);
          setArrived(false);
          room?.goStop(i, "cut", () => {});
          requestAnimationFrame(() => arrive(i));
          return i;
        },
        step: (d: 1 | -1) => step(d, "qa"),
        get stop() { return stopRef.current; },
        get moving() { return moving.current; },
        mode: (m: "light" | "dark") => setMode(m),
        music,
      };
      if (q.get("mode") === "dark") setMode("dark");
      if (q.has("fast")) requestAnimationFrame(() => preRef.current?.finish());
    };

    const onContextLost = (e: Event) => { e.preventDefault(); fail(new Error("WebGL context lost")); };
    canvas.addEventListener("webglcontextlost", onContextLost);

    /* The header's ink: light where the room behind the name is dark, dark where it is light,
       read from the frame as drawn, every little while and once on arriving. */
    let inkAt = 0, wasLanded = false, inkLight: boolean | null = null, inkStop = -1;
    const ink = () => {
      const r = room;
      if (!r || dead || !r.introDone || scrollY > innerHeight * 0.5) return;
      const now = performance.now();
      const landed = r.landed, came = landed && !wasLanded;
      wasLanded = landed;
      if (!came && now - inkAt < 400) return;
      inkAt = now;
      const b = document.querySelector<HTMLElement>(".hud .brand")?.getBoundingClientRect();
      if (!b || !b.width) return;
      const at = stopRef.current;
      r.readLumaBehind("ink", { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }, (l) => {
        inkStop = at;
        const light = inkLight === null ? l < 0.5 : inkLight ? l < 0.56 : l < 0.44;
        if (light !== inkLight) { inkLight = light; html.dataset.hud = light ? "light" : "dark"; }
      }, came || at !== inkStop);
    };
    gsap.ticker.add(ink);

    // a turned phone or a resized window: the pins' numbers follow the new framings
    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(order, 250); };
    addEventListener("resize", onResize);

    // the collage below and the lightbox share one click path
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const link = t.closest<HTMLAnchorElement>('a[href^="#"]');
      if (link && link.getAttribute("href")!.length > 1 && !link.closest(".brand")) {
        const el = document.querySelector<HTMLElement>(link.getAttribute("href")!);
        if (el) { e.preventDefault(); scrollTo({ top: el.offsetTop, behavior: reduce ? "auto" : "smooth" }); return; }
      }
      const a = t.closest<HTMLElement>("[data-work]");
      if (!a) return;
      e.preventDefault();
      const seq = a.closest("#works")
        ? [...document.querySelectorAll<HTMLElement>("#works [data-work]")].map((x) => x.dataset.work!)
        : undefined;
      lbRef.current?.open(a.dataset.work!, a.querySelector("img"), seq);
    };
    document.addEventListener("click", onDocClick);

    return () => {
      killed = true;
      clearTimeout(timeout);
      clearTimeout(slowT);
      clearTimeout(rt);
      gsap.ticker.remove(frame);
      gsap.ticker.remove(ink);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      history.scrollRestoration = prevRestoration;
      for (const k of ["room", "hud"] as const) {
        if (prevData[k] === undefined) delete html.dataset[k]; else html.dataset[k] = prevData[k];
      }
      removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocClick);
      room?.dispose();
      if (roomRef.current === room) roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // on a slow device a move or a fade still ends on time (wall clock): no lag smoothing in the studio
  useEffect(() => {
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.lagSmoothing(500, 33);
  }, []);

  const onLift = useCallback(() => { setEntered(true); roomRef.current?.playIntro(); }, []);
  const onPreDone = useCallback(() => {}, []);
  useEffect(() => { if (failed) setEntered(true); }, [failed]);

  // a watchdog for the visible tab: if the welcome has not gone well after loading, end it
  useEffect(() => {
    if (!loaded || ready || failed) return;
    const t = window.setTimeout(() => preRef.current?.finish(), 8_000);
    return () => clearTimeout(t);
  }, [loaded, ready, failed]);

  // the dock's Next asks once to be pressed, a second after the house appears
  useEffect(() => {
    if (!ready || failed) return;
    const a = window.setTimeout(() => setPulse(true), 1000);
    const b = window.setTimeout(() => setPulse(false), 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [ready, failed]);

  /* ------------------------------------------------------------------------
     Input: every gesture is one stop.
  ------------------------------------------------------------------------ */
  const inputOn = (entered || slow) && !failed;
  useEffect(() => {
    if (!inputOn) return;
    const html = document.documentElement;
    const inHouse = () => scrollY < 4;
    const own = (t: EventTarget | null) => !!(t as Element | null)?.closest?.(
      ".sdock, .rmap, .walk-panel, .lb, .hud a, .hud button, .studio-exit, .wall-pin, .wall-label, #works, .contact");

    // wheel and trackpad: one flick, one stop; held until the move ends and the wheel is quiet
    let acc = 0, locked = false, quietT = 0;
    const release = () => {
      if (moving.current) { quietT = window.setTimeout(release, 60); return; }
      acc = 0; locked = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (!inHouse() || holds.current.size || e.ctrlKey) return;
      const t = e.target as Element | null;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (t?.closest?.(".rmap, .walk-panel, .lb") || (sideways && t?.closest?.(".sd-strip"))) return;
      e.preventDefault();
      clearTimeout(quietT);
      quietT = window.setTimeout(release, 250);
      if (locked) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      acc += (sideways ? e.deltaX : e.deltaY) * unit;
      if (Math.abs(acc) >= 60) {
        const d = acc > 0 ? 1 : -1;
        acc = 0; locked = true;
        step(d, "wheel");
      }
    };
    // back up from the page below: the inertia that brought it here is not a step
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (y < 4 && lastY >= 4) { locked = true; clearTimeout(quietT); quietT = window.setTimeout(release, 250); }
      lastY = y;
      const vh = innerHeight;
      const k = clamp01(y / (vh * 0.85));
      const st = stageRef.current, hud = hudRef.current;
      if (st) { st.style.transform = k > 0 ? `scale(${1 - 0.2 * k})` : ""; st.style.borderRadius = k > 0 ? `${28 * k}px` : ""; }
      if (hud) { hud.style.opacity = String(1 - clamp01(y / (vh * 0.5))); hud.inert = y > vh * 0.25; }
      setBelow(y > 40);
      roomRef.current?.setVisible(y < vh);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || !inHouse() || holds.current.size) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], dialog[open]")) return;
      const next = ["ArrowRight", "ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !t?.closest?.("button, a"));
      const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
      if (!next && !prev) return;
      e.preventDefault();
      if (!e.repeat) step(next ? 1 : -1, "key");
    };

    // a finger: a swipe either way is one stop (left or up is on); a tap is the room's
    const sw = { on: false, x: 0, y: 0, t: 0 };
    const onTouchStart = (e: TouchEvent) => {
      sw.on = false;
      if (e.touches.length !== 1 || !inHouse() || holds.current.size || own(e.target)) return;
      const t = e.touches[0];
      Object.assign(sw, { on: true, x: t.clientX, y: t.clientY, t: performance.now() });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!sw.on) return;
      // the house never scrolls away under a finger, nor pulls to refresh
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!sw.on) return;
      sw.on = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sw.x, dy = t.clientY - sw.y, dt = Math.max(1, performance.now() - sw.t);
      const across = Math.abs(dx) > Math.abs(dy);
      const v = (across ? Math.abs(dx) : Math.abs(dy)) / dt;
      const far = across ? Math.abs(dx) > 40 : Math.abs(dy) > 60;
      if (!far && !(v > 0.4 && Math.max(Math.abs(dx), Math.abs(dy)) > 24)) return;
      step((across ? dx : dy) < 0 ? 1 : -1, "swipe");
    };

    addEventListener("wheel", onWheel, { passive: false, capture: true });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("keydown", onKey);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", () => { sw.on = false; }, { passive: true });
    html.dataset.walk = "stops";
    onScroll();
    return () => {
      clearTimeout(quietT);
      removeEventListener("wheel", onWheel, { capture: true });
      removeEventListener("scroll", onScroll);
      removeEventListener("keydown", onKey);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      delete html.dataset.walk;
    };
  }, [inputOn, step]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    if (loaded && !failed) roomRef.current?.setMode(mode);
  }, [mode, loaded, failed]);

  // her words for a stop (not the room's line, which the dock carries): one fixed panel, desktop
  useEffect(() => {
    const slot = copyRef.current;
    if (!slot) return;
    const panels = [...slot.querySelectorAll<HTMLElement>(".copy-panel")];
    const quick = reducedMotion();
    for (const p of panels) {
      const on = arrived && ready && p.dataset.i === String(stop);
      if ((p.dataset.on === "1") === on) continue;
      p.dataset.on = on ? "1" : "0";
      gsap.to(p, { autoAlpha: on ? 1 : 0, duration: quick ? 0 : on ? 0.25 : 0.12, ease: "power1.out", overwrite: true });
    }
  }, [stop, arrived, ready]);

  // the village line along the foot follows the walk (CSS reads --walk)
  useEffect(() => { villageRef.current?.style.setProperty("--walk", String(progressOf(stop))); }, [stop]);

  const [lbOpen, setLbOpen] = useState(false);
  const onLightbox = useCallback((open: boolean) => { hold("lightbox", open); setLbOpen(open); }, [hold]);
  useEffect(() => { hold("map", mapOpen); }, [mapOpen, hold]);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const openWork = useCallback((id: string, source: string) => {
    const w = BY_ID.get(id);
    if (w) track("painting_clicked", { ...paintingProperties(w), source });
    lbRef.current?.open(id, null, WALK_ORDER);
  }, []);
  const showWorks = (f: WorksFilter) => {
    dispatchEvent(new CustomEvent(WORKS_FILTER, { detail: f }));
    setTimeout(goWorks, 60);
  };
  const goStop = useCallback((i: number) => {
    // the room list holds input while it is open: let go first
    hold("map", false);
    setMapOpen(false);
    if (scrollY > 4) scrollTo({ top: 0 });
    moveRef.current(i, "map");
  }, [hold]);

  const here = CHAPTERS[stop]?.id;
  const panel = arrived && (here === "about" || here === "desk") ? here : "";
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (panel) d.panel = panel; else delete d.panel;
    return () => { delete document.documentElement.dataset.panel; };
  }, [panel]);

  // a link to one painting (its page's "See it in her studio", or /#work=<id>): go to its wall, open it there
  useEffect(() => {
    if (!ready || failed) return;
    const hash = location.hash;
    if (hash === "#works") { setTimeout(goWorks, 300); return; }
    const m = /^#work=([a-z0-9-]+)$/.exec(hash);
    if (!m || !BY_ID.has(m[1])) return;
    const id = m[1];
    history.replaceState(null, "", location.pathname + location.search);
    const i = stopOf(id);
    if (i < 0) { lbRef.current?.open(id, null, WALK_ORDER); return; }
    afterArrive.current = () => lbRef.current?.open(id, null, WALK_ORDER);
    moveRef.current(i, "link");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed]);

  const dockOn = (entered || slow) && !failed && !below && !lbOpen;
  const order = orders[stop] ?? LABEL_ORDER[stop];

  return (
    <>
      <div className="stage" ref={stageRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      {/* the room dims under About her's sheet; the dip to Kajal between rooms */}
      <div className="stage-dim" data-on={here === "about" && arrived ? "1" : "0"} aria-hidden="true" />
      <div className="stage-veil" ref={veilRef} aria-hidden="true"><span className="veil-name" /></div>

      <Preloader ref={preRef} pct={pct} loaded={loaded} failed={failed} slow={slow && !loaded}
                 onLift={onLift} onDone={onPreDone} />

      {/* always on screen, from the first frame: the way back to the website */}
      <a className="studio-exit" href="/" aria-label="Exit the studio and go back to the website">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        <span>Exit the studio</span>
      </a>

      <header className="hud" ref={hudRef} inert={!entered} data-state={entered ? "live" : "pre"}>
        <div className="hud-top">
          <a className="brand" href="#top" aria-label="Dr Dolly Prasad, back to the door"
             onClick={(e) => { e.preventDefault(); if (scrollY > 4) scrollTo({ top: 0, behavior: "smooth" }); else goStop(0); }}>
            <div data-brand-target className="brand-target" />
          </a>
          <span className="mask hud-map"><button type="button" className="pill hud-pill map-btn" aria-expanded={mapOpen} aria-haspopup="dialog"
                  onClick={() => setMapOpen((o) => !o)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16" /></svg>The rooms</button></span>
          <button type="button" className="diya-btn music-btn" aria-pressed={playing}
                  aria-label={playing ? "Pause the music" : "Play the music"} onClick={() => music.toggle()}>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M12 22.5V9.5l11-2.5v12.5" className="dish-line" />
              <circle cx="9.5" cy="22.5" r="2.8" className="dish" />
              <circle cx="20.5" cy="19.5" r="2.8" className="dish" />
              {!playing && <path d="M6 6l20 20" className="dish-line" />}
            </svg>
          </button>
        </div>
      </header>

      {/* her words at a stop, where there are any (the room's line is in the dock) */}
      <div className="copy" ref={copyRef} aria-hidden="true">
        {CHAPTERS.map((c, i) => {
          const body = c.body && c.body !== ROOM_LINE[c.room as RoomName] ? c.body : undefined;
          if (!body && !c.quote && !c.verse) return null;
          return (
            <div className="copy-panel" data-i={i} data-on="0" key={c.id}>
              {c.verse && <p className="poem">{c.verse.split("\n").map((ln, k) => <span className="poem-line" key={k}>{ln}</span>)}</p>}
              {body && (c.bodyUntil ? <Until until={c.bodyUntil}><p className="lede">{body}</p></Until> : <p className="lede">{body}</p>)}
              {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
            </div>
          );
        })}
      </div>

      <div className="village" ref={villageRef} aria-hidden="true" />

      <AboutHer open={entered && panel === "about"} />
      <Desk open={entered && panel === "desk"} />

      <WallLabels room={roomRef} stop={stop} arrived={arrived && ready} live={ready && !failed} phone={phone}
                  order={order} onOpen={(id) => openWork(id, "studio_wall_label")} onStrip={setStripWanted} />

      {failed && (
        <p className="room-off lab" role="status">
          The room could not be opened on this device. The paintings are all below.
        </p>
      )}

      {/* the house: one screen. Each stop's words, for assistive tech and search */}
      <main className="chapters" id="top">
        <section className="sec" aria-label="The studio">
          {CHAPTERS.map((c) => (c.body || c.verse || c.quote) ? (
            <div className="chapter-text" key={c.id}>
              <h2 className="lab">{c.eyebrow}</h2>
              {c.verse && <p className="poem">{c.verse}</p>}
              {c.body && (c.bodyUntil ? <Until until={c.bodyUntil}><p className="lede">{c.body}</p></Until> : <p className="lede">{c.body}</p>)}
              {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
            </div>
          ) : null)}
        </section>
      </main>

      <Dock stop={stop} order={order} strip={phone || stripWanted} visible={dockOn} pulse={pulse} roomsOpen={mapOpen}
            onPrev={() => step(-1, "prev")} onNext={() => step(1, "next")}
            onOpen={(id) => openWork(id, "studio_strip")} onRooms={() => setMapOpen((o) => !o)} />
      <RoomMap open={mapOpen} active={stop} onClose={closeMap} onGo={goStop} onWorks={() => { closeMap(); showWorks("all"); }} />
      <Lightbox ref={lbRef} dims={dims} onOpenChange={onLightbox} />
      <Cursor live={ready || failed} />
    </>
  );
}

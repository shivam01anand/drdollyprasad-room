"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Room } from "@/lib/room/Room";
import { motion, gsap, reducedMotion } from "@/lib/motion";
import Preloader, { type PreloaderHandle } from "./Preloader";
import Lightbox, { type LightboxHandle } from "./Lightbox";
import Cursor, { roomCursorLabel } from "./Cursor";
import WallLabels from "./WallLabels";
import Until from "./Until";
import RoomMap from "./RoomMap";
import Dock from "./Dock";
import KnowMore, { OpeningCard } from "./AboutHer";
import Desk from "./Desk";
import { WORKS_FILTER, type WorksFilter } from "./Works";
import * as music from "@/lib/music";
import { CHAPTERS } from "@/lib/chapters";
import { stopsFor, isPhoneLayout, roomsOf, isSeries, roomLine, WALK_ORDER, stopOfWork, type Stop } from "@/lib/stops";
import { activeVariant } from "@/lib/room/variants";
import { BY_ID } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";

type Dims = Record<string, { w: number; h: number }>;
type Method = "next" | "prev" | "swipe" | "wheel" | "key" | "map" | "strip" | "link" | "qa" | "enter";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const HOME = "/";

/**
 * The studio, painting first (art direction V3, 29 Oct 2026). The visitor is always at one stop:
 * on a phone one painting (the small panels in stacked pairs), on a wide screen a group of at most
 * three. Every input (a swipe, one wheel flick, an arrow key, Previous and Next, a room in the
 * list) moves exactly one stop or goes straight to one. Along a wall the camera trucks (0.5 s);
 * to the next wall of a room it turns (0.6 s); between rooms the page dips to Kajal with the
 * room's name and the village line drawing under it (under 1 s). "← Home" is always top left.
 */
export default function Studio({ dims }: { dims: Dims }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<PreloaderHandle>(null);
  const lbRef = useRef<LightboxHandle>(null);
  const roomRef = useRef<Room | null>(null);
  /** every reason input is held: the lightbox, the room list, Know more */
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
  const [entered, setEntered] = useState(false);
  const [slow, setSlow] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">(activeVariant().startDark ? "dark" : "light");
  const [mapOpen, setMapOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stop, setStop] = useState(0);
  const [arrived, setArrived] = useState(true);
  /** the walk: a phone's (painting by painting) or a wide screen's (groups) */
  const [walkPhone, setWalkPhone] = useState(false);
  /** the phone's chrome (≤ 760 px wide) */
  const [phone, setPhone] = useState(false);
  const [stripWanted, setStripWanted] = useState(false);
  const [below, setBelow] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [letter, setLetter] = useState<{ room: string; line: string } | null>(null);
  const stops = useMemo(() => stopsFor(walkPhone), [walkPhone]);
  const stopsRef = useRef<Stop[]>(stops);
  stopsRef.current = stops;
  const N = stops.length;
  const stopRef = useRef(0);
  const moving = useRef(false);
  const queued = useRef<number | null>(null);
  const afterArrive = useRef<(() => void) | null>(null);

  useEffect(() => music.onChange(setPlaying), []);
  // Music is on by default, at low volume, and starts on the visitor's first tap, key or click
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
    setWalkPhone(isPhoneLayout(innerWidth, innerHeight));
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!ready || failed) return;
    const s = stops[stop];
    if (!s) return;
    const timer = setTimeout(() => track("studio_chapter_viewed", {
      chapter_id: s.id, chapter_name: s.works.map((id) => BY_ID.get(id)?.title).join(" · ") || s.chapter.stop,
      room: s.room, chapter_number: stop + 1,
    }), 700);
    return () => clearTimeout(timer);
  }, [stop, ready, failed, stops]);

  /* ------------------------------------------------------------------------
     Moving: the only way from one stop to another.
  ------------------------------------------------------------------------ */
  const letterT = useRef(0);
  const arrive = useCallback((to: number) => {
    moving.current = false;
    setArrived(true);
    performance.mark?.("step-arrive");
    const S = stopsRef.current, s = S[to];
    roomRef.current?.drawFrieze(s?.room, s?.space);
    // the room's line, as lettering on the wall at its first painting, for 3 s
    const run = roomsOf(S).find((r) => r.first === to);
    clearTimeout(letterT.current);
    if (run && isSeries(run) && roomLine(run.name)) {
      setLetter({ room: run.name, line: roomLine(run.name)! });
      letterT.current = window.setTimeout(() => setLetter(null), 3000);
    } else setLetter(null);
    const after = afterArrive.current;
    afterArrive.current = null;
    after?.();
    const q = queued.current;
    queued.current = null;
    if (q !== null && q !== to) moveRef.current(q, "next");
  }, []);

  const moveRef = useRef<(to: number, method: Method) => void>(() => {});
  moveRef.current = (to: number, method: Method) => {
    const S = stopsRef.current;
    const from = stopRef.current;
    to = Math.max(0, Math.min(S.length - 1, to));
    if (to === from) { afterArrive.current?.(); afterArrive.current = null; return; }
    if (moving.current) { if (queued.current === null) queued.current = to; return; }
    const r = roomRef.current;
    const live = !!r && r.introDone;
    const quick = reducedMotion();
    const kind = live && !quick ? r!.moveKind(from, to) : "cut";
    track("studio_step", { from, to, method });
    performance.mark?.("step-start");
    stopRef.current = to;
    moving.current = true;
    clearTimeout(letterT.current);
    setLetter(null);
    setStop(to);
    setArrived(false);
    if (!live) { requestAnimationFrame(() => arrive(to)); return; }
    if (kind === "truck") { r!.goStop(to, "walk", () => arrive(to), 0.5); return; }
    if (kind === "turn") { r!.goStop(to, "walk", () => arrive(to), 0.6); return; }
    // a cut: a dip to Kajal; a new room says its name, with the village line drawn under it
    const veil = veilRef.current!;
    const newRoom = S[to].room !== S[from].room;
    const runs = roomsOf(S), series = runs.filter(isSeries);
    const run = runs.find((x) => to >= x.first && to <= x.last);
    const n = run ? series.findIndex((x) => x.name === run.name) : -1;
    const kicker = veil.querySelector<HTMLElement>(".veil-kicker")!, name = veil.querySelector<HTMLElement>(".veil-name")!;
    const border = veil.querySelector<HTMLElement>(".veil-border")!;
    kicker.textContent = newRoom && n >= 0 ? `Room ${n + 1} of ${series.length}` : "";
    name.textContent = newRoom ? S[to].room : "";
    veil.dataset.room = newRoom ? "1" : "0";
    gsap.killTweensOf([veil, border]);
    const tl = gsap.timeline();
    tl.to(veil, { autoAlpha: 1, duration: quick ? 0 : 0.22, ease: "power1.in" })
      .add(() => r!.goStop(to, "cut", () => {}));
    if (newRoom && !quick) {
      tl.fromTo(border, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power1.inOut" }, ">")
        .to({}, { duration: 0.05 });
    } else tl.to({}, { duration: quick ? 0 : 0.06 });
    tl.to(veil, { autoAlpha: 0, duration: quick ? 0 : 0.3, ease: "power1.out" })
      .add(() => arrive(to));
  };

  const goHome = useCallback(() => { location.assign(HOME); }, []);

  /** one stop on (+1) or back (−1); past the desk, home */
  const step = useCallback((d: 1 | -1, method: Method) => {
    if (holds.current.size) return;
    const last = stopsRef.current.length - 1;
    const base = moving.current ? (queued.current ?? stopRef.current) : stopRef.current;
    if (d > 0 && base >= last) { if (!moving.current && method !== "wheel" && method !== "swipe") goHome(); return; }
    if (moving.current) { if (queued.current === null) queued.current = Math.max(0, Math.min(last, base + d)); return; }
    moveRef.current(stopRef.current + d, method);
  }, [goHome]);

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
        // a turned phone: the other walk, at the same painting
        onLayout: (p, index) => {
          stopsRef.current = stopsFor(p);
          stopRef.current = index;
          moving.current = false; queued.current = null;
          setWalkPhone(p);
          setStop(index);
          setArrived(true);
        },
      }).then(() => {
        if (killed || dead) return;
        clearTimeout(timeout);
        clearTimeout(slowT);
        setLoaded(true);
        if (process.env.NODE_ENV !== "production" || new URLSearchParams(location.search).has("qa")) devSwitches();
      });
    }).catch((e) => { clearTimeout(timeout); fail(e); });

    /* ?qa=1: the screenshot driver's handle. go(i) lands on a stop at once; step(±1) is a real step. */
    const devSwitches = () => {
      const q = new URLSearchParams(location.search);
      (window as unknown as { __studio?: object }).__studio = {
        go(i: number | string) {
          const S = stopsRef.current;
          const k = typeof i === "number" ? i : S.findIndex((s) => s.id === i);
          if (k < 0 || k >= S.length) return false;
          moving.current = false; queued.current = null;
          stopRef.current = k;
          setStop(k);
          setArrived(false);
          room?.goStop(k, "cut", () => {});
          requestAnimationFrame(() => arrive(k));
          return k;
        },
        step: (d: 1 | -1) => step(d, "qa"),
        get stop() { return stopRef.current; },
        get stops() { return stopsRef.current.map((s) => ({ id: s.id, room: s.room, works: s.works })); },
        get moving() { return moving.current; },
        measure: () => room?.measureStops(),
        more: (on: boolean) => setMore(on),
        mode: (m: "light" | "dark") => setMode(m),
        music,
      };
      if (q.get("mode") === "dark") setMode("dark");
      if (q.has("fast")) requestAnimationFrame(() => preRef.current?.finish());
    };

    const onContextLost = (e: Event) => { e.preventDefault(); fail(new Error("WebGL context lost")); };
    canvas.addEventListener("webglcontextlost", onContextLost);

    // the collage below and the lightbox share one click path
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const link = t.closest<HTMLAnchorElement>('a[href^="#"]');
      if (link && link.getAttribute("href")!.length > 1) {
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
      gsap.ticker.remove(frame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      history.scrollRestoration = prevRestoration;
      for (const k of ["room", "hud"] as const) {
        if (prevData[k] === undefined) delete html.dataset[k]; else html.dataset[k] = prevData[k];
      }
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

  useEffect(() => {
    if (!loaded || ready || failed) return;
    const t = window.setTimeout(() => preRef.current?.finish(), 8_000);
    return () => clearTimeout(t);
  }, [loaded, ready, failed]);

  // the way in asks once to be pressed, a second after the house appears
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
      ".vdock, .ocard, .rmap, .walk-panel, .lb, .vhead, .plaque, #works, .contact");

    let acc = 0, locked = false, quietT = 0;
    const release = () => {
      if (moving.current) { quietT = window.setTimeout(release, 60); return; }
      acc = 0; locked = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (!inHouse() || holds.current.size || e.ctrlKey) return;
      const t = e.target as Element | null;
      if (t?.closest?.(".rmap, .walk-panel, .lb")) return;
      e.preventDefault();
      clearTimeout(quietT);
      quietT = window.setTimeout(release, 250);
      if (locked) return;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      acc += (sideways ? e.deltaX : e.deltaY) * unit;
      if (Math.abs(acc) >= 60) {
        const d = acc > 0 ? 1 : -1;
        acc = 0; locked = true;
        step(d, "wheel");
      }
    };
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
    const sw = { on: false, x: 0, y: 0, t: 0 };
    const onTouchStart = (e: TouchEvent) => {
      sw.on = false;
      if (e.touches.length !== 1 || !inHouse() || holds.current.size || own(e.target)) return;
      const t = e.touches[0];
      Object.assign(sw, { on: true, x: t.clientX, y: t.clientY, t: performance.now() });
    };
    const onTouchMove = (e: TouchEvent) => { if (sw.on && e.cancelable) e.preventDefault(); };
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
    const onCancel = () => { sw.on = false; };
    document.addEventListener("touchcancel", onCancel, { passive: true });
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
      document.removeEventListener("touchcancel", onCancel);
      delete html.dataset.walk;
    };
  }, [inputOn, step]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    if (loaded && !failed) roomRef.current?.setMode(mode);
  }, [mode, loaded, failed]);

  const [lbOpen, setLbOpen] = useState(false);
  const onLightbox = useCallback((open: boolean) => { hold("lightbox", open); setLbOpen(open); }, [hold]);
  useEffect(() => { hold("map", mapOpen); }, [mapOpen, hold]);
  useEffect(() => { hold("more", more); }, [more, hold]);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const closeMore = useCallback(() => setMore(false), []);
  const openWork = useCallback((id: string, source: string) => {
    const w = BY_ID.get(id);
    if (w) track("painting_clicked", { ...paintingProperties(w), source });
    lbRef.current?.open(id, null, WALK_ORDER);
  }, []);
  const showWorks = (f: WorksFilter) => {
    dispatchEvent(new CustomEvent(WORKS_FILTER, { detail: f }));
    setTimeout(() => {
      const el = document.getElementById("works");
      if (el) scrollTo({ top: el.offsetTop, behavior: reducedMotion() ? "auto" : "smooth" });
    }, 60);
  };
  const goStop = useCallback((i: number) => {
    hold("map", false);
    setMapOpen(false);
    if (scrollY > 4) scrollTo({ top: 0 });
    moveRef.current(i, "map");
  }, [hold]);
  const enter = useCallback(() => {
    hold("more", false);
    setMore(false);
    if (stopRef.current === 0) moveRef.current(1, "enter");
  }, [hold]);

  const here = stops[stop]?.id;
  const opening = here === "presence";
  const panel = arrived && here === "desk" ? "desk" : opening ? "about" : "";
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (panel) d.panel = panel; else delete d.panel;
    return () => { delete document.documentElement.dataset.panel; };
  }, [panel]);

  // a link to one painting (its page's "See it in her studio", or /#work=<id>): go to it, open it there
  useEffect(() => {
    if (!ready || failed) return;
    const hash = location.hash;
    if (hash === "#works") { setTimeout(() => showWorks("all"), 300); return; }
    const m = /^#work=([a-z0-9-]+)$/.exec(hash);
    if (!m || !BY_ID.has(m[1])) return;
    const id = m[1];
    history.replaceState(null, "", location.pathname + location.search);
    const i = stopOfWork(stopsRef.current, id);
    if (i < 0) { lbRef.current?.open(id, null, WALK_ORDER); return; }
    afterArrive.current = () => lbRef.current?.open(id, null, WALK_ORDER);
    moveRef.current(i, "link");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed]);

  const live = (entered || slow) && !failed && !below && !lbOpen;
  const dockOn = live && !opening;

  return (
    <>
      <div className="stage" ref={stageRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      {/* a faint vignette over the house (never over the dock or the sheets) */}
      <div className="vignette" aria-hidden="true" />
      <div className="stage-dim" data-on={more ? "1" : "0"} aria-hidden="true" />
      <div className="stage-veil" ref={veilRef} aria-hidden="true" data-room="0">
        <div className="veil-in">
          <span className="veil-kicker" />
          <span className="veil-name" />
          <i className="veil-border" />
        </div>
      </div>

      <Preloader ref={preRef} pct={pct} loaded={loaded} failed={failed} slow={slow && !loaded}
                 onLift={onLift} onDone={onPreDone} />

      {/* always on screen, from the first frame: the way home, the rooms, the music */}
      <header className="vhead" ref={hudRef} data-state={entered ? "live" : "pre"}>
        <a className="vh-home" href={HOME} aria-label="Leave the studio and go to the home page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6.5L5.5 12l5.5 5.5" /></svg>
          <span>Home</span>
        </a>
        <div className="vh-right">
          {!failed && (
            <button type="button" className="vh-rooms map-btn" aria-expanded={mapOpen} aria-haspopup="dialog" inert={!entered}
                    onClick={() => setMapOpen((o) => !o)}>
              Rooms <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
            </button>
          )}
          <button type="button" className="vh-music music-btn" aria-pressed={playing} inert={!entered}
                  aria-label={playing ? "Pause the music" : "Play the music"} onClick={() => music.toggle()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {playing
                ? <path d="M6 9v6M10 6v12M14 8v8M18 10v4" />
                : <path d="M6 12h12" />}
            </svg>
          </button>
        </div>
      </header>

      {/* the room's line, as lettering at the top of the wall on its first painting (ours, never hers) */}
      <div className="wall-letter" data-on={letter && arrived && live ? "1" : "0"} aria-hidden="true">
        {letter && <><span className="wl-room">{letter.room}</span><span className="wl-line">{letter.line}</span></>}
      </div>

      <OpeningCard open={live && opening} onEnter={enter} onMore={() => setMore(true)} />
      <KnowMore open={entered && more} onClose={closeMore} onEnter={enter} />
      <Desk open={live && panel === "desk"} />

      <WallLabels room={roomRef} stops={stops} stop={stop} arrived={arrived && ready} live={ready && !failed && !more} phone={phone}
                  onOpen={(id) => openWork(id, "studio_wall_label")} onStrip={setStripWanted} />

      {failed && (
        <p className="room-off lab" role="status">
          The room could not be opened on this device. The paintings are all below.
        </p>
      )}

      {/* the house: one screen. Each wall's words, for assistive tech and search */}
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

      <Dock stops={stops} stop={stop} phone={phone} strip={stripWanted} visible={dockOn} pulse={pulse}
            onPrev={() => step(-1, "prev")} onNext={() => step(1, "next")}
            onOpen={(id) => openWork(id, "studio_dock")} />
      <RoomMap stops={stops} open={mapOpen} active={stop} onClose={closeMap} onGo={goStop}
               onWorks={() => { closeMap(); showWorks("all"); }} />
      <Lightbox ref={lbRef} dims={dims} onOpenChange={onLightbox} />
      <Cursor live={ready || failed} />
    </>
  );
}

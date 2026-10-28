"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { Room } from "@/lib/room/Room";
import { motion, gsap, scrambleTo, reducedMotion } from "@/lib/motion";
import Preloader, { type PreloaderHandle } from "./Preloader";
import Lightbox, { type LightboxHandle } from "./Lightbox";
import Cursor, { roomCursorLabel } from "./Cursor";
import WallLabels from "./WallLabels";
import Until from "./Until";
import RoomMap, { roomsOfWalk } from "./RoomMap";
import AboutHer from "./AboutHer";
import Desk from "./Desk";
import { WORKS_FILTER, type WorksFilter } from "./Works";
import * as music from "@/lib/music";
import { CHAPTERS, WALK_ORDER, stopOf } from "@/lib/chapters";
import { activeVariant } from "@/lib/room/variants";
import { BY_ID } from "@/lib/works";
import { askPath } from "@/lib/studio-ask";
import { rebaseWalkScroll, walkProgress } from "@/lib/walk-layout";
import { paintingProperties, track } from "@/lib/analytics";

type Dims = Record<string, { w: number; h: number }>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function Studio({ dims }: { dims: Dims }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const villageRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<PreloaderHandle>(null);
  const lbRef = useRef<LightboxHandle>(null);
  const roomRef = useRef<Room | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  // Every reason scrolling is held, in one place: the intro, lightbox and menu.
  // Scroll runs only when none is left.
  const locks = useRef(new Set<string>(["intro"]));
  const lock = useCallback((reason: string, on: boolean) => {
    if (on) locks.current.add(reason); else locks.current.delete(reason);
    const l = lenisRef.current;
    if (!l) return;
    if (locks.current.size) l.stop(); else l.start();
  }, []);

  const [pct, setPct] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">(activeVariant().startDark ? "dark" : "light");
  /** one wall on or back (set by the scroll effect, which knows the stops) */
  const stepRef = useRef<(d: 1 | -1) => void>(() => {});
  /** the first visit's hint, on a phone: how to walk */
  const [coach, setCoach] = useState(false);
  /** the phone's sheet of stops */
  const [stops, setStops] = useState(false);
  /** the tanpura (lib/music.ts) */
  const [playing, setPlaying] = useState(false);
  useEffect(() => music.onChange(setPlaying), []);
  // Music is on by default, at low volume, and starts on the visitor's first tap, key or click
  // (a browser starts sound only from a real gesture; a wheel or a scroll is not one). A stored
  // "off" is respected (music.wanted reads it inside try/catch). Listeners stay until sound runs.
  useEffect(() => {
    const events = ["pointerup", "touchend", "keydown", "click"] as const;
    const off = () => events.forEach((e) => removeEventListener(e, wake, true));
    const wake = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".music-btn")) return;   // the toggle decides for itself
      if (!music.wanted()) { off(); return; }
      if (!music.isPlaying()) music.start();
      setTimeout(() => { if (music.wake()) off(); }, 250);
    };
    if (music.wanted()) events.forEach((e) => addEventListener(e, wake, true));
    return off;
  }, []);
  const [active, setActive] = useState(0);
  const [loadEpoch, setLoadEpoch] = useState(0);
  useEffect(() => {
    if (!ready || failed) return;
    const chapter = CHAPTERS[active];
    if (!chapter) return;
    const timer = setTimeout(() => track("studio_chapter_viewed", {
      chapter_id: chapter.id, chapter_name: chapter.stop, room: chapter.room, chapter_number: active + 1,
    }), 700);
    return () => clearTimeout(timer);
  }, [active, ready, failed]);
  const ranOnce = useRef(false);
  // once the header is live, scroll owns its inertness; before, React does
  const hudLive = useRef(false);
  useEffect(() => { hudLive.current = ready || failed; }, [ready, failed]);
  const clockRef = useRef<HTMLSpanElement>(null);

  // studio time — it is her studio, so it is her clock. Typed in by the
  // scrambler once the header is up, and re-typed when the minute turns.
  useEffect(() => {
    if (!ready && !failed) return;
    const f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" });
    let last = "";
    let tw: { kill(): void } | null = null;
    const t = () => {
      const now = f.format(new Date());
      if (now === last || !clockRef.current) return;
      last = now;
      tw?.kill();
      tw = scrambleTo(clockRef.current, now, { speed: 1, duration: 1 });
    };
    t();
    const i = setInterval(t, 5_000);
    return () => { clearInterval(i); tw?.kill(); };
  }, [ready, failed]);

  /* ------------------------------------------------------------------------
     The room, the scroll, and the one loop that drives both.
  ------------------------------------------------------------------------ */
  useEffect(() => {
    motion();
    // a replayed effect (Fast Refresh) builds a new engine: start its
    // lifecycle, and its preloader, from the beginning
    if (ranOnce.current) {
      setLoaded(false);
      setReady(false);
      setFailed(false);
      setPct(0);
      setLoadEpoch((n) => n + 1);
      hudLive.current = false;
    }
    ranOnce.current = true;
    const prevRestoration = history.scrollRestoration;
    const html = document.documentElement;
    const prevData = { room: html.dataset.room, hud: html.dataset.hud };
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    const reduce = reducedMotion();
    const canvas = canvasRef.current!;
    // the engine is its own chunk: it downloads alongside its textures
    // instead of holding up the first paint of the counter
    let room: Room | null = null;
    let killed = false;
    let dead = false;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: !reduce });
    lenisRef.current = lenis;
    lock("intro", true);

    // section geometry, measured when layout changes — never per scroll
    let centers: number[] = [];
    let worksTop = Infinity;
    let featTop = Infinity, featBottom = -Infinity;
    let vh = innerHeight;
    let lastActive = -1;
    let lastScroll = 0;
    const camT = (s: number) => walkProgress(s, centers);

    const apply = (s: number, sync = false) => {
      lastScroll = s;
      if (!dead) {
        const t = camT(s);
        if (sync) room?.syncScroll(t); else room?.scroll(t);
      }
      // the slider carries its own words: the fixed copy steps aside while
      // it is substantially on screen, so two layers of text never meet
      const copy = copyRef.current;
      if (copy) {
        const over = s + vh > featTop + vh * 0.2 && s < featBottom - vh * 0.2;
        if ((copy.dataset.yield === "1") !== over) copy.dataset.yield = over ? "1" : "0";
      }
      // the chapter whose centre is nearest owns the copy
      let idx = 0, best = Infinity;
      centers.forEach((c, i) => { const d = Math.abs(c - s); if (d < best) { best = d; idx = i; } });
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
        // the header's ink follows what it sits on: read from the room as drawn (ink, below); until
        // the room is there, or if it fails, the chapter's own word for it
        if (!room?.introDone || dead) document.documentElement.dataset.hud = CHAPTERS[idx]?.ink ?? "";
      }

      // the village line draws left to right with the walk (CSS reads --walk; static when motion is reduced)
      const vil = villageRef.current;
      if (vil && centers.length) {
        const a = centers[0], z = centers[centers.length - 1];
        vil.style.setProperty("--walk", String(clamp01(z > a ? (s - a) / (z - a) : 0)));
      }

      // past the plan, the live room shrinks into a held card …
      const st = stageRef.current, hud = hudRef.current;
      const end = centers.length ? centers[centers.length - 1] : Infinity;
      const k = clamp01((s - end) / (vh * 0.85));
      if (st) {
        st.style.transform = k > 0 ? `scale(${1 - 0.2 * k})` : "";
        st.style.borderRadius = k > 0 ? `${28 * k}px` : "";
      }
      // … and hands over to the collage
      const past = clamp01((s - (worksTop - vh)) / (vh * 0.6));
      if (hud) {
        hud.style.opacity = String(1 - past);
        if (hudLive.current) hud.inert = past > 0.5;
      }
      if (!dead) room?.setVisible(s < worksTop - 2);
    };

    const measure = () => {
      const before = { centers, worksTop };
      const oldHeight = vh;
      vh = innerHeight;
      const secs = [...(mainRef.current?.querySelectorAll<HTMLElement>(".sec") ?? [])];
      centers = secs.map((el) => el.offsetTop + el.offsetHeight / 2 - vh / 2);
      worksTop = document.getElementById("works")?.offsetTop ?? Infinity;
      const feat = mainRef.current?.querySelector<HTMLElement>(".sec-featured");
      if (feat) { featTop = feat.offsetTop; featBottom = feat.offsetTop + feat.offsetHeight; }
      const changed = oldHeight !== vh || before.worksTop !== worksTop ||
        before.centers.length !== centers.length || centers.some((c, i) => c !== before.centers[i]);
      if (!changed) return;

      const mapped = swipe.on ? lastScroll : rebaseWalkScroll(lastScroll, before, { centers, worksTop });
      const y = Number.isFinite(mapped) ? Math.max(0, mapped) : lastScroll;
      lenis.resize();
      if (Math.abs(y - lastScroll) > 0.5) lenis.scrollTo(y, { immediate: true, force: true });
      // Layout updates change the scroll coordinates, not the live camera pose.
      // In particular, a font/image resize must never finish a moving camera.
      apply(y);
      if (heading >= 0) {
        const target = heading < centers.length ? centers[heading] : worksTop;
        const remaining = Math.max(0.1, (glideEndsAt - performance.now()) / 1000);
        glideTo(target, heading, remaining);
      }
    };

    // As on the live site, a wheel/trackpad stays under the visitor's control.
    lenis.on("scroll", (l: Lenis) => apply(l.scroll));

    /* On a phone the walk is in the hand. A finger on the house moves it:
       drag up and the walk follows the finger toward the next wall (never
       further), let go and it carries on there at a walking pace — or, for a
       small nudge, settles back. A sideways swipe turns to the next wall (to
       the left) or the last (to the right), the room turning under the finger
       as it goes; so do the arrows at the screen's edges (stepRef). The
       carousel keeps its own sideways drags; past the last stop the page is
       the page again (the works, the contact) until a pull down from the top
       of the works brings the walk back. */
    const coarse = matchMedia("(pointer: coarse)").matches;
    const swipe = { on: false, back: false, mode: "" as "" | "walk" | "look", x0: 0, y0: 0, t0: 0, s0: 0, from: 0, lastY: 0, lastT: 0, v: 0 };
    let heading = -1;
    let glideEndsAt = 0;
    const nearestStop = (sc: number) => {
      let k = 0, best = Infinity;
      centers.forEach((c, i) => { const d = Math.abs(c - sc); if (d < best) { best = d; k = i; } });
      return k;
    };
    const glideTo = (y: number, i: number, dur = 1.6) => {
      heading = i;
      const quick = reducedMotion();
      glideEndsAt = performance.now() + (quick ? 0 : dur * 1000);
      html.dataset.gliding = "1";
      lenis.scrollTo(y, {
        duration: quick ? 0 : dur, immediate: quick, force: true,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        onComplete: () => { heading = -1; delete html.dataset.gliding; },
      });
    };
    const ownTouch = (e: TouchEvent) => (e as TouchEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
    const onTouchStart = (e: TouchEvent) => {
      swipe.on = false;
      if (!coarse || e.touches.length !== 1 || locks.current.size || !centers.length) return;
      const target = e.target as Element;
      // the carousel, the sheet, the labels and the header keep their own touches
      if (target.closest(".sec-featured, .sheet, .lb, .hud a, .hud button, .wall-label, .walk-panel")) return;
      const last = centers[centers.length - 1];
      const inWalk = lastScroll <= last + 4;
      const atWorks = !inWalk && Math.abs(lastScroll - worksTop) < 8;
      if (!inWalk && !atWorks) return;
      const t = e.touches[0], now = performance.now();
      const from = heading >= 0 ? heading : nearestStop(lastScroll);
      Object.assign(swipe, { on: true, back: atWorks, mode: "", x0: t.clientX, y0: t.clientY, t0: now, s0: lastScroll, from, lastY: t.clientY, lastT: now, v: 0 });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!swipe.on) return;
      const t = e.touches[0], now = performance.now();
      const dx = t.clientX - swipe.x0, dy = t.clientY - swipe.y0;
      if (!swipe.mode) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        swipe.mode = "walk";   // one gesture: vertical. A sideways drag does nothing.
      }
      if (swipe.back && dy < -6) { swipe.on = false; return; }
      if (e.cancelable) e.preventDefault();
      ownTouch(e);
      if (swipe.mode === "look") {
        // the head turns with the finger: a finger's width across the screen is a long look
        room?.look(-dx / (innerWidth * 0.5), -dy / (innerHeight * 0.8));
        return;
      }
      swipe.v = 0.7 * swipe.v + 0.3 * ((t.clientY - swipe.lastY) / Math.max(1, now - swipe.lastT));
      swipe.lastY = t.clientY; swipe.lastT = now;
      if (swipe.back) return;
      // the page follows the finger, from this stop as far as the next one either way
      const n = centers.length;
      const lo = swipe.from > 0 ? centers[swipe.from - 1] : centers[0];
      const hi = swipe.from < n - 1 ? centers[swipe.from + 1] : centers[n - 1];
      const y = Math.min(hi, Math.max(lo, swipe.s0 - dy * 1.15));
      heading = -1;
      lenis.scrollTo(y, { immediate: true, force: true });
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!swipe.on) return;
      swipe.on = false;
      if (swipe.mode === "look") {
        room?.endLook();
        ownTouch(e);
        // a sideways swipe turns to the next wall, or back to the last
        const t = e.changedTouches[0];
        const dx = t.clientX - swipe.x0;
        if (Math.abs(dx) > innerWidth * 0.16 && !swipe.back) {
          const next = swipe.from + (dx < 0 ? 1 : -1), n = centers.length;
          if (next >= 0 && next < n) glideTo(centers[next], next);
          else if (next >= n) glideTo(worksTop, n);
        }
        return;
      }
      if (swipe.mode !== "walk") return;      // a tap: the room and the page have it
      ownTouch(e);
      const t = e.changedTouches[0];
      const dy = t.clientY - swipe.y0, v = swipe.v;
      const n = centers.length;
      if (swipe.back) { if (dy > 40) glideTo(centers[n - 1], n - 1); return; }
      // a real swipe goes on to the next stop; a nudge settles back where it was
      const go = Math.abs(dy) > innerHeight * 0.12 || Math.abs(v) > 0.45;
      const next = go ? swipe.from + (dy < 0 ? 1 : -1) : swipe.from;
      if (next < 0) { glideTo(centers[0], 0, 0.9); return; }
      if (next >= n) glideTo(worksTop, n);
      else glideTo(centers[next], next, go ? 1.6 : 0.9);
    };

    // the edge arrows (and the keyboard's): one wall on, or one back
    stepRef.current = (d: 1 | -1) => {
      if (!centers.length || locks.current.size) return;
      const n = centers.length;
      const from = heading >= 0 ? heading : nearestStop(lastScroll);
      const next = Math.max(0, Math.min(n, from + d));
      if (next === from) return;
      if (next >= n) glideTo(worksTop, n); else glideTo(centers[next], next);
    };
    if (coarse) {
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd, { passive: true });
      document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }

    const frame = (time: number) => {
      if (document.hidden) return;
      lenis.raf(time * 1000);
      // the room keeps wall-clock deadlines, so it gets the wall clock
      if (dead) return;
      try { room?.renderFrame(performance.now()); } catch (error) { fail(error); }
    };
    gsap.ticker.add(frame);

    /* One terminal failure path: the room is torn down, the chapters
       collapse, and the paintings below become the page. */
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
      document.documentElement.dataset.room = "off";
      document.documentElement.dataset.hud = "";            // (the page under it now: its own ink)
      setFailed(true);
      // the room's own reasons end; an open lightbox keeps its hold
      locks.current.delete("intro");
      if (locks.current.size) lenis.stop(); else lenis.start();
      requestAnimationFrame(measure);
    };

    const timeout = setTimeout(() => fail(new Error("timed out")), 60_000);

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
          track("studio_ready", { duration_ms: Math.round(performance.now() - loadStarted) });
          setReady(true);
          lock("intro", false);
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
        setLoaded(true);
        measure();
        if (process.env.NODE_ENV !== "production") devSwitches();
      });
    }).catch((e) => { clearTimeout(timeout); fail(e); });

    /* development only: ?fast skips the preloader, ?shot=<chapter> lands on
       a beat, ?mode=dark lights the diya */
    const devSwitches = () => {
      const q = new URLSearchParams(location.search);
      // a handle for the screenshot driver: land on any chapter, instantly
      (window as unknown as { __studio?: object }).__studio = {
        go(id: string) {
          const el = document.querySelector<HTMLElement>(`[data-chapter='${id}']`) ?? document.querySelector<HTMLElement>(id);
          if (!el) return false;
          const y = Math.max(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2);
          lenis.scrollTo(y, { immediate: true, force: true });
          apply(y, true);
          return y;
        },
        top(y: number) { lenis.scrollTo(y, { immediate: true, force: true }); apply(y, true); },
        mode: (m: "light" | "dark") => setMode(m),
        music,
      };
      if (q.get("mode") === "dark") setMode("dark");
      if (!q.has("fast") && !q.has("shot")) return;
      requestAnimationFrame(() => {
        preRef.current?.finish();
        room?.rig.finishIntro();
        const shot = q.get("shot");
        if (!shot) return;
        const go = () => {
          const el = document.querySelector<HTMLElement>(`[data-chapter='${shot}']`) ?? document.querySelector<HTMLElement>(shot);
          if (!el) return;
          const y = el.offsetTop + el.offsetHeight / 2 - innerHeight / 2;
          lenis.scrollTo(Math.max(0, y), { immediate: true, force: true });
          apply(Math.max(0, y), true);
        };
        setTimeout(go, 400);
      });
    };

    const onContextLost = (e: Event) => { e.preventDefault(); fail(new Error("WebGL context lost")); };
    canvas.addEventListener("webglcontextlost", onContextLost);

    /* The header's ink: light lettering where the room behind it is dark, dark where it is light,
       read from the frame as drawn every little while as the walk goes (no chapter can know it: the
       same wall sits behind the header on one screen and not on another), and once more on arriving. */
    let inkAt = 0, wasLanded = false, inkLight: boolean | null = null, inkStop = -1;
    const ink = () => {
      const r = room;
      if (!r || dead || !r.introDone || lastScroll > (centers[centers.length - 1] ?? Infinity) + 2) return;
      const now = performance.now();
      const landed = r.landed, arrived = landed && !wasLanded;
      wasLanded = landed;
      if (!arrived && now - inkAt < 400) return;
      inkAt = now;
      const b = document.querySelector<HTMLElement>(".hud .brand")?.getBoundingClientRect();
      if (!b || !b.width) return;
      const at = lastActive;
      // (a frame is drawn for it on arriving, and whenever the walk is at a stop it has not read)
      r.readLumaBehind("ink", { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }, (l) => {
        inkStop = at;
        // (a band between the two, so a wall of middling light never sets it flickering)
        const light = inkLight === null ? l < 0.5 : inkLight ? l < 0.56 : l < 0.44;
        if (light !== inkLight) { inkLight = light; html.dataset.hud = light ? "light" : "dark"; }
        if (process.env.NODE_ENV !== "production") (window as unknown as { __ink?: object }).__ink = { l, light, at, t: performance.now() };
      }, arrived || at !== inkStop);
    };
    gsap.ticker.add(ink);

    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    addEventListener("resize", measure);
    document.fonts?.ready.then(() => { if (!killed) measure(); });
    measure();

    // the works collage and the lightbox share one click path
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement;
      // in-page links glide rather than jump
      const link = t.closest<HTMLAnchorElement>('a[href^="#"]');
      if (link && link.getAttribute("href")!.length > 1 && !link.closest(".brand")) {
        const el = document.querySelector<HTMLElement>(link.getAttribute("href")!);
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el, { duration: reduce ? 0 : 2.2, immediate: reduce, easing: (x: number) => 1 - Math.pow(1 - x, 4) });
          return;
        }
      }
      const a = t.closest<HTMLElement>("[data-work]");
      if (!a) return;
      e.preventDefault();
      // in the collage, Previous / Next follow what it shows, as filtered
      const seq = a.closest("#works")
        ? [...document.querySelectorAll<HTMLElement>("#works [data-work]")].map((x) => x.dataset.work!)
        : undefined;
      lbRef.current?.open(a.dataset.work!, a.querySelector("img"), seq);
    };
    document.addEventListener("click", onDocClick);

    return () => {
      killed = true;
      clearTimeout(timeout);
      gsap.ticker.remove(frame);
      gsap.ticker.remove(ink);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      history.scrollRestoration = prevRestoration;
      for (const k of ["room", "hud"] as const) {
        if (prevData[k] === undefined) delete html.dataset[k]; else html.dataset[k] = prevData[k];
      }
      ro.disconnect();
      removeEventListener("resize", measure);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      lenis.destroy();
      room?.dispose();
      if (roomRef.current === room) roomRef.current = null;
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, []);

  /* the preloader's callbacks are stable, so a re-render can never cut it off */
  const getHeroRect = useCallback(() => roomRef.current?.heroRect() ?? null, []);
  const onLift = useCallback(() => { roomRef.current?.playIntro(); }, []);
  const onPreDone = useCallback(() => {}, []);

  // a watchdog for the visible tab only: if the intro has not finished well
  // after loading, land everything in its final state
  useEffect(() => {
    if (!loaded || ready || failed) return;
    let t = 0;
    const arm = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        if (document.hidden) { arm(); return; }
        preRef.current?.finish();
        roomRef.current?.rig.finishIntro();
      }, 16_000);
    };
    arm();
    const onVis = () => { if (!document.hidden) arm(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", onVis); };
  }, [loaded, ready, failed]);

  /* the header comes in once the camera has landed */
  useLayoutEffect(() => {
    const hud = hudRef.current;
    if (!hud) return;
    // the server-rendered header waits hidden (globals.css) so it never shows
    // over the counter; from here the entrance tweens own it
    if (!reducedMotion()) {
      hud.querySelectorAll<HTMLElement>("[data-hud-text]").forEach((el) => { el.textContent = ""; });
      gsap.set(hud.querySelectorAll(".hud-pill"), { yPercent: 300, autoAlpha: 0 });
      gsap.set(hud.querySelectorAll(".diya-btn"), { yPercent: -180, autoAlpha: 0 });
      // the hint shares a corner with the preloader's "New Delhi"; the
      // chips would show as empty capsules while their text waits to type in
      gsap.set(hud.querySelectorAll(".hud-hint, .hud-meta, .hud-mail"), { autoAlpha: 0 });
    }
    hud.dataset.state = "live";
  }, []);

  useEffect(() => {
    if (!ready && !failed) return;
    const hud = hudRef.current!;
    const tweens: { kill(): void }[] = [];
    hud.querySelectorAll<HTMLElement>("[data-hud-text]").forEach((el) =>
      tweens.push(scrambleTo(el, el.dataset.hudText!, { speed: 2, duration: 0.8 })));
    const quick = reducedMotion();
    tweens.push(gsap.to(hud.querySelectorAll(".hud-pill"),
      { yPercent: 0, autoAlpha: 1, duration: quick ? 0 : 0.5, ease: "genEase", stagger: { amount: quick ? 0 : 0.5 } }));
    tweens.push(gsap.to(hud.querySelectorAll(".diya-btn"), { yPercent: 0, autoAlpha: 1, duration: quick ? 0 : 0.5, ease: "genEase", stagger: 0.08 }));
    tweens.push(gsap.to(hud.querySelectorAll(".hud-meta, .hud-mail"), { autoAlpha: 1, duration: quick ? 0 : 0.35, ease: "power1.out" }));
    tweens.push(gsap.to(hud.querySelector(".hud-hint"), { autoAlpha: 1, duration: quick ? 0 : 0.6, delay: quick ? 0 : 0.4 }));
    return () => tweens.forEach((t) => t.kill());
  }, [ready, failed]);

  /* one panel of copy at a time, in one fixed slot that the header can
     never overlap: the old panel goes, then the new one types in */
  useEffect(() => {
    const slot = copyRef.current;
    if (!slot || !ready) return;
    const panels = [...slot.querySelectorAll<HTMLElement>(".copy-panel")];
    const next = panels.find((p) => p.dataset.i === String(active));
    const showing = panels.filter((p) => p.dataset.on === "1" && p !== next);
    const reduce = reducedMotion();
    const tl = gsap.timeline();
    if (showing.length) {
      tl.to(showing, { autoAlpha: 0, y: -8, duration: reduce ? 0 : 0.25, ease: "power1.in" });
      tl.add(() => showing.forEach((p) => (p.dataset.on = "0")));
    }
    slot.dataset.has = next ? "1" : "0";

    if (next && next.dataset.on !== "1") {
      tl.add(() => { next.dataset.on = "1"; });
      tl.fromTo(next, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.55, ease: "power2.out" });
      const eyebrow = next.querySelector<HTMLElement>("[data-eyebrow]");
      if (eyebrow) tl.add(scrambleTo(eyebrow, eyebrow.dataset.eyebrow!, { speed: 2, duration: 0.8 }), "<");
      next.querySelectorAll<HTMLElement>("[data-line]").forEach((ln, i) =>
        tl.add(scrambleTo(ln, ln.dataset.line!, { speed: 0.6, duration: 1.1, anagram: true }), `<+${i === 0 ? 0.1 : 0.07}`));
    }
    return () => {
      tl.kill();
      // an interrupted hand-over must not strand a half-faded or half-typed panel
      for (const panel of panels) {
        gsap.set(panel, { autoAlpha: 0, y: 0 });
        panel.dataset.on = "0";
        panel.querySelectorAll<HTMLElement>("[data-eyebrow], [data-line]").forEach((el) => {
          el.textContent = el.dataset.eyebrow ?? el.dataset.line ?? "";
        });
      }
    };
  }, [active, ready]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    if (loaded && !failed) roomRef.current?.setMode(mode);
  }, [mode, loaded, failed]);

  const go = (sel: string, center = false) => {
    const el = document.querySelector<HTMLElement>(sel);
    const l = lenisRef.current;
    if (!el || !l) return;
    const offset = center ? -(innerHeight - el.offsetHeight) / 2 : 0;
    const quick = reducedMotion();
    // a glide is a glide: snapping would catch it at every stop on the way
    const html = document.documentElement;
    html.dataset.gliding = "1";
    l.scrollTo(el, { offset, duration: quick ? 0 : 2.2, immediate: quick, easing: (t: number) => 1 - Math.pow(1 - t, 4),
      onComplete: () => { delete html.dataset.gliding; } });
  };

  const onLightbox = useCallback((open: boolean) => lock("lightbox", open), [lock]);
  const closeStops = useCallback(() => {
    // Menu destinations run in this same click. Release the sheet's scroll
    // hold now: waiting for its React effect makes Lenis discard Contact.
    lock("sheet", false);
    setStops(false);
  }, [lock]);

  // the first visit on a phone: a hint, until the visitor walks (or it has been seen)
  useEffect(() => {
    if (!ready || failed || !matchMedia("(pointer: coarse)").matches) return;
    try { if (localStorage.getItem("dp:coached") === "1") return; } catch { /* private mode */ }
    const show = window.setTimeout(() => setCoach(true), 900);
    const done = () => {
      setCoach(false);
      try { localStorage.setItem("dp:coached", "1"); } catch { /* private mode */ }
      removeEventListener("touchstart", onTouch, true);
    };
    const onTouch = () => window.setTimeout(done, 400);
    addEventListener("touchstart", onTouch, true);
    const hide = window.setTimeout(done, 9000);
    return () => { clearTimeout(show); clearTimeout(hide); removeEventListener("touchstart", onTouch, true); };
  }, [ready, failed]);

  // the keyboard walks too: ← and → a wall at a time
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, dialog[open], .sec-featured")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stepRef.current(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stepRef.current(-1); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [ready]);

  useEffect(() => { lock("sheet", stops); }, [stops, lock]);
  /** a stop of the walk, by its index: its section, centred */
  /** the works, filtered, in the collage below the house */
  const showWorks = (f: WorksFilter) => {
    dispatchEvent(new CustomEvent(WORKS_FILTER, { detail: f }));
    setTimeout(() => go("#works"), 60);
  };
  // the sheet holds the page still while it is open: move once it has let go
  const goStop = (i: number) => {
    roomRef.current?.prepareChapter(i);
    setTimeout(() => go(`[data-chapter='${CHAPTERS[i].id}']`, true), 120);
  };
  // the chapter in view, for the header's "you are here"
  const here = ready ? CHAPTERS[active]?.id : undefined;
  const walkRooms = roomsOfWalk();
  const at = walkRooms.findIndex((r) => active >= r.first && active <= r.last);
  const nextRoom = at >= 0 && active === walkRooms[at].last ? walkRooms[at + 1] : undefined;

  // a link to one painting (its own page's "See it in her studio", or a shared /#work=<id>): once
  // the house is open, walk to the wall it hangs on and open it there; /#works goes to the collage
  useEffect(() => {
    if (!ready || failed) return;
    const hash = location.hash;
    if (hash === "#works") { setTimeout(() => go("#works"), 300); return; }
    const m = /^#work=([a-z0-9-]+)$/.exec(hash);
    if (!m || !BY_ID.has(m[1])) return;
    const id = m[1];
    history.replaceState(null, "", location.pathname + location.search);   // a refresh starts at the door
    const i = stopOf(id);
    if (i < 0) { lbRef.current?.open(id, null, WALK_ORDER); return; }
    goStop(i);
    let tries = 0;
    const t = window.setInterval(() => {
      const r = roomRef.current;
      const there = !!r && r.landed && Math.abs(r.at * (CHAPTERS.length - 1) - i) < 0.04;
      if (there || ++tries > 80) {
        clearInterval(t);
        lbRef.current?.open(id, null, WALK_ORDER);
      }
    }, 150);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed]);

  return (
    <>
      <div className="stage" ref={stageRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      <Preloader key={loadEpoch} ref={preRef} pct={pct} loaded={loaded} failed={failed}
                 getHeroRect={getHeroRect} onLift={onLift} onDone={onPreDone} />

      {/* always on screen, from the first frame: the way back to the website */}
      <a className="studio-exit" href="/" aria-label="Exit the studio and go back to the website">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        <span>Exit the studio</span>
      </a>

      {/* the header — line work and pills, as in the original */}
      <header className="hud" ref={hudRef} inert={!ready && !failed} data-state="pre">
        <div className="hud-top">
          <a className="brand" href="#top" aria-label="Dr Dolly Prasad, back to the door"
             onClick={(e) => {
               e.preventDefault();
               const quick = reducedMotion();
               lenisRef.current?.scrollTo(0, { duration: quick ? 0 : 2.4, immediate: quick });
             }}>
            <div data-brand-target className="brand-target" />
          </a>
          <span className="mask hud-map"><button type="button" className="pill hud-pill map-btn" aria-expanded={stops} aria-haspopup="dialog"
                  onClick={() => setStops((o) => !o)}>
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
        <div className="hud-bottom">
          <span className="lab hud-hint">Scroll to walk</span>
        </div>
      </header>

      {/* the copy slot — fixed, below the header's reach */}
      <div className="copy" ref={copyRef} data-has="0" aria-hidden="true">
        {CHAPTERS.map((c, i) => (c.body || c.verse || c.quote) ? (
          <div className="copy-panel" data-i={i} data-on="0" key={c.id}>
            <div className="copy-head">
              <div className="lab" data-eyebrow={c.eyebrow}>{c.eyebrow}</div>
              {/* the label's place in the hang, as a catalogue numbers it */}
              <div className="lab copy-idx">{String(i + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}</div>
            </div>
            {c.verse && (
              <p className="poem">
                {c.verse.split("\n").map((ln, k) => <span className="poem-line" key={k} data-line={ln}>{ln}</span>)}
              </p>
            )}
            {c.body && (c.bodyUntil ? <Until until={c.bodyUntil}><p className="lede">{c.body}</p></Until> : <p className="lede">{c.body}</p>)}
            {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
          </div>
        ) : null)}
      </div>

      {/* the village line, drawn along the foot as the walk goes (hidden from assistive tech: decoration) */}
      <div className="village" ref={villageRef} aria-hidden="true" />

      {/* the entrance and her desk: panels for chapters "about" and "desk" (lib/chapters.ts hooks them up) */}
      <AboutHer open={ready && here === "about"} />
      <Desk open={ready && here === "desk"} />

      <WallLabels room={roomRef} active={active} live={ready && !failed}
                  onOpen={(id) => lbRef.current?.open(id, null, WALK_ORDER)} />

      {failed && (
        <p className="room-off lab" role="status">
          The room could not be opened on this device. The paintings are all below.
        </p>
      )}

      {/* one section per chapter — the same source as the camera */}
      <main className="chapters" ref={mainRef} id="top">
        {CHAPTERS.map((c) => (
          <section className="sec" key={c.id} data-chapter={c.id} aria-label={c.eyebrow}>
            {(c.body || c.verse || c.quote) && (
              <div className="chapter-text">
                <h2 className="lab">{c.eyebrow}</h2>
                {c.verse && <p className="poem">{c.verse}</p>}
                {c.body && (c.bodyUntil ? <Until until={c.bodyUntil}><p className="lede">{c.body}</p></Until> : <p className="lede">{c.body}</p>)}
                {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
              </div>
            )}
          </section>
        ))}
      </main>

      {coach && (
        <div className="coach" role="status">
          <span className="coach-hand" aria-hidden="true" />
          <span className="coach-text">Swipe up to walk through the house</span>
        </div>
      )}

      <RoomMap open={stops} active={active} onClose={closeStops} onGo={goStop} onWorks={() => showWorks("all")} />
      {/* at a room's last stop: on to the next room */}
      {ready && !failed && nextRoom && (
        <button type="button" className="next-room" key={nextRoom.name} onClick={() => goStop(nextRoom.first)}>
          Next room<span className="next-name">: {nextRoom.name}</span> <span aria-hidden="true">→</span>
        </button>
      )}
      <Lightbox ref={lbRef} dims={dims} onOpenChange={onLightbox} />
      <Cursor live={ready || failed} />
    </>
  );
}

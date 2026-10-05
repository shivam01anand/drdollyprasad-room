"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { Room } from "@/lib/room/Room";
import { motion, gsap, scrambleTo, reducedMotion } from "@/lib/motion";
import Preloader, { type PreloaderHandle } from "./Preloader";
import Featured from "./Featured";
import Lightbox, { type LightboxHandle } from "./Lightbox";
import Cursor, { roomCursorLabel } from "./Cursor";
import { CHAPTERS } from "@/lib/chapters";
import { activeVariant } from "@/lib/room/variants";
import { EMAIL } from "@/lib/works";

type Dims = Record<string, { w: number; h: number }>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function Studio({ dims }: { dims: Dims }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<PreloaderHandle>(null);
  const lbRef = useRef<LightboxHandle>(null);
  const roomRef = useRef<Room | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  // every reason scrolling is held, in one place: the intro, the lightbox,
  // rearrange. Scroll runs only when none is left.
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
  const [rearrange, setRearrange] = useState(false);
  const [active, setActive] = useState(0);
  const [loadEpoch, setLoadEpoch] = useState(0);
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
      setRearrange(false);
      setLoadEpoch((n) => n + 1);
      hudLive.current = false;
      locks.current.delete("rearrange");
    }
    ranOnce.current = true;
    const prevRestoration = history.scrollRestoration;
    const html = document.documentElement;
    const prevData = { room: html.dataset.room, hud: html.dataset.hud, rearrange: html.dataset.rearrange };
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

    const camT = (s: number) => {
      const n = centers.length;
      if (n < 2) return 0;
      if (s <= centers[0]) return 0;
      if (s >= centers[n - 1]) return 1;
      let k = 0;
      while (k < n - 2 && s > centers[k + 1]) k++;
      return (k + (s - centers[k]) / Math.max(1, centers[k + 1] - centers[k])) / (n - 1);
    };

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
        // the header's ink follows what it sits on
        document.documentElement.dataset.hud = CHAPTERS[idx]?.ink ?? "";
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
      vh = innerHeight;
      const secs = [...(mainRef.current?.querySelectorAll<HTMLElement>(".sec") ?? [])];
      centers = secs.map((el) => el.offsetTop + el.offsetHeight / 2 - vh / 2);
      worksTop = document.getElementById("works")?.offsetTop ?? Infinity;
      const feat = mainRef.current?.querySelector<HTMLElement>(".sec-featured");
      if (feat) { featTop = feat.offsetTop; featBottom = feat.offsetTop + feat.offsetHeight; }
      apply(lastScroll, true);
    };

    lenis.on("scroll", (l: Lenis) => apply(l.scroll));

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
    const fail = (why: unknown) => {
      if (killed || dead) return;
      dead = true;
      console.error("[room]", why);
      room?.dispose();
      if (roomRef.current === room) roomRef.current = null;
      room = null;
      document.documentElement.dataset.room = "off";
      setFailed(true);
      setRearrange(false);
      // the room's own reasons end; an open lightbox keeps its hold
      locks.current.delete("intro");
      locks.current.delete("rearrange");
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
          setReady(true);
          lock("intro", false);
        },
        onArtwork: (id) => lbRef.current?.open(id, null),
        onHoverArt: (id) => roomCursorLabel(id ? "View" : null),
        onRearrangeError: (error) => {
          if (killed || dead) return;
          console.error("[room physics]", error);
          setRearrange(false);
        },
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
        rearrange: (on: boolean) => setRearrange(on),
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
      lbRef.current?.open(a.dataset.work!, a.querySelector("img"));
    };
    document.addEventListener("click", onDocClick);

    return () => {
      killed = true;
      clearTimeout(timeout);
      gsap.ticker.remove(frame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      history.scrollRestoration = prevRestoration;
      for (const k of ["room", "hud", "rearrange"] as const) {
        if (prevData[k] === undefined) delete html.dataset[k]; else html.dataset[k] = prevData[k];
      }
      ro.disconnect();
      removeEventListener("resize", measure);
      document.removeEventListener("click", onDocClick);
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
      gsap.set(hud.querySelector(".diya-btn"), { yPercent: -180, autoAlpha: 0 });
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
    tweens.push(gsap.to(hud.querySelector(".diya-btn"), { yPercent: 0, autoAlpha: 1, duration: quick ? 0 : 0.5, ease: "genEase" }));
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

  useEffect(() => {
    roomRef.current?.setState(rearrange ? "rearrange" : "presentation");
    document.documentElement.dataset.rearrange = rearrange ? "1" : "0";
    lock("rearrange", rearrange);
  }, [rearrange, lock]);

  const go = (sel: string, center = false) => {
    const el = document.querySelector<HTMLElement>(sel);
    const l = lenisRef.current;
    if (!el || !l) return;
    const offset = center ? -(innerHeight - el.offsetHeight) / 2 : 0;
    const quick = reducedMotion();
    l.scrollTo(el, { offset, duration: quick ? 0 : 2.2, immediate: quick, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  };

  const onLightbox = useCallback((open: boolean) => lock("lightbox", open), [lock]);
  // the chapter in view, for the header's "you are here"
  const here = ready ? CHAPTERS[active]?.id : undefined;

  return (
    <>
      <div className="stage" ref={stageRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      <Preloader key={loadEpoch} ref={preRef} pct={pct} loaded={loaded} failed={failed}
                 getHeroRect={getHeroRect} onLift={onLift} onDone={onPreDone} />

      {/* the header — line work and pills, as in the original */}
      <header className="hud" ref={hudRef} inert={!ready && !failed} data-state="pre">
        <div className="hud-top">
          <a className="brand" href="#top" aria-label="Dr Dolly Prasad — back to the door"
             onClick={(e) => {
               e.preventDefault();
               const quick = reducedMotion();
               lenisRef.current?.scrollTo(0, { duration: quick ? 0 : 2.4, immediate: quick });
             }}>
            <div data-brand-target className="brand-target" />
          </a>
          <div className="hud-meta lab">
            <span data-hud-text="New Delhi">New Delhi</span>
            <span ref={clockRef} />
          </div>
          <a className="hud-mail lab" href={`mailto:${EMAIL}`} data-hud-text="↳ Write to me">↳ Write to me</a>
          <button type="button" className="diya-btn" aria-pressed={mode === "dark"}
                  aria-label={mode === "dark" ? "Put out the diya" : "Light the diya"}
                  onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 6c2.6 3.1 3.6 5.4 3.6 7.2a3.6 3.6 0 0 1-7.2 0c0-1.8 1-4.1 3.6-7.2Z" className="flame" />
              <path d="M5 19.5h22c-1 4.2-5.3 7-11 7s-10-2.8-11-7Z" className="dish" />
            </svg>
          </button>
        </div>
        <div className="hud-bottom">
          <span className="lab hud-hint" key={rearrange ? "tilt" : "scroll"}>
            {rearrange ? "Drag to tilt the room" : "Scroll ↓"}
          </span>
          <nav className="hud-pills" aria-label="Site">
            {failed ? (
              <>
                <span className="mask"><button type="button" className="pill hud-pill" onClick={() => go("#works")}>Works<span className="arr"> →</span></button></span>
                <span className="mask"><button type="button" className="pill hud-pill" onClick={() => go("#contact")}>Contact<span className="arr"> →</span></button></span>
              </>
            ) : !rearrange ? (
              <>
                <span className="mask"><button type="button" className="pill hud-pill" disabled={!ready}
                      onClick={() => setRearrange(true)}>Shake<span className="long"> the room</span> <span aria-hidden="true">⁂</span></button></span>
                <span className="mask"><button type="button" className="pill hud-pill" aria-current={here === "featured" || undefined}
                      onClick={() => go("[data-chapter='featured']")}>Works<span className="arr"> →</span></button></span>
                <span className="mask"><button type="button" className="pill hud-pill" aria-current={here === "plan" || undefined}
                      onClick={() => go("[data-chapter='plan']", true)}>Exhibitions<span className="arr"> →</span></button></span>
                <span className="mask"><button type="button" className="pill hud-pill" onClick={() => go("#contact")}>Contact<span className="arr"> →</span></button></span>
              </>
            ) : (
              <>
                <span className="mask"><button type="button" className="pill" onClick={() => roomRef.current?.reset()}>Reset ↺</button></span>
                <span className="mask"><button type="button" className="pill pill-solid" onClick={() => setRearrange(false)}>Back to the room</button></span>
              </>
            )}
          </nav>
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
            {c.body && <p className="lede">{c.body}</p>}
            {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
          </div>
        ) : null)}
      </div>

      {failed && (
        <p className="room-off lab" role="status">
          The room could not be opened on this device. The paintings are all below.
        </p>
      )}

      {/* one section per chapter — the same source as the camera */}
      <main className="chapters" ref={mainRef} id="top">
        {CHAPTERS.map((c) =>
          c.slot === "featured" ? (
            <section className="sec sec-featured" key={c.id} data-chapter={c.id} aria-label="Featured works">
              <Featured dims={dims} onOpen={(id, img) => lbRef.current?.open(id, img)} />
            </section>
          ) : (
            <section className="sec" key={c.id} data-chapter={c.id} aria-label={c.eyebrow}>
              {(c.body || c.verse || c.quote) && (
                <div className="chapter-text">
                  <h2 className="lab">{c.eyebrow}</h2>
                  {c.verse && <p className="poem">{c.verse}</p>}
                  {c.body && <p className="lede">{c.body}</p>}
                  {c.quote && <blockquote className="quote">“{c.quote}”</blockquote>}
                </div>
              )}
            </section>
          )
        )}
      </main>

      <Lightbox ref={lbRef} dims={dims} onOpenChange={onLightbox} />
      <Cursor live={ready || failed} />
    </>
  );
}

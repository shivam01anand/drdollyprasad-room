"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { motion, gsap, Flip, scrambleTo, reducedMotion } from "@/lib/motion";
import INTRO from "@/lib/intro.json";

export type HeroRect = { left: number; top: number; width: number; height: number };
export type PreloaderHandle = { finish(): void };

type Props = {
  pct: number;
  loaded: boolean;
  failed: boolean;
  /** where the room has the hero painting at the establishing shot */
  getHeroRect(): HeroRect | null;
  /** the panel starts to lift: the room's own intro begins here */
  onLift(): void;
  /** the preloader is gone */
  onDone(): void;
};

/** the ring as scripts/intro/render.py laid it: x, y (fractions of the lamp image), behind, sprite, size, lean, mirrored */
type Head = [number, number, number, number, number, number, number];
const RING = INTRO.ring as Head[];
/** the garland's flowers in the order they are laid, and back-to-front within each layer for drawing */
const DRAW = RING.map((f, i) => ({ f, i })).sort((a, b) => a.f[1] - b.f[1]);
const SEEN = "dp:lamp-lit";

/**
 * The opening is the lighting of the lamp.
 *
 * Every exhibition of hers in India opens the same way: the tall brass lamp
 * at the centre of the gallery, a ring of marigolds at its foot, its wicks
 * lit before anyone looks at a painting (42-ctx-gallery-view). So the page
 * opens on that lamp, on paper. The marigolds are laid as the house loads —
 * the garland is the progress — and when it closes at the front, the five
 * wicks catch one by one. Her name forms beneath the light and rises into
 * the header; one painting is shown clean, exactly where the room has it,
 * with a line of welcome; then the panel lifts and the house is there
 * around the painting.
 *
 * The lamp, its shadow and the marigolds are Cycles renders of the house's
 * own lamp (scripts/intro). The brand nodes are made outside React and
 * moved with Flip, so the name never cuts between lockup and header. A
 * second visit in the same session finds the lamp already lit; a tap at any
 * point after loading goes straight in.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const land1 = useRef<HTMLDivElement>(null);
  const land2 = useRef<HTMLDivElement>(null);
  const welcome = useRef<HTMLParagraphElement>(null);
  const hero = useRef<HTMLImageElement>(null);

  const nodes = useRef<{ b1: HTMLSpanElement; b2: HTMLSpanElement } | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const state = useRef({ started: false, lifted: false, done: false, laid: 0 });
  const owned = useRef<(gsap.core.Animation | { kill(): void })[]>([]);
  const own = <T extends gsap.core.Animation>(a: T) => { owned.current.push(a); return a; };

  // the two brand nodes, made once and never rendered by React
  useLayoutEffect(() => {
    motion();
    // a replayed effect (Fast Refresh, StrictMode) starts from a clean slate
    state.current = { started: false, lifted: false, done: false, laid: 0 };
    owned.current = [];
    root.current?.style.removeProperty("display");
    const mk = () => {
      const s = document.createElement("span");
      s.className = "pre-big";
      return s;
    };
    const b1 = mk(), b2 = mk();
    land1.current!.appendChild(b1);
    land2.current!.appendChild(b2);
    nodes.current = { b1, b2 };
    return () => {
      owned.current.forEach((a) => a.kill());
      removeEventListener("resize", place);
      b1.remove();
      b2.remove();
    };
  }, []);

  /** the house's progress, read by the laying loop; from the first moment the
   *  garland also runs a little ahead of it, so the laying starts with the page */
  const want = useRef(0);
  want.current = Math.max(want.current, props.pct);

  // the garland is the progress: laid one flower at a time, at a hand's pace,
  // never in a burst however fast the house arrives
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const heads = [...st.querySelectorAll<HTMLElement>("[data-head]")].sort((a, b) => Number(a.dataset.head) - Number(b.dataset.head));
    const t0 = performance.now();
    let last = t0, raf = 0;
    const step = (now: number) => {
      const target = Math.round((RING.length * Math.max(want.current, Math.min(30, (now - t0) / 40))) / 100);
      const s = state.current;
      // a flower every 24 ms, two at a time once the house is ready
      const per = s.started ? 12 : 24;
      while (s.laid < Math.min(target, RING.length) && now - last >= per) {
        heads[s.laid].dataset.on = "1";
        s.laid++;
        last += per;
      }
      if (now - last > per) last = now - per;
      if (s.laid < RING.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // one loop for the whole load; it reads the latest progress from props via `want`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** the clean painting sits exactly where the room has it —
   *  one stable function, so the resize listener it backs can be removed */
  const place = useRef(() => {
    const r = cb.current.getHeroRect();
    const img = hero.current;
    if (!r || !img) return;
    img.style.left = `${r.left}px`;
    img.style.top = `${r.top}px`;
    img.style.width = `${r.width}px`;
    img.style.height = `${r.height}px`;
  }).current;

  const lift = () => {
    if (state.current.lifted) return;
    state.current.lifted = true;
    cb.current.onLift();
  };

  const done = () => {
    if (state.current.done) return;
    state.current.done = true;
    removeEventListener("resize", place);
    lift();
    if (root.current) root.current.style.display = "none";
    try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
    cb.current.onDone();
  };

  /** the end state, reachable from anywhere: the brand in the header, the
   *  panel gone, the room's intro started */
  const finish = () => {
    owned.current.forEach((a) => a.kill());
    owned.current = [];
    const n = nodes.current;
    const target = document.querySelector<HTMLElement>("[data-brand-target]");
    if (n) {
      if (target && n.b1.parentElement !== target) target.append(n.b1, n.b2);
      gsap.set([n.b1, n.b2], { clearProps: "all" });
      n.b1.textContent = "→ Dr Dolly";
      n.b2.textContent = "Prasad";
    }
    done();
  };

  useImperativeHandle(ref, () => ({ finish }), []);

  // the failed path: nothing to reveal, so end at once and let the page
  // show its fallback
  useEffect(() => {
    if (props.failed && !state.current.done) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.failed]);

  useEffect(() => {
    if (!props.loaded || props.failed || state.current.started) return;
    state.current.started = true;
    let cancelled = false;
    let again = false;
    try { again = sessionStorage.getItem(SEEN) === "1"; } catch { /* private mode */ }

    // once the house is ready, a tap goes straight in
    const skip = () => { if (!state.current.done) finish(); };
    panel.current?.addEventListener("pointerdown", skip);
    owned.current.push({ kill: () => panel.current?.removeEventListener("pointerdown", skip) });

    const run = async () => {
      // the first Flip measures the brand, so the face must be in
      await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
      try { await hero.current?.decode(); } catch { /* shown anyway */ }
      if (cancelled || state.current.done) return;
      if (reducedMotion()) { finish(); return; }

      // the garland closes at the front before a wick is lit
      want.current = 100;
      if (again) {
        stage.current?.querySelectorAll<HTMLElement>("[data-head]").forEach((h) => (h.dataset.on = "1"));
        state.current.laid = RING.length;
      }
      await new Promise<void>((res) => {
        const check = () => (state.current.laid >= RING.length || cancelled ? res() : setTimeout(check, 40));
        check();
      });
      if (cancelled || state.current.done) return;
      const wait = again ? 0 : 0.35;
      const n = nodes.current!;
      const st = stage.current!;
      const flames = [...st.querySelectorAll<HTMLElement>(".pre-flame")];
      addEventListener("resize", place);

      // a second visit: the lamp is already lit, and everything moves at a walk
      const k = again ? 0.55 : 1;
      const tl = own(gsap.timeline({ onComplete: done, delay: wait }));

      // the wicks catch, one from the next, and the light gathers round the lamp
      if (again) {
        tl.add(() => flames.forEach((f) => (f.dataset.lit = "1")), 0);
        tl.to(glow.current, { autoAlpha: 1, duration: 0.4 }, 0);
      } else {
        // left to right across the cup, as a hand with one taper would go
        [...flames].sort((a, b) => Number(a.dataset.x) - Number(b.dataset.x))
          .forEach((f, i) => tl.add(() => { f.dataset.lit = "1"; }, 0.1 + i * 0.16));
        tl.fromTo(glow.current, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.out" }, 0.15);
      }

      // her name, beneath the light
      tl.add(() => {
        own(scrambleTo(n.b1, "→ Dr Dolly", { speed: 1, duration: 0.9 }));
        own(scrambleTo(n.b2, "Prasad", { speed: 1, duration: 0.9 }));
      }, 0.95 * k);

      // the name rises into the header; the lamp steps back into the house
      tl.add(() => {
        const target = document.querySelector<HTMLElement>("[data-brand-target]");
        if (target) {
          const s = Flip.getState([n.b1, n.b2], { props: "fontSize" });
          target.append(n.b1, n.b2);
          own(Flip.from(s, { duration: 1.0, ease: "genEase", absolute: true }));
        }
      }, 2.15 * k);
      tl.to(st, { autoAlpha: 0, y: "2vh", scale: 0.97, duration: 0.55, ease: "power1.inOut" }, 2.1 * k);
      tl.to(glow.current, { autoAlpha: 0, duration: 0.7, ease: "power1.inOut" }, 2.15 * k);

      // one painting, clean, where the room has it; a line of welcome
      tl.add(() => {
        place();
        own(gsap.fromTo(hero.current, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08, autoAlpha: 1 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.5, ease: "power3.out" }));
        if (welcome.current) own(scrambleTo(welcome.current, "Welcome to my studio", { speed: 0.6, duration: 1.2, delay: 0.4 }));
      }, 2.7 * k);

      // the words step back first, so nothing slides across the painting as
      // the panel goes. Made at that moment, not up front: the welcome's
      // scramble overwrites every earlier tween on its element.
      tl.add(() => {
        own(gsap.to([welcome.current, root.current?.querySelector(".pre-foot")].filter(Boolean),
          { autoAlpha: 0, duration: 0.3, ease: "power1.in" }));
      }, 4.35 * k);
      // the panel lifts and the room is there, around the painting
      tl.add(() => {
        lift();
        own(gsap.to(panel.current, { yPercent: -101, duration: 1.0, ease: "genEase" }));
      }, 4.7 * k);
      // the photograph gives way to the painting on the wall behind it
      tl.to(hero.current, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 4.7 * k + 0.55);
      tl.to({}, { duration: 0.05 }, 4.7 * k + 1.15);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loaded, props.failed]);

  const pct = Math.round(props.pct);
  return (
    <div className="pre" ref={root}>
      <div className="pre-panel" ref={panel}>
        <div className="pre-stage" ref={stage} role="progressbar" aria-label="Lighting the lamp"
             aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
             style={{ aspectRatio: String(INTRO.aspect) }}>
          <div className="pre-glow" ref={glow} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pre-shadow" src="/intro/shadow.webp" alt="" />
          <Garland behind />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pre-lamp" src="/intro/lamp.webp" alt="" />
          <Garland behind={false} />
          {INTRO.wicks.map(([x, y], i) => (
            <span key={i} className="pre-flame" data-x={x} style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />
          ))}
        </div>
        <div className="pre-centre">
          <div className="pre-land" ref={land1} />
          <div className="pre-land" ref={land2} />
        </div>
        <p className="pre-welcome" ref={welcome} aria-label="Welcome to my studio" />
        <div className="pre-foot lab">New Delhi</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pre-hero" ref={hero} src="/art/large/woman-with-poppies.jpg" alt="" decoding="async" />
    </div>
  );
});

/** one layer of the ring: the flowers behind the lamp, or those in front of it */
function Garland({ behind }: { behind: boolean }) {
  return (
    <div className={`pre-ring${behind ? " is-behind" : " is-front"}`}>
      {DRAW.filter(({ f }) => f[2] === (behind ? 1 : 0)).map(({ f, i }) => (
        <i key={i} data-head={i} className="pre-head"
           style={{
             left: `${f[0] * 100}%`, top: `${f[1] * 100}%`,
             width: `${INTRO.head * 150 * f[4]}%`,
             backgroundImage: `url(/intro/marigold-${f[3]}.webp)`,
             ["--lean" as string]: `${f[5]}deg`, ["--flip" as string]: f[6] ? -1 : 1,
           }} />
      ))}
    </div>
  );
}

export default Preloader;

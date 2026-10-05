"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { motion, gsap, Flip, scrambleTo, reducedMotion } from "@/lib/motion";

export type HeroRect = { left: number; top: number; width: number; height: number };
export type PreloaderHandle = { finish(): void };

type Props = {
  pct: number;
  loaded: boolean;
  failed: boolean;
  /** where the room has Twenty Paise at the establishing shot */
  getHeroRect(): HeroRect | null;
  /** the panel starts to lift: the room's own intro begins here */
  onLift(): void;
  /** the preloader is gone */
  onDone(): void;
};

/**
 * The brand is the preloader is the logo.
 *
 * One pair of nodes is the load counter, then a lockup at the centre, then
 * the header mark — moved through the DOM with Flip so the identity never
 * cuts. They are created outside React, so moving them can never collide
 * with React's own bookkeeping.
 *
 * The sequence follows the original beat for beat, then adds hers: as the
 * name settles into the header, one painting is shown clean — exactly where
 * the room will have it — with a line of welcome. The panel lifts and the
 * room is there around the painting; then the camera moves in.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const tlSlot = useRef<HTMLDivElement>(null);
  const brSlot = useRef<HTMLDivElement>(null);
  const land1 = useRef<HTMLDivElement>(null);
  const land2 = useRef<HTMLDivElement>(null);
  const welcome = useRef<HTMLParagraphElement>(null);
  const hero = useRef<HTMLImageElement>(null);

  const nodes = useRef<{ b1: HTMLSpanElement; b2: HTMLSpanElement } | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const state = useRef({ started: false, lifted: false, done: false });
  const owned = useRef<(gsap.core.Animation | { kill(): void })[]>([]);
  const own = <T extends gsap.core.Animation>(a: T) => { owned.current.push(a); return a; };

  // the two brand nodes, made once and never rendered by React
  useLayoutEffect(() => {
    motion();
    // a replayed effect (Fast Refresh, StrictMode) starts from a clean slate
    state.current = { started: false, lifted: false, done: false };
    owned.current = [];
    root.current?.style.removeProperty("display");
    gsap.set([panel.current, hero.current], { clearProps: "all" });
    const mk = (t: string) => {
      const s = document.createElement("span");
      s.className = "pre-big";
      s.textContent = t;
      return s;
    };
    const b1 = mk("%"), b2 = mk("0");
    tlSlot.current!.appendChild(b1);
    brSlot.current!.appendChild(b2);
    nodes.current = { b1, b2 };
    return () => {
      owned.current.forEach((a) => a.kill());
      removeEventListener("resize", place);
      b1.remove();
      b2.remove();
    };
  }, []);

  // the counter is plain text, and the wipe grows in from the right
  useEffect(() => {
    const n = nodes.current;
    if (!n || state.current.started) return;
    n.b2.textContent = String(props.pct);
    if (wipe.current) wipe.current.style.transform = `translateX(${100 - props.pct}%)`;
  }, [props.pct]);

  /** the clean painting sits exactly where the room has Twenty Paise —
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

    const run = async () => {
      // the first Flip measures the brand, so the face must be in
      await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
      try { await hero.current?.decode(); } catch { /* shown anyway */ }
      if (cancelled || state.current.done) return;
      if (reducedMotion()) { finish(); return; }

      const n = nodes.current!;
      n.b2.textContent = "100";
      if (wipe.current) wipe.current.style.transform = "translateX(0%)";
      addEventListener("resize", place);

      const tl = own(gsap.timeline({ onComplete: done }));

      // 0.7 s — the counter becomes the name
      tl.add(() => {
        own(scrambleTo(n.b1, "→ Dr Dolly", { speed: 1, duration: 1 }));
        own(scrambleTo(n.b2, "Prasad", { speed: 1, duration: 1 }));
      }, 0.7);

      // 1.9 s — both fly from their corners into a stacked lockup at centre
      tl.add(() => {
        const st = Flip.getState([n.b1, n.b2], { props: "fontSize" });
        land1.current!.appendChild(n.b1);
        land2.current!.appendChild(n.b2);
        own(Flip.from(st, { duration: 1.2, ease: "genEase", absolute: true }));
      }, 1.9);

      // 3.2 s — the lockup flies to the header; one painting, clean, where
      // the room has it; a line of welcome
      tl.add(() => {
        const target = document.querySelector<HTMLElement>("[data-brand-target]");
        if (target) {
          const st = Flip.getState([n.b1, n.b2], { props: "fontSize" });
          target.append(n.b1, n.b2);
          own(Flip.from(st, { duration: 1.0, ease: "genEase", absolute: true }));
        }
        place();
        // the painting waits until the name has cleared the centre
        own(gsap.fromTo(hero.current, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08, autoAlpha: 1 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.5, ease: "power3.out", delay: 0.55 }));
        if (welcome.current) own(scrambleTo(welcome.current, "Welcome to my studio", { speed: 0.6, duration: 1.2, delay: 0.95 }));
      }, 3.2);

      // 5.25 s — the words step back first, so nothing slides across the
      // painting as the panel goes. Made at that moment, not up front: the
      // welcome's scramble overwrites every earlier tween on its element.
      tl.add(() => {
        own(gsap.to([welcome.current, root.current?.querySelector(".pre-foot")].filter(Boolean),
          { autoAlpha: 0, duration: 0.3, ease: "power1.in" }));
      }, 5.25);
      // 5.6 s — the panel lifts and the room is there, around the painting
      tl.add(() => {
        lift();
        own(gsap.to(panel.current, { yPercent: -101, duration: 1.0, ease: "genEase" }));
      }, 5.6);
      // the photograph gives way to the painting on the wall behind it
      tl.to(hero.current, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 6.15);
      tl.to({}, { duration: 0.05 }, 6.75);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loaded, props.failed]);

  return (
    <div className="pre" ref={root}>
      <div className="pre-panel" ref={panel}>
        <div className="pre-wipe" ref={wipe} />
        <div className="pre-grid">
          <div className="pre-tl" ref={tlSlot} />
          <div className="pre-br" ref={brSlot} />
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

export default Preloader;

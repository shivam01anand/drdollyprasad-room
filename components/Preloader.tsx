"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { motion, gsap, Flip, reducedMotion } from "@/lib/motion";
import { SHOW } from "@/lib/works";
import { NOW_SHOWING_CONFIRMED } from "@/lib/site";

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

const SEEN = "dp:welcomed";
const WORDS = ["Welcome", "to", "my", "studio"];

/**
 * The welcome. Warm paper, lamplight from above, and her greeting, word by
 * word — नमस्ते, then "Welcome to my studio" — with her name beneath and a
 * hairline that fills as the house loads. As soon as the house is ready and
 * the greeting has been said, the visitor is taken in: her name rises into
 * the header, one painting is shown clean exactly where the room has it, and
 * the panel lifts with the house around the painting. (The music waits for
 * the visitor's first touch or key: a browser lets sound begin only then.)
 *
 * The brand nodes are made outside React and moved with Flip, so the name
 * never cuts between the welcome and the header. A second visit in the same
 * session is welcomed back.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const greet = useRef<HTMLDivElement>(null);
  const sign = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const hero = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [again, setAgain] = useState(false);
  /** her exhibition, said under her name while it is on (it goes after its last day) */
  const [showing, setShowing] = useState(false);

  const nodes = useRef<{ b1: HTMLSpanElement; b2: HTMLSpanElement } | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const state = useRef({ started: false, lifted: false, done: false, said: false });
  const owned = useRef<(gsap.core.Animation | { kill(): void })[]>([]);
  const own = <T extends gsap.core.Animation>(a: T) => { owned.current.push(a); return a; };

  // the two brand nodes, made once and never rendered by React
  useLayoutEffect(() => {
    motion();
    state.current = { started: false, lifted: false, done: false, said: false };
    owned.current = [];
    root.current?.style.removeProperty("display");
    const mk = (t: string) => {
      const s = document.createElement("span");
      s.className = "pre-big";
      s.textContent = t;
      return s;
    };
    const b1 = mk("→ Dr Dolly"), b2 = mk("Prasad");
    sign.current!.append(b1, b2);
    nodes.current = { b1, b2 };
    try { setAgain(sessionStorage.getItem(SEEN) === "1"); } catch { /* private mode */ }
    setShowing(NOW_SHOWING_CONFIRMED && Date.now() < Date.parse(`${SHOW.until}T23:59:59+05:30`));
    return () => {
      owned.current.forEach((a) => a.kill());
      removeEventListener("resize", place);
      b1.remove();
      b2.remove();
    };
  }, []);

  // the greeting is on screen from the first paint (never a blank panel) and only settles into place
  useEffect(() => {
    const g = greet.current;
    if (!g) return;
    const quick = reducedMotion();
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const parts = [...g.querySelectorAll<HTMLElement>("[data-in]")];
      own(gsap.fromTo(parts, { autoAlpha: 1, y: 10, filter: "blur(0px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: quick ? 0 : 0.7, ease: "power2.out", stagger: quick ? 0 : 0.08,
          onComplete: () => { state.current.said = true; if (cb.current.loaded) setReady(true); } }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the hairline fills as the house loads
  useEffect(() => {
    if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.02, props.pct / 100)})`;
  }, [props.pct]);

  // the invitation, once the house is ready and the greeting said
  useEffect(() => {
    if (props.loaded && !props.failed && state.current.said) setReady(true);
  }, [props.loaded, props.failed]);
  useEffect(() => {
    if (!ready) return;
    // a beat to read the greeting, then in
    const t = window.setTimeout(() => enter(), again ? 150 : 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, again]);

  /** the clean painting sits exactly where the room has it — one stable
   *  function, so the resize listener it backs can be removed */
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

  /** the end state, reachable from anywhere: the brand in the header, the panel gone */
  const finish = () => {
    owned.current.forEach((a) => a.kill());
    owned.current = [];
    const n = nodes.current;
    const target = document.querySelector<HTMLElement>("[data-brand-target]");
    if (n) {
      if (target && n.b1.parentElement !== target) target.append(n.b1, n.b2);
      gsap.set([n.b1, n.b2], { clearProps: "all" });
    }
    done();
  };

  useImperativeHandle(ref, () => ({ finish }), []);

  useEffect(() => {
    if (props.failed && !state.current.done) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.failed]);

  /** in: the name to the header, the painting where the room has it, and the panel lifts */
  const enter = () => {
    if (state.current.started || state.current.done) return;
    state.current.started = true;
    if (reducedMotion()) { finish(); return; }
    const n = nodes.current!;
    addEventListener("resize", place);
    const tl = own(gsap.timeline({ onComplete: done }));
    const words = [...(greet.current?.querySelectorAll("[data-in]:not(.pre-sign)") ?? [])];
    tl.to(words, { autoAlpha: 0, y: -12, filter: "blur(6px)", duration: 0.7, ease: "power2.in", stagger: 0.04 }, 0);
    tl.to(root.current?.querySelector(".pre-bar") ?? {}, { autoAlpha: 0, duration: 0.4 }, 0);
    tl.add(() => {
      const target = document.querySelector<HTMLElement>("[data-brand-target]");
      if (!target) return;
      const s = Flip.getState([n.b1, n.b2], { props: "fontSize,letterSpacing" });
      target.append(n.b1, n.b2);
      own(Flip.from(s, { duration: 1.1, ease: "genEase", absolute: true }));
    }, 0.4);
    tl.add(() => {
      place();
      own(gsap.fromTo(hero.current, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.06, autoAlpha: 1 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.5, ease: "power3.out" }));
    }, 0.75);
    tl.add(() => {
      lift();
      own(gsap.to(panel.current, { yPercent: -101, duration: 1.15, ease: "genEase" }));
    }, 2.45);
    tl.to(hero.current, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 3.05);
    tl.to({}, { duration: 0.05 }, 3.65);
  };

  return (
    <div className="pre" ref={root}>
      <div className="pre-panel" ref={panel}>
        <div className="pre-light" aria-hidden="true" />
        <div className="pre-welcome" ref={greet}>
          <p className="pre-namaste" data-in="" lang="hi">नमस्ते</p>
          <h1 className="pre-hello" aria-label={again ? "Welcome back to my studio" : "Welcome to my studio"}>
            {(again ? ["Welcome", "back"] : WORDS).map((w, i) => <span key={i} data-in="">{w}</span>)}
          </h1>
          <div className="pre-sign" ref={sign} data-in="" />
          <p className="pre-note lab" data-in="">Paintings · New Delhi</p>
          {showing && <p className="pre-note pre-show lab" data-in="">Showing at Sacred Fragments · 18–21 October</p>}
          <div className="pre-foot">
            <div className="pre-bar" role="progressbar" aria-label="Opening the house" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={Math.round(props.pct)} data-ready={ready ? "1" : "0"}>
              <i ref={bar} />
            </div>
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pre-hero" ref={hero} src="/art/large/woman-with-poppies.jpg" alt="" decoding="async" />
    </div>
  );
});

export default Preloader;

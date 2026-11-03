"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { motion, gsap, reducedMotion } from "@/lib/motion";

export type HeroRect = { left: number; top: number; width: number; height: number };
export type PreloaderHandle = { finish(): void };

type Props = {
  pct: number;
  loaded: boolean;
  failed: boolean;
  /** the crossfade starts: the house is framed on its first stop under it */
  onLift(): void;
  /** the house is taking long: a quiet line says so (the dock shows the names over the welcome) */
  slow?: boolean;
  /** the preloader is gone */
  onDone(): void;
};

const SEEN = "dp:welcomed";
const WORDS = ["Welcome", "to", "my", "studio"];

/**
 * The welcome. Warm paper, lamplight from above, and her greeting, word by
 * word — नमस्ते, then "Welcome to my studio" — with her name beneath and a
 * hairline that fills as the house loads. As soon as the house is ready and
 * the greeting has been said (at least 1.2 s), the welcome crossfades in
 * 0.5 s onto the house, already framed on Woman with Poppies. (The music waits for
 * the visitor's first touch or key: a browser lets sound begin only then.)
 *
 * The brand nodes are made outside React and handed to the header as the
 * welcome fades. A second visit in the same
 * session is welcomed back.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const greet = useRef<HTMLDivElement>(null);
  const sign = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [again, setAgain] = useState(false);
  /** her exhibition, said under her name while it is on (it goes after its last day) */

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
    return () => {
      owned.current.forEach((a) => a.kill());
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
  const born = useRef(0);
  useEffect(() => { born.current = performance.now(); }, []);
  useEffect(() => {
    if (!ready) return;
    // the greeting stays at least 1.2 s on screen, then the house (29 Oct: no long beat after it)
    const t = window.setTimeout(() => enter(), Math.max(0, 1200 - (performance.now() - born.current)));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, again]);

  const lift = () => {
    if (state.current.lifted) return;
    state.current.lifted = true;
    cb.current.onLift();
  };

  const done = () => {
    if (state.current.done) return;
    state.current.done = true;
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

  /** in: one 0.5 s crossfade onto the house, already framed on the first stop; the name goes to
   *  the header as the welcome goes (29 Oct: no Flip, no clip, no lift, no dolly) */
  const enter = () => {
    if (state.current.started || state.current.done) return;
    state.current.started = true;
    if (reducedMotion()) { finish(); return; }
    lift();
    const n = nodes.current!;
    const tl = own(gsap.timeline({ onComplete: () => {
      const target = document.querySelector<HTMLElement>("[data-brand-target]");
      if (target) target.append(n.b1, n.b2);
      gsap.fromTo([n.b1, n.b2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });
      done();
    } }));
    tl.to(root.current, { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, 0);
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
          {props.slow && <p className="pre-slow lab" role="status">Opening the house…</p>}
          <div className="pre-foot">
            <div className="pre-bar" role="progressbar" aria-label="Opening the house" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={Math.round(props.pct)} data-ready={ready ? "1" : "0"}>
              <i ref={bar} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Preloader;

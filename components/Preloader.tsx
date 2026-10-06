"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { motion, gsap, Flip, reducedMotion } from "@/lib/motion";
import * as music from "@/lib/music";

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
 * hairline that fills as the house loads. When it is ready, an invitation:
 * Step inside. That step is the gesture that lets the music begin (a
 * tanpura, lib/music.ts); her name rises into the header, one painting is
 * shown clean exactly where the room has it, and the panel lifts with the
 * house around the painting.
 *
 * The brand nodes are made outside React and moved with Flip, so the name
 * never cuts between the welcome and the header. A second visit in the same
 * session is welcomed back and goes straight in.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const greet = useRef<HTMLDivElement>(null);
  const sign = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const invite = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [withMusic, setWithMusic] = useState(true);
  const [again, setAgain] = useState(false);

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
    try { setWithMusic(music.wanted()); setAgain(sessionStorage.getItem(SEEN) === "1"); } catch { /* private mode */ }
    return () => {
      owned.current.forEach((a) => a.kill());
      removeEventListener("resize", place);
      b1.remove();
      b2.remove();
    };
  }, []);

  // the greeting comes in word by word, as soon as the face is in
  useEffect(() => {
    const g = greet.current;
    if (!g) return;
    const quick = reducedMotion();
    let cancelled = false;
    Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(() => {
      if (cancelled) return;
      const parts = [...g.querySelectorAll<HTMLElement>("[data-in]")];
      own(gsap.fromTo(parts, { autoAlpha: 0, y: 14, filter: "blur(8px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: quick ? 0 : 1.3, ease: "power2.out", stagger: quick ? 0 : 0.16,
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
    if (!ready || !invite.current) return;
    if (again) { enter(false); return; }
    own(gsap.fromTo(invite.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: reducedMotion() ? 0 : 0.8, ease: "power2.out" }));
    invite.current.querySelector<HTMLButtonElement>(".pre-enter")?.focus({ preventScroll: true });
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

  /** step inside: the music (this is the gesture it needs), the name to the header,
   *  the painting where the room has it, and the panel lifts */
  const enter = (gesture: boolean) => {
    if (state.current.started || state.current.done) return;
    state.current.started = true;
    if (gesture && withMusic) music.start();
    if (reducedMotion()) { finish(); return; }
    const n = nodes.current!;
    addEventListener("resize", place);
    const tl = own(gsap.timeline({ onComplete: done }));
    const words = [...(greet.current?.querySelectorAll("[data-in]:not(.pre-sign)") ?? [])];
    tl.to([...words, invite.current], { autoAlpha: 0, y: -12, filter: "blur(6px)", duration: 0.7, ease: "power2.in", stagger: 0.04 }, 0);
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

  // Enter or Space on the welcome steps inside
  useEffect(() => {
    if (!ready || again) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if ((e.target as HTMLElement)?.closest?.(".pre-music, .pre-enter")) return;
      e.preventDefault();
      enter(true);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, again, withMusic]);

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
          <div className="pre-foot">
            <div className="pre-bar" role="progressbar" aria-label="Opening the house" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={Math.round(props.pct)} data-ready={ready ? "1" : "0"}>
              <i ref={bar} />
            </div>
            <div className="pre-invite" ref={invite}>
              <button type="button" className="pre-enter" onClick={() => enter(true)} disabled={!ready}>
                Step inside <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="pre-music lab" aria-pressed={withMusic}
                      onClick={() => {
                        const on = !withMusic;
                        setWithMusic(on);
                        try { localStorage.setItem("dp:music", on ? "1" : "0"); } catch { /* private mode */ }
                      }}>
                {withMusic ? "♪ With music · turn off" : "Without music · turn on"}
              </button>
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

"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { reducedMotion } from "@/lib/motion";

export type PreloaderHandle = { finish(): void };

type Props = {
  pct: number;
  loaded: boolean;
  failed: boolean;
  /** the panel starts to go: the room's own intro begins here */
  onLift(): void;
  /** the preloader is gone */
  onDone(): void;
};

/** once the house is ready, the colour finishes and the panel goes: never longer than this */
const FINISH_MS = 350;
const FADE_MS = 450;

/**
 * The welcome: one of her paintings, first as a charcoal sketch, filling with colour from the
 * bottom up as the house actually loads (the colour is the progress: `pct`, counted asset by
 * asset in Room.init). The painting itself is never altered: the sketch is the same photograph
 * under a grey, contrasty CSS filter, and the colour is that photograph revealed through a mask.
 * When the first stops are ready the colour completes within FINISH_MS and the visitor is in; a
 * tap or a key once it is ready goes in at once. With reduced motion the painting is shown in
 * colour and the panel simply goes.
 */
const Preloader = forwardRef<PreloaderHandle, Props>(function Preloader(props, ref) {
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLElement>(null);
  const nodes = useRef<{ b1: HTMLSpanElement; b2: HTMLSpanElement } | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const state = useRef({ started: false, done: false });
  const timers = useRef<number[]>([]);
  const [shown, setShown] = useState(0);

  // the brand for the header, made once and never rendered by React
  useLayoutEffect(() => {
    state.current = { started: false, done: false };
    root.current?.style.removeProperty("display");
    const mk = (t: string) => {
      const s = document.createElement("span");
      s.className = "pre-big";
      s.textContent = t;
      return s;
    };
    nodes.current = { b1: mk("→ Dr Dolly"), b2: mk("Prasad") };
    return () => {
      timers.current.forEach(clearTimeout);
      nodes.current?.b1.remove();
      nodes.current?.b2.remove();
    };
  }, []);

  // honest progress: the colour follows what has arrived, and never goes back
  useEffect(() => {
    setShown((s) => Math.max(s, Math.min(100, props.pct)));
  }, [props.pct]);

  const done = () => {
    if (state.current.done) return;
    state.current.done = true;
    if (!state.current.started) cb.current.onLift();
    state.current.started = true;
    if (root.current) root.current.style.display = "none";
    cb.current.onDone();
  };

  const brandIn = () => {
    const n = nodes.current;
    const target = document.querySelector<HTMLElement>("[data-brand-target]");
    if (n && target && n.b1.parentElement !== target) target.append(n.b1, n.b2);
  };

  /** the end state, from anywhere: the brand in the header, the panel gone */
  const finish = () => {
    timers.current.forEach(clearTimeout);
    brandIn();
    done();
  };
  useImperativeHandle(ref, () => ({ finish }), []);

  /** in: the colour completes, the room's intro starts, the panel fades away */
  const enter = (now = false) => {
    if (state.current.started || state.current.done) return;
    state.current.started = true;
    const quick = now || reducedMotion();
    // the colour's last stretch is quicker than its steps, so it is whole before the panel goes
    root.current?.setAttribute("data-finishing", "1");
    setShown(100);
    // the camera starts its short move in under the panel while the colour completes
    cb.current.onLift();
    const go = () => {
      brandIn();
      root.current?.setAttribute("data-out", "1");
      timers.current.push(window.setTimeout(done, quick ? 0 : FADE_MS));
    };
    if (quick) go(); else timers.current.push(window.setTimeout(go, FINISH_MS));
  };

  useEffect(() => {
    if (props.failed && !state.current.done) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.failed]);

  // in as soon as the first stops are ready
  useEffect(() => {
    if (props.loaded && !props.failed) enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loaded, props.failed]);

  // a tap or a key, once ready, skips what is left of the colour
  useEffect(() => {
    if (!props.loaded || props.failed) return;
    const skip = () => { if (!state.current.done) { timers.current.forEach(clearTimeout); state.current.started = false; enter(true); } };
    const el = root.current;
    el?.addEventListener("pointerdown", skip);
    addEventListener("keydown", skip);
    return () => { el?.removeEventListener("pointerdown", skip); removeEventListener("keydown", skip); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loaded, props.failed]);

  const p = shown / 100;
  return (
    <div className="pre" ref={root}>
      <div className="pre-panel">
        <div className="pre-light" aria-hidden="true" />
        <div className="pre-welcome">
          <figure className="pre-art" ref={art} suppressHydrationWarning style={{ ["--pre-p" as string]: p }}>
            <div className="pre-canvas">
              {/* the same photograph twice: as a charcoal sketch, and in colour as far as the house has loaded */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pre-sketch" alt="" decoding="async" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pre-colour" alt="" decoding="async" />
            </div>
            <figcaption>
              <span className="pre-title" suppressHydrationWarning>“Twenty Paise”</span>
              <span className="pre-by lab">Dr Dolly Prasad</span>
            </figcaption>
          </figure>
          <div className="pre-foot">
            <div className="pre-bar" role="progressbar" aria-label="Opening the studio" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={Math.round(shown)} data-ready={props.loaded ? "1" : "0"}>
              <i style={{ transform: `scaleX(${Math.max(0.02, p)})` }} />
            </div>
            <p className="pre-status lab" aria-hidden="true">
              Opening the studio · {Math.round(shown)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Preloader;

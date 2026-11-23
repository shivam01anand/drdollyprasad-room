"use client";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/cormorant-garamond/500.css";
import "./painting-card.css";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { paintingProperties, track } from "@/lib/analytics";
import { BY_ID, LARGE, WORKS } from "@/lib/works";
import { labelLine } from "@/lib/site";
import PaintingStage from "@/components/site/PaintingStage";
import PaintingInfo from "@/components/site/PaintingInfo";

/** `seq`: the works the reader can turn through from this one (the walk's, the collage's) */
export type LightboxHandle = { open(id: string, from: HTMLImageElement | null, seq?: string[]): void };
type Dims = Record<string, { w: number; h: number }>;

/**
 * One painting, over the house, in the same card as its own page (/work/[id]):
 * the painting framed as the site frames it, its views (the painting, the
 * painting in a room, the full-screen zoom) from PaintingStage, and its text
 * from PaintingInfo. The house stays behind it; ✕, Esc or a click outside
 * puts the work away, and Previous / Next (or ← →) turn through the stop.
 */
const Lightbox = forwardRef<LightboxHandle, { dims: Dims; onOpenChange(open: boolean): void }>(
  function Lightbox({ dims, onOpenChange }, ref) {
    const root = useRef<HTMLDialogElement>(null);
    const sheet = useRef<HTMLDivElement>(null);
    const closeBtn = useRef<HTMLButtonElement>(null);
    const [id, setId] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);
    const cb = useRef(onOpenChange);
    cb.current = onOpenChange;
    const st = useRef<{ id: string | null; seq: string[]; back: HTMLElement | null; at: number; timer: number }>(
      { id: null, seq: [], back: null, at: 0, timer: 0 });
    /** an Esc meant for the full-screen zoom inside the card, not for the card */
    const zoomEsc = useRef(false);

    const show = useCallback((next: string) => {
      const w = BY_ID.get(next);
      if (!w) return;
      track("painting_viewed", { ...paintingProperties(w), surface: "studio_lightbox" });
      st.current.id = next;
      st.current.at = performance.now();
      setId(next);
      sheet.current?.scrollTo({ top: 0 });
    }, []);

    const open = useCallback((next: string, from: HTMLImageElement | null, seq?: string[]) => {
      const r = root.current;
      if (!r || !BY_ID.has(next) || st.current.id) return;
      clearTimeout(st.current.timer);
      setClosing(false);
      st.current.seq = seq?.includes(next) ? seq : WORKS.map((x) => x.id);
      // focus returns to what opened the work: the card's link, the wall label, the list button
      st.current.back = from?.closest<HTMLElement>("[tabindex], button, a") ?? (document.activeElement as HTMLElement | null);
      show(next);
      cb.current(true);
      if (!r.open) r.showModal();
      closeBtn.current?.focus({ preventScroll: true });
    }, [show]);

    const close = useCallback(() => {
      const r = root.current, cur = st.current.id;
      if (!r || !cur) return;
      const w = BY_ID.get(cur);
      if (w) track("painting_closed", { ...paintingProperties(w), surface: "studio_lightbox",
        duration_seconds: Math.round((performance.now() - st.current.at) / 1000) });
      st.current.id = null;
      setClosing(true);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      st.current.timer = window.setTimeout(() => {
        if (r.open) r.close();
        setId(null);
        setClosing(false);
        cb.current(false);
        st.current.back?.focus({ preventScroll: true });
        st.current.back = null;
      }, reduce ? 0 : 220);
    }, []);

    /** Previous / Next: its neighbour in the same sequence takes the card */
    const turn = useCallback((d: 1 | -1) => {
      const { id: cur, seq } = st.current;
      if (!cur || seq.length < 2) return;
      const k = seq.indexOf(cur);
      show(seq[(k + d + seq.length) % seq.length]);
    }, [show]);

    useImperativeHandle(ref, () => ({ open }), [open]);

    useEffect(() => {
      const r = root.current;
      if (!r) return;
      // runs before the zoom's own window listener: Esc and ← → belong to the zoom while it is up
      const keys = (e: KeyboardEvent) => {
        const zoomed = !!r.querySelector(".zoom");
        if (e.key === "Escape") { zoomEsc.current = zoomed; return; }
        if (zoomed || !st.current.id || e.metaKey || e.ctrlKey || e.altKey) return;
        // Tab stays inside the card: past the last control it comes back to the close, and the other way round
        if (e.key === "Tab") {
          const all = [...r.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
            .filter((el) => el.offsetParent !== null || el === closeBtn.current);
          if (!all.length) return;
          const first = all[0], last = all[all.length - 1], at = document.activeElement;
          if (e.shiftKey && (at === first || !r.contains(at))) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && (at === last || !r.contains(at))) { e.preventDefault(); first.focus(); }
          return;
        }
        if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
      };
      r.addEventListener("keydown", keys, true);
      return () => r.removeEventListener("keydown", keys, true);
    }, [turn]);

    useEffect(() => () => clearTimeout(st.current.timer), []);

    /** a click outside the card closes, but not the tap that opened it (on a touch screen
     *  its click can arrive after the card is up) */
    const backdrop = () => { if (performance.now() - st.current.at > 450) close(); };

    const w = id ? BY_ID.get(id) : undefined;
    const d = id ? dims[id] : undefined;
    const k = id ? st.current.seq.indexOf(id) : -1;
    const pad = (n: number) => String(n).padStart(2, "0");

    return (
      <dialog className={`lb${closing ? " is-closing" : ""}`} ref={root} aria-labelledby="lb-title" data-lenis-prevent=""
              data-painting-id={id ?? undefined}
              onCancel={(e) => { e.preventDefault(); if (zoomEsc.current) { zoomEsc.current = false; return; } close(); }}>
        <div className="lb-veil" onClick={backdrop} />
        <button type="button" className="lb-close" ref={closeBtn} onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
        </button>
        <div className="lb-sheet" ref={sheet}>
          {w && (
            <PaintingStage key={w.id} w={w} src={LARGE.has(w.id) ? `/art/large/${w.id}.jpg` : `/art/works/${w.id}.jpg`}
                           dims={d} small={!!d && Math.max(d.w, d.h) < 600} sub={labelLine(w)}>
              <PaintingInfo w={w} place="studio" titleId="lb-title" />
            </PaintingStage>
          )}
          {st.current.seq.length > 1 && (
            <div className="lb-step" role="group" aria-label="Her other works">
              <button type="button" onClick={() => turn(-1)}>← Previous</button>
              <span className="lb-count">{k >= 0 ? `${pad(k + 1)} / ${pad(st.current.seq.length)}` : ""}</span>
              <button type="button" onClick={() => turn(1)}>Next →</button>
            </div>
          )}
        </div>
      </dialog>
    );
  }
);

export default Lightbox;

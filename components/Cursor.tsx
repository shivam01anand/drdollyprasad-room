"use client";

import { useEffect, useRef } from "react";
import { motion, gsap, settleText } from "@/lib/motion";

/**
 * The original's cursor: a thin ring that trails the pointer by 0.3 s and is
 * drawn in difference, so it is dark over plaster and light over the dark
 * room. Over a link or a control it closes to a dot; over something that
 * says what it does — the Featured row, a painting in the collage or on the
 * wall — it opens and the word decodes inside it.
 * The system cursor is never hidden. Desktop only, as in the original.
 *
 * Labels come from `data-cursor` on any element, or from the room through
 * the `cursor:label` window event (a painting under the pointer).
 */
export const roomCursorLabel = (label: string | null) =>
  window.dispatchEvent(new CustomEvent("cursor:label", { detail: label }));

const CONTROL = "a, button, [role='button'], input, label, select, textarea";

export default function Cursor({ live }: { live: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 992px)");
    const w = wrap.current!, d = dot.current!, t = text.current!;
    if (!mq.matches) { w.hidden = true; return; }
    motion();
    w.hidden = false;
    gsap.set(d, { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
    const xTo = gsap.quickTo(d, "x", { duration: 0.3, ease: "power2.out" });
    const yTo = gsap.quickTo(d, "y", { duration: 0.3, ease: "power2.out" });

    let fromDom: string | null = null;   // a [data-cursor] under the pointer
    let fromRoom: string | null = null;  // a painting on the wall
    let overControl = false;
    let overCanvas = false;
    let shown = "";
    let tw: { kill(): void } | null = null;

    const settle = () => {
      const label = fromDom ?? (overCanvas ? fromRoom : null);
      d.classList.toggle("is-label", !!label);
      d.classList.toggle("is-control", !label && overControl);
      if ((label ?? "") === shown) return;
      const was = shown;
      shown = label ?? "";
      tw?.kill();
      // a word leaves through its own letters, as in the original
      tw = label
        ? settleText(t, label)
        : settleText(t, "");
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      xTo(e.clientX); yTo(e.clientY);
      w.dataset.in = "1";
    };
    let lastEl: Element | null = null;
    const read = (el: Element | null) => {
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      fromDom = labelled?.dataset.cursor || null;
    };
    // a label that changes under a still pointer (the lightbox zoom)
    const onRefresh = () => { read(lastEl); settle(); };
    const onOver = (e: PointerEvent) => {
      const el = e.target as Element | null;
      lastEl = el;
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      fromDom = labelled?.dataset.cursor || null;
      overControl = !!el?.closest(CONTROL);
      overCanvas = el?.tagName === "CANVAS";
      settle();
    };
    const onOut = (e: PointerEvent) => { if (!e.relatedTarget) w.dataset.in = "0"; };
    const onRoom = (e: Event) => { fromRoom = (e as CustomEvent<string | null>).detail; settle(); };
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    addEventListener("cursor:label", onRoom);
    addEventListener("cursor:refresh", onRefresh);
    return () => {
      removeEventListener("cursor:refresh", onRefresh);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      removeEventListener("cursor:label", onRoom);
      tw?.kill();
    };
  }, []);

  return (
    <div className="cursor" ref={wrap} data-live={live ? "1" : "0"} data-in="0" aria-hidden="true" hidden>
      <div className="cursor-dot" ref={dot}><div className="cursor-text" ref={text} /></div>
    </div>
  );
}

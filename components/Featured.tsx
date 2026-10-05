"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, gsap, Draggable, scrambleTo, reducedMotion } from "@/lib/motion";
import { BY_ID, FEATURED, pill, quoted } from "@/lib/works";

/**
 * Featured — the original's slider, rebuilt for her work.
 *
 * A heading with arrows and an "All work" pill; a row of cards in two widths,
 * captions alternating above and below so the row has a vertical rhythm;
 * title left and her stated size right; the status pill on the image. Cards
 * open by clip, bottom-up and top-down in turn, settling from 1.2×; the
 * captions decode out of their own letters. Drag with inertia, snap card to
 * card, arrows, or a sideways trackpad swipe. A click opens the work.
 */

// the original's two widths, in its 15/20 rhythm
const WIDE = [true, false, true, false, false, true, false, true, false, true, false];

type Dims = Record<string, { w: number; h: number }>;

export default function Featured({ dims, onOpen }: { dims: Dims; onOpen(id: string, img: HTMLImageElement): void }) {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const open = useRef(onOpen);
  open.current = onOpen;

  // the resting, unrevealed state is set before paint, so nothing flashes
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    motion();
    const root = section.current!;
    root.querySelectorAll<HTMLElement>(".feat-media").forEach((m, i) =>
      gsap.set(m, { clipPath: i % 2 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)" }));
    gsap.set(root.querySelectorAll(".feat-media img"), { scale: 1.2 });
    gsap.set(root.querySelectorAll(".feat-pill"), { xPercent: 101, autoAlpha: 0 });
    gsap.set(root.querySelector(".feat-all"), { yPercent: 101 });
    root.querySelectorAll<HTMLElement>("[data-cap]").forEach((el) => { el.textContent = ""; });
  }, []);

  useEffect(() => {
    motion();
    const root = section.current!, vp = viewport.current!, tr = track.current!;
    const reduce = reducedMotion();
    const cards = [...tr.querySelectorAll<HTMLElement>(".feat-card")];

    // geometry, measured when layout changes rather than on every input
    let minX = 0;
    let snapXs: number[] = [0];
    const measure = () => {
      minX = Math.min(0, vp.clientWidth - tr.scrollWidth);
      snapXs = [...new Set([...cards.map((c) => Math.max(minX, -(c.offsetLeft - cards[0].offsetLeft))), minX])]
        .sort((a, b) => b - a);
    };
    measure();
    const nearest = (x: number) => snapXs.reduce((best, c) => (Math.abs(c - x) < Math.abs(best - x) ? c : best), 0);

    // one owner for the row's movement: a new input cancels the last one
    let slide: gsap.core.Tween | undefined;
    let settle = 0;
    const cancel = () => { slide?.kill(); drag?.tween?.kill(); clearTimeout(settle); };
    const glide = (x: number, d = 0.9) => {
      cancel();
      slide = gsap.to(tr, { x: Math.max(minX, Math.min(0, x)), duration: reduce ? 0 : d, ease: "power3.out",
        onUpdate: () => { drag.update(); } });
    };

    const [drag] = Draggable.create(tr, {
      type: "x",
      inertia: !reduce,
      bounds: { minX, maxX: 0 },
      edgeResistance: 0.85,
      snap: { x: (v: number) => nearest(v) },
      dragClickables: true,
      allowNativeTouchScrolling: true,
      minimumMovement: 6,
      cursor: "grab",
      activeCursor: "grabbing",
      onPress: () => { slide?.kill(); clearTimeout(settle); },
      onClick(e: PointerEvent) {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".feat-card");
        const img = card?.querySelector<HTMLImageElement>(".feat-media img");
        if (card && img) open.current(card.dataset.id!, img);
      },
    });

    const go = (dir: 1 | -1) => {
      const x = gsap.getProperty(tr, "x") as number;
      const next = dir > 0 ? snapXs.find((v) => v < x - 4) ?? minX : [...snapXs].reverse().find((v) => v > x + 4) ?? 0;
      glide(next);
    };
    const prev = root.querySelector<HTMLButtonElement>("[data-prev]")!;
    const nextBtn = root.querySelector<HTMLButtonElement>("[data-next]")!;
    const onPrev = () => go(-1), onNext = () => go(1);
    prev.addEventListener("click", onPrev);
    nextBtn.addEventListener("click", onNext);

    // a sideways swipe on a trackpad moves the row; vertical wheel scrolls the page
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      // a sideways gesture belongs to the row alone: Lenis listens on the
      // window and ignores defaultPrevented, so the page must not hear it
      e.preventDefault();
      e.stopPropagation();
      cancel();
      const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? vp.clientWidth : 1;
      const x = gsap.getProperty(tr, "x") as number;
      gsap.set(tr, { x: Math.max(minX, Math.min(0, x - e.deltaX * unit)) });
      drag.update();
      settle = window.setTimeout(() => glide(nearest(gsap.getProperty(tr, "x") as number), 0.6), 140);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.target !== vp) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    vp.addEventListener("keydown", onKey);
    // a card reached by Tab is brought into view
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as Element).closest<HTMLElement>(".feat-card");
      if (card) glide(-(card.offsetLeft - cards[0].offsetLeft), 0.25);
    };
    vp.addEventListener("focusin", onFocus);

    // reveal on enter, reset on leave — in both directions, as the original
    const media = [...root.querySelectorAll<HTMLElement>(".feat-media")];
    const imgs = media.map((m) => m.querySelector("img")!);
    const pills = [...root.querySelectorAll<HTMLElement>(".feat-pill")];
    const caps = [...root.querySelectorAll<HTMLElement>("[data-cap]")];
    const all = root.querySelector<HTMLElement>(".feat-all")!;
    let live: gsap.core.Timeline | null = null;

    const reveal = () => {
      live?.kill();
      const tl = gsap.timeline();
      tl.to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 2, ease: "power2.out", stagger: 0.06 }, 0.5)
        .to(imgs, { scale: 1, duration: 2, ease: "power2.out", stagger: 0.06 }, 0.5)
        .to(pills, { xPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out", stagger: 0.04 }, 0.9)
        .to(all, { yPercent: 0, duration: 0.6, ease: "power2.out" }, 1);
      caps.forEach((el) => tl.add(scrambleTo(el, el.dataset.cap!, { anagram: true, speed: 0.6, duration: 1 }), 1));
      live = tl;
    };
    const reset = () => {
      live?.kill();
      const tl = gsap.timeline();
      tl.set(media, { clipPath: (i: number) => (i % 2 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)") })
        .set(imgs, { scale: 1.2 })
        .set(pills, { xPercent: 101, autoAlpha: 0 })
        .set(all, { yPercent: 101 });
      caps.forEach((el) => tl.add(scrambleTo(el, "", { anagram: false, chars: el.dataset.cap, speed: 0.6, duration: 0.6 }), 0));
      live = tl;
    };

    let io: IntersectionObserver | null = null;
    if (!reduce) {
      let inView = false;
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !inView) { inView = true; reveal(); }
        else if (!e.isIntersecting && inView) { inView = false; reset(); }
      }, { threshold: 0.2 });
      io.observe(vp);
    }

    const ro = new ResizeObserver(() => {
      cancel();
      measure();
      const x = gsap.getProperty(tr, "x") as number;
      gsap.set(tr, { x: Math.max(minX, Math.min(0, x)) });
      drag.applyBounds({ minX, maxX: 0 });
    });
    ro.observe(vp);
    ro.observe(tr);

    return () => {
      io?.disconnect();
      ro.disconnect();
      live?.kill();
      cancel();
      drag.kill();
      prev.removeEventListener("click", onPrev);
      nextBtn.removeEventListener("click", onNext);
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("keydown", onKey);
      vp.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <section className="featured" ref={section} aria-label="Featured works">
      <div className="feat-head">
        <div className="feat-arrows">
          <button type="button" className="feat-arrow" data-prev aria-label="Previous works">←</button>
          <button type="button" className="feat-arrow" data-next aria-label="Next works">→</button>
        </div>
        <h2 id="featured-title" className="feat-title" data-cap="Featured">Featured</h2>
        <div className="mask">
          <a className="pill pill-solid feat-all" href="#works">All work →</a>
        </div>
      </div>

      <div className="feat-viewport" ref={viewport} tabIndex={0} aria-label="Featured works — drag, or use the arrow keys">
        <div className="feat-track" ref={track}>
          {FEATURED.map((id, i) => {
            const w = BY_ID.get(id)!;
            const d = dims[id];
            const above = i % 2 === 1;
            const caption = (
              <div className="feat-cap">
                <span data-cap={quoted(w.title)}>{quoted(w.title)}</span>
                {w.size && <span data-cap={w.size}>{w.size}</span>}
              </div>
            );
            return (
              <article className={`feat-card${WIDE[i] ? " is-wide" : ""}${above ? " is-above" : ""}`} data-id={id} key={id}
                       role="button" tabIndex={0} aria-label={`Open ${w.title}`}
                       onKeyDown={(e) => {
                         if (e.key !== "Enter" && e.key !== " ") return;
                         e.preventDefault();
                         const image = e.currentTarget.querySelector<HTMLImageElement>(".feat-media img");
                         if (image) open.current(id, image);
                       }}>
                {above && caption}
                <div className="feat-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/art/works/${id}.jpg`} alt={`${w.title} — ${w.medium.toLowerCase()}`}
                       width={d?.w} height={d?.h} draggable={false} data-flip-id={id} loading="lazy" decoding="async" />
                  <span className="feat-pill">{pill(w)}</span>
                </div>
                {!above && caption}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

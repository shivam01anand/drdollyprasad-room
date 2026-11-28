"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { HER_WALL, herWallMore } from "@/lib/her-wall";
import { inkPlan } from "@/lib/caption-fit";
import { gsap, reducedMotion } from "@/lib/motion";
import type { Room } from "@/lib/room/Room";

/**
 * The wall about her (lib/her-wall.ts), set where her easel stood. A framed photograph (black frame,
 * cream mat, as her paintings hang) and lettering on the wall beside it: no box, no glass. It is
 * anchored to the courtyard's north wall, so it follows the wall while the view sways, and comes in
 * once the camera has landed. Its words are never smaller than 16 px, on a phone too; its frame
 * and gaps scale with the wall (--u, pixels to a metre).
 */
const STOP = CHAPTERS.findIndex((c) => c.herWall);

export default function HerWall({ room, active, live }: { room: React.RefObject<Room | null>; active: number; live: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !live || active !== STOP) return;
    const quick = reducedMotion();
    let on = false, last = -1, raf = 0, ink = 0, inkAsked = false;
    const onLight = () => { inkAsked = false; };
    addEventListener("studio:light", onLight);
    /** what stands below it (the chapter's words at the foot of a phone, the controls): it must end above that;
     *  else it tightens, then drops its two last lines, never its type below 16 px */
    const fit = (top: number): number => {
      let floor = innerHeight - 12;
      document.querySelectorAll<HTMLElement>(`.copy-panel[data-i='${active}'], .dock, .hud-bottom > *`).forEach((n) => {
        const b = n.getBoundingClientRect();
        if (b.width && b.height && b.top > innerHeight * 0.45) floor = Math.min(floor, b.top);
      });
      const min = Math.max(innerHeight * 0.095, 78);
      for (const level of ["0", "1", "2"]) {
        el.dataset.fit = level;
        const need = floor - 8 - el.offsetHeight;
        if (need >= Math.min(top, min) || level === "2") return Math.max(min, Math.min(top, need));
      }
      return top;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const R = room.current;
      if (!R) return;
      const here = R.landed && Math.abs(R.at * (CHAPTERS.length - 1) - active) < 0.04;
      if (!here) {
        if (on) { on = false; last = -1; inkAsked = false; gsap.to(el, { autoAlpha: 0, duration: quick ? 0 : 0.2, overwrite: true }); }
        return;
      }
      if (on && last === R.viewVersion) return;
      last = R.viewVersion;
      const w = R.wallRect(HER_WALL.wall);
      if (!w) return;
      const width = w.x1 - w.x0, u = width / (HER_WALL.wall.x1 - HER_WALL.wall.x0);
      el.style.setProperty("--u", `${u.toFixed(2)}px`);
      el.style.width = `${Math.round(width)}px`;
      const top = Math.max(w.y0, innerHeight * 0.095);
      const y = Math.round(fit(top));
      el.style.transform = `translate3d(${Math.round(w.x0)}px, ${y}px, 0)`;
      if (!inkAsked) {
        inkAsked = true;
        // the wall behind the words, as drawn: the ink and, where neither holds 4.5:1, a thicker soft shadow
        R.readLumaBehind("herwall", { x0: w.x0, y0: y, x1: w.x1, y1: Math.min(innerHeight, y + el.offsetHeight) }, (l, range) => {
          const plan = inkPlan(l, range, el.dataset.ink ? el.dataset.ink === "light" : null);
          el.dataset.ink = plan.light ? "light" : "dark";
          el.dataset.halo = plan.halo ? "1" : "";
        }, true);
      }
      if (!on) { on = true; gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: quick ? 0 : 0.5, delay: quick ? 0 : 0.15, ease: "power2.out", overwrite: true }); }
    };
    raf = requestAnimationFrame(tick);
    return () => { removeEventListener("studio:light", onLight); cancelAnimationFrame(raf); clearTimeout(ink); gsap.killTweensOf(el); el.style.visibility = "hidden"; el.style.opacity = "0"; };
  }, [room, active, live]);

  const h = HER_WALL, more = herWallMore();
  return (
    <div className="her-wall" ref={root} aria-label={`About ${h.heading}`}>
      <figure className="hw-photo">
        <span className="hw-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.photo.src} width={h.photo.width} height={h.photo.height} alt={h.photo.alt} decoding="async" draggable={false} />
        </span>
        <figcaption>{h.photo.caption}</figcaption>
      </figure>
      <div className="hw-intro">
        <h2>{h.heading}</h2>
        <p>{h.bio}</p>
      </div>
      <div className="hw-exh">
        <h3>{h.exhibitionsHeading}</h3>
        <ul>
          {h.exhibitions.map((e) => <li key={e.year + e.line}><b>{e.year}</b> {e.line}</li>)}
          <li className="hw-more">and {more} more since 2005</li>
        </ul>
      </div>
      <div className="hw-lines">
        <p>{h.press}</p>
        <p>{h.collectors}</p>
      </div>
    </div>
  );
}

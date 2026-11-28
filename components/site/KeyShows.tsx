"use client";

import { useEffect, useState, type ReactNode } from "react";
import Marquee from "./Marquee";
import { motionPaused } from "@/lib/motion-rules";
import type { Photo } from "@/lib/site";

const SLIDE_MS = 4200;

/** one key show: its photographs, one at a time, moving on by themselves (and by hand) */
function ShowCarousel({ name, where, photos, id }: { name: string; where: string; photos: Photo[]; id: string }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!held && !motionPaused()) setI((x) => (x + 1) % photos.length); }, SLIDE_MS);
    return () => clearInterval(t);
  }, [held, photos.length]);
  const go = (d: number) => setI((x) => (x + d + photos.length) % photos.length);
  const p = photos[i];
  return (
    <figure className="ks-show" aria-roledescription="carousel" aria-label={`Photographs: ${name}`}
            onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
      <div className="ks-stage">
        {photos.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.src} className={k === i ? "is-on" : ""} src={x.src} alt={k === i ? x.alt : ""} aria-hidden={k !== i || undefined}
               loading={k < 2 ? "eager" : "lazy"} decoding="async" draggable={false} />
        ))}
        <button type="button" className="ks-btn ks-prev" aria-label={`Previous photograph, ${name}`} onClick={() => go(-1)}>‹</button>
        <button type="button" className="ks-btn ks-next" aria-label={`Next photograph, ${name}`} onClick={() => go(1)}>›</button>
      </div>
      <figcaption>
        <b id={`${id}-ks`}>{name}</b>
        <span>{where}</span>
        <small aria-live="off">{p.cap ?? ""}</small>
      </figcaption>
    </figure>
  );
}

export type OtherShow = { name: string; venue: string; year: string };

/** the key shows' two photo carousels side by side, then every other exhibition in one slow row */
export default function KeyShows({ shows, others }: {
  shows: { id: string; name: string; where: string; photos: Photo[] }[];
  others: OtherShow[];
}): ReactNode {
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <section className="ks" aria-labelledby="ks-h">
      <h2 id="ks-h" className="ks-h">Key exhibitions</h2>
      <div className="ks-grid">
        {shows.map((s) => <ShowCarousel key={s.id} id={s.id} name={s.name} where={s.where} photos={s.photos} />)}
      </div>
      <p className="ks-more-h">And the other exhibitions and art fairs</p>
      {/* data-hold: lib/drift keeps the row still while the pointer is on it, and always under reduced motion */}
      <div className="ks-row" data-hold={hover || reduced ? "1" : undefined}
           onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Marquee label="Other exhibitions" reverse seconds={Math.max(60, others.length * 6)} copies={3} className="ks-marq">
          {others.map((o) => (
            <div key={o.name + o.year} className="ks-item">
              <b>{o.name}</b>
              <span>{o.venue}</span>
              <small>{o.year}</small>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { slug: string; label: string; n: number; src: string; alt: string; w?: number; h?: number };

/** a fast crossfade through each collection's lead painting, with its name and number of works (CR-008) */
export default function SeriesSlides({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i];
  return (
    <div className="ss">
      <Link className="ss-stage" href={`/series/${s.slug}`} aria-label={`${s.label}, ${s.n} works`}>
        {slides.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.slug} className={`framed${k === i ? " is-on" : ""}`} src={x.src} alt={k === i ? x.alt : ""} width={x.w} height={x.h} loading={k === 0 ? "eager" : "lazy"} />
        ))}
      </Link>
      <p className="ss-cap" aria-live="off"><b>{String(i + 1).padStart(2, "0")}</b><span>{s.label}</span><small>{s.n} works</small></p>
    </div>
  );
}

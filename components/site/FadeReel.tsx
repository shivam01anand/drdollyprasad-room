"use client";

import Link from "next/link";
import { motionPaused } from "@/lib/motion-rules";
import { useEffect, useState } from "react";

export type Reel = { id: string; title: string; src: string };

/** CR-011: a small, slow crossfade through every painting, under the five collections */
export default function FadeReel({ items }: { items: Reel[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!motionPaused()) setI((x) => (x + 1) % items.length); }, 2200);
    return () => clearInterval(t);
  }, [items.length]);
  const w = items[i];
  return (
    <div className="freel">
      <Link className="freel-stage" href={`/work/${w.id}`} aria-label={w.title}>
        {items.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.id} className={k === i ? "is-on" : ""} src={x.src} alt={k === i ? x.title : ""}
               loading={k < 2 ? "eager" : "lazy"} />
        ))}
      </Link>
      <p className="freel-cap">{w.title}</p>
    </div>
  );
}

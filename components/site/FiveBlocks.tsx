"use client";

import { useEffect, useState } from "react";
import { motionPaused } from "@/lib/motion-rules";

export type Block = { slug: string; label: string; n: number; period: string; pics: { src: string; alt: string }[] };

/** Collections: the five collections in one line, each a small slideshow of its paintings; a tap opens the collection */
export default function FiveBlocks({ blocks }: { blocks: Block[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!motionPaused()) setTick((x) => x + 1); }, 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <ol className="five" aria-label="The five collections">
      {blocks.map((b, k) => {
        // the five blocks change one after another, not all at once
        const on = tick === 0 ? 0 : Math.floor(tick + k * 0.6) % b.pics.length; // every block opens on its lead painting
        return (
          <li key={b.slug}>
            <a className="five-b" href={`#${b.slug}`}>
              <span className="five-stage">
                {b.pics.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.src} className={i === on ? "is-on" : ""} src={p.src} alt={i === 0 ? p.alt : ""}
                       loading="eager" />
                ))}
              </span>
              <span className="five-n">{String(k + 1).padStart(2, "0")}</span>
              <span className="five-t">{b.label}</span>
              <span className="five-m">{b.n} works · {b.period}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

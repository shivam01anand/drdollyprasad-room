"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Block = { slug: string; label: string; n: number; period: string; pics: { src: string; alt: string }[] };

/** Collections: the five collections in one line, each a small slideshow of its paintings; a tap opens the collection */
export default function FiveBlocks({ blocks }: { blocks: Block[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((x) => x + 1), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <ol className="five" aria-label="The five collections">
      {blocks.map((b, k) => {
        // the five blocks change one after another, not all at once
        const on = Math.floor((tick + k * 0.6)) % b.pics.length;
        return (
          <li key={b.slug}>
            <Link className="five-b" href={`/series/${b.slug}`}>
              <span className="five-stage">
                {b.pics.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.src} className={i === on ? "is-on" : ""} src={p.src} alt={i === 0 ? p.alt : ""}
                       loading={i < 2 ? "eager" : "lazy"} />
                ))}
              </span>
              <span className="five-n">{String(k + 1).padStart(2, "0")}</span>
              <span className="five-t">{b.label}</span>
              <span className="five-m">{b.n} works · {b.period}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

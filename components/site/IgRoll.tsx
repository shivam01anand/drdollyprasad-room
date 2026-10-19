"use client";

import { useEffect, useRef } from "react";
import { driftRow } from "@/lib/drift";

/**
 * The Instagram strip beside the follow card: her paintings drifting past.
 * Drag or swipe it by hand; a click or tap opens her Instagram. The button
 * beside it is the keyboard's way in, so the strip itself stays out of the tab order.
 */
export type IgItem = { src: string; width?: number; height?: number };

export default function IgRoll({ items, href }: { items: IgItem[]; href: string }) {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => (view.current && track.current ? driftRow(view.current, track.current, { seconds: 60, copies: 2, pauseOnHover: true }) : undefined), []);
  return (
    <div className="ig-roll" ref={view} aria-hidden="true">
      <div className="ig-track" ref={track}>
        {[...items, ...items].map((it, i) => (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} width={it.width} height={it.height} alt="" loading="lazy" draggable={false} />
          </a>
        ))}
      </div>
    </div>
  );
}

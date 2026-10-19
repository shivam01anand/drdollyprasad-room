"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { driftRow } from "@/lib/drift";

export type BandTile = { href: string; src: string; title: string; width?: number; height?: number };

/**
 * The low running row behind a page's title card: drag or swipe it by hand,
 * click or tap a painting to open it, and it drifts on again after a moment.
 * Each painting sharpens under the cursor so it reads as something to open.
 * The real links to every painting are on the page, so the row stays out of
 * the keyboard's way and out of screen readers.
 */
export default function BandRow({ tiles }: { tiles: BandTile[] }) {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => (view.current && track.current ? driftRow(view.current, track.current, { seconds: 90, copies: 2, pauseOnHover: true }) : undefined), []);
  return (
    <div className="tband-row" ref={view} aria-hidden="true">
      <div className="tband-track" ref={track}>
        {[...tiles, ...tiles].map((t, i) => (
          <Link key={i} href={t.href} tabIndex={-1} title={t.title} draggable={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="framed thin" src={t.src} alt="" width={t.width} height={t.height} loading={i < tiles.length ? "eager" : "lazy"} decoding="async" draggable={false} />
          </Link>
        ))}
      </div>
    </div>
  );
}

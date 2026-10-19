"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Gallery from "./Gallery";
import { dims } from "@/lib/images";
import type { PressItem } from "@/lib/press";

/** where each face is (object-position), so a phone crop never cuts her head */
const FOCUS: Record<string, string> = {
  "ihc-press-01": "78% 40%", "ihc-press-06": "60% 72%", "ihc-press-03": "55% 45%", "ihc-press-02": "55% 35%",
  "ihc-press-04": "30% 55%", "ihc-press-05": "58% 48%", "ihc-press-b": "75% 40%", "delhi-times": "50% 30%",
};

/**
 * In the press (CR-005): an editorial collage of the interviews, the papers and
 * the television archive, each in a thin black frame with a soft shadow.
 * On a computer it is a masonry of three (two on a tablet); on a phone, one
 * swipeable row with the next item peeking in. A photograph or clipping opens
 * full screen with its caption (Gallery). A television excerpt plays where it
 * is, starting muted (its sound is a tap away in the player's controls), with
 * its cover as the poster; nothing loads until it is played.
 */
export default function Press({ items, more }: { items: PressItem[]; more?: { href: string; label: string } }) {
  const stills = items.filter((p) => p.kind !== "video");
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className="press" role="list">
        {items.map((p) => (
          <li key={p.id} className={`press-item is-${p.kind}`}>
            <figure>
              {p.kind === "video" ? <Clip p={p} /> : (
                <button type="button" className="press-open" onClick={() => setOpen(stills.indexOf(p))}
                        aria-label={`Open full screen: ${p.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.sm ?? p.src} alt={p.alt} loading="eager" decoding="async" {...dims(p.sm ?? p.src)} style={{ objectPosition: FOCUS[p.id] ?? "50% 30%" }} />
                </button>
              )}
              <figcaption>
                <em>{p.source}</em>
                <b>{p.title}</b>
                <span>{p.line}</span>
                {p.credit && <small>{p.credit}</small>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {more && <p className="press-more"><Link className="link" href={more.href}>{more.label} →</Link></p>}
      {open !== null && (
        <Gallery label="In the press" start={open} onClose={() => setOpen(null)}
                 shots={stills.map((p) => ({ src: p.src, alt: p.alt, title: p.title, line: p.line, source: p.source }))} />
      )}
    </>
  );
}

/** a television excerpt: its cover first, a play button on it, then the clip itself, muted, in place */
function Clip({ p }: { p: PressItem }) {
  const v = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const play = () => {
    const el = v.current;
    if (!el) return;
    el.muted = true;
    setOn(true);
    el.play().catch(() => {});
  };
  return (
    <div className={`press-clip${on ? " is-on" : ""}`}>
      <video ref={v} poster={p.poster} preload="none" playsInline muted controls={on} aria-label={p.alt}
             onEnded={() => setOn(false)}>
        <source src={p.src} type="video/mp4" />
      </video>
      {!on && (
        <button type="button" className="press-play" onClick={play} aria-label={`Play: ${p.title} (starts muted)`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
        </button>
      )}
      {!on && <span className="press-watch" aria-hidden="true">Watch · NCR, 2010</span>}
    </div>
  );
}

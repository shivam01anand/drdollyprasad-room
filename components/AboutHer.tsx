"use client";

import { useState } from "react";
import { PRESS_ALL, type PressItem } from "@/lib/press";
import { askPath } from "@/lib/studio-ask";

/**
 * The entrance panel (chapter id "about"): who she is, then the press, in the walk's own style.
 * Shown by Studio.tsx while that chapter is the one in view; it renders nothing for the walk until
 * lib/chapters.ts has a chapter with that id.
 *
 * Copy locked by Shubham, 27 Oct 2026 (ours, never hers).
 */
const HEADING = "An artist who makes the everyday memorable";
const CREDITS = "Eighteen exhibitions and art fairs, 2005–2018 · Collectors in India, the USA and the UK";

const ORDER = ["ihc-press-01", "tv-ncr-2010", "delhi-times", "ihc-press-06", "ihc-press-03", "tv-archive"];
const ITEMS: PressItem[] = ORDER.map((id) => PRESS_ALL.find((p) => p.id === id)).filter((p): p is PressItem => !!p);

/** a clip is a poster until it is tapped; only then is the video fetched. Muted: sound is her visitor's to turn on. */
function Clip({ item }: { item: PressItem }) {
  const [on, setOn] = useState(false);
  return (
    <div className="wp-clip">
      {on ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={item.src} poster={item.poster} muted autoPlay playsInline controls preload="none"
               aria-label={item.card ?? item.title} />
      ) : (
        <button type="button" className="wp-play" onClick={() => setOn(true)} aria-label={`Play: ${item.card ?? item.title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.poster} alt={item.alt} loading="lazy" decoding="async" />
          <span className="wp-play-dot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5-9-5.5Z" /></svg></span>
        </button>
      )}
    </div>
  );
}

export default function AboutHer({ open }: { open: boolean }) {
  return (
    <section className="walk-panel about-her" data-on={open ? "1" : "0"} inert={!open} aria-hidden={!open}
             aria-label={HEADING} data-lenis-prevent="">
      <h2 className="wp-h">{HEADING}</h2>
      <p className="wp-p">
        Dr Dolly Prasad is a New Delhi artist who holds the everyday <span className="red">sacred</span>. For her, the ordinary is
        never small: a clay gullak, a closed door, a lamp lifted at aarti, a face at the corner of a lane.
      </p>
      <p className="wp-cred">{CREDITS}</p>
      <ul className="wp-press">
        {ITEMS.map((it) => (
          <li key={it.id} className={`wp-item is-${it.kind}`}>
            {it.kind === "video" ? <Clip item={it} /> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.sm ?? it.src} alt={it.alt} loading="lazy" decoding="async" />
            )}
            <p className="wp-cap">{it.card ?? it.title}</p>
          </li>
        ))}
      </ul>
      <a className="wp-link" href={askPath()} data-analytics-source="studio_about">Ask about a painting</a>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PRESS_ALL, type PressItem } from "@/lib/press";
import { askPath } from "@/lib/studio-ask";

/**
 * About her: the opening card and its "Know more" sheet (who she is, then the press).
 *
 * Copy locked by Shubham, 27 Oct 2026 (ours, never hers).
 */
const HEADING = "An artist who makes the everyday memorable";
const CREDITS = "Eighteen exhibitions and art fairs, 2005–2018 · Collectors in India, the USA and the UK";

// three tiles, in this order (Shubham, 9 Nov 2026)
const ORDER = ["ihc-press-01", "tv-ncr-2010", "delhi-times"];
const ITEMS: PressItem[] = ORDER.map((id) => PRESS_ALL.find((p) => p.id === id)).filter((p): p is PressItem => !!p);

/** a clip is a poster until it is tapped; only then is the video fetched. Muted: sound is her visitor's to turn on. */
function Clip({ item, eager }: { item: PressItem; eager: boolean }) {
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
          <img src={item.poster} alt={item.alt} loading={eager ? "eager" : "lazy"} decoding="async" />
          <span className="wp-play-dot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5-9-5.5Z" /></svg></span>
        </button>
      )}
    </div>
  );
}

/**
 * The opening (art direction V3 §2): Woman with Poppies above, and a compact card about her. The
 * card is the dock on this stop: "Enter the studio" walks in; "Know more" opens the full text and
 * the press (KnowMore). Copy locked by Shubham, 27 Oct 2026 (ours, never hers).
 */
export function OpeningCard({ open, onEnter, onMore }: { open: boolean; onEnter(): void; onMore(): void }) {
  return (
    <section className="ocard" data-on={open ? "1" : "0"} inert={!open} aria-hidden={!open} aria-label="About her">
      <div className="oc-who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/site/dolly.jpg" alt="Dr Dolly Prasad" width={52} height={52} decoding="async" />
        <div>
          <p className="oc-name">Dr Dolly Prasad</p>
          <p className="oc-meta">Paintings · New Delhi</p>
        </div>
      </div>
      <h2 className="oc-h">{HEADING}</h2>
      <p className="oc-p">Dr Dolly Prasad is a New Delhi artist who holds the everyday <span className="red">sacred</span>.</p>
      <div className="oc-actions">
        <button type="button" className="oc-enter" onClick={onEnter}>
          <span>Enter the studio</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" /></svg>
        </button>
        <button type="button" className="oc-more" onClick={onMore} aria-haspopup="dialog">Know more</button>
      </div>
      <p className="oc-cred">Eighteen exhibitions and art fairs, 2005–2018</p>
    </section>
  );
}

/** "Know more": the full text, the credentials and the press, in the locked order */
export default function KnowMore({ open, onClose, onEnter }: { open: boolean; onClose(): void; onEnter(): void }) {
  // the press loads as soon as the sheet is first opened (a lazy image in a hidden sheet stayed blank, QC 29 Oct)
  const [seen, setSeen] = useState(false);
  useEffect(() => { if (open) setSeen(true); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <section className="walk-panel about-her knowmore" data-on={open ? "1" : "0"} inert={!open} aria-hidden={!open}
             role="dialog" aria-label={HEADING} data-lenis-prevent="">
      <button type="button" className="km-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <h2 className="wp-h">{HEADING}</h2>
      <p className="wp-p">
        Dr Dolly Prasad is a New Delhi artist who holds the everyday <span className="red">sacred</span>. For her, the ordinary is
        never small: a clay gullak, a closed door, a lamp lifted at aarti, a face at the corner of a lane.
      </p>
      <p className="wp-cred">{CREDITS}</p>
      <ul className="wp-press">
        {ITEMS.map((it) => (
          <li key={it.id} className={`wp-item is-${it.kind}`}>
            {it.kind === "video" ? <Clip item={it} eager={seen} /> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.sm ?? it.src} alt={it.alt} loading={seen ? "eager" : "lazy"} decoding="async" />
            )}
            <p className="wp-cap">{it.card ?? it.title}</p>
          </li>
        ))}
      </ul>
      <div className="km-foot">
        <button type="button" className="oc-enter" onClick={onEnter}>
          <span>Enter the studio</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" /></svg>
        </button>
        <a className="wp-link" href={askPath()} data-analytics-source="studio_about">Ask about a painting</a>
      </div>
    </section>
  );
}

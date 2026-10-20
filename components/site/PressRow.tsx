"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Marquee from "./Marquee";
import Gallery from "./Gallery";
import { dims } from "@/lib/images";
import type { PressItem } from "@/lib/press";

/** where each face is (object-position), so a crop never cuts her head */
const FOCUS: Record<string, string> = {
  "ihc-press-01": "78% 40%", "ihc-press-06": "60% 72%", "ihc-press-03": "55% 45%", "ihc-press-02": "55% 35%",
  "ihc-press-04": "30% 55%", "ihc-press-05": "58% 48%", "ihc-press-b": "75% 40%", "delhi-times": "50% 30%",
};

/** the shape of each card's picture: its own file's proportions; television posters 16:10 */
const ar = (p: PressItem) => {
  if (p.kind === "video") return 16 / 10;
  const d = dims(p.sm ?? p.src);
  return d.width && d.height ? d.width / d.height : 4 / 3;
};

/**
 * In the press, as one moving row of every item (R3, Shubham 20 Oct: "all the
 * press, all the accolades"). It drifts at about 30 px a second (lib/drift via
 * Marquee), never stops under the mouse (CR-007), and moves by hand: drag,
 * swipe, Shift + wheel. A click (not a drag) opens the full-screen Gallery at
 * that item; a television excerpt plays there, muted, with its controls.
 * Nothing plays in the row. The row holds still while the Gallery is open.
 */
export default function PressRow({ items, more }: { items: PressItem[]; more?: { href: string; label: string } }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(130); // 10 cards x ~390 px at 30 px/s, until measured
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const set = el?.querySelector<HTMLElement>(".marq-set");
    if (!el || !set) return;
    el.querySelector(".marq")?.setAttribute("aria-roledescription", "carousel");
    const fit = () => { const w = set.getBoundingClientRect().width; if (w > 0) setSeconds(Math.max(20, Math.round(w / 30))); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(set);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="press press-row" data-hold={open !== null ? "1" : undefined}>
      <Marquee label="In the press" copies={3} seconds={seconds} className="press-marq">
        {items.map((p, k) => (
          <figure key={p.id} className={`press-item is-${p.kind}`} style={{ ["--ar" as string]: ar(p) } as CSSProperties}>
            <button type="button" className="media" onClick={() => setOpen(k)}
                    aria-label={p.kind === "video" ? `Play in full screen: ${p.title} (starts muted)` : `Open full screen: ${p.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.kind === "video" ? p.poster! : p.sm ?? p.src} alt={p.alt} loading="lazy" decoding="async" draggable={false}
                   {...(p.kind === "video" ? {} : dims(p.sm ?? p.src))} style={{ objectPosition: FOCUS[p.id] ?? "50% 30%" }} />
              {p.kind === "video" && (
                <span className="press-play" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
                </span>
              )}
            </button>
            <figcaption>
              <b>{p.title}</b>
              <span>{p.card ?? p.source}</span>
            </figcaption>
          </figure>
        ))}
      </Marquee>
      {more && <p className="press-more"><Link className="link" href={more.href}>{more.label} →</Link></p>}
      {open !== null && (
        <Gallery label="In the press" start={open} onClose={() => setOpen(null)}
                 shots={items.map((p) => ({ src: p.src, alt: p.alt, title: p.title, line: p.line, source: p.source,
                   ...(p.kind === "video" ? { video: true, poster: p.poster } : {}) }))} />
      )}
    </div>
  );
}

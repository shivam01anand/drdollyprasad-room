"use client";

import { askPath } from "@/lib/studio-ask";

/**
 * Her desk, the walk's close: where a visitor asks about a painting, or goes home.
 * Copy locked by Shubham, 27 Oct 2026 (ours, never hers); "Back to home" and "See all her
 * paintings" from art direction V3 §3.
 */
const HEADING = "Her desk";
const LINE = "If a painting stayed with you, ask us about it.";

export default function Desk({ open }: { open: boolean }) {
  return (
    <section className="walk-panel desk" data-on={open ? "1" : "0"} inert={!open} aria-hidden={!open}
             aria-label={HEADING} data-lenis-prevent="">
      <h2 className="wp-h">{HEADING}</h2>
      <p className="wp-p">{LINE}</p>
      <div className="desk-actions">
        <a className="pill pill-solid desk-ask" href={askPath()} data-analytics-source="studio_desk">Ask about a painting</a>
        <a className="desk-home" href="/">Back to home</a>
      </div>
      <a className="wp-link desk-all" href="/works">See all her paintings</a>
    </section>
  );
}

"use client";

import { askPath } from "@/lib/studio-ask";

/**
 * Her desk, the walk's close (chapter id "desk"): where a visitor asks about a painting.
 * Copy locked by Shubham, 27 Oct 2026 (ours, never hers).
 */
const HEADING = "Her desk";
const LINE = "If a painting stayed with you, ask us about it.";

export default function Desk({ open }: { open: boolean }) {
  return (
    <section className="walk-panel desk" data-on={open ? "1" : "0"} inert={!open} aria-hidden={!open}
             aria-label={HEADING} data-lenis-prevent="">
      <h2 className="wp-h">{HEADING}</h2>
      <p className="wp-p">{LINE}</p>
      <a className="pill pill-solid" href={askPath()} data-analytics-source="studio_desk">Ask about a painting</a>
    </section>
  );
}

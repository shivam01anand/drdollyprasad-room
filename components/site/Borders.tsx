"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { borders } from "@/lib/motifs";
import { SERIES_BY_LABEL, SERIES_BY_SLUG, type Motif } from "@/lib/site";
import { BY_ID } from "@/lib/works";

/** which line work a page wears: a series page and its paintings wear the series' own */
function motifFor(path: string): Motif {
  const s = /^\/series\/([a-z0-9-]+)/.exec(path);
  if (s) return SERIES_BY_SLUG.get(s[1])?.motif ?? "home";
  const w = /^\/work\/([a-z0-9-]+)/.exec(path);
  if (w) {
    const work = BY_ID.get(w[1]);
    return (work && SERIES_BY_LABEL.get(work.series)?.motif) || "home";
  }
  return "home";
}

/** the frame round the page: side ribbons (fixed) on a computer, a frieze above and below everywhere */
export function Rails() {
  const path = usePathname();
  const b = useMemo(() => borders(motifFor(path)), [path]);
  return (
    <>
      <div className="rail rail-l" aria-hidden="true" style={{ backgroundImage: b.left }} />
      <div className="rail rail-r" aria-hidden="true" style={{ backgroundImage: b.right }} />
    </>
  );
}

export function Band({ at }: { at: "top" | "bottom" }) {
  const path = usePathname();
  const b = useMemo(() => borders(motifFor(path)), [path]);
  return <div className={`band band-${at}`} aria-hidden="true" style={{ backgroundImage: b.top }} />;
}

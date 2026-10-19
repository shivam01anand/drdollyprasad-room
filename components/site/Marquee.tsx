"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { driftRow } from "@/lib/drift";

/**
 * A row that keeps drifting sideways, seamlessly, on a computer and a phone.
 * It can be dragged with the mouse or swiped with a finger, a click or tap
 * opens what is under it, and a moment after it is let go it drifts again
 * (lib/drift). Its children are laid out once per copy; the later copies are
 * hidden from screen readers and the keyboard so nothing is announced twice,
 * but they can still be clicked. For anyone who has asked for reduced motion
 * it never moves by itself; it still moves by hand.
 * `seconds` is the time for one full pass of the set.
 */
export default function Marquee({ children, seconds = 60, copies = 4, reverse = false, label, className = "" }: {
  children: ReactNode; seconds?: number; copies?: number; reverse?: boolean; label?: string; className?: string;
}) {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = view.current, t = track.current;
    if (!v || !t) return;
    // the copies are for the eye only: out of the tab order, still clickable
    t.querySelectorAll<HTMLElement>(".marq-set[aria-hidden] a, .marq-set[aria-hidden] button").forEach((a) => { a.tabIndex = -1; });
    return driftRow(v, t, { seconds, copies, reverse, pauseOnHover: true });
  }, [seconds, copies, reverse]);

  return (
    <div ref={view} className={`marq ${className}`} role={label ? "region" : undefined} aria-label={label}>
      <div ref={track} className={`marq-track${reverse ? " rev" : ""}`}
           style={{ ["--pass" as string]: `${seconds}s`, ["--copies" as string]: copies } as CSSProperties}>
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} className="marq-set" aria-hidden={i > 0 || undefined}>{children}</div>
        ))}
      </div>
    </div>
  );
}

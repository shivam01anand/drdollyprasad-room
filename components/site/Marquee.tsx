import type { CSSProperties, ReactNode } from "react";

/**
 * A row that keeps drifting sideways, seamlessly, on a computer and a phone.
 * Its children are laid out once per copy; the later copies are hidden from
 * screen readers and the keyboard so nothing is announced twice. For anyone
 * who has asked for reduced motion it becomes an ordinary scrolling row.
 * `seconds` is the time for one full pass of the set.
 */
export default function Marquee({ children, seconds = 60, copies = 4, reverse = false, label, className = "" }: {
  children: ReactNode; seconds?: number; copies?: number; reverse?: boolean; label?: string; className?: string;
}) {
  return (
    <div className={`marq ${className}`} role={label ? "region" : undefined} aria-label={label}>
      <div className={`marq-track${reverse ? " rev" : ""}`}
           style={{ ["--pass" as string]: `${seconds}s`, ["--copies" as string]: copies } as CSSProperties}>
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} className="marq-set" aria-hidden={i > 0 || undefined} inert={i > 0}>{children}</div>
        ))}
      </div>
    </div>
  );
}

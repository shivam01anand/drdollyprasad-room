"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { driftWall } from "@/lib/drift";

/** the moving wall's columns, which also move by hand (lib/drift: driftWall) */
export default function WallDrift({ n, children }: { n: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? driftWall(ref.current) : undefined), []);
  return (
    // the moving wall repeats real links found elsewhere on the page; keyboard users skip it, the mouse and finger can use it
    <div ref={ref} className="cols" aria-hidden="true" style={{ ["--n" as string]: n } as CSSProperties}>
      {children}
    </div>
  );
}

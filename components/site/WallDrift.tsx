"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { driftWall } from "@/lib/drift";

/** the moving wall's columns, which also move by hand (lib/drift: driftWall) */
export default function WallDrift({ n, children }: { n: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? driftWall(ref.current) : undefined), []);
  // R4 fix 7 (consultant P1-6): a photograph tile whose file has not arrived yet stays out of sight and fades in when
  // it lands, instead of showing an empty beige photo slot above its label (its box is reserved, so nothing moves)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const off: (() => void)[] = [];
    el.querySelectorAll<HTMLImageElement>(".xcard img").forEach((img) => {
      if (img.complete && img.naturalWidth) return;
      const tile = img.closest<HTMLElement>(".xcard");
      if (!tile) return;
      tile.classList.add("is-waiting");
      const done = () => tile.classList.remove("is-waiting");
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      off.push(() => { img.removeEventListener("load", done); img.removeEventListener("error", done); });
    });
    return () => off.forEach((f) => f());
  }, []);
  return (
    // the moving wall repeats real links found elsewhere on the page; keyboard users skip it, the mouse and finger can use it
    <div ref={ref} className="cols" aria-hidden="true" style={{ ["--n" as string]: n } as CSSProperties}>
      {children}
    </div>
  );
}

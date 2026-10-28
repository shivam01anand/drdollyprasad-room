"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/motion";
import { CHAPTERS } from "@/lib/chapters";

/**
 * The room map: one compact list of the rooms, in walking order, with a "you are here" mark.
 * Rooms are read from CHAPTERS (the `room` field, consecutive chapters with the same room
 * make one room), so it follows the hang without edits. The exhibitions plan
 * is not a room and is left out.
 */
export type RoomStop = { name: string; first: number; last: number };

export function roomsOfWalk(): RoomStop[] {
  const out: RoomStop[] = [];
  CHAPTERS.forEach((c, i) => {
    if (c.id === "plan") return;
    const name = c.room || c.stop;
    const prev = out[out.length - 1];
    if (prev && prev.name === name && prev.last === i - 1) prev.last = i;
    else out.push({ name, first: i, last: i });
  });
  return out;
}

export default function RoomMap({ open, active, onClose, onGo, onWorks }: {
  open: boolean;
  active: number;
  onClose(): void;
  onGo(i: number): void;
  onWorks(): void;
}) {
  const rooms = useMemo(roomsOfWalk, []);
  const root = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const here = rooms.findIndex((r) => active >= r.first && active <= r.last);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const quick = reducedMotion();
    if (open) {
      el.dataset.open = "1";
      gsap.fromTo(el, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: quick ? 0 : 0.3, ease: "power2.out" });
      first.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      const onDown = (e: PointerEvent) => {
        const t = e.target as Element;
        if (!el.contains(t) && !t.closest(".map-btn")) onClose();
      };
      addEventListener("keydown", onKey);
      addEventListener("pointerdown", onDown, true);
      return () => { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown, true); };
    }
    if (el.dataset.open !== "1") return;
    gsap.to(el, { autoAlpha: 0, y: 6, duration: quick ? 0 : 0.2, onComplete: () => { el.dataset.open = "0"; } });
  }, [open, onClose]);

  return (
    <div className="rmap" ref={root} data-open="0" role="dialog" aria-label="The rooms" aria-hidden={!open} inert={!open}
         data-lenis-prevent="">
      <ol>
        {rooms.map((r, i) => (
          <li key={r.name + r.first}>
            <button type="button" ref={i === 0 ? first : undefined} aria-current={i === here ? "location" : undefined}
                    onClick={() => { onClose(); onGo(r.first); }}>
              <span className="rmap-dot" aria-hidden="true" />
              <span className="rmap-name">{r.name}</span>
              {i === here && <span className="rmap-here">You are here</span>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="rmap-all" onClick={() => { onClose(); onWorks(); }}>All her paintings</button>
    </div>
  );
}

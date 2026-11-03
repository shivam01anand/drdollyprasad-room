"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/motion";
import { roomsOf, type Stop } from "@/lib/stops";

/**
 * The room list ("Rooms" in the header): the rooms in walking order, with a "you are here" mark
 * and each room's number of works. Read from the walk's stops, so it follows the hang.
 */
export default function RoomMap({ stops, open, active, onClose, onGo, onWorks }: {
  stops: Stop[];
  open: boolean;
  active: number;
  onClose(): void;
  onGo(i: number): void;
  onWorks(): void;
}) {
  const rooms = useMemo(() => roomsOf(stops), [stops]);
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
              {i === here ? <span className="rmap-here">You are here</span>
                : r.works.length > 0 && <span className="rmap-n">{r.works.length} {r.works.length === 1 ? "work" : "works"}</span>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="rmap-all" onClick={() => { onClose(); onWorks(); }}>All her paintings</button>
    </div>
  );
}

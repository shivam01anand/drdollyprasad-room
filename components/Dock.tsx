"use client";

import { useEffect, useMemo, useRef } from "react";
import { BY_ID, quoted, statusLabel, type Work } from "@/lib/works";
import { roomsOf, isSeries, type Stop } from "@/lib/stops";

/**
 * The dock (art direction V3 §4.3, 29 Oct 2026). A caption for what is in front of you, not a
 * strip of chips: built from the works list (never from the 3D scene), so the names are there
 * before the house is.
 *
 * Phone: the painting's title (Cormorant), "Look closer"; "Faith · 6 of 7 · ● Available"; a
 * hairline with one segment per work in the room; Previous and Next.
 * Wide screen: one row: Previous, the room and the wall, the hairline, Next (the wall plaques
 * carry the names; if one cannot be placed, the names come into the dock as a strip).
 * Red is only ever the Sold dot.
 */
export const roomAt = (stops: Stop[], i: number) => {
  const runs = roomsOf(stops);
  return runs.find((r) => i >= r.first && i <= r.last) ?? runs[0];
};

/** the Next button's words */
export function nextLabel(stops: Stop[], i: number) {
  if (i >= stops.length - 1) return "Back to home";
  const here = stops[i].room, next = stops[i + 1].room;
  if (next === here) return "Next";
  if (next === "Her desk") return "Her desk";
  return `Next room: ${next}`;
}

const dotOf = (w: Work) => (w.status === "Sold" ? "sold" : w.status === "Available" ? "available" : "other");

export default function Dock({ stops, stop, phone, strip, visible, pulse, onPrev, onNext, onOpen }: {
  stops: Stop[];
  stop: number;
  /** the phone's caption dock, or the wide screen's one row */
  phone: boolean;
  /** wide screen: a plaque could not be placed, so the names come into the dock */
  strip: boolean;
  visible: boolean;
  /** a one-time nudge on Next, once the house is there */
  pulse: boolean;
  onPrev(): void;
  onNext(): void;
  onOpen(id: string): void;
}) {
  const root = useRef<HTMLElement>(null);
  const s = stops[stop];
  const runs = useMemo(() => roomsOf(stops), [stops]);
  const room = runs.find((r) => stop >= r.first && stop <= r.last) ?? runs[0];
  const series = runs.filter(isSeries);
  const works = (s?.works ?? []).map((id) => BY_ID.get(id)).filter((w): w is Work => !!w);
  const desk = s?.id === "desk";

  // the page knows how tall the dock is: sheets and plaques keep clear of it
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--dock-h", `${Math.round(innerHeight - el.offsetTop)}px`);
    const ro = new ResizeObserver(set);
    ro.observe(el);
    addEventListener("resize", set);
    set();
    return () => { ro.disconnect(); removeEventListener("resize", set); };
  }, []);

  // the caption rises in on each step (0.15 s, 6 px)
  const capKey = s?.id ?? "";

  // where you are: "Faith · 6 of 7" (phone, by work) or "Room 2 of 5 · Wall 2 of 3" (wide, by stop)
  const roomWorks = room.works;
  const idx = works.map((w) => roomWorks.indexOf(w.id) + 1).filter((n) => n > 0);
  const nOf = idx.length > 1 ? `${idx[0]} and ${idx[idx.length - 1]} of ${roomWorks.length}` : idx.length ? `${idx[0]} of ${roomWorks.length}` : "";
  const walls = room.last - room.first + 1, wall = stop - room.first + 1;
  const seriesN = series.findIndex((r) => r.name === room.name);

  const segments = phone
    ? roomWorks.map((id) => (s?.works.includes(id) ? 1 : 0))
    : Array.from({ length: walls }, (_, k) => (k === wall - 1 ? 1 : 0));

  return (
    <nav className="vdock" ref={root} aria-label="Walk through the studio" data-on={visible ? "1" : "0"}
         data-layout={phone ? "phone" : "wide"} data-pair={works.length > 1 ? "1" : "0"} inert={!visible}>
      {phone ? (
        <div className="vd-cap" key={capKey}>
          {desk ? (
            <div className="vd-row1"><span className="vd-title">Her desk</span></div>
          ) : works.length === 1 ? (
            <div className="vd-row1">
              <button type="button" className="vd-title" onClick={() => onOpen(works[0].id)}>{quoted(works[0].title)}</button>
              <button type="button" className="vd-closer" onClick={() => onOpen(works[0].id)}>Look closer</button>
            </div>
          ) : (
            <div className="vd-row1 vd-pair">
              <ul>
                {works.map((w) => (
                  <li key={w.id}>
                    <button type="button" className="vd-title" onClick={() => onOpen(w.id)}>{quoted(w.title)}</button>
                    <span className={`vd-dot is-${dotOf(w)}`}>{statusLabel(w)}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="vd-closer" onClick={() => onOpen(works[0].id)}>Look closer</button>
            </div>
          )}
          <p className="vd-row2">
            {desk ? "The end of the walk" : <>
              {room.name}{nOf && <> · {nOf}</>}
              {works.length === 1 && <> · <span className={`vd-dot is-${dotOf(works[0])}`}>{statusLabel(works[0])}</span></>}
            </>}
          </p>
        </div>
      ) : (
        <div className="vd-cap" key={capKey}>
          <span className="vd-room">{room.name}</span>
          <span className="vd-row2">
            {desk ? "The end of the walk" : <>
              {seriesN >= 0 ? `Room ${seriesN + 1} of ${series.length}` : room.name === "About her" ? "Entrance" : ""}
              {walls > 1 && <> · Wall {wall} of {walls}</>}
            </>}
          </span>
        </div>
      )}
      {!desk && segments.length > 1 && (
        <div className="vd-progress" aria-hidden="true">
          {segments.map((on, k) => <i key={k} data-on={on ? "1" : "0"} />)}
        </div>
      )}
      {!phone && strip && works.length > 0 && (
        <ol className="vd-strip" aria-label="On this wall">
          {works.map((w) => (
            <li key={w.id}>
              <button type="button" onClick={() => onOpen(w.id)}>
                <span className="vd-stitle">{quoted(w.title)}</span>
                <span className={`vd-dot is-${dotOf(w)}`}>{statusLabel(w)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="vd-prev" onClick={onPrev} disabled={stop === 0} aria-label="Previous">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
      </button>
      <button type="button" className="vd-next" data-pulse={pulse ? "1" : "0"} onClick={onNext}>
        <span className="vd-next-t">{nextLabel(stops, stop)}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" /></svg>
      </button>
    </nav>
  );
}

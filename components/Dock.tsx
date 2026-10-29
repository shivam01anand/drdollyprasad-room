"use client";

import { useEffect, useMemo, useRef } from "react";
import { CHAPTERS, ROOM_LINE, type RoomName } from "@/lib/chapters";
import { BY_ID, quoted, statusLabel } from "@/lib/works";
import { roomsOfWalk } from "./RoomMap";

/**
 * The dock (UX spec "One wall at a time", 29 Oct 2026): always on screen in the house, built
 * from the works list (never from the 3D scene), so the names are there before the house is.
 * Where you are ("Faith · Room 2 of 5 · 7 works"), the room's line on its first wall, the
 * works on this wall (numbered as the pins on the paintings), and Previous / Next.
 */
const WALK = roomsOfWalk();
/** the series rooms: the only ones counted ("About her" and "Her desk" are not) */
const SERIES = WALK.filter((r) => r.name !== "About her" && r.name !== "Her desk");
const worksIn = (r: { first: number; last: number }) =>
  CHAPTERS.slice(r.first, r.last + 1).reduce((n, c) => n + (c.labels?.length ?? 0), 0);

export const roomAt = (stop: number) => WALK.find((r) => stop >= r.first && stop <= r.last) ?? WALK[0];

/** the Next button's words for a stop */
export function nextLabel(stop: number) {
  if (stop >= CHAPTERS.length - 1) return "See all her paintings";
  const here = roomAt(stop), next = roomAt(stop + 1);
  if (CHAPTERS[stop + 1].id === "about") return "About her";
  if (next === here) return "Next wall";
  if (next.name === "Her desk") return "Her desk";
  return `Next room: ${next.name}`;
}

export default function Dock({ stop, order, strip, visible, pulse, roomsOpen, onPrev, onNext, onOpen, onRooms }: {
  stop: number;
  /** this wall's works, left to right as they hang */
  order: string[];
  /** desktop: show the strip of names (a dense wall, or a wall whose labels did not all fit) */
  strip: boolean;
  visible: boolean;
  /** a one-time nudge on Next, once the house is there */
  pulse: boolean;
  roomsOpen: boolean;
  onPrev(): void;
  onNext(): void;
  onOpen(id: string): void;
  onRooms(): void;
}) {
  const root = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const room = roomAt(stop);
  const series = SERIES.findIndex((r) => r.name === room.name);
  const walls = room.last - room.first + 1;
  const wall = stop - room.first + 1;
  const line = stop === room.first ? ROOM_LINE[room.name as RoomName] : undefined;
  const meta = room.name === "About her" ? "Entrance"
    : room.name === "Her desk" ? "The end of the walk"
    : `Room ${series + 1} of ${SERIES.length} · ${worksIn(room)} works`;
  const items = useMemo(() => order.filter((id) => BY_ID.has(id)), [order]);

  // the page knows how tall the dock is: sheets, the map and the labels keep clear of it
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const set = () => {
      // (its layout box, not its rect: the rise-in transform must not count)
      document.documentElement.style.setProperty("--dock-h", `${Math.round(innerHeight - el.offsetTop)}px`);
    };
    const ro = new ResizeObserver(set);
    ro.observe(el);
    addEventListener("resize", set);
    set();
    return () => { ro.disconnect(); removeEventListener("resize", set); };
  }, []);
  // a new wall: its first work at the strip's start
  useEffect(() => { stripRef.current?.scrollTo({ left: 0 }); }, [stop]);

  return (
    <nav className="sdock" ref={root} aria-label="Walk through the studio" data-on={visible ? "1" : "0"}
         data-strip={items.length && strip ? "1" : "0"} data-items={items.length} inert={!visible}>
      <div className="sd-where">
        <button type="button" className="sd-pos" onClick={onRooms} aria-haspopup="dialog" aria-expanded={roomsOpen}>
          <span className="sd-room">{room.name}</span>
          <span className="sd-meta">{meta}{walls > 1 && <span className="sd-wallof"> · Wall {wall} of {walls}</span>}</span>
        </button>
        <button type="button" className="sd-all" onClick={onRooms} aria-haspopup="dialog" aria-expanded={roomsOpen}>
          All rooms <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
        </button>
      </div>
      {line && <p className="sd-line">{line}</p>}
      {items.length > 0 && (
        <ol className="sd-strip" ref={stripRef} aria-label="On this wall">
          {items.map((id, i) => {
            const w = BY_ID.get(id)!;
            return (
              <li key={id}>
                <button type="button" className="sd-chip" onClick={() => onOpen(id)} aria-label={`${i + 1}. ${quoted(w.title)}, ${statusLabel(w)}. Open`}>
                  <span className="sd-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/site/thumbs/sm/${id}.jpg`} alt="" width={40} height={40} decoding="async" />
                    <span className="sd-n" aria-hidden="true">{i + 1}</span>
                  </span>
                  <span className="sd-text">
                    <span className="sd-title">{quoted(w.title)}</span>
                    <span className={`sd-status is-${w.status.toLowerCase()}`}>{statusLabel(w)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="sd-nav">
        <button type="button" className="sd-prev" onClick={onPrev} disabled={stop === 0} aria-label="Previous wall">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
        </button>
        <div className="sd-dots" aria-hidden="true">
          <span className="sd-dotrow">
            {Array.from({ length: walls }, (_, k) => <i key={k} data-on={k === wall - 1 ? "1" : "0"} />)}
          </span>
          {walls > 1 && <span className="sd-wall">Wall {wall} of {walls}</span>}
        </div>
        <button type="button" className="sd-next" data-pulse={pulse ? "1" : "0"} onClick={onNext}>
          <span className="sd-next-t">{nextLabel(stop)}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" /></svg>
        </button>
      </div>
    </nav>
  );
}

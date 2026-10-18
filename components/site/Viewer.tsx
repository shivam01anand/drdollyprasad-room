"use client";

import { useCallback, useState } from "react";
import { roomsFor, type RoomView } from "@/lib/rooms";
import type { Work } from "@/lib/works";
import Zoom from "./Zoom";

/**
 * The painting as it would hang, to scale where she has stated a size, or on
 * its own. Until a view is chosen, a computer shows the room and a phone shows
 * the painting itself, as large as the screen allows. A tap opens it full screen.
 */
export default function Viewer({ w, src, thumb, dims, small, sub }: {
  w: Work; src: string; thumb: string; dims?: { w: number; h: number }; small: boolean; sub?: string;
}) {
  const rooms: RoomView[] = dims ? roomsFor(w, dims.w / dims.h) : [];
  // null: not yet chosen (CSS picks the room on a computer, the painting on a phone)
  const [view, setView] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const open = useCallback(() => setZoom(true), []);
  const shut = useCallback(() => setZoom(false), []);
  const name = `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;
  const roomId = view ?? rooms[0]?.room.id;
  const v = rooms.find((r) => r.room.id === roomId);
  const auto = view === null && !!v;
  const showRoom = !!v && view !== "work";
  const showPaper = !v || view === "work" || auto;

  return (
    <>
      <div className={`viewer${auto ? " is-auto" : ""}`}>
        {showRoom && v && (
          <div className="room v-room">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.room.src} width={v.room.w} height={v.room.h} loading={auto ? "lazy" : undefined}
                 alt={v.room.inPhoto ? `${name}, shown in an illustrative room setting` : "An illustrative room setting"} />
            {!v.room.inPhoto && (
              <span className="room-art" style={{
                left: `${v.at.left}%`, top: `${v.at.top}%`, width: `${v.at.width}%`, height: `${v.at.height}%`,
                ["--cm" as string]: `${v.at.cm}cqw`,
                ...(v.room.light ? { ["--light" as string]: `url("${v.room.light}")`, ["--light-size" as string]: v.at.lightSize, ["--light-pos" as string]: v.at.lightPos } : {}),
                ...(v.room.shadow ? { ["--shx" as string]: v.room.shadow.x, ["--shy" as string]: v.room.shadow.y, ["--shb" as string]: v.room.shadow.blur, ["--shc" as string]: v.room.shadow.color } : {}),
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={name} />
              </span>
            )}
            {v.trueSize && w.size && <span className="scale">Shown to scale · {w.size}</span>}
            <span className="room-cap">Illustrative room setting</span>
          </div>
        )}
        {showPaper && (
          <button type="button" className="paper v-paper" onClick={open} aria-label={`Open ${w.title} full screen`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} width={dims?.w} height={dims?.h} fetchPriority="high" className={small ? "is-small" : undefined} />
            <span className="paper-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </span>
          </button>
        )}
      </div>
      {rooms.length > 0 && (
        <div className={`thumbs${auto ? " is-auto" : ""}`} role="group" aria-label="Views of the painting">
          {rooms.map((r) => (
            <button key={r.room.id} type="button" className="t-room" aria-pressed={view === r.room.id || undefined} onClick={() => setView(r.room.id)}
                    aria-label="In a room setting" title="In a room setting">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.room.thumb} alt="" />
            </button>
          ))}
          <button type="button" className="t-paint" aria-pressed={view === "work" || undefined} onClick={() => setView("work")} aria-label="The painting on its own" title="The painting">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" />
          </button>
          <button type="button" className="t-zoom" onClick={open}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="1.6" /></svg>
            <span>Look closer</span>
          </button>
        </div>
      )}
      {zoom && <Zoom src={src} alt={name} title={w.title} sub={sub} onClose={shut} />}
    </>
  );
}

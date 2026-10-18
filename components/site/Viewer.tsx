"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { roomsFor, type RoomView } from "@/lib/rooms";
import type { Work } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";

// the close look (and its animation library) loads only when someone opens it
const Zoom = dynamic(() => import("./Zoom"), { ssr: false });

/**
 * The painting first, as large as the first screen allows; a tap or click
 * opens it full screen to look closely (pinch and wheel zoom). The room, to
 * scale where she has stated a size, is the second view, below.
 */
export default function Viewer({ w, src, thumb, dims, small }: {
  w: Work; src: string; thumb: string; dims?: { w: number; h: number }; small: boolean;
}) {
  const rooms: RoomView[] = dims ? roomsFor(w, dims.w / dims.h) : [];
  const [view, setView] = useState("work");
  const [zoom, setZoom] = useState(false);
  const v = rooms.find((r) => r.room.id === view);
  const name = `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;
  const choose = (id: string) => {
    if (id === view) return;
    track("painting_view_changed", { ...paintingProperties(w), view: id === "work" ? "painting" : "room", room_id: id === "work" ? null : id });
    setView(id);
  };
  const open = () => {
    track("painting_view_changed", { ...paintingProperties(w), view: "zoom", room_id: null });
    setZoom(true);
  };

  return (
    <>
      <div className="viewer">
        {v ? (
          <div className="room">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.room.src} width={v.room.w} height={v.room.h}
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
        ) : (
          <button type="button" className="paper" onClick={open} aria-label={`Look closer at ${w.title}, full screen`}
                  style={{ ["--art" as string]: `url(${thumb})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} width={dims?.w} height={dims?.h} fetchPriority="high" className={`framed${small ? " is-small" : ""}`} />
            <span className="paper-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="1.6" /></svg>
              Look closer
            </span>
          </button>
        )}
      </div>
      {rooms.length > 0 && (
        <div className="thumbs" role="group" aria-label="Views of the painting">
          <button type="button" className="t-paint" aria-pressed={view === "work"} onClick={() => choose("work")} aria-label="The painting on its own" title="The painting">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" width={76} height={58} />
          </button>
          {rooms.map((r) => (
            <button key={r.room.id} type="button" aria-pressed={view === r.room.id} onClick={() => choose(r.room.id)}
                    aria-label="In a room setting, to scale" title="In a room setting, to scale">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.room.thumb} alt="" width={76} height={58} loading="lazy" />
            </button>
          ))}
          <span className="thumbs-note">{rooms[0]?.trueSize ? "In a room, to scale" : "In a room"}</span>
        </div>
      )}
      {zoom && <Zoom id={w.id} src={src} alt={name} title={w.title} sub={[w.medium, w.size].filter(Boolean).join(" · ")} onClose={() => setZoom(false)} />}
    </>
  );
}

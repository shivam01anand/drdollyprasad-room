"use client";

import { useState } from "react";
import { roomsFor, type RoomView } from "@/lib/rooms";
import type { Work } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";

/** the painting as it would hang, to scale where she has stated a size, or on its own */
export default function Viewer({ w, src, thumb, dims, small }: {
  w: Work; src: string; thumb: string; dims?: { w: number; h: number }; small: boolean;
}) {
  const rooms: RoomView[] = dims ? roomsFor(w, dims.w / dims.h) : [];
  const [view, setView] = useState(rooms.length ? rooms[0].room.id : "work");
  const v = rooms.find((r) => r.room.id === view);
  const name = `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;
  const choose = (id: string) => {
    if (id === view) return;
    track("painting_view_changed", { ...paintingProperties(w), view: id === "work" ? "painting" : "room", room_id: id === "work" ? null : id });
    setView(id);
  };

  return (
    <>
      <div className="viewer">
        {v ? (
          <div className="room">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.room.src} width={v.room.w} height={v.room.h} fetchPriority="high"
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
          <div className="paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} width={dims?.w} height={dims?.h} fetchPriority="high" className={small ? "is-small" : undefined} />
          </div>
        )}
      </div>
      {rooms.length > 0 && (
        <div className="thumbs" role="group" aria-label="Views of the painting">
          {rooms.map((r) => (
            <button key={r.room.id} type="button" aria-pressed={view === r.room.id} onClick={() => choose(r.room.id)}
                    aria-label="In a room setting" title="In a room setting">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.room.thumb} alt="" />
            </button>
          ))}
          <button type="button" className="t-paint" aria-pressed={view === "work"} onClick={() => choose("work")} aria-label="The painting on its own" title="The painting">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" />
          </button>
        </div>
      )}
    </>
  );
}

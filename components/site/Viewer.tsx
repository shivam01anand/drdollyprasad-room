"use client";

import { useCallback, useState } from "react";
import { roomsFor, type RoomView } from "@/lib/rooms";
import type { Work } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";
import Zoom from "./Zoom";

const nameOf = (w: Work) => `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;

/**
 * The first screen of a painting's page, on a phone and a computer alike: the
 * whole painting, as large as the screen allows (never cropped, never altered),
 * its title under it and a small hint that it opens full screen.
 */
export default function Viewer({ w, src, dims, small, sub }: {
  w: Work; src: string; dims?: { w: number; h: number }; small: boolean; sub?: string;
}) {
  const [zoom, setZoom] = useState(false);
  const open = useCallback(() => {
    track("painting_zoomed", paintingProperties(w));
    setZoom(true);
  }, [w]);
  const shut = useCallback(() => setZoom(false), []);
  const name = nameOf(w);

  return (
    <section className="wpa" aria-label={w.title}>
      <button type="button" className="wpa-art" onClick={open} aria-label={`Zoom ${w.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} width={dims?.w} height={dims?.h} fetchPriority="high" className={small ? "is-small" : undefined} />
      </button>
      <h1 className="wpa-title">{w.title}</h1>
      <button type="button" className="wpa-hint" onClick={open}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="1.6" /></svg>
        <span className="on-fine">Click to zoom</span><span className="on-touch">Tap to zoom</span>
      </button>
      {zoom && <Zoom src={src} alt={name} title={w.title} sub={sub} onClose={shut} />}
    </section>
  );
}

/**
 * The painting in a room, below the first screen. A room study is a virtual
 * scene: it says so, and it claims a size only where she has stated one.
 */
export function RoomStudy({ w, src, dims }: { w: Work; src: string; dims?: { w: number; h: number } }) {
  const rooms: RoomView[] = dims ? roomsFor(w, dims.w / dims.h, { pilot: true }) : [];
  const [roomId, setRoomId] = useState(rooms[0]?.room.id);
  if (!rooms.length) return null;
  const v = rooms.find((r) => r.room.id === roomId) ?? rooms[0];
  const name = nameOf(w);
  const choose = (id: string) => {
    if (id === v.room.id) return;
    track("painting_view_changed", { ...paintingProperties(w), view: "room", room_id: id });
    setRoomId(id);
  };
  const study = !!v.room.study;

  return (
    <section className="wpa-room" aria-label="The painting in a room">
      <div className="viewer">
        <div className="room v-room">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.room.src} width={v.room.w} height={v.room.h} loading="lazy" decoding="async"
               alt={v.room.inPhoto ? `${name}, shown in a ${study ? "virtual room study" : "room setting"}` : "A room setting"} />
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
          {!study && v.trueSize && w.size && <span className="scale">Shown to scale · {w.size}</span>}
          <span className="room-cap">{study ? "Virtual room study" : "Illustrative room setting"}</span>
        </div>
      </div>
      <p className="wpa-room-note">
        {study
          ? `Virtual room study: ${v.room.label.toLowerCase()}, sized against an assumed ${v.room.assumed}. A guide to relative size, not a measured room.`
          : `${v.room.label}. An illustration${v.trueSize && w.size ? `, with the painting at its stated size (${w.size})` : ""}.`}
      </p>
      {rooms.length > 1 && (
        <div className="thumbs" role="group" aria-label="Rooms">
          {rooms.map((r) => (
            <button key={r.room.id} type="button" className="t-room" aria-pressed={r.room.id === v.room.id} onClick={() => choose(r.room.id)}
                    aria-label={r.room.label} title={r.room.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.room.thumb} alt="" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

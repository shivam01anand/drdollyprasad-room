"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { roomsFor, type RoomView } from "@/lib/rooms";
import { inchDims, type Work } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";

const Zoom = dynamic(() => import("./Zoom"), { ssr: false });

const nameOf = (w: Work) => `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;
type View = { k: "full" } | { k: "room"; id: string };

/**
 * CR-007: the painting first, as large as the screen allows; under it two views
 * only (R6, Shubham 20 Oct: the painting and the room); and a quiet "See it in a room"
 * switch that puts the painting on a wall, with its stated size as the caption.
 */
export default function PaintingStage({ w, src, dims, small, sub, children }: {
  w: Work; src: string; dims?: { w: number; h: number }; small: boolean; sub?: string; children?: React.ReactNode;
}) {
  const rooms: RoomView[] = dims ? roomsFor(w, dims.w / dims.h, { pilot: true }) : [];
  const [view, setView] = useState<View>({ k: "full" });
  const [zoom, setZoom] = useState(false);
  // the frame stays invisible until the picture is there, so no empty black box shows first
  const art = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const im = art.current; setReady(!im || (im.complete && im.naturalWidth > 0)); }, [view.k, src]);
  const strip = useRef<HTMLDivElement>(null);
  const open = useCallback(() => { track("painting_zoomed", paintingProperties(w)); setZoom(true); }, [w]);
  const name = nameOf(w);
  const size = inchDims(w, dims);
  const rv = view.k === "room" ? rooms.find((r) => r.room.id === view.id) ?? rooms[0] : undefined;
  const inRoom = !!rv;
  const toggle = () => {
    if (inRoom) setView({ k: "full" });
    else if (rooms[0]) { track("painting_view_changed", { ...paintingProperties(w), view: "room", room_id: rooms[0].room.id }); setView({ k: "room", id: rooms[0].room.id }); }
  };
  const stated = w.inches ? w.inches * 2.54 : 0;
  const toScale = !!rv && !!size && (rv.trueSize || (!!stated && "cm" in rv.room && Math.abs((rv.room as { cm: number }).cm - stated) < 1.5));
  const same = (v: View) => v.k === view.k && (v.k === "room" ? (view as { id: string }).id === v.id : true);

  const items: { v: View; label: string; thumb: React.ReactNode }[] = [
    { v: { k: "full" }, label: "The painting", thumb: <img src={src} alt="" loading="lazy" /> },
    // R6 (Shubham, 20 Oct): just the two, the painting and the room; no close-up crops
    ...rooms.slice(0, 1).map((r) => ({ v: { k: "room", id: r.room.id } as View, label: r.room.label, thumb: <img src={r.room.thumb} alt="" loading="lazy" /> })),
  ];

  return (
    <section className="pp" aria-label={w.title}>
      <div className={`pp-stage${inRoom ? " is-room" : ""}`}>
        {view.k === "full" && (
          <button type="button" className="pp-art" onClick={open} aria-label={`Zoom ${w.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* --ar reserves the picture's box before it loads (no blip, CLS): see fix-tech.css */}
            <img ref={art} src={src} alt={name} width={dims?.w} height={dims?.h} loading="eager" fetchPriority="high" decoding="async"
                 onLoad={() => setReady(true)}
                 className={[small ? "is-small" : "", ready ? "" : "is-loading"].filter(Boolean).join(" ") || undefined}
                 style={dims ? { ["--ar" as string]: `${dims.w} / ${dims.h}` } : undefined} />
          </button>
        )}
        {rv && (
          <div className="pp-room">
            <div className="room v-room">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rv.room.src} width={rv.room.w} height={rv.room.h} decoding="async" alt={`${name}, in ${rv.room.label.toLowerCase()}`} />
              {!rv.room.inPhoto && (
                <span className="room-art" style={{
                  left: `${rv.at.left}%`, top: `${rv.at.top}%`, width: `${rv.at.width}%`, height: `${rv.at.height}%`,
                  ["--cm" as string]: `${rv.at.cm}cqw`,
                  ...(rv.room.light ? { ["--light" as string]: `url("${rv.room.light}")`, ["--light-size" as string]: rv.at.lightSize, ["--light-pos" as string]: rv.at.lightPos } : {}),
                  ...(rv.room.shadow ? { ["--shx" as string]: rv.room.shadow.x, ["--shy" as string]: rv.room.shadow.y, ["--shb" as string]: rv.room.shadow.blur, ["--shc" as string]: rv.room.shadow.color } : {}),
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={name} />
                </span>
              )}
            </div>
            <p className="pp-cap">{toScale && size ? `To scale · ${size.width} × ${size.height} in` : rv.room.study ? "Virtual room study" : rv.room.label}</p>
          </div>
        )}
      </div>

      <div className="pp-bar">
        {rooms.length > 0 && (
          <button type="button" className="pp-toggle" aria-pressed={inRoom} onClick={toggle}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20V9l7-5 7 5v11M10 20v-6h4v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            {inRoom ? "See the painting" : "See it in a room"}
          </button>
        )}
        {!inRoom && (
          <button type="button" className="pp-zoom" onClick={open}>
            <span className="z-fine">Click to zoom</span><span className="z-touch">Tap to zoom</span>
          </button>
        )}
      </div>

      {items.length > 1 && <div className="pp-strip" ref={strip} role="group" aria-label="Other views">
        {items.map((it) => (
          <button key={it.label} type="button" className="pp-chip" aria-pressed={same(it.v)} aria-label={it.label} title={it.label} onClick={() => setView(it.v)}>
            {it.thumb}
          </button>
        ))}
      </div>}
      {children}

      {zoom && <Zoom id={w.id} src={src} alt={name} title={w.title} sub={sub} onClose={() => setZoom(false)} />}
    </section>
  );
}

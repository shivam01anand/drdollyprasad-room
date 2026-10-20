"use client";

import { useState } from "react";
import Gallery from "./Gallery";

/**
 * R4 B3-3: the room view as a small thumbnail beside the chapter text ("See it in a room"); the painting
 * always leads the chapter. A tap opens the room study full screen (the same quiet lightbox as the
 * exhibition photographs). The painting page keeps its own room tab.
 */
export default function RoomThumb({ src, thumb, alt, line }: { src: string; thumb: string; alt: string; line: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="room-th" onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" width={160} height={107} loading="lazy" decoding="async" />
        <span>See it in a room</span>
      </button>
      {open && <Gallery label="Room view" start={0} onClose={() => setOpen(false)} shots={[{ src, alt, line }]} />}
    </>
  );
}

/**
 * Rooms to see a painting at its true size: photographs of an empty wall
 * (generated mock-ups, Oct 2026), each calibrated in its own pixels.
 * `pxPerCm` is measured on the wall plane (skirting and furniture height);
 * a painting hangs centred on `cx` with its lower edge at `bottom`, about
 * 22 cm above the furniture, as one hangs over a bench or a sofa.
 */
export type Room = { id: string; label: string; src: string; thumb: string; w: number; h: number; pxPerCm: number; cx: number; bottom: number };

export const ROOMS: Room[] = [
  { id: "bench", label: "Hallway", src: "/art/rooms/bench.jpg", thumb: "/art/rooms/bench-thumb.jpg", w: 1536, h: 1024, pxPerCm: 3.4, cx: 771, bottom: 632 },
  { id: "sofa", label: "Living room", src: "/art/rooms/sofa.jpg", thumb: "/art/rooms/sofa-thumb.jpg", w: 1536, h: 1024, pxPerCm: 3.8, cx: 768, bottom: 488 },
];

/** where a painting of this size and shape sits in a room, in % of the photograph */
export function hang(room: Room, longestIn: number, aspect: number) {
  const longest = longestIn * 2.54 * room.pxPerCm;
  const w = aspect >= 1 ? longest : longest * aspect;
  const h = aspect >= 1 ? longest / aspect : longest;
  return {
    left: ((room.cx - w / 2) / room.w) * 100,
    top: ((room.bottom - h) / room.h) * 100,
    width: (w / room.w) * 100,
    height: (h / room.h) * 100,
    px: w,
  };
}

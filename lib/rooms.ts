import type { Work } from "./works";

/**
 * Rooms to see a painting in.
 *
 * A tailored room is one photograph made for one painting: the house, the wall,
 * its colour, the light and the furniture chosen so that this work looks its
 * best (generated with Codex, Oct 2026; designs, prompts and calibration notes
 * in review/rooms). Her painting is never in the photograph: the wall is left
 * empty and the real photograph of the work is hung on it here, in a float
 * frame like the house's, under the room's own light.
 *
 * The generic rooms (a hallway, a living room) are the fallback for a work she
 * has given a size but that has no room of its own. A work with neither is not
 * shown in a room.
 *
 * Every photograph is calibrated on its wall plane, in its own pixels:
 * `pxPerCm` from furniture of standard height measured against the wall's
 * floor line `floor` (where the depth of a front edge matters, through the
 * horizon). A painting hangs centred on `cx` with its lower edge `sill` cm
 * above the floor: about 22 cm above the furniture, or with its centre near
 * 150 cm over low furniture. Where she has stated the size, it hangs at that
 * size; where she has not, a tailored room shows it at `cm` and says nothing
 * about size.
 */
export type Room = {
  id: string;
  /** the caption: what kind of room, and where */
  label: string;
  src: string;
  thumb: string;
  w: number;
  h: number;
  /** wall-plane scale, px per cm, and the wall's floor line, px */
  pxPerCm: number;
  floor: number;
  /** the painting's centre line, px, and its lower edge in cm above the floor */
  cx: number;
  sill: number;
  /** the light on the wall: a small multiply map of the whole photograph (tools/lightmap.py) */
  light?: string;
  /** the frame's shadow on the wall, from the room's light: offset x, y and blur in cm, and its colour */
  shadow?: { x: number; y: number; blur: number; color: string };
};

export type Tailored = Room & {
  /** the work this room was made for */
  work: string;
  /** shown size, longest side in cm, where she has not stated one (never captioned) */
  cm: number;
};

/** one room per work, made for it (see review/rooms for each room's brief and calibration) */
export const TAILORED: Tailored[] = [];

/** the fallback rooms, for works with a stated size and no room of their own */
export const GENERIC: Room[] = [
  // bench 42–45 cm against a 10 cm skirting: 3.4 px/cm; lower edge 22 cm above the bench
  { id: "bench", label: "A hallway", src: "/art/rooms/bench.jpg", thumb: "/art/rooms/bench-thumb.jpg", w: 1536, h: 1024,
    pxPerCm: 3.4, floor: 851, cx: 771, sill: 64, light: "/art/rooms/bench-light.jpg",
    shadow: { x: 1.4, y: 2.4, blur: 5, color: "rgba(70,52,34,.34)" } },
  // the sofa's horizon (y 476, from the rug) puts its seat at 44 cm and its back at 76 cm at 3.25 px/cm
  // (it was 3.8, which hung every work about a sixth too large); lower edge 22 cm above the back
  { id: "sofa", label: "A living room", src: "/art/rooms/sofa.jpg", thumb: "/art/rooms/sofa-thumb.jpg", w: 1536, h: 1024,
    pxPerCm: 3.25, floor: 820, cx: 768, sill: 98, light: "/art/rooms/sofa-light.jpg",
    shadow: { x: 2, y: 2.4, blur: 5.5, color: "rgba(74,54,36,.32)" } },
];

/** the float frame, as in the house: a 1.6 cm lip round a 0.9 cm shadow gap */
export const FRAME_CM = 2.5;

export type Hang = {
  /** the canvas, in % of the photograph */
  left: number; top: number; width: number; height: number;
  /** one centimetre on the wall, in % of the photograph's width */
  cm: number;
  /** the light map placed so that the part behind the frame falls on it: CSS background size and position */
  lightSize: string; lightPos: string;
};

/** where a painting of this size and shape hangs in a room */
export function hang(room: Room, longestCm: number, aspect: number): Hang {
  const longest = longestCm * room.pxPerCm;
  const w = aspect >= 1 ? longest : longest * aspect;
  const h = aspect >= 1 ? longest / aspect : longest;
  const x = room.cx - w / 2;
  const y = room.floor - room.sill * room.pxPerCm - h;
  // the light covers the frame too
  const f = FRAME_CM * room.pxPerCm;
  const ow = w + 2 * f, oh = h + 2 * f;
  return {
    left: (x / room.w) * 100,
    top: (y / room.h) * 100,
    width: (w / room.w) * 100,
    height: (h / room.h) * 100,
    cm: (room.pxPerCm / room.w) * 100,
    lightSize: `${(room.w / ow) * 100}% ${(room.h / oh) * 100}%`,
    lightPos: `${((x - f) / (room.w - ow)) * 100}% ${((y - f) / (room.h - oh)) * 100}%`,
  };
}

export type RoomView = { room: Room; at: Hang; trueSize: boolean };

/** the rooms a work can be seen in: its own, else the generic ones if she has stated its size */
export function roomsFor(work: Work, aspect: number): RoomView[] {
  const own = TAILORED.find((r) => r.work === work.id);
  const stated = work.inches ? work.inches * 2.54 : 0;
  if (own) return [{ room: own, at: hang(own, stated || own.cm, aspect), trueSize: !!stated }];
  if (!stated) return [];
  return GENERIC.map((room) => ({ room, at: hang(room, stated, aspect), trueSize: true }));
}

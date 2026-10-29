import type { Work } from "./works";
import hallway from "./hallway-rooms.json";

/**
 * Rooms to see a painting in.
 *
 * A tailored room is one photograph made for one painting: the house, the wall,
 * its colour, the light and the furniture chosen so that this work looks its
 * best (designs in review/rooms/prompts.py). Each is a real interior built and
 * path-traced in Blender (review/rooms/blender), with her painting hung in it:
 * the original photograph of the work, unaltered, on a satin canvas in the
 * house's float frame, at its true size where she has stated one, lit as a
 * collector would light it. The painting is part of the photograph (`inPhoto`),
 * so nothing is hung over it here; its calibration below records where it falls.
 *
 * The generic rooms (a hallway, a living room) are the fallback for a work she
 * has given a size but that has no room of its own. A work with neither is not
 * shown in a room.
 *
 * Every photograph is calibrated on its wall plane, in its own pixels:
 * `pxPerCm` from furniture of standard height measured against the wall's
 * floor line `floor` (where the depth of a front edge matters, through the
 * horizon); a rendered room's, from its camera, exactly. A painting hangs centred on `cx` with its lower edge `sill` cm
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
  /** the painting is in the photograph (rendered there): the room is shown as it is, nothing hung over it */
  inPhoto?: boolean;
  /** a virtual room study (generated scene): labelled as such, and never captioned "to scale" */
  study?: boolean;
  /** for a study: the furniture its relative size was judged against (an assumption, not a measurement) */
  assumed?: string;
};

export type Tailored = Room & {
  /** the work this room was made for */
  work: string;
  /** shown size, longest side in cm, where she has not stated one (never captioned) */
  cm: number;
};

/** one room per work, made for it (see review/rooms for each room's brief and calibration) */
export const TAILORED: Tailored[] = [
  // centre 145 cm, 27% of the frame's width; hung at 115 cm, a size she has not stated
  { id: "woman-with-poppies", work: "woman-with-poppies", label: "A drawing room, Lutyens’ Delhi",
    src: "/art/rooms/woman-with-poppies.webp", thumb: "/art/rooms/woman-with-poppies-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 3.977, floor: 996, cx: 900, sill: 104, cm: 115, inPhoto: true },
  // centre 139.4 cm, 26% of the frame's width; hung at its stated 91.4 cm
  { id: "temple-bells", work: "temple-bells", label: "An entrance hall, a farmhouse in Chhatarpur",
    src: "/art/rooms/temple-bells.webp", thumb: "/art/rooms/temple-bells-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.861, floor: 1020, cx: 900, sill: 102, cm: 91.4, inPhoto: true },
  // centre 159 cm, 29% of the frame's width; hung at 121.9 cm, a size she has not stated
  { id: "bulls-and-wheel", work: "bulls-and-wheel", label: "A dining room, a Gurgaon penthouse",
    src: "/art/rooms/bulls-and-wheel.webp", thumb: "/art/rooms/bulls-and-wheel-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.034, floor: 1142, cx: 609, sill: 98, cm: 121.9, inPhoto: true },
  // centre 145.7 cm, 25% of the frame's width; hung at its stated 91.4 cm
  { id: "boy-with-bananas", work: "boy-with-bananas", label: "A verandah, a villa in Goa",
    src: "/art/rooms/boy-with-bananas.webp", thumb: "/art/rooms/boy-with-bananas-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.667, floor: 1047, cx: 900, sill: 100, cm: 91.4, inPhoto: true },
  // centre 150 cm, 22% of the frame's width; hung at 100 cm, a size she has not stated
  { id: "monk-and-green-buddha", work: "monk-and-green-buddha", label: "A reading room, Bengaluru",
    src: "/art/rooms/monk-and-green-buddha.webp", thumb: "/art/rooms/monk-and-green-buddha-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.861, floor: 1083, cx: 900, sill: 100, cm: 100, inPhoto: true },
  // centre 137.5 cm, 21% of the frame's width; hung at its stated 61 cm
  { id: "woman-with-bird", work: "woman-with-bird", label: "A bedroom by the sea, Mumbai",
    src: "/art/rooms/woman-with-bird.webp", thumb: "/art/rooms/woman-with-bird-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 5.556, floor: 1059, cx: 872, sill: 107, cm: 61, inPhoto: true },
  // centre 143.8 cm, 27% of the frame's width; hung at 95 cm, a size she has not stated
  { id: "three-veiled-women", work: "three-veiled-women", label: "A sitting room, a haveli in Jodhpur",
    src: "/art/rooms/three-veiled-women.webp", thumb: "/art/rooms/three-veiled-women-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.730, floor: 992, cx: 709, sill: 97, cm: 95, inPhoto: true },
  // centre 143.4 cm, 26% of the frame's width; hung at 105 cm, a size she has not stated
  { id: "child-among-flowers", work: "child-among-flowers", label: "A sitting room, Pondicherry",
    src: "/art/rooms/child-among-flowers.webp", thumb: "/art/rooms/child-among-flowers-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.268, floor: 982, cx: 900, sill: 102, cm: 105, inPhoto: true },
  // centre 148.8 cm, 25% of the frame's width; hung at 101.6 cm, a size she has not stated
  { id: "shree-420-and-milk-cans", work: "shree-420-and-milk-cans", label: "A den on Marine Drive, Mumbai",
    src: "/art/rooms/shree-420-and-milk-cans.webp", thumb: "/art/rooms/shree-420-and-milk-cans-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 5.385, floor: 1100, cx: 900, sill: 98, cm: 101.6, inPhoto: true },
  // centre 138.5 cm, 20% of the frame's width; hung at its stated 61 cm
  { id: "woman-with-red-flower", work: "woman-with-red-flower", label: "A library, Ballygunge, Kolkata",
    src: "/art/rooms/woman-with-red-flower.webp", thumb: "/art/rooms/woman-with-red-flower-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 5.645, floor: 1098, cx: 900, sill: 108, cm: 61, inPhoto: true },
  // centre 139.6 cm, 28% of the frame's width; hung at 120 cm, a size she has not stated
  { id: "monks-and-blue-buddha", work: "monks-and-blue-buddha", label: "A living room, Jubilee Hills, Hyderabad",
    src: "/art/rooms/monks-and-blue-buddha.webp", thumb: "/art/rooms/monks-and-blue-buddha-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 3.933, floor: 908, cx: 900, sill: 92, cm: 120, inPhoto: true },
  // centre 146.6 cm, 26% of the frame's width; hung at 91.4 cm, a size she has not stated
  { id: "terracotta-pots", work: "terracotta-pots", label: "A dining hall, a Chettinad mansion",
    src: "/art/rooms/terracotta-pots.webp", thumb: "/art/rooms/terracotta-pots-thumb.webp",
    w: 1800, h: 1200, pxPerCm: 4.730, floor: 1056, cx: 900, sill: 102, cm: 91.4, inPhoto: true },
];

/**
 * Pilot (design round 004, room B, "calm hallway"): a virtual room study for two
 * paintings only, 05 "The Matka and the Coins" and 40 "Petals of Thought". The
 * painting is composited into the scene from its original image, frontal and
 * uncropped; its size is judged against an assumed 120 cm console
 * (ROOM_SCALE_NOTES.json: 4.25 px/cm on the 1536 px scene), so it is a relative
 * size study and is labelled so, never "to scale".
 */
type HallwayEntry = { id: string; work: string; room?: "hallway" | "console"; cm?: number; w?: number; h?: number; pxPerCm?: number; floor?: number; cx?: number };

/**
 * The two virtual scenes. "hallway" is brief 004 (round 3, 20 Oct 2026); "console" is
 * 019 Part 4, "see it in your room": a sunlit living-room wall over a low credenza
 * (plate E, 1920 x 1080), one per painting that had no room of its own.
 */
const SCENE = {
  hallway: { label: "A calm hallway", assumed: "120 cm console" },
  console: { label: "A sunlit living room", assumed: "218 cm low credenza" },
} as const;

/**
 * A hallway room is data only: an entry in lib/hallway-rooms.json and the image
 * public/art/rooms/hallway-<id>.webp (or console-<id>.webp for `"room": "console"`) (a thumbnail, hallway-<id>-thumb.webp, is
 * used if present; with one room per painting none is needed). Defaults are the
 * pilot scene's calibration.
 */
export const PILOT: Tailored[] = (hallway.rooms as HallwayEntry[]).map((e) => {
  const scene = e.room ?? "hallway";
  return {
  id: `${scene}-${e.id}`, work: e.work, label: SCENE[scene].label, study: true, assumed: SCENE[scene].assumed,
  src: `/art/rooms/${scene}-${e.id}.webp`, thumb: `/art/rooms/${scene}-${e.id}-thumb.webp`,
  w: e.w ?? 1536, h: e.h ?? 1024, pxPerCm: e.pxPerCm ?? 4.25, floor: e.floor ?? 790, cx: e.cx ?? 768, sill: 0,
  cm: e.cm ?? 91.4, inPhoto: true,
  };
});

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
export function roomsFor(work: Work, aspect: number, opts: { pilot?: boolean } = {}): RoomView[] {
  // the hallway pilot first where one was made (the website's painting page and the studio's lightbox, rooms[0])
  const pilot = opts.pilot ? PILOT.find((r) => r.work === work.id) : undefined;
  const own = TAILORED.find((r) => r.work === work.id);
  const stated = work.inches ? work.inches * 2.54 : 0;
  const ownView = own ? { room: own, at: hang(own, stated || own.cm, aspect), trueSize: !!stated } : undefined;
  // the new photographic room first; a work's earlier 3D room stays as a second view
  // the new photographic room only; the earlier 3D room is no longer shown on painting pages (Shubham, 20 Oct)
  if (pilot) return [{ room: pilot, at: hang(pilot, pilot.cm, aspect), trueSize: false }];
  if (ownView) return [ownView];
  if (!stated) return [];
  return GENERIC.map((room) => ({ room, at: hang(room, stated, aspect), trueSize: true }));
}

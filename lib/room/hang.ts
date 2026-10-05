import { ROOM } from "./shell";

/**
 * Where her work hangs, and how.
 *
 * Her catalogue says "oil on canvas, framed" eighteen times; the small door
 * panels sit in deep shadow-box frames. Heights are hung to a common centre
 * line, as a gallery would, except the four Bandh Darwaze panels, which are
 * one foot square and hung as a block of four.
 */
export type Wall = "back" | "left" | "right";

export type Hung = {
  id: string;
  wall: Wall;
  /** x on the back wall, z on the side walls */
  along: number;
  /** centre height */
  y: number;
  /** canvas height in metres */
  h: number;
  /** frame width and depth */
  fw: number;
  fd: number;
  /** standing on the floor against something instead of hanging */
  lean?: { x: number; z: number; yaw: number; tilt: number };
};

const LINE = 1.66;   // the centre line of the hang

export const HANG: Hung[] = [
  // the altar: Twenty Paise alone on its red field
  { id: "rickshaw-puller-and-coin", wall: "back", along: 0, y: LINE, h: 1.42, fw: 0.058, fd: 0.06 },
  // Bandh Darwaze I–IV as a block of four, one foot each
  { id: "weathered-door-ring",     wall: "back", along: 1.86, y: 1.84, h: 0.305, fw: 0.042, fd: 0.07 },
  { id: "red-and-teal-door-lock",  wall: "back", along: 2.31, y: 1.84, h: 0.305, fw: 0.042, fd: 0.07 },
  { id: "teal-door-bolt",          wall: "back", along: 1.86, y: 1.39, h: 0.305, fw: 0.042, fd: 0.07 },
  { id: "carved-door-knocker",     wall: "back", along: 2.31, y: 1.39, h: 0.305, fw: 0.042, fd: 0.07 },
  // what is leaving — Gone Are The Days
  { id: "mother-india-and-kettles", wall: "left", along: -1.36, y: LINE, h: 1.12, fw: 0.05, fd: 0.055 },
  { id: "bullock-cart-and-truck",   wall: "left", along: -0.16, y: LINE, h: 0.98, fw: 0.05, fd: 0.055 },
  // what is still — the recent work, where green enters
  { id: "boy-with-bananas",    wall: "right", along: -1.72, y: LINE, h: 1.08, fw: 0.05, fd: 0.055 },
  { id: "child-among-flowers", wall: "right", along: 1.72,  y: LINE, h: 0.84, fw: 0.05, fd: 0.055 },
  // a canvas not yet hung, leaning on the plinth below the door panels
  { id: "terracotta-pots", wall: "back", along: 2.3, y: 0, h: 0.6, fw: 0.034, fd: 0.04,
    lean: { x: 2.3, z: -ROOM.d / 2 + ROOM.plinth.d, yaw: 0, tilt: 0.16 } },
];

export const HERO = HANG[0];

/** how far the canvas face stands off its wall */
export function faceOffset(h: Hung) {
  const field = h.wall === "back" && Math.abs(h.along) < ROOM.field.w / 2 ? 0.024 : 0;
  return field + h.fd - 0.012;
}

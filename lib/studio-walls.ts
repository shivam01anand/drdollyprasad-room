import RAW from "./studio-walls.json";
import { ROOM_LINE, DARK_ROOMS } from "./chapters";
import { BY_ID } from "./works";

/**
 * The photo studio's walls (Shubham, 8 Nov 2026: a photo studio in place of the 3D walk).
 * lib/studio-walls.json holds them in room order; every box is [x, y, w, h] in the photograph's
 * own pixel space (2400 x 1350). `bbox` is the painting's frame (its tap area); `plaque` is where
 * its title plaque sits on the wall. To add a wall: export its photo to public/studio/<id>-1600.webp
 * and -2400.webp, measure the frames, and add an entry in its room's place.
 */
export type Box = [number, number, number, number];
export type WallWork = { id: string; bbox: Box; plaque: Box };
/** `glow: false`: the photo already has the picture lights' pool baked in, so the code overlay is off */
export type Wall = { id: string; room: string; tone: "light" | "dark"; image: string; glow: boolean; works: WallWork[] };

/** the walk's rooms, in order (only the ones with a wall appear) */
export const ROOM_ORDER = ["Onset of Spring", "Faith", "Bandh Darwaze", "Gone Are The Days", "Portraits"] as const;

type RawWall = { id: string; room: string; tone?: string; image: string; glow?: boolean; works: { id: string; bbox: number[]; plaque?: number[] }[] };
const raw = RAW as unknown as { space: [number, number]; walls: RawWall[] };

export const SPACE = raw.space;

export const WALLS: Wall[] = raw.walls
  .filter((w) => (ROOM_ORDER as readonly string[]).includes(w.room))
  .map((w) => ({
    id: w.id,
    room: w.room,
    tone: (w.tone === "light" || w.tone === "dark" ? w.tone : DARK_ROOMS.has(w.room) ? "dark" : "light") as Wall["tone"],
    image: w.image,
    glow: w.glow !== false,
    works: w.works.filter((x) => BY_ID.has(x.id)).map((x) => {
      const b = x.bbox as Box;
      // no plaque measured yet: centred about 40 px below the frame
      const p = (x.plaque as Box | undefined) ?? [Math.round(b[0] + b[2] / 2 - 140), b[1] + b[3] + 40, 280, 60];
      return { id: x.id, bbox: b, plaque: p };
    }),
  }))
  .sort((a, b) => ROOM_ORDER.indexOf(a.room as never) - ROOM_ORDER.indexOf(b.room as never));

export const roomLine = (room: string) => ROOM_LINE[room as keyof typeof ROOM_LINE];

/** every work on the walls, in walk order: the lightbox turns through these */
export const WALL_ORDER = WALLS.flatMap((w) => w.works.map((x) => x.id));

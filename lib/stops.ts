import STOPS_JSON from "./studio-stops.json";
import { CHAPTERS, ROOM_LINE, type Chapter, type RoomName } from "./chapters";
import type { Band } from "./room/phone-framing";

/**
 * The walk as stops (art direction V3, 29 Oct 2026, "paintings first").
 *
 * A phone walks painting by painting (39 stops; the six small panels as three stacked pairs); a
 * wide screen walks groups of at most three (20 stops). Both lists, and their cameras, are made by
 * scripts/house/stop-cams.mjs from lib/studio-hang.json and the house's hang; a stop's room, its
 * space in the house and the afternoon's light come from its wall in lib/chapters.ts.
 */
export type Stop = {
  id: string;
  /** the wall (a chapter of lib/chapters.ts) it stands at */
  wall: string;
  /** the works in view, in walk order */
  works: string[];
  /** its camera in house.json */
  cam: string;
  chapter: Chapter;
  room: RoomName;
  space: Chapter["space"];
  dusk: number;
};

type Raw = { id: string; wall: string; works: string[]; cam: string };
const BY_WALL = new Map(CHAPTERS.map((c) => [c.id, c]));
const build = (raw: Raw[]): Stop[] => raw.map((r) => {
  const c = BY_WALL.get(r.wall);
  if (!c) throw new Error(`stop ${r.id}: no wall ${r.wall}`);
  return { ...r, chapter: c, room: c.room ?? "About her", space: c.space, dusk: c.dusk ?? 0 };
});

export const PHONE_STOPS = build((STOPS_JSON as unknown as { phone: Raw[] }).phone);
export const DESK_STOPS = build((STOPS_JSON as unknown as { desk: Raw[] }).desk);

/** the layout a screen gets: a phone's (portrait or small) or a wide screen's */
export const isPhoneLayout = (w: number, h: number) => w <= 760 || w / Math.max(1, h) < 0.85;
export const stopsFor = (phone: boolean) => (phone ? PHONE_STOPS : DESK_STOPS);

/** the phone's chrome: the header, the dock, the opening card (components/Studio, globals.css V3) */
export const CHROME = {
  phone: { header: 56, dock: 166, card: 336 },
  desk: { header: 70, dock: 100, card: 400 },
};

/** the part of the screen a stop's painting is framed in (the rest is header, dock or card) */
export function bandFor(stop: Stop | undefined, W: number, H: number): Band {
  const phoneChrome = W <= 760;
  const open = stop?.id === "presence";
  if (phoneChrome) return { t: CHROME.phone.header, b: open ? CHROME.phone.card : CHROME.phone.dock, l: 0, r: 0 };
  if (open) return { t: CHROME.desk.header, b: CHROME.desk.dock, l: Math.min(460, Math.round(W * 0.36)), r: 40 };
  return { t: CHROME.desk.header, b: CHROME.desk.dock, l: 0, r: 0 };
}

/** consecutive stops of one room make a run (the room list, the dock's "n of k") */
export type RoomRun = { name: RoomName; first: number; last: number; works: string[] };
export function roomsOf(stops: Stop[]): RoomRun[] {
  const out: RoomRun[] = [];
  stops.forEach((s, i) => {
    const prev = out[out.length - 1];
    if (prev && prev.name === s.room && prev.last === i - 1) { prev.last = i; prev.works.push(...s.works); }
    else out.push({ name: s.room, first: i, last: i, works: [...s.works] });
  });
  return out;
}
/** the series rooms ("About her" and "Her desk" are not counted) */
export const isSeries = (r: { name: string }) => r.name !== "About her" && r.name !== "Her desk";

export const roomLine = (name: string) => ROOM_LINE[name as RoomName];

/** every work in the order the walk passes it */
export const WALK_ORDER: string[] = PHONE_STOPS.flatMap((s) => s.works);

/** the stop a work is seen at; -1 if none */
export const stopOfWork = (stops: Stop[], id: string) => stops.findIndex((s) => s.works.includes(id));

/** the same place on the other layout (a phone turned on its side) */
export function mapStop(from: Stop[], i: number, to: Stop[]) {
  const s = from[i];
  if (!s) return 0;
  const j = s.works.length ? stopOfWork(to, s.works[0]) : to.findIndex((t) => t.id === s.id);
  return j < 0 ? Math.min(i, to.length - 1) : j;
}

/** the afternoon goes as you go in: the light at a (fractional) stop index */
export function duskAt(stops: Stop[], x: number) {
  const n = stops.length;
  const c = Math.min(n - 1, Math.max(0, x));
  const i = Math.min(n - 2, Math.floor(c));
  const k = c - i, s = k * k * (3 - 2 * k);
  return stops[i].dusk + (stops[i + 1].dusk - stops[i].dusk) * s;
}

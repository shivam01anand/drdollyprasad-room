import { HER_WALL } from "./her-wall";
import type { Room } from "./room/Room";
import { CHAPTERS } from "./chapters";

/**
 * The chapter's words are a caption along the foot of the screen, with no card. They must never
 * stand on a frame, on the room a frame's label needs under it, on her at her easel, or on a thing
 * the stop names (her photograph on its easel). Where the caption's line would cross one of those,
 * its measure is narrowed to end short of it (or it starts past it), so the words wrap in the free wall
 * or floor beside it.
 *
 * Both the caption (components/Studio) and the wall labels (components/WallLabels) call this when the
 * camera lands, with the same rectangles, so each knows where the other stands.
 */
type Rect = { x0: number; y0: number; x1: number; y1: number };

/** under a frame: the room its label takes */
const LABEL_ROOM = 74;
/** the narrowest measure worth setting beside a frame; under it the caption keeps the foot of the screen */
const MIN_MEASURE = 168;

const overlaps = (a: Rect, b: Rect, m: number) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;

/** what the caption at stop `index` must stand clear of, as the room is drawn now (CSS pixels) */
export function captionObstacles(room: Room, index: number): Rect[] {
  const out: Rect[] = room.artRects().map((f) => ({ ...f, y1: f.y1 + LABEL_ROOM }));
  for (const a of CHAPTERS[index]?.asides ?? []) {
    const r = room.anchorRect(a.anchor, a.size[0], a.size[1]);
    if (r) out.push(r);
  }
  if (CHAPTERS[index]?.herWall) {
    const w = room.wallRect(HER_WALL.wall);
    if (w) out.push(w);
  }
  return out.filter((r) => r.x1 > 0 && r.y1 > 0 && r.x0 < innerWidth && r.y0 < innerHeight);
}

export function fitCaption(panel: HTMLElement, obstacles: Rect[]) {
  panel.style.maxWidth = "";
  panel.style.left = "";
  const box = () => { const b = panel.getBoundingClientRect(); return { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }; };
  let b = box();
  if (!(b.x1 - b.x0) || !(b.y1 - b.y0)) return;
  // moved or narrowed, it may meet something else (narrowed, it grows taller): a few passes settle it
  for (let pass = 0; pass < 4; pass++) {
    const hits = obstacles.filter((r) => overlaps(b, r, 12));
    if (!hits.length) return;
    // something stands where the caption starts (a canvas on the side wall, at the screen's edge): start past it
    const edge = hits.filter((r) => r.x0 <= b.x0 + 48);
    if (edge.length) {
      const x = Math.max(...edge.map((r) => r.x1)) + 24;
      if (x > innerWidth * 0.45) break;
      panel.style.left = `${Math.round(x)}px`;
    } else {
      const w = Math.floor(Math.min(...hits.map((r) => r.x0)) - b.x0 - 24);
      if (w < MIN_MEASURE) break;
      panel.style.maxWidth = `${w}px`;
    }
    b = box();
  }
  // no free room beside the frames (a phone, a wall hung to the screen's edge): the foot of the screen, as set
  if (obstacles.some((r) => overlaps(b, r, 12)) || b.y0 < innerHeight * 0.4) { panel.style.maxWidth = ""; panel.style.left = ""; }
}

/** the caption of stop `index`, fitted to the room as drawn; its rectangle, or null if the stop has no words */
export function fitCaptionAt(room: Room, index: number): Rect | null {
  const panel = document.querySelector<HTMLElement>(`.copy-panel[data-i='${index}']`);
  if (!panel) return null;
  fitCaption(panel, captionObstacles(room, index));
  const b = panel.getBoundingClientRect();
  return b.width && b.height ? { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom } : null;
}

/** Words set on the room with no card: light ink or dark, by what is behind them (Room.readLumaBehind).
 *  Half by the mean of that ground and half by the middle of its darkest and lightest parts, so a line
 *  that crosses from brick to plaster still reads on both, and a label in a frame's shadow on a pale
 *  wall stays dark. `was` holds it steady near the middle */
export function inkFor(mean: number, range: { lo: number; hi: number }, was: boolean | null = null) {
  const v = (mean + (range.lo + range.hi) / 2) / 2;
  return was === null ? v < 0.5 : was ? v < 0.55 : v < 0.45;
}

/** the lettering's inks, as relative luminance (#211B17 and #F4EEE3) */
const L_DARK = 0.013, L_LIGHT = 0.86;
const lin = (v: number) => Math.pow(Math.max(0, Math.min(1, v)), 2.2);
export const WCAG = 4.8;   // the target is 4.5:1; a margin for a reading that is the mean of bands
/**
 * The ink for lettering over a stretch of the room as drawn (mean light and the darkest and lightest
 * of its bands, 0 to 1 as displayed): dark or light, whichever holds best on the worst part behind it,
 * with the middling bands held steady by `was`. `halo`: neither reaches 4.5:1 (WCAG) on the worst band, so
 * the letters carry a soft shadow of the opposite tone, thicker, which is what they are then read against.
 * Never a box.
 */
export function inkPlan(mean: number, range: { lo: number; hi: number }, was: boolean | null = null) {
  const dark = (lin(range.lo) + 0.05) / (L_DARK + 0.05);       // dark ink, on the darkest band
  const light = (L_LIGHT + 0.05) / (lin(range.hi) + 0.05);     // light ink, on the lightest band
  let useLight = inkFor(mean, range, was);
  // where the heuristic's choice fails the target and the other does not, take the other
  if (useLight && light < WCAG && dark >= WCAG) useLight = false;
  else if (!useLight && dark < WCAG && light >= WCAG) useLight = true;
  const ratio = useLight ? light : dark;
  return { light: useLight, halo: ratio < WCAG, ratio };
}

/**
 * The site's motion rules in one place (website review #1, Brand ruling 2, 20 Oct 2026).
 *
 * Shubham chose rows that keep moving. A visitor whose phone or computer has
 * "Reduce motion" switched on must still see a living site, but never a slide,
 * a zoom or a fling. So, under that setting:
 *   - the moving rows and the Home wall drift at half speed, and a drag stops
 *     where it is let go (no coasting);
 *   - the exhibition photograph changes every 5 s as a 600 ms crossfade.
 *
 * The COO can flip REDUCED_KEEPS_MOVING to false to go back to the earlier
 * behaviour: under "Reduce motion" nothing moves by itself (it still moves by hand).
 */
export const REDUCED_KEEPS_MOVING = true;

/** rows and the wall under "Reduce motion": this share of the normal speed */
export const REDUCED_SPEED = 0.5;
/** ...but a moving row never drifts slower than this under "Reduce motion" (px/s), so it never reads as stuck */
export const REDUCED_MIN_PX_S = 7;

/** the exhibition photograph roll (Brand: 3.2 s too quick; COO tie-break after the consultant debate, 21 Oct: 3.5 s) */
export const PHOTO_ROLL_MS = 3500;
export const PHOTO_ROLL_MS_REDUCED = 5000;
/** under "Reduce motion" the photographs crossfade over this long (no slide, no zoom) */
export const PHOTO_FADE_MS_REDUCED = 600;
/** after a swipe, a tap or a scroll of the strip, the roll and the strip wait this long */
export const PHOTO_HOLD_MS = 6000;
/** after the visitor scrolls the strip by hand, the strip itself is left where they put it this long */
export const STRIP_HOLD_MS = 12000;

export function prefersReducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The footer's "Pause movement" link (4-REVIEW1-DECISION 4.4): one site-wide stop for every row, the
 * Home wall, the exhibition photo roll and CSS animations. It sets html[data-motion="paused"],
 * is remembered in localStorage ("ddp-motion"), and tells listeners with a "ddp-motion" event.
 */
export const MOTION_KEY = "ddp-motion";
export const MOTION_EVENT = "ddp-motion";
export function motionPaused() {
  return typeof document !== "undefined" && document.documentElement.dataset.motion === "paused";
}
export function setMotionPaused(paused: boolean) {
  if (typeof document === "undefined") return;
  if (paused) document.documentElement.dataset.motion = "paused";
  else delete document.documentElement.dataset.motion;
  try { localStorage.setItem(MOTION_KEY, paused ? "paused" : "on"); } catch { /* storage unavailable: the choice lasts this page only */ }
  window.dispatchEvent(new Event(MOTION_EVENT));
}
export function storedMotionPaused() {
  try { return localStorage.getItem(MOTION_KEY) === "paused"; } catch { return false; }
}

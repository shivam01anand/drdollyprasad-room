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

/** the exhibition photograph roll (Brand: 3.2 s was too quick to read a photograph) */
export const PHOTO_ROLL_MS = 4000;
export const PHOTO_ROLL_MS_REDUCED = 5000;
/** under "Reduce motion" the photographs crossfade over this long (no slide, no zoom) */
export const PHOTO_FADE_MS_REDUCED = 600;
/** after a swipe, a tap or a scroll of the strip, the roll and the strip wait this long */
export const PHOTO_HOLD_MS = 6000;

export function prefersReducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

/**
 * The motion language, shared by every component.
 *
 * GSAP 3.13 ships ScrambleText, CustomEase, Draggable and Inertia in the
 * public package, so the original's exact primitives are used rather than
 * imitated: genEase for every move, ScrambleText for every piece of type.
 */

let ready = false;
export function motion() {
  if (!ready && typeof window !== "undefined") {
    gsap.registerPlugin(Flip, ScrambleTextPlugin, CustomEase, Draggable, InertiaPlugin);
    // long hold, a fast middle, a long flat tail — the original's one ease
    CustomEase.create(
      "genEase",
      "M0,0 C0,0 0.026,0 0.052,0 0.254,0 0.282,0.142 0.386,0.538 0.478,0.889 0.619,0.998 0.94,0.998 0.976,0.998 1,0.998 1,0.998 "
    );
    ready = true;
    if (process.env.NODE_ENV !== "production") {
      /* development only: step the one clock by hand, for checking beats in
         a tab the browser has hidden (hidden tabs get no animation frames) */
      const w = window as unknown as { __gsap?: typeof gsap; __advance?: (ms: number) => void };
      w.__gsap = gsap;
      w.__advance = (ms: number) => {
        const end = performance.now() + ms;
        while (performance.now() < end) {
          const next = performance.now() + 16.6;
          while (performance.now() < next) { /* wait out one frame */ }
          gsap.ticker.tick();
        }
      };
    }
  }
  return gsap;
}

export { gsap, Flip, Draggable };

/**
 * The glyph pool is hers: the PIN code on her pillar letter box and the
 * denominations on the coins she paints. Nothing invented.
 */
export const POOL = "110001204ANNASPAISE1946";

export const reducedMotion = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

type ScrambleOpts = {
  duration?: number;
  /** 2 = UI (25 ms flicker), 1 = brand (50 ms), 0.6 = content (83 ms) */
  speed?: number;
  delay?: number;
  /** decode out of the string's own letters, so a title reads as a shuffle of itself */
  anagram?: boolean;
  chars?: string;
};

/** the studio's words just arrive (QC 28 Oct: no scramble in the studio); a tween-shaped handle like scrambleTo's */
export function settleText(el: Element, text: string) {
  el.textContent = text;
  return gsap.set(el, {});
}

/** type `text` into `el`; returns the tween so callers can own and kill it */
export function scrambleTo(el: Element, text: string, o: ScrambleOpts = {}) {
  motion();
  if (reducedMotion()) {
    el.textContent = text;
    return gsap.set(el, {});
  }
  const chars = o.chars ?? (o.anagram ? text.replace(/\s+/g, "") || POOL : POOL);
  return gsap.to(el, {
    duration: o.duration ?? 1,
    delay: o.delay ?? 0,
    overwrite: true,
    scrambleText: { text, chars, speed: o.speed ?? 1, delimiter: "" },
  });
}

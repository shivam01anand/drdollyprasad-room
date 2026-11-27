import ALT from "./alt-text.json";
import type { Work } from "./works";

/**
 * A painting's alt text: its title, what is painted, and the medium. The middle part is the checked
 * visual record from dolly-engine kb/paintings.json, assembled by scripts/alt/make.py (no new facts).
 * A painting the record does not cover falls back to title and medium.
 */
const A: Record<string, string> = ALT;

export const altOf = (w: Work) => A[w.id] ?? `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;

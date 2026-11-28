import ALT from "./alt-text.json";
import type { Work } from "./works";

/**
 * A painting's alt text: "<Title>, <medium> by Dr Dolly Prasad: <what is painted>", plain lines written
 * from the checked visual record in dolly-engine kb/paintings.json and reviewed (no new facts).
 * scripts/alt/make.py wrote the first, terse format and is superseded. A painting not covered falls back to title and medium.
 */
const A: Record<string, string> = ALT;

export const altOf = (w: Work) => A[w.id] ?? `${w.title}, ${w.medium.toLowerCase()} by Dr Dolly Prasad`;

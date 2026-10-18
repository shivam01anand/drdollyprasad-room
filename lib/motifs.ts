import type { Motif } from "./site";

/**
 * The line work round the edges of every page: small, plain drawings of the
 * things in her paintings, one set per series, standing on a fine baseline
 * against the outside edge (as in the approved Instagram frames). Faith uses
 * the approved prayer frieze itself. These drawings are the website's
 * decoration, never part of a painting.
 *
 * Each motif is drawn in an 80 × 80 box, strokes only.
 */

const INK = "#2B2420";

const spokes = (cx: number, cy: number, r0: number, r1: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const p = (r: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    return `M${p(r0)}L${p(r1)}`;
  }).join("");

const petals = (cx: number, cy: number, n: number, rx: number, ry: number, off: number) =>
  Array.from({ length: n }, (_, i) =>
    `<ellipse cx="${cx}" cy="${cy - off}" rx="${rx}" ry="${ry}" transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`).join("");

const M = {
  wheel: `<circle cx="40" cy="46" r="28"/><circle cx="40" cy="46" r="23"/><circle cx="40" cy="46" r="5"/><path d="${spokes(40, 46, 5, 23, 10)}"/>`,
  coin: `<circle cx="40" cy="48" r="22"/><circle cx="40" cy="48" r="18" stroke-dasharray="1 3.4"/><path d="M29 43c2-4 8-4 9 0c1 3-3 6-9 11h10"/><ellipse cx="47" cy="48" rx="4" ry="6"/>`,
  gullak: `<path d="M35 25h10M36 25c-12 6-18 16-16 28c2 10 10 17 20 17s18-7 20-17c2-12-4-22-16-28"/><path d="M35 37h10"/><path d="M28 62c8 3 16 3 24 0"/>`,
  kettle: `<path d="M24 68h32c2-14-2-26-16-26s-18 12-16 26z"/><path d="M33 42c0-5 14-5 14 0"/><circle cx="40" cy="34" r="2"/><path d="M55 56c6-2 10-8 12-15M25 48c-8 2-8 14 0 16"/>`,
  postbox: `<path d="M27 72V38c0-13 26-13 26 0v34z"/><path d="M33 46h14M27 54h26M24 72h32"/><circle cx="40" cy="62" r="2"/>`,
  ring: `<circle cx="40" cy="22" r="7"/><circle cx="40" cy="22" r="2"/><path d="M40 29v3"/><circle cx="40" cy="50" r="17"/><circle cx="40" cy="50" r="13"/>`,
  door: `<path d="M22 74V36a18 18 0 0 1 36 0v38"/><path d="M40 18v56M26 36a14 14 0 0 1 28 0"/><circle cx="34" cy="52" r="2"/><circle cx="46" cy="52" r="2"/><circle cx="31" cy="64" r="1.4"/><circle cx="49" cy="64" r="1.4"/><circle cx="31" cy="42" r="1.4"/><circle cx="49" cy="42" r="1.4"/>`,
  lock: `<path d="M31 42v-9a9 9 0 0 1 18 0v9"/><rect x="25" y="42" width="30" height="26" rx="3"/><circle cx="40" cy="52" r="3"/><path d="M40 55v6"/>`,
  bolt: `<rect x="14" y="36" width="52" height="18" rx="2"/><path d="M20 45h34"/><circle cx="34" cy="45" r="3.5"/><path d="M34 48v12"/><circle cx="19" cy="40" r="1.2"/><circle cx="61" cy="50" r="1.2"/>`,
  diya: `<path d="M20 58c6 11 34 11 40 0z"/><path d="M60 58c4-1 6-3 7-6"/><path d="M40 54c-7-6-5-15 0-24c5 9 7 18 0 24z"/><path d="M40 50c-2-3-1-7 0-10"/>`,
  bell: `<path d="M27 60c0-17 5-26 13-26s13 9 13 26z"/><path d="M24 60h32M40 34v-10M36 24h8"/><circle cx="40" cy="65" r="3"/><path d="M32 70c2 4 0 6 2 9M48 70c-2 4 0 6-2 9"/>`,
  lotus: `<path d="M40 68c-8-8-8-22 0-34c8 12 8 26 0 34z"/><path d="M40 68c-12-2-20-12-22-24c12 2 20 10 22 24zM40 68c12-2 20-12 22-24c-12 2-20 10-22 24z"/><path d="M18 70h44"/>`,
  turban: `<path d="M20 44c0-16 10-25 20-25s20 9 20 25"/><path d="M20 44c8-6 32-6 40 0M23 35c8-7 26-7 34 0M30 25c4-3 16-3 20 0"/><path d="M28 45c0 14 6 24 12 24s12-10 12-24"/><path d="M59 42c6 6 7 17 2 26"/>`,
  chai: `<path d="M30 34h20l-3 36H33z"/><path d="M31 44h18"/><path d="M36 29c-3-4 3-6 0-11M44 29c-3-4 3-6 0-11"/>`,
  milkcan: `<path d="M33 22h14v7c8 4 11 10 11 17v20c0 5-36 5-36 0V46c0-7 3-13 11-17z"/><path d="M33 29h14M22 50h36"/>`,
  kadhai: `<path d="M14 46c4 20 48 20 52 0z"/><path d="M14 46c-7 0-7-7 0-7h5M66 46c7 0 7-7 0-7h-5"/><path d="M24 54c10 4 22 4 32 0"/>`,
  leaf: `<path d="M38 74C38 52 42 32 52 12"/><path d="M38 74C20 58 24 30 52 12c6 22 2 46-14 62z"/><path d="M41 54l-12-6M43 44l-11-8M46 34l-9-8M42 56l10-8M45 44l9-9"/>`,
  poppy: `<path d="M26 34c-4-14 12-18 14-8c2-10 18-6 14 8c-2 8-26 8-28 0z"/><circle cx="40" cy="32" r="3"/><path d="M40 42c0 12-2 22-5 32"/><path d="M38 60c-8-2-12-8-12-14c7 1 11 6 12 14z"/>`,
  bird: `<path d="M16 50c10-1 18-10 26-10c8 0 12 4 14 8l9-2-6 6c-4 8-14 12-24 10c-8-2-14-8-19-12z"/><circle cx="52" cy="45" r="1.2"/><path d="M32 47c6 4 13 4 17 0M30 58l-4 12M36 60l-1 12"/>`,
  flower: `${petals(40, 44, 6, 6, 11, 12)}<circle cx="40" cy="44" r="5"/>`,
};

type Key = keyof typeof M;

export const SETS: Record<Exclude<Motif, "faith">, Key[]> = {
  days: ["wheel", "coin", "gullak", "kettle", "postbox"],
  doors: ["ring", "door", "lock", "bolt"],
  faces: ["turban", "chai", "milkcan", "kadhai"],
  recent: ["leaf", "poppy", "bird", "flower", "bell"],
  home: ["wheel", "diya", "leaf", "ring", "poppy", "gullak", "turban", "bell"],
};

const CELL = 96;
const H = 84;

/** one horizontal tile: the motifs standing on a baseline */
function strip(keys: Key[]) {
  const w = keys.length * CELL;
  const body = keys.map((k, i) =>
    `<g transform="translate(${i * CELL + 8} 2)">${M[k]}</g><circle cx="${i * CELL + 92}" cy="76" r="1.3" fill="${INK}" stroke="none"/>`).join("");
  return { w, body: `${body}<path d="M0 82.5H${w}"/>` };
}

const wrap = (w: number, h: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;

const uri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export type Borders = { top: string; left: string; right: string; ratio: number };

/** the border images for a motif set: a frieze, and the two side ribbons facing inward */
export function borders(motif: Motif): Borders {
  if (motif === "faith") {
    return {
      top: `url("/site/prayer-frieze.png")`,
      left: `url("/site/prayer-frieze-left.png")`,
      right: `url("/site/prayer-frieze-right.png")`,
      ratio: 966 / 77,
    };
  }
  const { w, body } = strip(SETS[motif]);
  return {
    top: uri(wrap(w, H, body)),
    // turned so the baseline lies against the page's outer edge and the drawings face in
    left: uri(wrap(H, w, `<g transform="translate(${H} 0) rotate(90)">${body}</g>`)),
    right: uri(wrap(H, w, `<g transform="translate(0 ${w}) rotate(-90)">${body}</g>`)),
    ratio: w / H,
  };
}

import SIZES from "./image-sizes.json";

/**
 * The pixel size of each wall and card photograph, so every <img> reserves its
 * space before it loads and the page does not jump (layout shift).
 * Regenerate lib/image-sizes.json when photographs in public/site change.
 */
const S: Record<string, number[]> = SIZES;

export const dims = (src: string): { width?: number; height?: number } => {
  const d = S[src];
  return d ? { width: d[0], height: d[1] } : {};
};

/**
 * A srcset for a wall or card photograph: the 280 px copy in its `sm/` folder (when
 * there is one) for small tiles on a phone, and the file itself for the rest.
 */
export const smSet = (src: string): { srcSet?: string; sizes?: string } => {
  const sm = src.replace(/\/([^/]+)$/, "/sm/$1");
  const a = S[sm], b = S[src];
  return a && b ? { srcSet: `${sm} ${a[0]}w, ${src} ${b[0]}w`, sizes: "(max-width: 640px) 140px, (max-width: 1100px) 25vw, 16vw" } : {};
};

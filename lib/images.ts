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

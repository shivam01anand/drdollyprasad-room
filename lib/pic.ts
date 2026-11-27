import V from "./image-variants.json";

/**
 * The lighter copies of a photograph (scripts/images/variants.cjs): AVIF and WebP at a few widths,
 * under /i/ with a hash of the source in the name, so they are cached for a year (next.config.mjs).
 * The JPEG itself stays the fallback. A photograph with no copies returns null and is shown as before.
 */
const M = V as unknown as Record<string, [string, number, number, number[]]>;

export type PicSet = { avif: string; webp: string; width: number; height: number };

export const picSet = (src: string): PicSet | null => {
  const v = M[src];
  if (!v) return null;
  const [hash, width, height, ws] = v;
  const base = `/i${src.replace(/\.jpg$/, "")}.${hash}`;
  const set = (ext: string) => ws.map((w) => `${base}.${w}.${ext} ${w}w`).join(", ");
  return { avif: set("avif"), webp: set("webp"), width, height };
};

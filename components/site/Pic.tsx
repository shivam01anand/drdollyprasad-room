import type { ImgHTMLAttributes, Ref } from "react";
import { picSet, type PicSet } from "@/lib/pic";

/**
 * One photograph, in the lightest form the browser can show: AVIF, then WebP, then the JPEG it was
 * made from (lib/pic). `sizes` says how wide it is drawn, so a phone takes a small copy. The
 * <picture> wrapper takes no box of its own (site.css: picture{display:contents}), so every
 * existing rule written for the <img> still applies to it. Below the first screen it loads lazily
 * unless `eager` is set.
 */
export default function Pic({ src, sizes, set, eager = false, imgRef, ...img }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "sizes" | "loading"> & {
  src: string; sizes: string; set?: PicSet | null; eager?: boolean; imgRef?: Ref<HTMLImageElement>;
}) {
  const s = set === undefined ? picSet(src) : set;
  const el = (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img ref={imgRef} src={src} loading={eager ? "eager" : "lazy"} decoding="async" {...img} />
  );
  if (!s) return el;
  return (
    <picture>
      <source type="image/avif" srcSet={s.avif} sizes={sizes} />
      {el}
    </picture>
  );
}

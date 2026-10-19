import fs from "node:fs";
import path from "node:path";

/**
 * The single divider (ChatGPT brief 005, Brand pick C): one small line-sketch
 * figure between two hairlines, marking a break between sections. Decorative
 * only (alt=""), brand ink, and always its own block between sections, never
 * inside a section that holds a painting, so it cannot touch or sit beside a
 * painting frame.
 *
 * Today: the reading figure at 2x, a phone file (78x96, shown 39x48) and a
 * computer file (104x128, shown 52x64).
 *
 * Drop-in (brief 006, the painting lady): put the approved files at
 *   public/site/dividers/painter-desktop@2x.png  (104x128, shown 52x64)
 *   public/site/dividers/painter-phone@2x.png    (78x96, shown 39x48)
 * and rebuild. When both exist they replace the reading figure in every slot,
 * with no code change (checked once, at build time).
 */
const has = (f: string) => {
  try { return fs.existsSync(path.join(process.cwd(), "public", f)); } catch { return false; }
};
const PAINTER = { desktop: "/site/dividers/painter-desktop@2x.png", phone: "/site/dividers/painter-phone@2x.png" };
const PAINTER_READY = has(PAINTER.desktop) && has(PAINTER.phone);

export const DIVIDER_FIGURES = {
  reading: PAINTER_READY ? PAINTER : { desktop: "/site/dividers/reading.png", phone: "/site/dividers/reading-phone.png" },
  praying: PAINTER_READY ? PAINTER : { desktop: "/site/dividers/praying.png", phone: "/site/dividers/praying-phone.png" },
  seated: PAINTER_READY ? PAINTER : { desktop: "/site/dividers/seated.png", phone: "/site/dividers/seated-phone.png" },
  painter: PAINTER_READY ? PAINTER : { desktop: "/site/dividers/reading.png", phone: "/site/dividers/reading-phone.png" },
} as const;

/** CSS size of the computer image (the file is 2x: 104x128); the phone size (39x48) is set in site.css */
export const DIVIDER_PX = { w: 52, h: 64 };

export type DividerFigure = keyof typeof DIVIDER_FIGURES;

export default function Divider({ figure = "reading" }: { figure?: DividerFigure }) {
  return (
    <div className="divider" aria-hidden="true">
      <picture>
        <source media="(min-width: 761px)" srcSet={DIVIDER_FIGURES[figure].desktop} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DIVIDER_FIGURES[figure].phone} alt="" width={DIVIDER_PX.w} height={DIVIDER_PX.h} loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}

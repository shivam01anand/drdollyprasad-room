/**
 * The single divider (ChatGPT brief 005, Brand pick C): one small line-sketch
 * figure between two hairlines, marking a break between sections. Decorative
 * only (alt=""), brand ink, and always its own block between sections, never
 * inside a section that holds a painting, so it cannot touch or sit beside a
 * painting frame.
 *
 * TEMPORARY ART: the files below are crops of the rough (005-Borders-Rough.jpg)
 * for the preview only. Swap them for the clean transparent assets by replacing
 * the files at the same paths (see docs/WEBSITE-BACKLOG.md, "Divider asset").
 */
export const DIVIDER_FIGURES = {
  reading: "/site/dividers/reading.png",
  praying: "/site/dividers/praying.png",
  seated: "/site/dividers/seated.png",
} as const;

/** the intrinsic size of the files above; set it to the final assets' size when they replace the temporary ones */
export const DIVIDER_PX = { w: 145, h: 164 };

export type DividerFigure = keyof typeof DIVIDER_FIGURES;

export default function Divider({ figure = "reading" }: { figure?: DividerFigure }) {
  return (
    <div className="divider" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DIVIDER_FIGURES[figure]} alt="" width={DIVIDER_PX.w} height={DIVIDER_PX.h} loading="lazy" decoding="async" />
    </div>
  );
}

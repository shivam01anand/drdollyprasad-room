/**
 * The single divider (ChatGPT brief 005, Brand pick C): one small line-sketch
 * figure between two hairlines, marking a break between sections. Decorative
 * only (alt=""), brand ink, and always its own block between sections, never
 * inside a section that holds a painting, so it cannot touch or sit beside a
 * painting frame.
 *
 * Final art (005 RETURN-2, BUILD_SPEC): the same reading figure at 2x, a phone
 * file (78x96, shown 39x48) and a computer file (104x128, shown 52x64). All three
 * figure slots use it for now; replace a slot's pair to give it its own figure.
 */
export const DIVIDER_FIGURES = {
  reading: { desktop: "/site/dividers/reading.png", phone: "/site/dividers/reading-phone.png" },
  praying: { desktop: "/site/dividers/praying.png", phone: "/site/dividers/praying-phone.png" },
  seated: { desktop: "/site/dividers/seated.png", phone: "/site/dividers/seated-phone.png" },
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

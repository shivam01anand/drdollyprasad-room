/**
 * The quiet frame round every page (Shubham, PR #11 review: the line-sketch
 * language of the Instagram posts, not the old dotted and diamond rules).
 *
 * Band: a thin strip of her village line sketch, tiling sideways without a
 * seam, in ink on transparent, at the top and the bottom of every page. The
 * files are swapped without touching code (docs/WEBSITE-BACKLOG.md, "Border
 * and divider drop-in"):
 *   public/site/borders/border-desktop@2x.png  shown 48 px tall (computer)
 *   public/site/borders/border-phone@2x.png    shown 36 px tall (phone, 640 px and under)
 * Today's files are cropped from the approved village-perimeter sketch (brief
 * 002 kit) along its ground line, recoloured to ink #26211D; ChatGPT's brief
 * 006 strips replace them at the same paths.
 *
 * Rails: a single hairline down each side on a computer (no pattern).
 */
export function Rails() {
  return (
    <>
      <div className="rail rail-l" aria-hidden="true" />
      <div className="rail rail-r" aria-hidden="true" />
    </>
  );
}

export function Band({ at }: { at: "top" | "bottom" | "footer" }) {
  return <div className={`band band-${at}`} aria-hidden="true" />;
}

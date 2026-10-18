/**
 * The frame round every page: the prayer frieze from her Faith series —
 * figures with lamps, bells, books and folded hands — as side ribbons on a
 * computer and a frieze above and below everywhere.
 */
export function Rails() {
  return (
    <>
      <div className="rail rail-l" aria-hidden="true" />
      <div className="rail rail-r" aria-hidden="true" />
    </>
  );
}

export function Band({ at }: { at: "top" | "bottom" }) {
  return <div className={`band band-${at}`} aria-hidden="true" />;
}

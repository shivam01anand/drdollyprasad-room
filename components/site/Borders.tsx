/**
 * The quiet frame round every page: a fine double rule with small diamonds,
 * in a warm brown. Plain pattern, no figures, so it suits every collection.
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

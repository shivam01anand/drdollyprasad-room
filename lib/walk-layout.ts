export type WalkLayout = { centers: readonly number[]; worksTop: number };

/** The camera's chapter progress, independent of the page's current height. */
export function walkProgress(scroll: number, centers: readonly number[]) {
  const n = centers.length;
  if (n < 2 || scroll <= centers[0]) return 0;
  if (scroll >= centers[n - 1]) return 1;
  let k = 0;
  while (k < n - 2 && scroll > centers[k + 1]) k++;
  return (k + (scroll - centers[k]) / Math.max(1, centers[k + 1] - centers[k])) / (n - 1);
}

/** Keep the same point in the walk when a viewport or section changes size. */
export function rebaseWalkScroll(scroll: number, before: WalkLayout, after: WalkLayout) {
  const old = before.centers, next = after.centers;
  if (old.length < 2 || next.length < 2) return scroll;
  const oldEnd = old[old.length - 1], nextEnd = next[next.length - 1];
  if (scroll <= oldEnd) {
    const f = walkProgress(scroll, old) * (next.length - 1);
    const k = Math.min(next.length - 2, Math.floor(f));
    return next[k] + (f - k) * (next[k + 1] - next[k]);
  }
  if (Number.isFinite(before.worksTop) && Number.isFinite(after.worksTop)) {
    if (scroll >= before.worksTop) return after.worksTop + scroll - before.worksTop;
    const k = (scroll - oldEnd) / Math.max(1, before.worksTop - oldEnd);
    return nextEnd + k * (after.worksTop - nextEnd);
  }
  return scroll;
}

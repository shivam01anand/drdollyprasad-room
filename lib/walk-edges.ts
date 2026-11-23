/**
 * The walk's edge arrows (Studio) stand off any painting's centre. When the camera lands, an arrow
 * with a painting's middle under it moves up or down its edge, to the nearest place clear of
 * every middle; it stays in the screen's middle band. WallLabels calls this before it places the
 * cards, so they stand clear of the arrows where the arrows end up.
 */
type Rect = { x0: number; y0: number; x1: number; y1: number };

const STEPS = [0, -96, 96, -168, 168];

export function clearWalkEdges(frames: Rect[]) {
  const vh = innerHeight;
  document.querySelectorAll<HTMLElement>(".walk-edge").forEach((b) => {
    const was = parseFloat(b.style.getPropertyValue("--edge-dy")) || 0;
    const r = b.getBoundingClientRect();
    const top = r.top - was, bottom = r.bottom - was;
    const hit = (dy: number) => frames.some((f) => {
      const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
      return cx > r.left - 10 && cx < r.right + 10 && cy > top + dy - 10 && cy < bottom + dy + 10;
    });
    const dy = STEPS.find((d) => top + d > vh * 0.18 && bottom + d < vh * 0.78 && !hit(d)) ?? 0;
    if (dy !== was) b.style.setProperty("--edge-dy", `${dy}px`);
  });
}

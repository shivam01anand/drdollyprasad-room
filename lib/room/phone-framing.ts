import type { HouseInfo } from "./house";
import type { Pose } from "./rig";
import { viewPose } from "../chapters";

/**
 * Art direction V3 (29 Oct 2026): a stop's camera on the real screen.
 *
 * The cams are computed from the hang by scripts/house/stop-cams.mjs: eye and target square on a
 * painting (or a group), and `span`, the metres of wall that must fit the visible band. Here the
 * band (screen less header and dock, and on the opening less the card) becomes a lens and a view
 * offset: the band's middle is the projection centre, and the span fills it as on the reference
 * screen, so a painting is 72 % of any phone's width.
 */
export type Band = { t: number; b: number; l: number; r: number };
type Cam = HouseInfo["cams"][string];

export function stopPose(cam: Cam, W: number, H: number, band: Band, prevYaw?: number): Pose {
  const p = viewPose(cam, prevYaw);
  const span = cam.span;
  const bw = Math.max(1, W - band.l - band.r), bh = Math.max(1, H - band.t - band.b);
  if (span) {
    const d = Math.hypot(cam.target[0] - cam.eye[0], cam.target[1] - cam.eye[1], cam.target[2] - cam.eye[2]);
    // pixels per metre at the target: the span fits the band both ways
    const ppm = Math.min(bw / span[0], bh / span[1]);
    p.fov = (2 * Math.atan(H / ppm / 2 / d) * 180) / Math.PI;
  } else {
    p.fov = cam.fov;
  }
  p.off = [0.5 - (band.l + bw / 2) / W, 0.5 - (band.t + bh / 2) / H];
  return p;
}

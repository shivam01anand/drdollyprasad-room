import * as THREE from "three";
import type { HouseInfo, V3 } from "./house";
import { fieldOfView } from "./rig";

type View = HouseInfo["cams"][string];
/** a chapter's space (house.json plan key); the older room names still map */
const ROOMS: Record<string, string> = {
  aangan: "aangan", quiet: "quiet", red: "red", gallery: "gallery",
  "The courtyard": "aangan", "The Quiet Room": "quiet", "The Red Room": "red", "The gallery": "gallery",
};
const NORMALS: Record<string, [number, number]> = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

/** Frame the whole hang on a phone, rather than selecting one of its canvases. */
export function phoneGroupView(info: HouseInfo, view: string, ids: readonly string[], room: string | undefined, aspect: number): View | null {
  if (ids.length < 2 || !room) return null;
  const bounds = info.plan[ROOMS[room]];
  if (!Array.isArray(bounds)) return null;
  const corners: THREE.Vector3[] = [];
  for (const id of ids) {
    const art = info.art[id];
    if (!art || !NORMALS[art.side]) return null;
    const [nx, nz] = NORMALS[art.side];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      corners.push(new THREE.Vector3(
        art.centre[0] + nz * (art.w / 2 + 0.03) * sx,
        art.centre[1] + (art.h / 2 + 0.03) * sy,
        art.centre[2] - nx * (art.w / 2 + 0.03) * sx,
      ));
    }
  }
  const centre = new THREE.Box3().setFromPoints(corners).getCenter(new THREE.Vector3());
  const original = info.cams[view];
  const away = new THREE.Vector3(original.eye[0] - centre.x, 0, original.eye[2] - centre.z).normalize();
  // Plan bounds use Blender's floor axes; cameras use three's x/z floor.
  const limits = [[bounds[0] + 0.55, bounds[1] - 0.55], [-bounds[3] + 0.55, -bounds[2] - 0.55]];
  let farthest = Infinity;
  for (const [i, axis] of (["x", "z"] as const).entries()) {
    if (Math.abs(away[axis]) < 1e-6) continue;
    const edge = limits[i][away[axis] > 0 ? 1 : 0];
    farthest = Math.min(farthest, (edge - centre[axis]) / away[axis]);
  }
  if (!Number.isFinite(farthest) || farthest < 0.8) return null;
  const camera = new THREE.PerspectiveCamera(62, aspect, 0.05, 120);
  const eyeY = 1.55;
  const make = (distance: number, fov: number): View => {
    const eye: V3 = [centre.x + away.x * distance, eyeY, centre.z + away.z * distance];
    // Hang the composition above centre, leaving the lower part for its copy.
    const angle = Math.atan2(centre.y - eyeY, distance) - Math.atan(0.25 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    const target: V3 = [centre.x, eyeY + distance * Math.tan(angle), centre.z];
    return { eye, target, fov };
  };
  const fits = (distance: number, fov: number) => {
    const candidate = make(distance, fov);
    camera.position.set(...candidate.eye);
    camera.lookAt(new THREE.Vector3(...candidate.target));
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    return corners.every((corner) => {
      const p = corner.clone().project(camera);
      return p.z > -1 && p.z < 1 && Math.abs(p.x) <= 0.87 && p.y >= -0.12 && p.y <= 0.68;
    });
  };
  let fov = fieldOfView(aspect);
  if (!fits(farthest, fov)) {
    let low = fov, high = 104;
    for (let i = 0; i < 18; i++) {
      const mid = (low + high) / 2;
      if (fits(farthest, mid)) high = mid; else low = mid;
    }
    fov = high;
  }
  let near = 0.8, far = farthest;
  for (let i = 0; i < 18; i++) {
    const mid = (near + far) / 2;
    if (fits(mid, fov)) far = mid; else near = mid;
  }
  return make(far, fov);
}

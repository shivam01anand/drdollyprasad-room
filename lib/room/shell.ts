import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Role } from "./materials";

/**
 * A bare room in an old Delhi house — see ROOM-DESIGN.md.
 *
 * Three walls are hung, each with its own beat: the back wall is the altar
 * (the shrine niche, Twenty Paise on its red field, the four Bandh Darwaze
 * panels), the left wall is what is leaving (two Gone Are The Days canvases
 * and the door out), the right wall is what is still (the recent work, either
 * side of a small high window). The fourth side is open, as in the original,
 * for the wide shots and the rearrange view.
 *
 * Nothing here owns a material. Every mesh names a material role and how its
 * UVs should be laid in metres; Room.ts binds the photographs and merges all
 * static geometry into a handful of draw calls.
 */

export const ROOM = {
  w: 6.4, d: 5.2, h: 3.35,
  t: 0.45,                                                     // thick walls, deep reveals
  door:   { w: 1.12, h: 2.2, z: 1.35, open: 0.52 },            // left wall, swung into the room
  window: { w: 1.5, h: 1.08, sill: 1.58, z: 0 },               // right wall — small, high, deep-set
  niche:  { w: 0.52, h: 0.66, sill: 1.02, x: -2.15, depth: 0.3 },  // back wall — the lamp's place
  plinth: { h: 0.36, d: 0.4 },
  field:  { w: 2.05, h: 2.5 },
};

const HX = ROOM.w / 2, HZ = ROOM.d / 2;

/** how a mesh's UVs are laid: projected from world position, the
 *  geometry's own UVs stretched to real lengths, or left exactly as built */
export type UVMode =
  | { kind: "world" }
  | { kind: "metric"; su: number; sv: number }
  | { kind: "keep" };

export type Tag = { role: Role; uv: UVMode; cast: boolean; receive: boolean };

export function tag(m: THREE.Mesh, role: Role, uv: UVMode = { kind: "world" }, cast = true, receive = true) {
  m.userData.tag = { role, uv, cast, receive } satisfies Tag;
  return m;
}

const rbox = (w: number, h: number, d: number, r = 0.012, seg = 2) =>
  new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

function box(w: number, h: number, d: number, x: number, y: number, z: number, role: Role, name: string) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
  m.position.set(x, y, z);
  m.name = name;
  return tag(m, role);
}

function rounded(w: number, h: number, d: number, x: number, y: number, z: number, role: Role, name: string, r = 0.012) {
  const m = new THREE.Mesh(rbox(w, h, d, r));
  m.position.set(x, y, z);
  m.name = name;
  return tag(m, role);
}

/**
 * Tile a wall with boxes, leaving rectangular holes. Holes are
 * [along0, along1, y0, y1] in the wall's own frame.
 */
function wallWithHoles(
  o: { axis: "x" | "z"; at: number; from: number; to: number; height: number; thick: number; name: string; role: Role },
  holes: [number, number, number, number][]
) {
  const g = new THREE.Group();
  const ys = [0, o.height];
  holes.forEach(([, , y0, y1]) => ys.push(y0, y1));
  const bands = [...new Set(ys)].sort((a, b) => a - b);

  for (let b = 0; b < bands.length - 1; b++) {
    const y0 = bands[b], y1 = bands[b + 1];
    if (y1 - y0 < 1e-4) continue;
    const mid = (y0 + y1) / 2;
    const cutting = holes.filter((h) => mid > h[2] && mid < h[3]);
    const xs = [o.from, o.to];
    cutting.forEach(([a0, a1]) => xs.push(a0, a1));
    const cols = [...new Set(xs)].sort((a, c) => a - c);
    for (let c = 0; c < cols.length - 1; c++) {
      const a0 = cols[c], a1 = cols[c + 1];
      if (a1 - a0 < 1e-4) continue;
      const amid = (a0 + a1) / 2;
      if (cutting.some(([h0, h1]) => amid > h0 && amid < h1)) continue;
      const w = a1 - a0, hgt = y1 - y0, cy = (y0 + y1) / 2;
      g.add(
        o.axis === "z"
          ? box(w, hgt, o.thick, amid, cy, o.at, o.role, `${o.name}_${b}_${c}`)
          : box(o.thick, hgt, w, o.at, cy, amid, o.role, `${o.name}_${b}_${c}`)
      );
    }
  }
  return g;
}

export type Anchors = {
  /** world centre of the padlock — the close read looks here */
  lock: THREE.Vector3;
  /** world normal of the door leaf's room face */
  leafNormal: THREE.Vector3;
  /** where the flame sits */
  diya: THREE.Vector3;
  /** the window opening, for the light shaft */
  windowCentre: THREE.Vector3;
};

export function buildShell() {
  const root = new THREE.Group();
  root.name = "Shell";
  const { h, t } = ROOM;

  /* --- ground ------------------------------------------------------------ */
  // kota-stone floor, oversized so it never ends in frame — out through the
  // open side and under the right wall
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 44));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-HX - t + 18, 0, 0);
  floor.name = "Floor";
  root.add(tag(floor, "floor", { kind: "world" }, false, true));

  // the courtyard beyond the door: terracotta tiles in the sun
  const court = new THREE.Mesh(new THREE.PlaneGeometry(16, 44));
  court.rotation.x = -Math.PI / 2;
  court.position.set(-HX - t - 8, 0.0005, 0);
  court.name = "CourtFloor";
  root.add(tag(court, "courtFloor", { kind: "world" }, false, true));

  /* --- walls --------------------------------------------------------------- */
  const n = ROOM.niche;
  const nx0 = n.x - n.w / 2, nx1 = n.x + n.w / 2;
  // back wall carries its corners; the niche is cut 0.3 m into it
  root.add(wallWithHoles(
    { axis: "z", at: -HZ - t / 2, from: -HX - t, to: HX + t, height: h, thick: t, name: "WallBack", role: "wall" },
    [[nx0, nx1, n.sill, n.sill + n.h]]
  ));
  const nicheBackDepth = t - n.depth;
  root.add(box(n.w, n.h, nicheBackDepth, n.x, n.sill + n.h / 2, -HZ - n.depth - nicheBackDepth / 2, "wallShade", "NicheBack"));

  const d = ROOM.door;
  const dz0 = d.z - d.w / 2, dz1 = d.z + d.w / 2;
  root.add(wallWithHoles(
    { axis: "x", at: -HX - t / 2, from: -HZ, to: HZ, height: h, thick: t, name: "WallLeft", role: "wall" },
    [[dz0, dz1, 0, d.h]]
  ));

  const wdw = ROOM.window;
  const wz0 = wdw.z - wdw.w / 2, wz1 = wdw.z + wdw.w / 2;
  root.add(wallWithHoles(
    { axis: "x", at: HX + t / 2, from: -HZ, to: HZ, height: h, thick: t, name: "WallRight", role: "wall" },
    [[wz0, wz1, wdw.sill, wdw.sill + wdw.h]]
  ));

  /* --- ceiling: plank soffit, beams across the short span ------------------
     The beams run front to back, so in the wide shots they are lines that
     lead the eye to the hero. */
  const ceiling = new THREE.Group();
  ceiling.name = "Ceiling";
  const soffit = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w + 0.02, ROOM.d + 0.02));
  soffit.rotation.x = Math.PI / 2;
  soffit.position.y = h;
  soffit.name = "Soffit";
  ceiling.add(tag(soffit, "timber", { kind: "world" }, true, true));
  for (let i = 0; i < 7; i++) {
    const x = -HX + 0.5 + i * ((ROOM.w - 1.0) / 6);
    ceiling.add(rounded(0.15, 0.2, ROOM.d, x, h - 0.1, 0, "timber", `Beam_${i}`, 0.018));
  }
  root.add(ceiling);

  /* --- the back wall: the altar ------------------------------------------- */
  const p = ROOM.plinth;
  root.add(rounded(ROOM.w, p.h, p.d, 0, p.h / 2, -HZ + p.d / 2, "stone", "Plinth", 0.02));

  // the red field — a raised, re-plastered panel, as the gallery hung her
  const f = ROOM.field;
  root.add(rounded(f.w, f.h, 0.024, 0, p.h + f.h / 2, -HZ + 0.012, "field", "HeroField", 0.008));

  // the niche: stone floor, sandstone surround cut with राम
  root.add(rounded(n.w, 0.02, n.depth, n.x, n.sill + 0.01, -HZ - n.depth / 2, "stone", "NicheFloor", 0.006));
  const jambH = n.h + 0.0;
  for (const [i, x] of [nx0 - 0.055, nx1 + 0.055].entries()) {
    const j = new THREE.Mesh(rbox(0.11, jambH, 0.04, 0.008));
    j.position.set(x, n.sill + jambH / 2, -HZ + 0.02);
    j.name = `RamJamb_${i}`;
    root.add(tag(j, "ram", { kind: "keep" }));
  }
  root.add(rounded(n.w + 0.22 + 0.04, 0.12, 0.05, n.x, n.sill + n.h + 0.06, -HZ + 0.025, "sandstone", "RamLintel", 0.01));
  root.add(rounded(n.w + 0.3, 0.07, 0.1, n.x, n.sill - 0.035, -HZ + 0.05, "sandstone", "RamSill", 0.01));

  /* --- the right wall: window, deep reveal, grille, chajja ---------------- */
  root.add(rounded(t + 0.1, 0.06, wdw.w + 0.12, HX + t / 2 - 0.05, wdw.sill - 0.03, wdw.z, "stone", "WindowSill", 0.01));
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, wdw.h, 12));
    bar.position.set(HX + t - 0.1, wdw.sill + wdw.h / 2, wz0 + (wdw.w / 6) * (i + 1));
    bar.name = `Grille_v${i}`;
    root.add(tag(bar, "iron", { kind: "metric", su: 0.075, sv: wdw.h }));
  }
  for (let i = 0; i < 2; i++) {
    root.add(rounded(0.014, 0.034, wdw.w, HX + t - 0.1, wdw.sill + (wdw.h / 3) * (i + 1), wdw.z, "iron", `Grille_h${i}`, 0.004));
  }
  root.add(rounded(0.72, 0.08, wdw.w + 1.1, HX + t + 0.34, wdw.sill + wdw.h + 0.22, wdw.z, "stone", "Chajja", 0.015));

  /* --- the left wall: the door -------------------------------------------- */
  // chaukhat — the timber frame, proud of the plaster
  for (const z of [dz0 - 0.06, dz1 + 0.06])
    root.add(rounded(0.13, d.h + 0.12, 0.12, -HX + 0.0, (d.h + 0.12) / 2, z, "timber", "DoorJamb", 0.012));
  root.add(rounded(0.13, 0.12, d.w + 0.24, -HX + 0.0, d.h + 0.06, d.z, "timber", "DoorLintel", 0.012));
  // dehleez — the stone threshold you step over
  root.add(rounded(t + 0.14, 0.05, d.w, -HX - t / 2, 0.025, d.z, "stone", "Threshold", 0.01));

  /* the leaf, hinged at its back edge and swung into the room. Bandh
     Darwaze: planks under turquoise flaking to brown, an iron hasp, a
     padlock hanging open on its staple, a ring pull, domed studs. */
  const door = new THREE.Group();
  door.name = "Door";
  const leafW = d.w - 0.02, leafH = d.h - 0.02, leafT = 0.055;
  const leaf = new THREE.Mesh(rbox(leafT, leafH, leafW, 0.008));
  leaf.position.set(leafT / 2, leafH / 2 + 0.01, leafW / 2);
  leaf.name = "DoorLeaf";
  door.add(tag(leaf, "door", { kind: "world" }));
  const face = leafT;                                   // the room face, in leaf space

  // two strap hinges with their nail heads
  for (const y of [0.32, leafH - 0.3]) {
    door.add(rounded(0.008, 0.05, 0.78, face + 0.004, y, 0.4, "iron", "Strap", 0.003));
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2));
      s.rotation.z = -Math.PI / 2;
      s.position.set(face + 0.008, y, 0.12 + k * 0.2);
      door.add(tag(s, "iron", { kind: "metric", su: 0.07, sv: 0.02 }));
    }
  }
  // domed studs in a row — Bandh Darwaze IV
  for (let k = 0; k < 5; k++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2));
    s.rotation.z = -Math.PI / 2;
    s.position.set(face, 1.52, 0.16 + k * 0.19);
    door.add(tag(s, "iron", { kind: "metric", su: 0.1, sv: 0.03 }));
  }
  // the hasp: a hinged strap across the leaf's free edge
  const haspY = 1.06, haspZ = 0.84;
  door.add(rounded(0.012, 0.052, 0.3, face + 0.006, haspY, haspZ, "iron", "Hasp", 0.005));
  const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 14));
  knuckle.position.set(face + 0.011, haspY, haspZ - 0.15);
  door.add(tag(knuckle, "iron", { kind: "metric", su: 0.07, sv: 0.07 }));
  // the staple: a loop standing out of the leaf through the hasp's slot
  const stapleZ = haspZ + 0.11;
  const staple = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0045, 10, 20, Math.PI));
  staple.rotation.set(0, 0, -Math.PI / 2);
  staple.position.set(face, haspY, stapleZ);
  door.add(tag(staple, "iron", { kind: "metric", su: 0.03, sv: 0.11 }));

  /* the padlock, hanging open on it — the whole subject of Bandh Darwaze II.
     An Aligarh lock: a brass body, an iron shackle sprung up and swung off
     its short leg, the long leg threaded through the staple. */
  const lock = new THREE.Group();
  lock.name = "Padlock";
  const body = new THREE.Mesh(rbox(0.032, 0.088, 0.074, 0.011, 3));
  body.position.set(0, -0.044, 0);
  lock.add(tag(body, "brass", { kind: "world" }));
  const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12));
  keyhole.rotation.z = Math.PI / 2;
  keyhole.position.set(0.0165, -0.06, 0);
  lock.add(tag(keyhole, "ironDark", { kind: "metric", su: 0.04, sv: 0.004 }));
  // the long leg stays in the body; everything else pivots about it
  const longLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.04, 10));
  longLeg.position.set(0, 0.006, -0.025);
  lock.add(tag(longLeg, "iron", { kind: "metric", su: 0.035, sv: 0.04 }));
  const swing = new THREE.Group();
  swing.position.set(0, 0, -0.025);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.0055, 12, 28, Math.PI));
  arc.rotation.y = Math.PI / 2;
  arc.position.set(0, 0.026, 0.025);
  swing.add(tag(arc, "iron", { kind: "metric", su: 0.035, sv: 0.08 }));
  const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.014, 10));
  shortLeg.position.set(0, 0.019, 0.05);
  swing.add(tag(shortLeg, "iron", { kind: "metric", su: 0.035, sv: 0.014 }));
  swing.rotation.y = 0.85;
  lock.add(swing);
  // hanging from the staple, swung a little off the leaf as it fell open
  lock.position.set(face + 0.013, haspY - 0.05, stapleZ + 0.025);
  lock.rotation.set(0, 0, 0.3);
  door.add(lock);
  // the ring pull on its boss
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.014, 18));
  boss.rotation.z = Math.PI / 2;
  boss.position.set(face + 0.007, 1.03, 0.6);
  door.add(tag(boss, "iron", { kind: "metric", su: 0.13, sv: 0.014 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0075, 12, 40));
  ring.rotation.set(0.12, Math.PI / 2, 0);
  ring.position.set(face + 0.018, 0.985, 0.6);
  door.add(tag(ring, "iron", { kind: "metric", su: 0.33, sv: 0.05 }));

  door.position.set(-HX + 0.01, 0, dz0 + 0.01);
  door.rotation.y = d.open;
  root.add(door);

  // the carved jamb beside the door — the interlace pilaster in Bandh Darwaze IV,
  // here as a run of small carved rosettes on the frame
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 8, 20));
    r.rotation.y = Math.PI / 2;
    r.position.set(-HX + 0.07, 0.3 + i * 0.22, dz1 + 0.06);
    root.add(tag(r, "timber", { kind: "metric", su: 0.17, sv: 0.05 }));
  }

  /* --- the courtyard ------------------------------------------------------
     Low enough walls that the late sun clears them into the doorway. */
  const cw = 0.3, ch = 3.1, cx = -HX - t - 6.0;
  root.add(box(cw, ch, 16, cx, ch / 2, 0.8, "court", "CourtWall"));
  root.add(box(6.0 + t, ch, cw, (cx + (-HX - t)) / 2, ch / 2, -HZ - 1.4, "court", "CourtWallBack"));
  // a coping along the top of the far wall
  root.add(rounded(cw + 0.12, 0.1, 16, cx, ch + 0.05, 0.8, "stone", "CourtCoping", 0.02));
  // a tulsi chaura, the courtyard's own small shrine, in line with the door
  root.add(rounded(0.62, 0.36, 0.62, cx + 1.9, 0.18, d.z + 0.2, "court", "Chaura_0", 0.03));
  root.add(rounded(0.48, 0.42, 0.48, cx + 1.9, 0.36 + 0.21, d.z + 0.2, "court", "Chaura_1", 0.03));

  /* --- anchors -------------------------------------------------------------- */
  root.updateMatrixWorld(true);
  const lockWorld = new THREE.Vector3();
  body.getWorldPosition(lockWorld);
  const leafNormal = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), d.open);
  const anchors: Anchors = {
    lock: lockWorld,
    leafNormal,
    diya: new THREE.Vector3(n.x, n.sill + 0.022, -HZ - n.depth * 0.42),
    windowCentre: new THREE.Vector3(HX + t / 2, wdw.sill + wdw.h / 2, wdw.z),
  };

  return { root, ceiling, anchors };
}

/**
 * The canopy over the courtyard. It is never seen — it exists only in the
 * door light's shadow map, so what reaches the doorway and the floor inside
 * is dappled. Under Canopy of Greens, as light rather than as leaves.
 */
export function buildCanopy() {
  let s = 41;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.IcosahedronGeometry(0.34, 1);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), k3 = new THREE.Vector3();
  // placed where the door light's rays to the doorway pass, 3.4–5.2 m up
  for (let i = 0; i < 52; i++) {
    const k = 0.55 + rnd() * 0.9;
    p.set(-HX - 3.0 - rnd() * 3.4, 3.4 + rnd() * 1.8, 0.2 + rnd() * 3.6);
    k3.set(k * (1 + rnd() * 0.6), k * 0.6, k * (1 + rnd() * 0.6));
    parts.push(base.clone().applyMatrix4(m4.compose(p, q, k3)));
  }
  base.dispose();
  const geo = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  /* three tests shadow casters against the viewing camera's layers, so the
     canopy stays on layer 0 and is hidden from colour instead: it writes
     neither colour nor depth, and exists only in the shadow maps */
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  mesh.name = "Canopy";
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.userData.noAO = true;
  return mesh;
}

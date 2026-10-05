import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { tag } from "./shell";
import { ROOM } from "./shell";

/**
 * Her subjects, as objects.
 *
 * David Lee's room is furnished with studio furniture. Hers is furnished
 * with the things that came to her to be painted, and each sits under or
 * beside the canvas it came from: the matkas below the shrine (Terracotta),
 * the churns along the wall of recent work (The Doodhwala), the coal stove
 * and kettle on the plinth (The Chai Boy), the coins at the foot of Twenty
 * Paise, the cart wheel leaning by the door (The Bullocks), the pillar box
 * in the corner (Patra Petika), the stacked woks by the door (The Kadhai
 * Seller), a hank of sacred thread and a brass bell by the lamp (Threads of
 * Faith).
 *
 * "They come to me / … / Then sit quietly / In front of me."
 *
 * Lathe profiles because that is what most of these things are: thrown pots
 * and spun metal. The profile is the drawing.
 */

export type Spawn = {
  name: string;
  group: THREE.Group;
  mass: number;
  /** rest height of the group origin (0 on the floor, the plinth top on it) */
  restY: number;
};

const V2 = (x: number, y: number) => new THREE.Vector2(x, y);

function profileLength(pts: THREE.Vector2[]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += pts[i].distanceTo(pts[i - 1]);
  return l;
}

/** a turned or thrown form, with UVs in metres */
function lathe(pts: THREE.Vector2[], seg = 64) {
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  const rMax = Math.max(...pts.map((p) => p.x));
  return { geo: g, su: Math.PI * 2 * rMax, sv: profileLength(pts) };
}

function turned(pts: THREE.Vector2[], role: Parameters<typeof tag>[1], seg = 64) {
  const { geo, su, sv } = lathe(pts, seg);
  return tag(new THREE.Mesh(geo), role, { kind: "metric", su, sv });
}

/* --- Terracotta (2015) — unglazed earthenware -------------------------------- */
function matka(scale = 1) {
  const p = [
    V2(0.001, 0), V2(0.07, 0.0), V2(0.13, 0.02), V2(0.19, 0.075), V2(0.228, 0.15),
    V2(0.24, 0.23), V2(0.228, 0.305), V2(0.19, 0.37), V2(0.142, 0.41),
    V2(0.112, 0.432), V2(0.106, 0.447), V2(0.122, 0.462), V2(0.124, 0.474),
    V2(0.112, 0.478), V2(0.098, 0.462), V2(0.094, 0.44),
  ];
  const g = new THREE.Group();
  const m = turned(p.map((v) => v.clone().multiplyScalar(scale)), "clay");
  g.add(m);
  return g;
}

/** a heap, one tipped over with its mouth to us — "three interiors open".
 *  Each pot is its own body, so the heap can come apart when the room is
 *  shaken. [x, z, scale, yaw] relative to the heap. */
const PILE: [number, number, number, number][] = [
  [0, 0, 1.0, 0], [0.5, 0.1, 0.84, 1.1], [-0.08, 0.5, 0.76, 2.2], [0.42, 0.6, 0.66, 0.6],
];

/* --- The Doodhwala — dented aluminium churns --------------------------------- */
export function churn(scale = 1) {
  const p = [
    V2(0.001, 0), V2(0.128, 0), V2(0.142, 0.012), V2(0.146, 0.04), V2(0.146, 0.33),
    V2(0.14, 0.38), V2(0.104, 0.44), V2(0.088, 0.49), V2(0.09, 0.505),
    V2(0.106, 0.515), V2(0.108, 0.535), V2(0.096, 0.548), V2(0.05, 0.562), V2(0.001, 0.566),
  ];
  const g = new THREE.Group();
  g.add(turned(p, "aluminium"));
  // a reinforcing band — churns are hooped
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.147, 0.006, 8, 64));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.2;
  g.add(tag(band, "aluminium", { kind: "metric", su: 0.92, sv: 0.04 }));
  // two side handles
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0065, 8, 20, Math.PI));
    h.rotation.set(0, s > 0 ? 0 : Math.PI, Math.PI / 2);
    h.position.set(s * 0.15, 0.36, 0);
    g.add(tag(h, "aluminium", { kind: "metric", su: 0.1, sv: 0.04 }));
  }
  g.scale.setScalar(scale);
  return g;
}

/* --- The Chai Boy — a kettle on a coal angithi ------------------------------- */
export function kettleOnStove() {
  const g = new THREE.Group();
  // the angithi: an iron bucket stove with a clay-lined mouth
  const stove = [
    V2(0.001, 0), V2(0.12, 0), V2(0.13, 0.012), V2(0.142, 0.2), V2(0.15, 0.215),
    V2(0.145, 0.222), V2(0.118, 0.222), V2(0.11, 0.2),
  ];
  g.add(turned(stove, "ironDark", 48));
  const coal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 32));
  coal.position.y = 0.196;
  g.add(tag(coal, "ironDark", { kind: "metric", su: 0.7, sv: 0.1 }));
  // three iron prongs the kettle sits on
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const prong = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.04, 0.05, 2, 0.006));
    prong.position.set(Math.cos(a) * 0.12, 0.236, Math.sin(a) * 0.12);
    prong.rotation.y = -a;
    g.add(tag(prong, "ironDark"));
  }
  const kp = [
    V2(0.001, 0), V2(0.1, 0), V2(0.114, 0.014), V2(0.12, 0.1), V2(0.108, 0.165),
    V2(0.078, 0.2), V2(0.07, 0.214), V2(0.084, 0.222), V2(0.08, 0.236),
    V2(0.04, 0.246), V2(0.001, 0.248),
  ];
  const kettle = new THREE.Group();
  kettle.add(turned(kp, "aluminium"));
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.024, 0.16, 16));
  spout.position.set(0.13, 0.12, 0);
  spout.rotation.z = -0.95;
  kettle.add(tag(spout, "aluminium", { kind: "metric", su: 0.12, sv: 0.16 }));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.007, 8, 28, Math.PI));
  handle.position.set(0, 0.235, 0);
  handle.rotation.y = Math.PI / 2;
  kettle.add(tag(handle, "aluminium", { kind: "metric", su: 0.23, sv: 0.04 }));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 10));
  knob.position.y = 0.255;
  kettle.add(tag(knob, "aluminium", { kind: "metric", su: 0.1, sv: 0.05 }));
  kettle.position.y = 0.258;
  kettle.rotation.y = 0.6;
  g.add(kettle);
  return g;
}

/* --- her recurring object: a brass bell, held and never rung ---------------- */
export function bell(scale = 1) {
  const p = [
    V2(0.001, 0.006), V2(0.058, 0.004), V2(0.066, 0.0), V2(0.068, 0.012), V2(0.06, 0.04),
    V2(0.046, 0.08), V2(0.032, 0.108), V2(0.022, 0.126), V2(0.018, 0.142),
    V2(0.024, 0.15), V2(0.001, 0.156),
  ];
  const g = new THREE.Group();
  g.add(turned(p.map((v) => v.clone().multiplyScalar(scale)), "brass", 48));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016 * scale, 0.004 * scale, 8, 20));
  ring.position.y = 0.168 * scale;
  g.add(tag(ring, "brass", { kind: "metric", su: 0.1, sv: 0.03 }));
  return g;
}

/* --- The Bullocks — a cart wheel, timber felloes in an iron tyre ------------ */
export function cartWheel(r = 0.44) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 12, 72));
  g.add(tag(tyre, "iron", { kind: "metric", su: 2 * Math.PI * r, sv: 0.14 }));
  const felloe = new THREE.Mesh(new THREE.TorusGeometry(r - 0.045, 0.034, 10, 72));
  felloe.scale.z = 1.25;
  g.add(tag(felloe, "timber", { kind: "metric", su: 2 * Math.PI * r, sv: 0.2 }));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.16, 24));
  hub.rotation.x = Math.PI / 2;
  g.add(tag(hub, "timber", { kind: "metric", su: 0.5, sv: 0.16 }));
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16));
  axle.rotation.x = Math.PI / 2;
  g.add(tag(axle, "ironDark", { kind: "metric", su: 0.2, sv: 0.2 }));
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.019, r - 0.1, 10));
    const a = (i / 12) * Math.PI * 2;
    s.position.set(Math.cos(a) * (r / 2 + 0.01), Math.sin(a) * (r / 2 + 0.01), 0);
    s.rotation.z = a - Math.PI / 2;
    g.add(tag(s, "timber", { kind: "metric", su: 0.1, sv: r }));
  }
  return g;
}

/* --- Patra Petika — the pillar letter box, पिन कोड 110001 ----------------------- */
export function postbox() {
  const g = new THREE.Group();
  const p = [
    V2(0.001, 0), V2(0.27, 0), V2(0.27, 0.05), V2(0.24, 0.07), V2(0.225, 0.09),
    V2(0.218, 0.92), V2(0.232, 0.94), V2(0.235, 0.97), V2(0.22, 0.985),
    V2(0.205, 1.04), V2(0.17, 1.09), V2(0.11, 1.125), V2(0.04, 1.14), V2(0.001, 1.142),
  ];
  g.add(turned(p, "postbox", 64));
  // the slot, with its hood
  const hood = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.035, 0.24, 2, 0.008));
  hood.position.set(0.222, 0.86, 0);
  g.add(tag(hood, "postbox"));
  const slot = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.016, 0.2, 2, 0.004));
  slot.position.set(0.222, 0.83, 0);
  g.add(tag(slot, "ironDark"));
  // the collection door with its padlock
  const doorPlate = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.22, 0.16, 2, 0.008));
  doorPlate.position.set(0.214, 0.38, 0);
  g.add(tag(doorPlate, "postbox"));
  return g;
}

/* --- a short stack of withdrawn coins — The Matka and the Coins ------------- */
export function coinStack() {
  const g = new THREE.Group();
  let s = 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
  for (let i = 0; i < 11; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.0042, 40));
    c.position.set(rnd() * 0.006, 0.0021 + i * 0.0042, rnd() * 0.006);
    g.add(tag(c, "aluminium", { kind: "metric", su: 0.15, sv: 0.03 }));
  }
  // and two spilled beside it
  for (const [x, z] of [[0.06, 0.02], [0.03, 0.06]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.0042, 40));
    c.position.set(x, 0.0021, z);
    g.add(tag(c, "aluminium", { kind: "metric", su: 0.15, sv: 0.03 }));
  }
  return g;
}

/* --- a wound hank of sacred thread — Threads of Faith (2024) ---------------- */
export function threadHank() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 10, 40));
    t.rotation.set(Math.PI / 2 + (i % 2 ? 0.06 : -0.05), 0, i * 0.4);
    t.position.y = 0.016 + 0.017 * i;
    t.scale.set(1, 1, 0.8);
    g.add(tag(t, "thread", { kind: "metric", su: 0.47, sv: 0.1 }));
  }
  return g;
}

/* --- The Kadhai Seller — blackened iron woks, stacked, ring handles out ---- */
export function kadhaiStack() {
  const g = new THREE.Group();
  const p = [
    V2(0.001, 0), V2(0.09, 0.008), V2(0.17, 0.038), V2(0.235, 0.085), V2(0.272, 0.13),
    V2(0.284, 0.15), V2(0.276, 0.154), V2(0.262, 0.135), V2(0.226, 0.093),
    V2(0.162, 0.05), V2(0.085, 0.022), V2(0.001, 0.014),
  ];
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
  for (let i = 0; i < 6; i++) {
    const k = new THREE.Group();
    k.add(turned(p, "ironDark", 48));
    for (const sgn of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.0075, 8, 20));
      h.position.set(sgn * 0.3, 0.14, 0);
      h.rotation.set(0, Math.PI / 2, 0);
      k.add(tag(h, "ironDark", { kind: "metric", su: 0.24, sv: 0.05 }));
    }
    k.position.set(rnd() * 0.05, 0.034 * i, rnd() * 0.05);
    k.rotation.y = rnd() * 1.2;
    g.add(k);
  }
  return g;
}

/**
 * Everything that drops in and settles when the room assembles. Placement is
 * composition, not scatter: each group sits with its painting.
 */
export function buildSitters(): Spawn[] {
  const out: Spawn[] = [];
  const HX = ROOM.w / 2, HZ = ROOM.d / 2, plinthTop = ROOM.plinth.h;
  const put = (name: string, group: THREE.Group, x: number, y: number, z: number, ry = 0, mass = 1, rot?: THREE.Euler) => {
    group.position.set(x, y, z);
    if (rot) group.rotation.copy(rot);
    else group.rotation.y = ry;
    group.name = name;
    out.push({ name, group, mass, restY: y });
  };

  // below the shrine: the pile of matkas — Terracotta
  const px = -2.66, pz = -1.8;
  PILE.forEach(([x, z, s, ry], i) => put(`Matka_${i}`, matka(s), px + x, 0, pz + z, ry, 1.5 * s));
  // the tipped one, lying on its belly with its mouth toward the room
  const r = 0.72 * 0.24;
  // yaw 1.99 turns its mouth toward the open side, where the camera stands
  put("Matka_tipped", matka(0.72), px + 0.92, r, pz + 0.42, 0, 1,
      new THREE.Euler(0, 1.99, Math.PI / 2, "YXZ"));
  // on the plinth beside the lamp: the thread and the bell
  put("Thread", threadHank(), -1.55, plinthTop, -2.38, 0.3, 0.4);
  put("Bell", bell(1.15), -1.3, plinthTop, -2.42, 0.6, 0.4);
  // at the foot of Twenty Paise, the coins
  put("Coins", coinStack(), 0.3, plinthTop, -2.4, 0, 0.3);
  // the plinth's right end: the chai stove and kettle
  put("Stove", kettleOnStove(), 1.22, plinthTop, -2.4, 0.4, 3);
  // along the wall of recent work: the churns
  put("Churn_1", churn(1.0), HX - 0.42, 0, 1.0, 0.3, 2);
  put("Churn_2", churn(0.92), HX - 0.32, 0, 1.38, 1.9, 2);
  put("Churn_3", churn(0.96), HX - 0.68, 0, 1.24, 0.9, 2);
  // the far corner: the letter box
  put("Postbox", postbox(), HX - 0.42, 0, HZ - 0.4, -1.9, 8);
  // by the door: the woks, and the wheel leaning on the wall
  put("Kadhai", kadhaiStack(), -2.45, 0, 2.15, 0.4, 4);
  // leaning back against the plaster, its top 10 cm off the vertical
  const lean = 0.12;
  put("Wheel", cartWheel(), -HX + 0.13, 0.44 * Math.cos(lean), 0.0, 0, 4,
      new THREE.Euler(0, Math.PI / 2, lean, "ZYX"));
  return out;
}

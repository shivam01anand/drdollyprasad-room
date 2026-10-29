#!/usr/bin/env node
/**
 * Art direction V3 (29 Oct 2026), "paintings first": the studio's stops and their cameras, computed
 * from the house's own hang (public/house/house.json `art`: each canvas's centre, size and wall),
 * never framed by hand.
 *
 *   node scripts/house/stop-cams.mjs          (writes lib/studio-stops.json and the s:/n:s: cams)
 *   node scripts/house/stop-cams.mjs --check  (prints the fill table only)
 *
 * Re-run after scripts/house/build.py (it rewrites house.json without these cams).
 *
 * Every stop looks square at its painting (or group) along the wall's normal: target = the
 * group's centre, eye = centre + normal * d. Each cam carries `span` [w, h]: the metres of wall,
 * at the target, that must fit the visible band (the screen less header and dock). The site turns
 * span into a lens for the real screen (lib/room/framing.ts), so a painting fills the same share of
 * any phone. If d would leave the room (plan bound less 0.55 m), the camera stays at the bound and
 * the lens widens instead.
 *
 * Fill rules (ux/ART_DIRECTION_V3.md §1):
 *   phone single: the frame is 72 % of the screen's width, unless its height would pass 70 % of the
 *                 band (then 70 % of the band's height); the opening leaves room for the card.
 *   phone pair (the small panels, top over bottom): 86 % of the band's height.
 *   desktop group of <= 3 (or a whole small hang): 70 % of the width, unless taller than 72 % of
 *                 the band (room for the wall plaques below; 80 % for a two-row hang of 5 or 6).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HOUSE = path.join(ROOT, "public/house/house.json");
const HANG = path.join(ROOT, "lib/studio-hang.json");
const OUT = path.join(ROOT, "lib/studio-stops.json");
const check = process.argv.includes("--check");

const house = JSON.parse(fs.readFileSync(HOUSE, "utf8"));
const hang = JSON.parse(fs.readFileSync(HANG, "utf8"));
const FRAME = 0.025;
const NORMALS = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const deg = (r) => (r * 180) / Math.PI;

/** reference screens; the bands are what the site lays out (components/Studio.tsx bandFor) */
export const LAYOUTS = {
  phone: { W: 390, H: 844, vfovBand: 52, band: { t: 56, b: 166, l: 0, r: 0 }, open: { t: 56, b: 336, l: 0, r: 0 } },
  desk: { W: 1440, H: 900, vfov: 40, band: { t: 70, b: 100, l: 0, r: 0 }, open: { t: 70, b: 100, l: 460, r: 40 } },
};

/** which plan space a canvas hangs in (Blender floor axes: x, y = -z) */
function spaceOf(c) {
  for (const [k, b] of Object.entries(house.plan)) {
    if (!Array.isArray(b)) continue;
    const x = c[0], y = -c[2];
    if (x > b[0] - 0.12 && x < b[1] + 0.12 && y > b[2] - 0.12 && y < b[3] + 0.12) return k;
  }
  return null;
}

/** the frames of a group: their box on the wall, its centre, the wall's normal */
function groupBox(ids) {
  const arts = ids.map((id) => {
    const a = house.art[id];
    if (!a) throw new Error(`no canvas ${id} in house.json`);
    return a;
  });
  const side = arts[0].side;
  if (arts.some((a) => a.side !== side)) throw new Error(`group ${ids} spans two walls`);
  const [nx, nz] = NORMALS[side];
  // along the wall, the viewer's right is (nz, 0, -nx)
  const u = (c) => c[0] * nz - c[2] * nx;
  let u0 = Infinity, u1 = -Infinity, y0 = Infinity, y1 = -Infinity, plane = 0;
  for (const a of arts) {
    const cu = u(a.centre);
    u0 = Math.min(u0, cu - a.w / 2 - FRAME); u1 = Math.max(u1, cu + a.w / 2 + FRAME);
    y0 = Math.min(y0, a.centre[1] - a.h / 2 - FRAME); y1 = Math.max(y1, a.centre[1] + a.h / 2 + FRAME);
    plane += side === "N" || side === "S" ? a.centre[2] : a.centre[0];
  }
  plane /= arts.length;
  const cu = (u0 + u1) / 2, cy = (y0 + y1) / 2;
  // back from (u, plane) to x, z
  const centre = side === "N" || side === "S" ? [cu * nz, cy, plane] : [plane, cy, -cu * nx];
  return { w: u1 - u0, h: y1 - y0, centre, normal: [nx, nz], side, space: spaceOf(arts[0].centre) };
}

/** how far back the eye may stand along the normal before it leaves its room */
function maxDistance(g) {
  const b = house.plan[g.space];
  if (!Array.isArray(b)) return 6;
  const lim = [[b[0] + 0.55, b[1] - 0.55], [-b[3] + 0.55, -b[2] - 0.55]];
  let far = Infinity;
  const away = [g.normal[0], g.normal[1]];
  const c = [g.centre[0], g.centre[2]];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(away[i]) < 1e-6) continue;
    const edge = lim[i][away[i] > 0 ? 1 : 0];
    far = Math.min(far, (edge - c[i]) / away[i]);
  }
  return far;
}

/**
 * A camera for a group on a layout. `fit` says what share of the band the group may fill:
 * { w: share of the band's width, h: share of the band's height }.
 */
function frame(ids, layout, band, fit) {
  const g = groupBox(ids);
  const bw = layout.W - band.l - band.r, bh = layout.H - band.t - band.b;
  // visible metres across the band: the group at fit.w of its width, unless that makes it too tall
  let Wf = g.w / fit.w, Hf = (Wf * bh) / bw;
  if (g.h / Hf > fit.h) { Hf = g.h / fit.h; Wf = (Hf * bw) / bh; }
  // the band's own vertical lens: phone 52° over the band; desktop 40° over the whole screen
  const tanBand = layout.vfovBand ? Math.tan((layout.vfovBand * Math.PI) / 360)
    : (Math.tan((layout.vfov * Math.PI) / 360) * bh) / layout.H;
  let d = Hf / 2 / tanBand;
  const far = maxDistance(g);
  const clamped = d > far;
  if (clamped) d = far;
  // a standing viewer, a little below the centre of what they look at; square on when close
  const eyeY = Math.max(1.35, Math.min(g.centre[1], g.centre[1] - 0.05 * d));
  const eye = [g.centre[0] + g.normal[0] * d, eyeY, g.centre[2] + g.normal[1] * d];
  const fov = 2 * Math.atan(((Hf / 2) * (layout.H / bh)) / d);
  const r = (v) => Math.round(v * 1e4) / 1e4;
  return {
    cam: { eye: eye.map(r), target: g.centre.map(r), fov: r(deg(fov)), span: [r(Wf), r(Hf)] },
    fill: { group: g.w / Wf * (bw / layout.W), each: ids.map((id) => (house.art[id].w + 2 * FRAME) / Wf * (bw / layout.W)), d, clamped },
  };
}

const stops = { phone: [], desk: [] };
const rows = [];
for (const { wall, desk, phone } of hang.walls) {
  for (const kind of ["phone", "desk"]) {
    const L = LAYOUTS[kind];
    if (wall === "desk") { stops[kind].push({ id: "desk", wall, works: [], cam: kind === "phone" ? "n:easel" : "easel" }); continue; }
    const groups = kind === "phone" ? (phone ?? desk.flat().map((id) => [id])) : desk;
    groups.forEach((ids, k) => {
      const open = wall === "presence";
      const id = open ? "presence" : kind === "phone" ? `p:${ids.join("+")}` : `d:${wall}:${k + 1}`;
      const band = open ? L.open : L.band;
      const fit = kind === "phone"
        ? (ids.length > 1 ? { w: 0.9, h: 0.86 } : open ? { w: 0.72, h: 0.62 } : { w: 0.72, h: 0.7 })
        : (open ? { w: 0.8, h: 0.7 } : { w: 0.7, h: ids.length >= 5 ? 0.8 : 0.72 });
      const { cam, fill } = frame(ids, L, band, fit);
      const key = `${kind === "phone" ? "n:" : ""}s:${id}`;
      house.cams[key] = cam;
      stops[kind].push({ id, wall, works: ids, cam: key });
      rows.push({ kind, id, group: fill.group, each: fill.each, d: fill.d, clamped: fill.clamped });
    });
  }
}

// whole-wall establishing views (review mocks and the Rooms overview): every work on one wall
for (const { wall, desk } of hang.walls) {
  const ids = desk.flat();
  if (ids.length < 2 || new Set(ids.map((id) => house.art[id].side)).size > 1) continue;
  for (const kind of ["phone", "desk"]) {
    const L = LAYOUTS[kind];
    const { cam, fill } = frame(ids, L, L.band, kind === "phone" ? { w: 0.9, h: 0.8 } : { w: 0.8, h: 0.8 });
    house.cams[`${kind === "phone" ? "n:" : ""}w:${wall}`] = cam;
    rows.push({ kind, id: `w:${wall}`, group: fill.group, each: fill.each, d: fill.d, clamped: fill.clamped });
  }
}

for (const kind of ["phone", "desk"]) {
  const list = rows.filter((r) => r.kind === kind);
  console.log(`\n${kind}: ${stops[kind].length} stops`);
  for (const r of list) {
    console.log(`${r.id.padEnd(58)} group ${(r.group * 100).toFixed(0).padStart(3)}%  each ${r.each.map((e) => (e * 100).toFixed(0)).join("/").padEnd(16)} d ${r.d.toFixed(2)}${r.clamped ? "  (at the room's bound: lens widened)" : ""}`);
  }
}

if (!check) {
  fs.writeFileSync(HOUSE, JSON.stringify(house, null, 1));
  fs.writeFileSync(OUT, JSON.stringify({
    _: "Generated by scripts/house/stop-cams.mjs from lib/studio-hang.json and public/house/house.json. Do not edit by hand.",
    ...stops,
  }, null, 1) + "\n");
  console.log(`\nwrote ${path.relative(ROOT, OUT)} and ${Object.keys(house.cams).filter((k) => /^(n:)?s:/.test(k)).length} cams in ${path.relative(ROOT, HOUSE)}`);
}

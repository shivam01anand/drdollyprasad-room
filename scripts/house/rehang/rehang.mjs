// Re-hang paintings inside house.glb: moves Art_<id> canvases and their frames (inside Static_artFrame),
// optionally resizing to true size (stretching so frame lips keep their thickness).
// usage: node rehang.mjs <in.glb> <house.json> <moves.json> <out.glb> <out.json> <holes.json>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';

const [inGlb, inJson, movesPath, outGlb, outJson, holesPath] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(inGlb);
const info = JSON.parse(fs.readFileSync(inJson, 'utf8'));
const moves = JSON.parse(fs.readFileSync(movesPath, 'utf8'));

const NRM = { N: [0, 0, 1], S: [0, 0, -1], E: [-1, 0, 0], W: [1, 0, 0] };
const right = (n) => [n[2], 0, -n[0]];          // up × n
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nodes = new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n]));

// frames: Static_artFrame's single primitive; split vertex ownership by old frame boxes
const frameNode = nodes.get('Static_artFrame');
const framePrim = frameNode.getMesh().listPrimitives()[0];
const fPos = framePrim.getAttribute('POSITION'), fNrm = framePrim.getAttribute('NORMAL');
const owned = new Int32Array(fPos.getCount()).fill(-1);

const ids = Object.keys(moves);
const holes = [];
ids.forEach((id, k) => {
  const a = info.art[id];
  const n = NRM[a.side], r = right(n);
  const hw = a.w / 2 + 0.035, hh = a.h / 2 + 0.035;
  let cnt = 0;
  for (let i = 0; i < fPos.getCount(); i++) {
    const p = fPos.getElement(i, []);
    const d = [p[0] - a.centre[0], p[1] - a.centre[1], p[2] - a.centre[2]];
    if (Math.abs(dot(d, r)) <= hw && Math.abs(d[1]) <= hh && Math.abs(dot(d, n)) <= 0.07) {
      if (owned[i] >= 0) throw new Error(`frame vertex ${i} claimed by ${ids[owned[i]]} and ${id}`);
      owned[i] = k; cnt++;
    }
  }
  if (!cnt) throw new Error(`no frame found for ${id}`);
  console.log(id, 'frame verts', cnt);
});

function makeXf(id) {
  const a = info.art[id], m = moves[id];
  const n0 = NRM[a.side], r0 = right(n0);
  const side = m.side ?? a.side;
  const n1 = NRM[side], r1 = right(n1);
  const c1 = m.centre ?? a.centre;
  const w1 = m.w ?? a.w, h1 = m.h ?? a.h;
  const dw = (w1 - a.w) / 2, dh = (h1 - a.h) / 2;
  const pt = (p) => {
    const d = [p[0] - a.centre[0], p[1] - a.centre[1], p[2] - a.centre[2]];
    let u = dot(d, r0), v = d[1]; const s = dot(d, n0);
    if (Math.abs(u) > 1e-4) u += Math.sign(u) * dw;
    if (Math.abs(v) > 1e-4) v += Math.sign(v) * dh;
    return [c1[0] + u * r1[0] + s * n1[0], c1[1] + v, c1[2] + u * r1[2] + s * n1[2]];
  };
  const vec = (q) => {
    const u = dot(q, r0), v = q[1], s = dot(q, n0);
    return [u * r1[0] + s * n1[0], v, u * r1[2] + s * n1[2]];
  };
  return { pt, vec, side, c1, w1, h1, old: { ...a } };
}

const xfs = ids.map(makeXf);
// canvases
ids.forEach((id, k) => {
  const node = nodes.get(`Art_${id}`);
  const xf = xfs[k];
  for (const prim of node.getMesh().listPrimitives()) {
    const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL');
    // accessors must not be shared with anything else
    for (let i = 0; i < P.getCount(); i++) {
      P.setElement(i, xf.pt(P.getElement(i, [])));
      if (N) N.setElement(i, xf.vec(N.getElement(i, [])));
    }
  }
});
// frames
for (let i = 0; i < fPos.getCount(); i++) {
  const k = owned[i]; if (k < 0) continue;
  fPos.setElement(i, xfs[k].pt(fPos.getElement(i, [])));
  if (fNrm) fNrm.setElement(i, xfs[k].vec(fNrm.getElement(i, [])));
}

// house.json
ids.forEach((id, k) => {
  const xf = xfs[k], a = info.art[id], m = moves[id];
  const old = xf.old;
  const n1 = NRM[xf.side];
  const lightY = m.lightY ?? (old.light ? old.light[1] : 3.38);
  const out = m.lightOut ?? (old.light ? Math.hypot(old.light[0] - old.centre[0], old.light[2] - old.centre[2]) : 0.95);
  info.art[id] = { ...a, w: xf.w1, h: xf.h1, side: xf.side, centre: xf.c1,
    light: [xf.c1[0] + n1[0] * out, lightY, xf.c1[2] + n1[2] * out] };
  if (m.late === false) delete info.art[id].late;
  if (m.late === true) info.art[id].late = true;
  // the wall it left: its outer frame and a margin for the frame's baked contact shadow
  holes.push({ id, side: old.side, centre: old.centre, hw: old.w / 2 + 0.025 + 0.05, hh: old.h / 2 + 0.025 + 0.05 });
});

// the walls behind the holes: triangles of every Static_ mesh lying in the hole's plane
const tris = [];
for (const [name, node] of nodes) {
  if (!name.startsWith('Static_') || name === 'Static_artFrame') continue;
  for (const prim of node.getMesh().listPrimitives()) {
    const P = prim.getAttribute('POSITION'), UV = prim.getAttribute('TEXCOORD_0'), I = prim.getIndices();
    if (!UV) continue;
    const idx = I ? Array.from(I.getArray()) : [...Array(P.getCount()).keys()];
    for (let t = 0; t < idx.length; t += 3) {
      const v = [0, 1, 2].map((j) => P.getElement(idx[t + j], []));
      const uv = [0, 1, 2].map((j) => UV.getElement(idx[t + j], []));
      for (const h of holes) {
        const n = NRM[h.side], r = right(n);
        // the wall face is behind the canvas centre
        const plane = dot(h.centre, n) - (h.id.match(/door/) && h.side === 'N' ? 0.023 : 0.0255);
        if (!v.every((p) => Math.abs(dot(p, n) - plane) < 0.004)) continue;
        const e1 = v[1].map((x, i) => x - v[0][i]), e2 = v[2].map((x, i) => x - v[0][i]);
        const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        if (dot(cr, n) <= 0) continue;            // facing into the room
        const us = v.map((p) => dot(p, r) - dot(h.centre, r)), ys = v.map((p) => p[1] - h.centre[1]);
        const R = 0.6;
        if (Math.max(...us) < -h.hw - R || Math.min(...us) > h.hw + R || Math.max(...ys) < -h.hh - R || Math.min(...ys) > h.hh + R) continue;
        tris.push({ mesh: name, hole: h.id, v, uv });
      }
    }
  }
}
console.log('wall triangles', tris.length);
fs.writeFileSync(holesPath, JSON.stringify({ holes, tris }));
fs.writeFileSync(outJson, JSON.stringify(info, null, 1));
await io.write(outGlb, doc);
console.log('wrote', outGlb);

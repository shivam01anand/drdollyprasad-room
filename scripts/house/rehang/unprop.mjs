// Take props out of house.glb and list the floor triangles under them, for floorpatch.py.
// usage: node unprop.mjs <in.glb> <house.json> <out.glb> <out.json> <floor.json> Prop_a,Prop_b,...
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const [inGlb, inJson, outGlb, outJson, floorPath, list] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(inGlb);
const info = JSON.parse(fs.readFileSync(inJson, 'utf8'));
const names = list.split(',');
const nodes = new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
const holes = [];
for (const nm of names) {
  const n = nodes.get(nm); if (!n) throw new Error('no node ' + nm);
  const b = getBounds(n);
  // its footprint on the floor, and a margin for its baked contact shadow
  holes.push({ id: nm, x0: b.min[0], x1: b.max[0], z0: b.min[2], z1: b.max[2], h: b.max[1] });
  n.traverse((c) => { if (c !== n) c.dispose(); }); n.dispose();
}
info.props = info.props.filter((p) => !names.includes(p));
const R = 0.6, tris = [];
for (const node of doc.getRoot().listNodes()) {
  const name = node.getName(); if (!name.startsWith('Static_') || name === 'Static_court' || !node.getMesh()) continue;
  for (const prim of node.getMesh().listPrimitives()) {
    const P = prim.getAttribute('POSITION'), UV = prim.getAttribute('TEXCOORD_0'), I = prim.getIndices();
    if (!UV) continue;
    const idx = I ? Array.from(I.getArray()) : [...Array(P.getCount()).keys()];
    for (let t = 0; t < idx.length; t += 3) {
      const v = [0, 1, 2].map((j) => P.getElement(idx[t + j], []));
      if (!v.every((p) => Math.abs(p[1]) < 0.02 && Math.abs(p[0]) < 19 && Math.abs(p[2]) < 19)) continue;   // house floors, not the ground outside
      const e1 = v[1].map((x, i) => x - v[0][i]), e2 = v[2].map((x, i) => x - v[0][i]);
      if (e1[2] * e2[0] - e1[0] * e2[2] <= 0) continue;   // facing up
      const uv = [0, 1, 2].map((j) => UV.getElement(idx[t + j], []));
      for (const h of holes) {
        const xs = v.map((p) => p[0]), zs = v.map((p) => p[2]);
        if (Math.max(...xs) < h.x0 - R || Math.min(...xs) > h.x1 + R || Math.max(...zs) < h.z0 - R || Math.min(...zs) > h.z1 + R) continue;
        tris.push({ mesh: name, hole: h.id, v: v.map((p) => [p[0], p[2]]), uv });
      }
    }
  }
}
console.log('floor triangles', tris.length, holes.map((h) => h.id + ' ' + [h.x0, h.x1, h.z0, h.z1].map((x) => x.toFixed(2))).join(' | '));
await doc.transform(prune({ propertyTypes: ['Mesh', 'Primitive', 'Accessor', 'Material', 'Texture'], keepLeaves: true, keepAttributes: true, keepIndices: true, keepSolidTextures: true }));
fs.writeFileSync(floorPath, JSON.stringify({ holes, tris }));
fs.writeFileSync(outJson, JSON.stringify(info, null, 1));
await io.write(outGlb, doc);

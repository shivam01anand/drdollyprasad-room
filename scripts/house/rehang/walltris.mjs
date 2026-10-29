// wall triangles behind props that stood against a wall, for wallpatch.py
// usage: node walltris.mjs <glb> <holes.json in> <out.json>; holes: [{id, side, plane, u0, u1, y1}]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const [glb, hp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule(),'draco3d.encoder': await draco3d.createEncoderModule()});
const doc = await io.read(glb);
const holes = JSON.parse(fs.readFileSync(hp, 'utf8'));
const NRM = { N: [0, 0, 1], S: [0, 0, -1], E: [-1, 0, 0], W: [1, 0, 0] };
const tris = [];
for (const n of doc.getRoot().listNodes()) { const m = n.getMesh(); if (!m || !n.getName().startsWith('Static_')) continue;
  for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION'), UV = p.getAttribute('TEXCOORD_0'), I = p.getIndices(); if (!UV) continue;
    const idx = I ? I.getArray() : [...Array(P.getCount()).keys()];
    for (let t = 0; t < idx.length; t += 3) { const v = [0,1,2].map(j => P.getElement(idx[t+j], [])); const uv = [0,1,2].map(j => UV.getElement(idx[t+j], []));
      for (const h of holes) { const nn = NRM[h.side]; const ai = nn[0] ? 0 : 2, ui = nn[0] ? 2 : 0;
        if (!v.every(q => Math.abs(q[ai] - h.plane) < 0.004)) continue;
        const e1 = v[1].map((x, i) => x - v[0][i]), e2 = v[2].map((x, i) => x - v[0][i]);
        const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
        if (cr[0]*nn[0] + cr[2]*nn[2] <= 0) continue;
        const us = v.map(q => q[ui]), ys = v.map(q => q[1]);
        if (Math.max(...us) < h.u0 - 0.8 || Math.min(...us) > h.u1 + 0.8 || Math.min(...ys) > h.y1 + 0.3) continue;
        tris.push({ hole: h.id, mesh: n.getName(), v: v.map(q => [q[ui], q[1]]), uv }); } } } }
console.log('wall tris', tris.length, [...new Set(tris.map(t => t.hole + ':' + t.mesh))].join(' '));
fs.writeFileSync(out, JSON.stringify({ holes, tris }));

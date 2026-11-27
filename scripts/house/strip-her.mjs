// Takes her painting figure, her easel and the canvas on it out of the published house (no Blender):
//   node scripts/house/strip-her.mjs public/house/house.glb public/house/house.json
// The next Blender rebuild must drop them in build.py too (her_corner), or they come back.
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(new URL("./package.json", import.meta.url));
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRDracoMeshCompression } = req("@gltf-transform/extensions");
const { prune } = req("@gltf-transform/functions");
const draco3d = req("draco3dgltf");
const [glb, json] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(), "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read(glb);
const DROP = /^(Figure_dolly|Deco_easelGroup|Deco_brushes|Deco_palette|Deco_tube\d|Deco_painted_wooden_stool_22|Deco_wooden_stool_01_22|Art_in-progress)/;
let n = 0;
for (const node of doc.getRoot().listNodes()) if (DROP.test(node.getName())) { node.dispose(); n++; }
doc.createExtension(KHRDracoMeshCompression).setRequired(true)
  .setEncoderOptions({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 14 }); // as publish.py
await doc.transform(prune({ keepAttributes: true }));
await io.write(glb, doc);
const info = JSON.parse(fs.readFileSync(json, "utf8"));
delete info.art["in-progress"];
delete info.anchors.easel;
delete info.anchors.dolly;
fs.writeFileSync(json, JSON.stringify(info, null, 1));
console.log("removed", n, "nodes");

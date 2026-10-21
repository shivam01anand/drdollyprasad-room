/* Camera/layout checks using the actual rig and GSAP; no browser or WebGL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const THREE = require('three');
const { gsap } = require('gsap');
const root = path.resolve(__dirname, '..');
const cache = new Map();

function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const abs = path.join(root, file), m = new Module(abs);
  cache.set(file, m);
  m.filename = abs;
  m.paths = Module._nodeModulePaths(path.dirname(abs));
  const nativeRequire = Module.createRequire(abs);
  m.require = (id) => !id.startsWith('.') || id.endsWith('.json')
    ? nativeRequire(id)
    : load(path.relative(root, path.resolve(path.dirname(abs), id + '.ts')));
  m._compile(ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, abs);
  return m.exports;
}

const { Rig } = load('lib/room/rig.ts');
const { CHAPTERS, resolveWalk, startPose, messPose, isNarrow } = load('lib/chapters.ts');
const { walkProgress, rebaseWalkScroll } = load('lib/walk-layout.ts');
const info = JSON.parse(fs.readFileSync(path.join(root, 'public/house/house.json')));
const viewports = [[320, 740], [360, 800], [390, 844], [430, 932], [768, 1024], [1440, 900]];
const normals = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

function create(w, h, reduced = false) {
  const aspect = w / h, narrow = isNarrow(aspect);
  const walk = resolveWalk(info, narrow, aspect), start = startPose(info, narrow);
  const rig = new Rig(walk.shots, start, messPose(info), aspect, reduced, walk.vias);
  rig.playIntro(start, () => {});
  rig.finishIntro();
  gsap.ticker.sleep();
  return rig;
}

let groups = 0;
for (const [w, h] of viewports.filter(([w, h]) => isNarrow(w / h))) {
  for (const reduced of [false, true]) {
    const rig = create(w, h, reduced);
    CHAPTERS.forEach((chapter, i) => {
      if ((chapter.labels?.length ?? 0) < 2) return;
      rig.syncScroll(i / (CHAPTERS.length - 1));
      rig.update(1000 / 60);
      for (const id of chapter.labels) {
        const art = info.art[id], [nx, nz] = normals[art.side];
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
          const p = new THREE.Vector3(art.centre[0] + nz * art.w / 2 * sx,
            art.centre[1] + art.h / 2 * sy, art.centre[2] - nx * art.w / 2 * sx).project(rig.camera);
          assert.ok(p.z > -1 && p.z < 1 && Math.abs(p.x) < 0.91 && p.y > -0.15 && p.y < 0.71,
            `${w}x${h} ${chapter.id}/${id} cropped: ${p.toArray()}`);
        }
      }
      groups++;
    });
    rig.dispose();
  }
}

// A simulated swipe must advance monotonically and settle at the same stop
// for 30, 60 and 120 Hz. These are camera math checks, not measured browser FPS.
for (const hz of [30, 60, 120]) {
  const rig = create(390, 844);
  let previous = 0;
  for (let f = 0; f <= hz * 8; f++) {
    const t = f / hz, k = Math.min(1, t / 1.6);
    rig.scroll((1 - (1 - k) ** 3) / (CHAPTERS.length - 1));
    rig.update(1000 / hz);
    assert.ok(rig.progress >= previous && rig.progress - previous <= 1 / ((CHAPTERS.length - 1) * 2.6 * hz) + 1e-12);
    assert.ok(rig.camera.matrixWorld.elements.every(Number.isFinite));
    previous = rig.progress;
  }
  close(rig.progress, 1 / (CHAPTERS.length - 1));
  const progress = rig.progress;
  rig.setAspect(430 / 932);
  const walk = resolveWalk(info, true, 430 / 932);
  rig.setShots(walk.shots, walk.vias);
  close(rig.progress, progress);
  rig.dispose();
}

const before = { centers: [0, 1000, 2300], worksTop: 3000 };
const after = { centers: [0, 1200, 2700], worksTop: 3600 };
for (let scroll = 0; scroll <= 2300; scroll += 25) {
  const mapped = rebaseWalkScroll(scroll, before, after);
  close(walkProgress(mapped, after.centers), walkProgress(scroll, before.centers));
}
close(rebaseWalkScroll(3400, before, after), 4000);
close(rebaseWalkScroll(2650, before, after), 3150);

// Optionally check the actual camera path against the source model's door
// openings, using the published colliders and each rig matrix along the move.
const sourceFile = process.argv[2];
if (sourceFile) {
  const source = JSON.parse(fs.readFileSync(path.resolve(root, sourceFile)));
  const openings = source.openings.map(([x0, x1, y0, y1, z0, z1]) => [x0, z0, -y1, x1, z1, -y0]);
  const inside = (p, b, m = 0.02) => p.x > b[0] + m && p.x < b[3] - m && p.y > b[1] + m && p.y < b[4] - m && p.z > b[2] + m && p.z < b[5] - m;
  for (const [w, h] of viewports) {
    const rig = create(w, h), p = new THREE.Vector3();
    for (let i = 0; i < CHAPTERS.length - 1; i++) for (let k = 0; k <= 480; k++) {
      rig.syncScroll((i + k / 480) / (CHAPTERS.length - 1));
      rig.update(1000 / 60);
      rig.camera.getWorldPosition(p);
      assert.ok(openings.some(b => inside(p, b, -0.04)) || !info.colliders.some(b => inside(p, b)),
        `${w}x${h} ${CHAPTERS[i].id} -> ${CHAPTERS[i + 1].id} crosses a wall at ${p.toArray()}`);
    }
    rig.dispose();
  }
  console.log('Camera paths remain clear of walls at all six viewport sizes.');
}
gsap.ticker.sleep();
console.log(`${groups} phone group compositions fit; reduced motion, frame-rate independence and resize continuity pass.`);

import * as THREE from "three";

/**
 * Plants for the rooms (review mock, 29 Oct 2026): Indian, homely, simple. The house's own areca
 * and potted plants are reused (cloned from house.glb); the tulsi, the snake plant and the money
 * plant (pothos) trailing from a wall shelf are built here from leaf cards on a generated alpha
 * texture. Muted natural greens, so the paintings stay the loudest colour in the room.
 * Placements: lib/studio-plants.json.
 */
export type Plant = {
  room: string; kind: string; at: [number, number]; side?: string; y?: number; pot?: string; rot?: number;
  /** palm: height (m); spread along the wall / out of it (half widths, m) */
  h?: number; spread?: [number, number];
  /** palm in a narrow gap: bare canes, every leaf above this height (m), over the paintings' tops */
  clear?: number;
  /** money plant: longest vine (m), vines, no shelf (it sits on a bench), half width of the trail */
  len?: number; vines?: number; shelf?: boolean; trail?: number;
  /** bench / dhurrie: size along the wall and out of it (m) */
  size?: [number, number];
  /** cutout: a role in the kit ("pair", "bench", "rug") or a file name in lib/studio-props.json; out of the wall (m); light (0..1, the room's light at that spot) */
  img?: string; off?: number; light?: number; face?: "camera" | "wall";
};
/** a staged cut-out (scripts: scripts/house/stage_props.py): width / height, its floor shadow's box (shares of the image), opaque points for QA */
export type PropAsset = { aspect: number; shadow: number[] | null; samples: [number, number][] };
const OUT: Record<string, [number, number]> = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

/** a seeded random, so the mocks are the same every time */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** a leaf: an outline filled in a muted green, a paler midrib */
function leafTex(shape: "oval" | "heart", fill: string, rib: string, vary?: string) {
  return canvasTex(128, 128, (g) => {
    g.beginPath();
    if (shape === "heart") {
      g.moveTo(64, 122);
      g.bezierCurveTo(10, 84, 4, 30, 34, 14);
      g.bezierCurveTo(50, 6, 60, 16, 64, 26);
      g.bezierCurveTo(68, 16, 78, 6, 94, 14);
      g.bezierCurveTo(124, 30, 118, 84, 64, 122);
    } else {
      g.moveTo(64, 4);
      g.bezierCurveTo(108, 34, 108, 92, 64, 124);
      g.bezierCurveTo(20, 92, 20, 34, 64, 4);
    }
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.save();
    g.clip();
    if (vary) {
      // a money plant's pale streaks
      g.strokeStyle = vary; g.lineWidth = 5; g.globalAlpha = 0.45;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(64, 110); g.lineTo(20 + i * 22, 20 + (i % 2) * 18); g.stroke(); }
      g.globalAlpha = 1;
    }
    const sh = g.createLinearGradient(0, 0, 128, 0);
    sh.addColorStop(0, "rgba(0,0,0,.18)"); sh.addColorStop(0.5, "rgba(255,255,255,.06)"); sh.addColorStop(1, "rgba(0,0,0,.18)");
    g.fillStyle = sh; g.fillRect(0, 0, 128, 128);
    g.restore();
    g.strokeStyle = rib; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(64, shape === "heart" ? 26 : 8); g.lineTo(64, 120); g.stroke();
  });
}

/** a snake plant's blade: dark green with paler cross bands and a yellow-green edge */
function bladeTex() {
  return canvasTex(64, 256, (g) => {
    g.beginPath();
    g.moveTo(32, 2); g.bezierCurveTo(50, 40, 58, 120, 56, 254); g.lineTo(8, 254); g.bezierCurveTo(6, 120, 14, 40, 32, 2);
    g.closePath();
    g.fillStyle = "#9A9A52"; g.fill();
    g.save(); g.clip();
    g.fillStyle = "#3E5233"; g.fillRect(12, 0, 40, 256);
    g.strokeStyle = "rgba(150,165,120,.35)"; g.lineWidth = 3;
    for (let y = 14; y < 256; y += 13) { g.beginPath(); g.moveTo(10, y); g.quadraticCurveTo(32, y - 6, 54, y + 2); g.stroke(); }
    g.restore();
  });
}

/** a palm leaflet: long and narrow, a muted green with a paler midrib */
function leafletTex() {
  return canvasTex(32, 256, (g) => {
    g.beginPath();
    g.moveTo(16, 2); g.bezierCurveTo(28, 60, 27, 180, 16, 254); g.bezierCurveTo(5, 180, 4, 60, 16, 2);
    g.closePath();
    const lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, "#6E7F4C"); lg.addColorStop(0.5, "#56693F"); lg.addColorStop(1, "#4A5C38");
    g.fillStyle = lg; g.fill();
    g.strokeStyle = "rgba(170,180,120,.55)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(16, 6); g.lineTo(16, 250); g.stroke();
  });
}

/** warm wood: a brown ground with long soft grain */
function woodTex() {
  return canvasTex(256, 64, (g) => {
    g.fillStyle = "#7A5638"; g.fillRect(0, 0, 256, 64);
    const R = rng(91);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(${R() < 0.5 ? "60,38,22" : "150,110,74"},${0.12 + R() * 0.18})`;
      g.lineWidth = 0.6 + R() * 1.6;
      const y = R() * 64;
      g.beginPath(); g.moveTo(0, y);
      g.bezierCurveTo(80, y + (R() - 0.5) * 6, 170, y + (R() - 0.5) * 6, 256, y + (R() - 0.5) * 4); g.stroke();
    }
  });
}

/** a cotton dhurrie, sun-faded: ivory ground, indigo and madder bands, a small stepped motif, fringes at the ends */
function dhurrieTex() {
  return canvasTex(512, 320, (g) => {
    const W = 512, H = 320, F = 14;
    g.fillStyle = "#E6DCC6"; g.fillRect(0, 0, W, H);
    // the fringes: the warp left loose at both ends
    g.clearRect(0, 0, F, H); g.clearRect(W - F, 0, F, H);
    g.strokeStyle = "#DCD1BA"; g.lineWidth = 1.4;
    for (let y = 2; y < H; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(F, y + 1); g.moveTo(W - F, y); g.lineTo(W, y - 1); g.stroke(); }
    const band = (x: number, w: number, c: string) => { g.fillStyle = c; g.fillRect(F + x, 0, w, H); };
    const ind = "#4C5872", mad = "#A0584A", ink = "#3E3A36";
    // weft stripes across the rug (the long axis runs left to right)
    band(10, 26, ind); band(42, 6, mad); band(54, 4, ink);
    band(W - 2 * F - 36, 26, ind); band(W - 2 * F - 48, 6, mad); band(W - 2 * F - 58, 4, ink);
    // the field: wide faded indigo stripes with thin madder lines
    for (let x = 90; x < W - 2 * F - 90; x += 46) { band(x, 18, ind); band(x + 24, 4, mad); }
    // a stepped (ladder) motif in the ivory between them
    g.fillStyle = mad;
    for (let x = 108 + F; x < W - F - 100; x += 46) for (let y = 18; y < H; y += 34) {
      g.fillRect(x + 2, y, 6, 6); g.fillRect(x - 2, y + 6, 14, 5); g.fillRect(x + 2, y + 11, 6, 6);
    }
    // a little wear: fade and weave
    g.fillStyle = "rgba(245,240,228,.22)"; g.fillRect(F, 0, W - 2 * F, H);
    g.globalAlpha = 0.07; g.fillStyle = "#000";
    for (let y = 0; y < H; y += 3) g.fillRect(F, y, W - 2 * F, 1);
    g.globalAlpha = 1;
  });
}

function leafMat(map: THREE.Texture) {
  return new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.78, metalness: 0, envMapIntensity: 0.4 });
}

/** a pot by lathe: terracotta, matt clay or brass */
function pot(kind: string, r: number, h: number, mats: Record<string, THREE.Material>) {
  const p = (x: number, y: number) => new THREE.Vector2(x * r, y * h);
  const prof = kind === "brass"
    ? [p(0, 0), p(0.62, 0), p(0.72, 0.06), p(0.95, 0.42), p(0.98, 0.62), p(0.8, 0.88), p(0.84, 0.96), p(0.98, 1), p(0.92, 1), p(0.75, 0.96)]
    : [p(0, 0), p(0.68, 0), p(0.74, 0.04), p(0.92, 0.84), p(1, 0.88), p(1, 1), p(0.9, 1), p(0.84, 0.94)];
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), mats[kind] ?? mats.terracotta);
  m.castShadow = m.receiveShadow = true;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r * (kind === "brass" ? 0.76 : 0.86), 20), mats.soil);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = h * 0.93;
  const g = new THREE.Group();
  g.add(m, soil);
  return g;
}

export function buildPlants(list: Plant[], find: (name: string) => THREE.Object3D | undefined,
  kit: Record<string, string> = {}, assets: Record<string, PropAsset> = {}): { group: THREE.Group; owned: { dispose(): void }[] } {
  const group = new THREE.Group();
  group.name = "Plants";
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T) => { owned.push(x); return x; };
  const mats: Record<string, THREE.Material> = {
    terracotta: own(new THREE.MeshStandardMaterial({ color: 0xa65d40, roughness: 0.92 })),
    clay: own(new THREE.MeshStandardMaterial({ color: 0x8e6b55, roughness: 0.96 })),
    brass: own(new THREE.MeshStandardMaterial({ color: 0xb28d4e, roughness: 0.38, metalness: 0.85 })),
    soil: own(new THREE.MeshStandardMaterial({ color: 0x3b2d22, roughness: 1 })),
    stand: own(new THREE.MeshStandardMaterial({ color: 0xcfc2ab, roughness: 0.95 })),
    wood: own(new THREE.MeshStandardMaterial({ color: 0x6a4a33, roughness: 0.8 })),
    stem: own(new THREE.MeshStandardMaterial({ color: 0x5a5a38, roughness: 0.9 })),
    cane: own(new THREE.MeshStandardMaterial({ color: 0x8a8e55, roughness: 0.75 })),
    bench: own(new THREE.MeshStandardMaterial({ map: own(woodTex()), color: 0xffffff, roughness: 0.7 })),
  };
  const palmLeaf = own(leafMat(own(leafletTex())));
  const dhurrieMat = own(new THREE.MeshStandardMaterial({ map: own(dhurrieTex()), transparent: true, alphaTest: 0.2, roughness: 1, metalness: 0 }));
  const tulsiLeaf = own(leafMat(own(leafTex("oval", "#4E6343", "#6E7D55"))));
  const pothosLeaf = own(leafMat(own(leafTex("heart", "#567444", "#82936A", "#B8BE8A"))));
  const blade = own(leafMat(own(bladeTex())));
  const card = own(new THREE.PlaneGeometry(1, 1));
  card.translate(0, 0.5, 0);
  const dummy = new THREE.Object3D();

  /** leaves as one instanced mesh: each leaf a card at a point, facing out and up */
  const leaves = (mat: THREE.Material, n: number, place: (i: number, o: THREE.Object3D) => void) => {
    const im = new THREE.InstancedMesh(card, mat, n);
    for (let i = 0; i < n; i++) { dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); place(i, dummy); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
    im.castShadow = true;
    im.receiveShadow = true;
    return im;
  };

  const loader = new THREE.TextureLoader();
  const texCache = new Map<string, THREE.Texture>();
  const tex = (file: string) => {
    let t = texCache.get(file);
    if (!t) {
      t = own(loader.load(`/house/props/${file}.webp`));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      texCache.set(file, t);
    }
    return t;
  };
  const shadowMats = new Map<string, THREE.Material>();
  const UP = new THREE.Vector3(0, 1, 0);

  list.forEach((pl, k) => {
    const R = rng(k * 7919 + 17);
    if (pl.kind === "cutout" || pl.kind === "rug") {
      const file = kit[pl.img ?? ""] ?? pl.img ?? "";
      const g = new THREE.Group();
      g.name = `prop:${pl.img}:${k}`;
      const [nx, nz] = OUT[pl.side ?? "N"];
      if (pl.kind === "rug") {
        // a dhurrie: the photographed weave as a floor plane, centred where it is put
        const [L, Dp] = pl.size ?? [2, 1.3];
        const rug = new THREE.Mesh(own(new THREE.PlaneGeometry(L, Dp)),
          own(new THREE.MeshBasicMaterial({ map: tex(file), color: new THREE.Color().setScalar(pl.light ?? 0.72), fog: false })));
        rug.rotation.x = -Math.PI / 2;
        rug.rotation.z = Math.atan2(nx, nz);
        rug.position.y = 0.006;
        rug.receiveShadow = true;
        g.add(rug);
        g.position.set(pl.at[0], 0, pl.at[1]);
        group.add(g);
        return;
      }
      const a = assets[file];
      if (!a) return;
      const H = pl.h ?? 1.4, W = H * a.aspect, base = pl.y ?? 0;
      // the plant: a photograph standing upright, turned to the camera about its own stem (or square to the wall: a bench)
      const geo = own(new THREE.PlaneGeometry(W, H));
      geo.translate(0, H / 2, 0);
      const mat = own(new THREE.MeshBasicMaterial({ map: tex(file), transparent: true, alphaTest: 0.35, depthWrite: true,
        color: new THREE.Color().setScalar(pl.light ?? 0.8), fog: false, side: THREE.DoubleSide }));
      const card = new THREE.Mesh(geo, mat);
      card.position.y = base;
      card.renderOrder = 2;
      const faceWall = pl.face === "wall";
      const wallYaw = Math.atan2(nx, nz);
      card.rotation.y = wallYaw;
      const tmp = new THREE.Vector3();
      const aim = (cam: THREE.Camera) => {
        if (faceWall) return;
        cam.getWorldPosition(tmp);
        g.updateMatrixWorld();
        const p = g.getWorldPosition(new THREE.Vector3());
        card.rotation.y = Math.atan2(tmp.x - p.x, tmp.z - p.z);
        card.updateMatrix();
        card.updateMatrixWorld(true);
      };
      card.onBeforeRender = (_r, _s, cam) => aim(cam);
      g.userData.aim = aim;
      // the QA's points: where the photograph is opaque, in the card's own plane
      g.userData.samples = () => a.samples.map(([u, v]) => new THREE.Vector3((u - 0.5) * W, base + v * H, 0).applyMatrix4(card.matrixWorld));
      g.add(card);
      // grounded: its own soft shadow on the floor (or on the bench it stands on)
      if (a.shadow) {
        const sw = (a.shadow[2] - a.shadow[0]) * W;
        let sm = shadowMats.get(file);
        if (!sm) {
          sm = own(new THREE.MeshBasicMaterial({ map: tex(`${file}-shadow`), transparent: true, depthWrite: false, color: 0x2a221c, fog: false,
            polygonOffset: true, polygonOffsetFactor: -2 }));
          shadowMats.set(file, sm);
        }
        const sh = new THREE.Mesh(own(new THREE.PlaneGeometry(sw * 1.25, sw * 0.7)), sm);
        sh.rotation.x = -Math.PI / 2;
        sh.position.set(((a.shadow[0] + a.shadow[2]) / 2 - 0.5) * W * (faceWall ? 1 : 0), base + 0.004, faceWall ? 0.02 : 0);
        sh.renderOrder = 1;
        g.add(sh);
      }
      void UP;
      g.position.set(pl.at[0], 0, pl.at[1]);
      group.add(g);
      return;
    }
    const g = new THREE.Group();
    g.name = `plant:${pl.kind}:${k}`;
    if (pl.kind === "areca") {
      const src = find("Foliage_areca0");
      const pt = pot(pl.pot ?? "terracotta", 0.24, 0.42, mats);
      g.add(pt);
      if (src) {
        const a = src.clone(true);
        a.position.set(0, 0.36, 0);
        a.quaternion.identity();
        a.scale.setScalar(0.42);
        g.add(a);
      }
    } else if (pl.kind === "rubber" || pl.kind === "small") {
      const src = find(pl.kind === "rubber" ? "Prop_potted_plant_02_3" : "Prop_potted_plant_04_tc_1");
      if (src) {
        const a = src.clone(true);
        a.position.set(0, 0, 0);
        a.quaternion.identity();
        a.scale.setScalar(pl.kind === "rubber" ? 1.55 : 2.6);
        g.add(a);
      }
    } else if (pl.kind === "tulsi") {
      // a whitewashed low stand, a clay pot, a bushy crown of small leaves
      const stand = new THREE.Mesh(own(new THREE.BoxGeometry(0.36, 0.36, 0.36)), mats.stand);
      stand.position.y = 0.18; stand.castShadow = stand.receiveShadow = true;
      const pt = pot("terracotta", 0.15, 0.24, mats);
      pt.position.y = 0.36;
      const stems = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Mesh(own(new THREE.CylinderGeometry(0.004, 0.007, 0.36, 5)), mats.stem);
        s.position.set((R() - 0.5) * 0.08, 0.36 + 0.22 + 0.15, (R() - 0.5) * 0.08);
        s.rotation.set((R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6);
        stems.add(s);
      }
      const crown = leaves(tulsiLeaf, 260, (_, o) => {
        const u = R() * Math.PI * 2, v = Math.acos(2 * R() - 1) * 0.8, rr = 0.1 + R() * 0.11;
        o.position.set(Math.sin(v) * Math.cos(u) * rr, 0.36 + 0.22 + 0.2 + Math.cos(v) * rr * 0.9, Math.sin(v) * Math.sin(u) * rr);
        o.rotation.set(-0.4 - R() * 0.9, u + Math.PI / 2 + (R() - 0.5), (R() - 0.5) * 0.6, "YXZ");
        o.scale.set(0.028, 0.045, 1);
      });
      g.add(stand, pt, stems, crown);
    } else if (pl.kind === "snake") {
      const pt = pot(pl.pot ?? "clay", 0.17, 0.3, mats);
      const bl = leaves(blade, 13, (i, o) => {
        const a = (i / 13) * Math.PI * 2 + R() * 0.5, rr = 0.03 + R() * 0.07;
        o.position.set(Math.cos(a) * rr, 0.27, Math.sin(a) * rr);
        o.rotation.set((R() - 0.5) * 0.25, a + (R() - 0.5) * 1.2, (R() - 0.5) * 0.25, "YXZ");
        o.scale.set(0.065 + R() * 0.02, 0.45 + R() * 0.38, 1);
      });
      g.add(pt, bl);
    } else if (pl.kind === "palm") {
      // an areca palm in a clay pot: a few ringed canes, arching fronds of narrow leaflets.
      // Its spread is held along the wall (spread[0]) and out of it (spread[1]) so it can stand in a gap.
      const [nx, nz] = OUT[pl.side ?? "N"];
      const H = pl.h ?? 2;
      const [sa, so] = pl.spread ?? [0.4, 0.35];
      const potH = 0.42, potR = 0.21;
      const pt = pot(pl.pot ?? "terracotta", potR, potH, mats);
      g.add(pt);
      const along = new THREE.Vector3(nz, 0, -nx), out = new THREE.Vector3(nx, 0, nz);
      const fronds: { base: THREE.Vector3; dir: THREE.Vector3; L: number; rise: number; droop: number }[] = [];
      const canes = 4;
      for (let c = 0; c < canes; c++) {
        const crown = pl.clear !== undefined;
        // a full palm: canes of mixed heights; a crown palm: the canes close together, the tops near the full height
        const ch = (H - 0.35 - potH) * (crown ? 0.86 + 0.14 * ((c + 1) / canes) : 0.6 + 0.4 * ((c + 1) / canes)) * (0.94 + R() * 0.06);
        const ox = (R() - 0.5) * (crown ? 0.06 : 0.12), oz = (R() - 0.5) * 0.06;
        const top = new THREE.Vector3().addScaledVector(along, ox).addScaledVector(out, oz);
        const lean = new THREE.Vector3().addScaledVector(along, (c - (canes - 1) / 2) * 0.07).addScaledVector(out, 0.02);
        const caneTop = top.clone().add(lean.clone().multiplyScalar(ch)); caneTop.y = potH + ch;
        const foot = new THREE.Vector3(top.x, potH - 0.02, top.z);
        const cl = caneTop.distanceTo(foot);
        const cane = new THREE.Mesh(own(new THREE.CylinderGeometry(0.012, 0.018, cl, 6)), mats.cane);
        cane.position.copy(foot).add(caneTop).multiplyScalar(0.5);
        cane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), caneTop.clone().sub(foot).normalize());
        g.add(cane);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + R() * 0.8 + c;
          const dir = new THREE.Vector3().addScaledVector(along, Math.cos(a) * sa).addScaledVector(out, Math.sin(a) * so);
          const L = 0.55 + R() * 0.35;
          const r = Math.hypot(Math.cos(a) * sa, Math.sin(a) * so);
          const rise = 0.35 + R() * 0.3;
          let droop = 0.45 + R() * 0.35;
          // a crown palm's fronds may not fall below `clear` (plus the leaflets' own hang)
          if (crown) droop = Math.min(droop, Math.max(0.1, rise + (caneTop.y - (pl.clear! + 0.16)) / L));
          fronds.push({ base: caneTop.clone(), dir: dir.normalize().multiplyScalar(Math.min(1, Math.max(0.12, r - 0.08) / L)), L, rise, droop });
        }
      }
      // leaflets along each frond's arching rachis
      const xf: THREE.Matrix4[] = [];
      const T = new THREE.Vector3(), Sd = new THREE.Vector3(), D = new THREE.Vector3(), Z = new THREE.Vector3(), X = new THREE.Vector3();
      const at = (f: (typeof fronds)[number], t: number) => new THREE.Vector3(
        f.base.x + f.dir.x * f.L * t, f.base.y + f.L * (f.rise * t - f.droop * t * t), f.base.z + f.dir.z * f.L * t);
      for (const f of fronds) {
        const n = 16;
        for (let i = 2; i < n; i++) {
          const t = i / n, p = at(f, t);
          T.copy(at(f, t + 0.02)).sub(p).normalize();
          Sd.crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
          for (const sgn of [-1, 1]) {
            D.copy(Sd).multiplyScalar(sgn * 0.75).addScaledVector(T, 0.55).add(new THREE.Vector3(0, -0.25 - t * 0.3, 0)).normalize();
            Z.crossVectors(D, T).normalize();
            X.crossVectors(D, Z).normalize();
            const len = 0.3 * (1 - 0.55 * t) * (0.85 + R() * 0.3);
            const m = new THREE.Matrix4().makeBasis(X.clone().multiplyScalar(0.028), D.clone().multiplyScalar(len), Z.clone());
            m.setPosition(p);
            xf.push(m);
          }
        }
        // the rachis itself
        const pts = Array.from({ length: 10 }, (_, i) => at(f, i / 9));
        const tube = new THREE.Mesh(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.005, 4)), mats.cane);
        g.add(tube);
      }
      const im = new THREE.InstancedMesh(card, palmLeaf, xf.length);
      xf.forEach((m, i) => im.setMatrixAt(i, m));
      g.add(im);
      g.position.set(pl.at[0], 0, pl.at[1]);
      group.add(g);
      return;
    } else if (pl.kind === "bench") {
      // a low wooden bench: a thick plank on four square legs with an apron, warm and plain
      const [nx, nz] = OUT[pl.side ?? "N"];
      const [L, Dp] = pl.size ?? [1.2, 0.34];
      const top = new THREE.Mesh(own(new THREE.BoxGeometry(L, 0.05, Dp)), mats.bench);
      top.position.y = 0.4;
      const local = new THREE.Group();
      local.add(top);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(own(new THREE.BoxGeometry(0.055, 0.375, 0.055)), mats.bench);
        leg.position.set(sx * (L / 2 - 0.08), 0.1875, sz * (Dp / 2 - 0.06));
        local.add(leg);
      }
      for (const sz of [-1, 1]) {
        const ap = new THREE.Mesh(own(new THREE.BoxGeometry(L - 0.16, 0.06, 0.025)), mats.bench);
        ap.position.set(0, 0.345, sz * (Dp / 2 - 0.06));
        local.add(ap);
      }
      local.rotation.y = Math.atan2(nx, nz);
      g.add(local);
      g.position.set(pl.at[0], 0, pl.at[1]);
      group.add(g);
      return;
    } else if (pl.kind === "ledge") {
      // a plain wooden ledge on the wall (for pots), its front edge 0.2 m out
      const [nx, nz] = OUT[pl.side ?? "N"];
      const [L, Dp] = pl.size ?? [1.2, 0.2];
      const plank = new THREE.Mesh(own(new THREE.BoxGeometry(L, 0.035, Dp)), mats.bench);
      plank.position.set(0, -0.0175, Dp / 2);
      const local = new THREE.Group();
      local.add(plank);
      local.rotation.y = Math.atan2(nx, nz);
      g.add(local);
      g.position.set(pl.at[0], pl.y ?? 2, pl.at[1]);
      group.add(g);
      return;
    } else if (pl.kind === "dhurrie") {
      const [L, Dp] = pl.size ?? [2, 1.3];
      const rug = new THREE.Mesh(own(new THREE.PlaneGeometry(L, Dp)), dhurrieMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.y = 0.008;
      const local = new THREE.Group();
      local.add(rug);
      local.rotation.y = pl.rot ?? 0;
      g.add(local);
      g.position.set(pl.at[0], 0, pl.at[1]);
      group.add(g);
      return;
    } else if (pl.kind === "pothos") {
      // a small wooden shelf on the wall, a clay pot, vines trailing down
      const [nx, nz] = OUT[pl.side ?? "N"];
      const shelf = new THREE.Mesh(own(new THREE.BoxGeometry(0.46, 0.03, 0.2)), mats.wood);
      shelf.position.set(0, -0.015, 0.1); shelf.castShadow = shelf.receiveShadow = true;
      const pt = pot("terracotta", 0.1, 0.16, mats);
      pt.position.set(0, 0, 0.1);
      const local = new THREE.Group();
      if (pl.shelf !== false) local.add(shelf);
      local.add(pt);
      const maxLen = pl.len ?? 1.2, nV = pl.vines ?? 6, tw = pl.trail ?? 0.15;
      // the vines: chains of heart leaves falling over the shelf's front edge, swaying a little
      const chains: THREE.Vector3[] = [];
      for (let v = 0; v < nV; v++) {
        const x0 = (R() - 0.5) * 2 * tw, len = maxLen * (0.3 + 0.7 * R());
        const steps = Math.round(len / 0.06);
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          chains.push(new THREE.Vector3(x0 + Math.sin(t * 3 + v) * 0.05, 0.12 - Math.pow(t, 0.9) * len, 0.17 + 0.05 * Math.sin(t * Math.PI)));
        }
      }
      // and a mound over the pot
      for (let m = 0; m < 26; m++) chains.push(new THREE.Vector3((R() - 0.5) * 0.24, 0.13 + R() * 0.1, 0.06 + R() * 0.12));
      const vine = leaves(pothosLeaf, chains.length, (i, o) => {
        o.position.copy(chains[i]);
        o.rotation.set(-0.3 - R() * 0.9, (R() - 0.5) * 1.6, (R() - 0.5) * 1.2, "YXZ");
        const s = 0.055 + R() * 0.03;
        o.scale.set(s, s * 1.05, 1);
      });
      local.add(vine);
      // face out of the wall: local +z along the wall's outward normal
      local.rotation.y = Math.atan2(nx, nz);
      g.add(local);
      g.position.set(pl.at[0], pl.y ?? 2, pl.at[1]);
      group.add(g);
      return;
    }
    g.rotation.y = pl.rot ?? R() * Math.PI * 2;
    g.position.set(pl.at[0], 0, pl.at[1]);
    group.add(g);
  });
  group.traverse((o) => { o.matrixAutoUpdate = true; if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group, owned };
}

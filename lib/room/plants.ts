import * as THREE from "three";

/**
 * Plants for the rooms (review mock, 29 Oct 2026): Indian, homely, simple. The house's own areca
 * and potted plants are reused (cloned from house.glb); the tulsi, the snake plant and the money
 * plant (pothos) trailing from a wall shelf are built here from leaf cards on a generated alpha
 * texture. Muted natural greens, so the paintings stay the loudest colour in the room.
 * Placements: lib/studio-plants.json.
 */
export type Plant = { room: string; kind: string; at: [number, number]; side?: string; y?: number; pot?: string; rot?: number };
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

export function buildPlants(list: Plant[], find: (name: string) => THREE.Object3D | undefined): { group: THREE.Group; owned: { dispose(): void }[] } {
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
  };
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

  list.forEach((pl, k) => {
    const R = rng(k * 7919 + 17);
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
    } else if (pl.kind === "pothos") {
      // a small wooden shelf on the wall, a clay pot, vines trailing down
      const [nx, nz] = OUT[pl.side ?? "N"];
      const shelf = new THREE.Mesh(own(new THREE.BoxGeometry(0.46, 0.03, 0.2)), mats.wood);
      shelf.position.set(0, -0.015, 0.1); shelf.castShadow = shelf.receiveShadow = true;
      const pt = pot("terracotta", 0.1, 0.16, mats);
      pt.position.set(0, 0, 0.1);
      const local = new THREE.Group();
      local.add(shelf, pt);
      // the vines: chains of heart leaves falling over the shelf's front edge, swaying a little
      const chains: THREE.Vector3[] = [];
      for (let v = 0; v < 6; v++) {
        const x0 = (R() - 0.5) * 0.3, len = 0.35 + R() * 0.85;
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

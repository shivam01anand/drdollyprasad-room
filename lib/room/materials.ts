import * as THREE from "three";
import type { Variant } from "./variants";

/**
 * Surfaces, from photographs.
 *
 * The previous room painted every wall from 512 px procedural noise with no
 * normal or roughness information, then restarted the texture on every box —
 * which is exactly what read as a 1990s game wall: soft blotches in square
 * tiles. Every surface here is a photographed PBR set (Poly Haven, CC0) at
 * its real physical size, mapped in world space so a wall made of nine boxes
 * reads as one continuous plaster surface.
 *
 * Two shader additions do the rest of the work a photograph cannot:
 *  - macro variation: a slow 8 m noise so a 2 m plaster texture never shows
 *    its repeat across a 6.4 m wall;
 *  - grime: walls darken toward the floor and soot toward the ceiling, as
 *    every lime-washed room with a lamp in it does.
 */

export type SetName =
  | "plaster" | "floor" | "door" | "timber" | "sandstone" | "iron" | "terracotta";

export type Role =
  | "wall" | "wallShade" | "field" | "court" | "floor" | "stone" | "sandstone" | "ram"
  | "timber" | "frame" | "door" | "iron" | "ironDark" | "clay" | "postbox"
  | "courtFloor" | "aluminium" | "brass" | "thread" | "leaf" | "canvasBack";

type Spec = {
  set?: SetName;
  /** multiplied into the photograph: an sRGB hex, or a linear triple when
   *  the photograph has to be lifted past white (lime wash reflects ~70 %,
   *  the plaster photograph averages 37 %) */
  tint: number | [number, number, number];
  /** metres per texture repeat */
  tile: number;
  roughness?: number;
  metalness?: number;
  normal?: number;
  env?: number;
  macro?: number;
  grime?: boolean;
  /** turn the photograph 90° (planks run vertically on a door leaf) */
  rotate?: boolean;
  /** the room's own colour family; false for the canvases' companions */
  tunable?: boolean;
  /** borrow only the surface (normal + roughness) of a set, not its colour —
   *  for metals, where the colour is the metal and the photograph is wear */
  detail?: SetName;
  detailTile?: number;
};

export const SPECS: Record<Role, Spec> = {
  // her plaster grounds — Mother and Son, The Newspaper Reader, The Chai Boy
  wall:      { set: "plaster", tint: [1.8, 1.73, 1.52], tile: 2.0, macro: 0.07, grime: true, env: 0.9, normal: 0.6 },
  wallShade: { set: "plaster", tint: [1.42, 1.32, 1.2], tile: 2.0, macro: 0.07, grime: true, env: 0.8, normal: 0.6 },
  // the red the gallery put behind her canvases (42-ctx-gallery-view)
  field:     { set: "plaster", tint: [0.66, 0.135, 0.07], tile: 2.0, macro: 0.08, grime: true, normal: 0.5, env: 0.7 },
  court:     { set: "plaster", tint: [1.84, 1.8, 1.6], tile: 2.4, macro: 0.12, grime: true, env: 0.6 },
  floor:     { set: "floor", tint: 0xf3ebe0, tile: 2.8, macro: 0.07, env: 0.8, roughness: 1.0 },
  stone:     { set: "floor", tint: 0xe2d6c4, tile: 1.6, macro: 0.05, env: 0.8 },
  sandstone: { set: "sandstone", tint: 0xf2dcc0, tile: 1.4, macro: 0.04, env: 0.8 },
  ram:       { set: "sandstone", tint: 0xf2dcc0, tile: 1.4, env: 0.8 },
  timber:    { set: "timber", tint: [1.25, 1.1, 0.95], tile: 2.0, macro: 0.05, env: 0.6 },
  frame:     { set: "timber", tint: 0x9a7a62, tile: 0.9, env: 0.7, roughness: 0.8 },
  // Bandh Darwaze — turquoise over brown, flaking in torn islands
  door:      { set: "door", tint: [1.85, 1.85, 1.78], tile: 1.15, rotate: true, env: 0.8, tunable: false, normal: 0.7 },
  iron:      { set: "iron", tint: 0x8a8178, tile: 0.55, metalness: 0.85, env: 1.0, roughness: 0.9 },
  ironDark:  { set: "iron", tint: 0x4a433d, tile: 0.6, metalness: 0.7, env: 0.9 },
  // Terracotta (2015): unfired clay, matte, the one object allowed its colour
  clay:      { set: "plaster", tint: 0xd27a50, tile: 0.7, roughness: 1.0, normal: 0.55, env: 0.7, tunable: false },
  // Patra Petika — post-office red over cast iron, worn
  postbox:   { set: "iron", tint: 0xc2402c, tile: 0.8, metalness: 0.25, env: 0.8, tunable: false },
  courtFloor:{ set: "terracotta", tint: 0xf0c2a6, tile: 2.08, env: 0.6 },
  aluminium: { tint: 0xd8d6d0, tile: 0.5, metalness: 1.0, roughness: 0.62, env: 1.0, tunable: false, detail: "iron" },
  brass:     { tint: 0xc09050, tile: 0.35, metalness: 1.0, roughness: 0.75, env: 1.0, tunable: false, detail: "iron" },
  // the one saturated colour outside the paintings, and it is a quote
  thread:    { tint: 0x9e2b1d, tile: 1, roughness: 0.95, env: 0.5, tunable: false },
  leaf:      { tint: 0x46603d, tile: 1, roughness: 0.9, env: 0.5, tunable: false },
  canvasBack:{ tint: 0x3a2e26, tile: 1, roughness: 0.95, env: 0.4 },
};

const SET_TILE_PATH = (set: SetName, kind: "diff" | "nor" | "arm", small: boolean) =>
  `/tex/${small ? "1k/" : ""}${set}_${kind}.webp`;

/** everything the loader must fetch, so progress can count it */
export function textureList(small: boolean) {
  const sets = new Set<SetName>();
  for (const s of Object.values(SPECS)) if (s.set) sets.add(s.set);
  const out: { set: SetName; kind: "diff" | "nor" | "arm"; url: string }[] = [];
  for (const set of sets)
    for (const kind of ["diff", "nor", "arm"] as const)
      out.push({ set, kind, url: SET_TILE_PATH(set, kind, small) });
  return out;
}

/* ---------------------------------------------------------------------------
   Macro variation: a small tileable noise, generated once. Tileable because
   it is built from a wrapped lattice and sampled with wrap, so the 8 m period
   has no seam either.
--------------------------------------------------------------------------- */
function macroNoise(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const octave = (cells: number) => {
    const lat = new Float32Array(cells * cells).map(() => rnd());
    const at = (x: number, y: number) => lat[((y + cells) % cells) * cells + ((x + cells) % cells)];
    return (u: number, v: number) => {
      const x = u * cells, y = v * cells;
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const fx = x - x0, fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = at(x0, y0), b = at(x0 + 1, y0), c2 = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      return a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d) * sx * sy;
    };
  };
  const o1 = octave(4), o2 = octave(9), o3 = octave(23);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const n = o1(u, v) * 0.55 + o2(u, v) * 0.3 + o3(u, v) * 0.15;
      const i = (y * size + x) * 4;
      const val = Math.round(n * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/**
 * राम, incised. Threads of Faith hangs its bells against sandstone blocks cut
 * with राम, repeated; here it is cut into the surround of the lamp niche —
 * small, only legible from close, and the only lettering in the room.
 * White is the stone face, black the bottom of the cut.
 */
export function ramTexture(rows: number, cols = 1) {
  const W = 256 * cols, H = 256 * rows;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#000";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `500 150px "IBM Plex Sans Devanagari", "Kohinoor Devanagari", "Noto Sans Devanagari", "Devanagari Sangam MN", sans-serif`;
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) g.fillText("राम", 128 + k * 256, 128 + r * 256 + 8);
  // soften the cut so the bump has a chamfer instead of a cliff
  const blur = document.createElement("canvas");
  blur.width = W; blur.height = H;
  const bg = blur.getContext("2d")!;
  bg.filter = "blur(3px)";
  bg.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(blur);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

export type Library = {
  get(role: Role): THREE.MeshStandardMaterial;
  all(): THREE.MeshStandardMaterial[];
  tile(role: Role): number;
  rotate(role: Role): boolean;
  textures: THREE.Texture[];
  dispose(): void;
};

/**
 * Build one material per role from the loaded photographs. `maps` holds the
 * decoded textures by "set:kind".
 */
export function buildLibrary(
  maps: Map<string, THREE.Texture>,
  variant: Variant,
  anisotropy: number,
  roomHeight: number
): Library {
  const macro = macroNoise();
  const tint = new THREE.Color(variant.tint);
  const owned: THREE.Texture[] = [macro];
  const mats = new Map<Role, THREE.MeshStandardMaterial>();

  for (const [key, t] of maps) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = anisotropy;
    t.colorSpace = key.endsWith(":diff") ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
  }

  for (const [role, s] of Object.entries(SPECS) as [Role, Spec][]) {
    const m = new THREE.MeshStandardMaterial({
      color: Array.isArray(s.tint) ? new THREE.Color().setRGB(...s.tint) : s.tint,
      roughness: s.roughness ?? 1,
      metalness: s.metalness ?? 0,
    });
    if (s.set) {
      const diff = maps.get(`${s.set}:diff`);
      const nor = maps.get(`${s.set}:nor`);
      const arm = maps.get(`${s.set}:arm`);
      if (diff) m.map = diff;
      if (nor) {
        m.normalMap = nor;
        const k = s.normal ?? 1;
        m.normalScale.set(k, k);
      }
      if (arm) {
        // ARM: red AO, green roughness, blue metalness — one fetch, three maps
        m.aoMap = arm;
        m.aoMapIntensity = 0.85;
        m.roughnessMap = arm;
        m.metalnessMap = s.metalness ? arm : null;
      }
    } else if (s.detail) {
      const nor = maps.get(`${s.detail}:nor`);
      const arm = maps.get(`${s.detail}:arm`);
      if (nor) { m.normalMap = nor; m.normalScale.set(0.45, 0.45); }
      // the photograph's roughness, scaled by this material's own
      if (arm) m.roughnessMap = arm;
      m.roughness = s.roughness ?? 0.6;
    } else {
      m.roughness = s.roughness ?? 0.9;
    }
    m.envMapIntensity = s.env ?? 0.8;
    if (s.tunable !== false) {
      tune(m.color, variant.sat, tint);
    }
    patch(m, {
      macro: s.set ? s.macro ?? 0 : 0,
      grime: !!s.grime,
      sat: s.tunable === false ? 1 : variant.sat,
      macroMap: macro,
      macroScale: s.tile / 8.0,
      roomHeight,
    });
    mats.set(role, m);
  }

  return {
    get: (r) => mats.get(r)!,
    all: () => [...mats.values()],
    tile: (r) => SPECS[r].tile,
    rotate: (r) => !!SPECS[r].rotate,
    textures: [...maps.values(), ...owned],
    dispose() {
      mats.forEach((m) => m.dispose());
      maps.forEach((t) => t.dispose());
      owned.forEach((t) => t.dispose());
    },
  };
}

/** pull a colour toward grey (sat<1) or push it out (sat>1), then tint */
function tune(c: THREE.Color, sat: number, tint: THREE.Color) {
  // HSL lives in 0–1, and a tint above 1 (a pale photograph brightened) would
  // clamp to white: tune the colour's hue at unit scale, then scale it back
  const k = Math.max(c.r, c.g, c.b, 1);
  c.multiplyScalar(1 / k);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, THREE.MathUtils.clamp(hsl.s * sat, 0, 1), hsl.l);
  c.multiplyScalar(k).multiply(tint);
  return c;
}

/**
 * Shader additions. Everything here is in the fragment after the albedo is
 * known, so lighting, shadows and the photograph's own AO all still apply.
 */
function patch(
  m: THREE.MeshStandardMaterial,
  o: { macro: number; grime: boolean; sat: number; macroMap: THREE.Texture; macroScale: number; roomHeight: number }
) {
  if (!o.macro && !o.grime && o.sat === 1) return;
  const key = `room:${o.macro > 0 ? 1 : 0}:${o.grime ? 1 : 0}:${o.sat !== 1 ? 1 : 0}`;
  m.customProgramCacheKey = () => key;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uMacro = { value: o.macroMap };
    shader.uniforms.uMacroAmp = { value: o.macro };
    shader.uniforms.uMacroScale = { value: o.macroScale };
    shader.uniforms.uSat = { value: o.sat };
    shader.uniforms.uRoomH = { value: o.roomHeight };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vWorldY;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;"
      );

    let frag = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       varying float vWorldY;
       uniform sampler2D uMacro;
       uniform float uMacroAmp;
       uniform float uMacroScale;
       uniform float uSat;
       uniform float uRoomH;`
    );
    const lines: string[] = [];
    if (o.macro > 0) {
      lines.push(`
        #ifdef USE_MAP
          float macroN = texture2D(uMacro, vMapUv * uMacroScale).r;
          float macroM = texture2D(uMacro, vMapUv * uMacroScale * 3.1 + vec2(0.37, 0.71)).r;
          diffuseColor.rgb *= 1.0 + uMacroAmp * ((macroN - 0.5) * 1.6 + (macroM - 0.5) * 0.6);
        #endif`);
    }
    if (o.grime) {
      lines.push(`
        // a lime-washed wall darkens where feet and brooms reach it,
        // and soots above where a lamp has burned for years
        float foot = smoothstep(0.0, 0.62, vWorldY);
        float soot = smoothstep(uRoomH - 0.95, uRoomH, vWorldY);
        diffuseColor.rgb *= mix(0.80, 1.0, foot) * mix(1.0, 0.84, soot);`);
    }
    if (o.sat !== 1) {
      lines.push(`
        float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb = max(mix(vec3(lum), diffuseColor.rgb, uSat), 0.0);`);
    }
    frag = frag.replace("#include <map_fragment>", `#include <map_fragment>\n${lines.join("\n")}`);
    shader.fragmentShader = frag;
  };
}

/* ---------------------------------------------------------------------------
   UVs in metres.

   Static architecture is merged into a few large meshes, so every vertex
   carries its own UV: box-projected from world position (a wall built of
   nine boxes reads as one surface), or the geometry's own UV rescaled to
   the object's real size for turned and curved things.
--------------------------------------------------------------------------- */

/** world-space box projection; the geometry must already be in world space */
export function worldUV(geo: THREE.BufferGeometry, tile: number, rotate = false) {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    let u: number, v: number;
    if (ax >= ay && ax >= az) { u = nx > 0 ? -z : z; v = y; }
    else if (ay >= az) { u = x; v = ny > 0 ? -z : z; }
    else { u = nz > 0 ? x : -x; v = y; }
    if (rotate) { const t = u; u = v; v = -t; }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** the geometry's own UVs, stretched to metres: su/sv are the real lengths
 *  that one unit of u and v covers */
export function metricUV(geo: THREE.BufferGeometry, su: number, sv: number, tile: number, rotate = false) {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (!uv) return geo;
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i) * su, v = uv.getY(i) * sv;
    if (rotate) { const t = u; u = v; v = -t; }
    uv.setXY(i, u / tile, v / tile);
  }
  uv.needsUpdate = true;
  return geo;
}

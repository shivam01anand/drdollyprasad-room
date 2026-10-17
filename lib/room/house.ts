import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { worldUV, type Library, type Role } from "./materials";

/**
 * The house — built and lit in Blender (scripts/house), loaded here.
 *
 * house.glb carries three kinds of thing:
 *  - Static_<role> / Ceil_<role>: the architecture, merged by material role,
 *    with only its lightmap UVs. The site gives each its photographed role
 *    material (lib/room/materials) and lays the texture UVs itself, in metres.
 *  - Art_<id>: the canvases — the painting on the front, raw linen round the
 *    sides, and their own lightmap UVs.
 *  - Prop_* and Foliage_*: things with their own materials. Props tumble when
 *    the room is shaken; foliage is alpha-tested cards.
 *  - Roof_*: the gallery hall's space frame and sunshades, with their own
 *    materials, lifted with the ceilings when the camera rises for the plan.
 *  - Figure_*: her painting figure, with a scan-derived head fitted to the
 *    original body, hands and brush pose.
 *
 * The light is baked twice into one atlas layout: the afternoon (lm-day) and
 * the evening with the diya lit (lm-night). A shader patch puts the baked
 * light in place of live diffuse light (uBake) and moves between the two
 * (uNight). house.json, in three's coordinates, carries the rest: the
 * chapters' cameras, the canvases, the colliders, the anchors.
 */

export type V3 = [number, number, number];
export type HouseInfo = {
  lightmap: { day: number; night?: number };
  /** `late`: far from the door (the gallery); its photograph loads after the house has opened.
   *  `light`: where its gallery light hangs, when it has one */
  /** `lk`: the canvas's light scale, afternoon and evening: a painting is shown in a gallery's light, never washed out */
  art: Record<string, { w: number; h: number; side: string; centre: V3; late?: boolean; light?: V3; study?: boolean; lk?: [number, number] }>;
  cams: Record<string, { eye: V3; target: V3; fov: number }>;
  anchors: Record<string, V3>;
  sun: { toSun: V3 };
  /** axis-aligned boxes, [x0, y0, z0, x1, y1, z1] */
  colliders: number[][];
  plan: Record<string, number[] | number>;
};

export const HOUSE_DIR = "/house";
/** the rooms' ceiling height: above it, the roofs lift away for the plan view */
export const ROOF = 3.6;

export type House = {
  info: HouseInfo;
  scene: THREE.Group;
  lmDay: THREE.Texture;
  lmNight: THREE.Texture | null;
};

export function loadHouseInfo(signal: AbortSignal, tick: () => void): Promise<HouseInfo> {
  return fetch(`${HOUSE_DIR}/house.json`, { signal }).then((r) => {
    if (!r.ok) throw new Error(`house.json ${r.status}`);
    return r.json() as Promise<HouseInfo>;
  }).then((info) => { tick(); return info; });
}

export async function loadHouse(
  small: boolean,
  signal: AbortSignal,
  loadTexture: (url: string) => Promise<THREE.Texture>,
  tick: () => void,
  infoPromise = loadHouseInfo(signal, tick),
): Promise<House> {
  const draco = new DRACOLoader().setDecoderPath("/draco/");
  draco.setDecoderConfig({ type: "wasm" });
  // Fetch the decoder while the model is in flight, instead of after it arrives.
  draco.preload();
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const suffix = small ? "-2k" : "";
  const [info, gltf, lmDay, lmNight] = await Promise.all([
    infoPromise,
    loader.loadAsync(`${HOUSE_DIR}/house.glb`).then((x) => { tick(); return x; }),
    loadTexture(`${HOUSE_DIR}/lm-day${suffix}.webp`).then((x) => { tick(); return x; }),
    loadTexture(`${HOUSE_DIR}/lm-night${suffix}.webp`).then((x) => { tick(); return x; }).catch(() => null),
  ]).finally(() => draco.dispose());
  for (const t of [lmDay, lmNight]) {
    if (!t) continue;
    t.colorSpace = THREE.SRGBColorSpace;
    t.channel = 1;
    t.flipY = false;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }
  return { info, scene: gltf.scene, lmDay, lmNight };
}

/** the uniforms the lightmap patch shares across every baked material */
export class BakedLight {
  readonly bake = { value: 1 };
  readonly night = { value: 0 };
  readonly nightMap: { value: THREE.Texture | null };
  readonly dayK: number;
  readonly nightK: { value: number };

  constructor(private house: House) {
    this.nightMap = { value: house.lmNight };
    // three's lightmap is irradiance; Cycles baked radiance-weighted diffuse light
    this.dayK = house.info.lightmap.day * Math.PI;
    this.nightK = { value: (house.info.lightmap.night ?? house.info.lightmap.day) * Math.PI };
  }

  /** lay the bake on a material (once); `k` scales its afternoon and evening light (a canvas's lk) */
  apply(mat: THREE.MeshStandardMaterial, k: [number, number] = [1, 1]) {
    if (mat.userData.baked) return mat;
    mat.userData.baked = true;
    mat.lightMap = this.house.lmDay;
    mat.lightMapIntensity = this.dayK * k[0];
    const nightK = k[1] === 1 ? this.nightK : { value: this.nightK.value * k[1] };
    const before = mat.onBeforeCompile.bind(mat);
    const key = mat.customProgramCacheKey.bind(mat);
    const u = this;
    mat.onBeforeCompile = (shader, renderer) => {
      before(shader, renderer);
      shader.uniforms.uBake = u.bake;
      shader.uniforms.uNight = u.night;
      shader.uniforms.uLmNight = u.nightMap;
      shader.uniforms.uLmNightK = nightK;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>
          uniform float uBake; uniform float uNight; uniform sampler2D uLmNight; uniform float uLmNightK;`)
        .replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>
          #ifdef USE_LIGHTMAP
            // afternoon and evening, baked; the live light only where the bake steps aside
            vec3 lmNight = texture2D( uLmNight, vLightMapUv ).rgb * uLmNightK;
            vec3 bakedIrr = mix( lightMapIrradiance, lmNight, uNight );
            irradiance = mix( irradiance - lightMapIrradiance, bakedIrr, uBake );
            #if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
              iblIrradiance *= 1.0 - uBake;
            #endif
          #endif`)
        .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= 1.0 - uBake;`);
    };
    mat.customProgramCacheKey = () => `${key()}|house-baked`;
    mat.needsUpdate = true;
    return mat;
  }
}

export type HouseParts = {
  statics: THREE.Mesh[];
  ceilings: THREE.Mesh[];
  /** the hall's roof structure: decoration that lifts with the ceilings */
  roofs: THREE.Object3D[];
  /** her adapted painting figure */
  figures: THREE.Mesh[];
  /** Only the generic head/hair hides when the captured head is ready. */
  figureHeads: THREE.Mesh[];
  /** the canvas fronts, by id */
  art: Map<string, THREE.Mesh>;
  edges: THREE.Mesh[];
  props: { group: THREE.Object3D; mass: number }[];
  foliage: THREE.Mesh[];
};

/**
 * Sort the loaded house into its parts and give the architecture its
 * materials. `lib` holds the room's photographed materials by role.
 */
export function assemble(house: House, lib: Library, baked: BakedLight, edgeMat: THREE.MeshStandardMaterial): HouseParts {
  const parts: HouseParts = { statics: [], ceilings: [], roofs: [], figures: [], figureHeads: [], art: new Map(), edges: [], props: [], foliage: [] };
  const root = house.scene;
  root.updateMatrixWorld(true);
  // the GLB's nodes: what they are is in their names (and their extras)
  const top = [...root.children];
  for (const node of top) {
    const n = node.name;
    if (n.startsWith("Static_") || n.startsWith("Ceil_")) {
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const role = ((node.userData.role as string) ?? n.split("_")[1]) as Role;
        const g = m.geometry;
        // world space, as the texture UVs are laid from world position
        g.applyMatrix4(m.matrixWorld);
        m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
        m.updateMatrix();
        g.setAttribute("uv1", g.getAttribute("uv"));
        g.deleteAttribute("uv");
        worldUV(g, lib.tile(role), lib.rotate(role));
        m.material = baked.apply(lib.get(role));
        m.castShadow = true;
        m.receiveShadow = true;
        (n.startsWith("Ceil_") ? parts.ceilings : parts.statics).push(m);
      });
    } else if (n.startsWith("Art_")) {
      const id = (node.userData.artId as string) ?? n.slice(4);
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const name = (m.material as THREE.Material).name ?? "";
        if (name.startsWith("art:")) {
          m.userData.artId = id;
          parts.art.set(id, m);
        } else {
          m.material = baked.apply(edgeMat);
          parts.edges.push(m);
        }
        m.receiveShadow = true;
        m.castShadow = true;
      });
    } else if (n.startsWith("Figure_")) {
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.envMapIntensity = 0.35;
        m.material = baked.apply(mat);
        m.castShadow = false;
        m.receiveShadow = false;
        parts.figures.push(m);
        if (node.userData.headFallback) parts.figureHeads.push(m);
      });
    } else if (n.startsWith("Roof_")) {
      // high and thin: the bake already holds its shadow, so it casts none live
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; }
      });
      parts.roofs.push(node);
    } else if (n.startsWith("Prop_")) {
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
      });
      parts.props.push({ group: node, mass: Number(node.userData.mass ?? 1) });
    } else if (n.startsWith("Foliage_")) {
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.transparent = false;
        mat.alphaTest = 0.45;
        mat.side = THREE.DoubleSide;
        mat.depthWrite = true;
        m.castShadow = true;
        m.receiveShadow = true;
        m.userData.noAO = true;
        parts.foliage.push(m);
      });
    } else {
      // anything else (decoration) is still matter
      node.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
      });
    }
  }
  return parts;
}

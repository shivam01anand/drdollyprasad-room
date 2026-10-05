import * as THREE from "three";

/**
 * The room's light, baked (scripts/bake). Blender path-traces the diffuse
 * light once — the sun through the grille, the dappled door, the open side,
 * the sky, every bounce between them — into one atlas over the shell and
 * the canvases. Here that atlas goes back onto the same geometry:
 *
 *  - each baked mesh gets its lightmap UVs as `uv2` (exported in the site's
 *    own vertex order, so they map one to one);
 *  - its material (a clone, so moving objects keep live light) takes the
 *    atlas as `lightMap` on channel 2;
 *  - a shader patch swaps live diffuse light for the baked light by `uBake`:
 *    at 1 the walls are lit only by the bake (direct specular stays live, so
 *    the sun still glints); at 0 the room is lit live, as before. Dark mode
 *    and rearrange (where things move) run at 0.
 *
 * Without the files the room simply stays live.
 */
export type BakeMeta = {
  res: number;
  max: number;
  meshes: Record<string, { offset: number; count: number; runtime: string; index: number }>;
};

export const BAKE_DIR = "/bake";

export async function loadBake(
  small: boolean,
  signal: AbortSignal,
  loadTexture: (url: string) => Promise<THREE.Texture>,
) {
  const [meta, uv, tex] = await Promise.all([
    fetch(`${BAKE_DIR}/lm.json`, { signal }).then((r) => (r.ok ? (r.json() as Promise<BakeMeta>) : null)),
    fetch(`${BAKE_DIR}/lm-uv.bin`, { signal }).then((r) => (r.ok ? r.arrayBuffer() : null)),
    loadTexture(`${BAKE_DIR}/lightmap${small ? "-2k" : ""}.webp`).catch(() => null),
  ]);
  if (!meta || !uv || !tex) { tex?.dispose(); return null; }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.channel = 2;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return { meta, uv: new Float32Array(uv), tex };
}

export class Baked {
  /** 1: baked light; 0: live light */
  readonly uniform = { value: 1 };
  private clones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  readonly owned: (THREE.Material | THREE.Texture)[] = [];

  constructor(private data: NonNullable<Awaited<ReturnType<typeof loadBake>>>) {
    this.owned.push(data.tex);
  }

  /** put the bake on every mesh it was made for; returns how many took it */
  apply(scene: THREE.Object3D) {
    const { meta, uv, tex } = this.data;
    const intensity = meta.max * Math.PI;
    const seen = new Map<string, number>();
    let applied = 0;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !(m.name.startsWith("Merged_") || m.name.startsWith("Art_"))) return;
      if (!(m.material instanceof THREE.MeshStandardMaterial)) return;
      // the same naming as the export: a repeated name gets _1, _2 …
      const n = seen.get(m.name) ?? 0;
      seen.set(m.name, n + 1);
      const entry = meta.meshes[n ? `${m.name}_${n}` : m.name];
      const pos = m.geometry.getAttribute("position");
      if (!entry || entry.count !== pos.count || m.geometry.index) return;
      m.geometry.setAttribute("uv2", new THREE.BufferAttribute(uv.slice(entry.offset, entry.offset + entry.count * 2), 2));
      const mat = this.material(m.material, !m.name.startsWith("Art_"));
      mat.lightMap = tex;
      mat.lightMapIntensity = intensity;
      mat.needsUpdate = true;
      m.material = mat;
      applied++;
    });
    return applied;
  }

  /** a shared material is cloned once for the baked surfaces; a canvas's own is patched in place */
  private material(source: THREE.MeshStandardMaterial, clone: boolean) {
    if (!clone) { this.patch(source, source); return source; }
    let c = this.clones.get(source);
    if (c) return c;
    c = source.clone();
    // remembers its source, so the bake export can still name its role
    c.userData = { ...source.userData, bakeSource: source };
    this.patch(c, source);
    this.clones.set(source, c);
    this.owned.push(c);
    return c;
  }

  private patch(target: THREE.MeshStandardMaterial, source: THREE.MeshStandardMaterial) {
    const before = source.onBeforeCompile.bind(source);
    const key = source.customProgramCacheKey.bind(source);
    const u = this.uniform;
    target.onBeforeCompile = (shader, renderer) => {
      before(shader, renderer);
      shader.uniforms.uBake = u;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uBake;")
        .replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>
          #ifdef USE_LIGHTMAP
            // baked: the lightmap is the whole of the diffuse light
            irradiance = mix( irradiance - lightMapIrradiance, lightMapIrradiance, uBake );
            #if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
              iblIrradiance *= 1.0 - uBake;
            #endif
          #endif`)
        .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= 1.0 - uBake;`);
    };
    target.customProgramCacheKey = () => `${key()}|baked`;
  }

  dispose() {
    this.owned.forEach((o) => o.dispose());
  }
}

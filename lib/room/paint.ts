import * as THREE from "three";
import type { BakedLight } from "./house";
import { reliefPixels } from "./relief-pixels";

/**
 * Paint, not a print. Two things a photograph of a canvas loses, given back
 * in the room:
 *
 *  - relief: the brushwork's own texture, read from the photograph's fine
 *    detail (its luminance less a blur of it, so the strokes and the weave
 *    stand up and the big forms do not emboss), as a normal map;
 *  - varnish: a soft sheen from the painting's own gallery light, high on
 *    the canvas, that slides as the camera moves and catches on the strokes.
 *
 * Both are small. The colours are hers; nothing here may wash them out.
 */

/** a normal map from the fine detail of a painting's photograph */
export function reliefMap(image: CanvasImageSource & { width: number; height: number }, longest: number) {
  const k = longest / Math.max(image.width, image.height);
  const w = Math.max(8, Math.round(image.width * k)), h = Math.max(8, Math.round(image.height * k));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(image, 0, 0, w, h);
  const img = g.getImageData(0, 0, w, h);
  const px = img.data;
  reliefPixels(px, w, h);
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** a flat normal: the canvas before its relief is read (the program already has the map, so the swap costs no compile) */
export function flatRelief() {
  const t = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/** where a canvas's gallery light hangs (scripts/house/build.py gallery_light), in three's axes */
export function galleryLight(a: { side: string; centre: [number, number, number]; light?: [number, number, number] }) {
  if (a.light) return new THREE.Vector3(...a.light);
  const out: Record<string, [number, number]> = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
  const [nx, nz] = out[a.side] ?? [0, 1];
  return new THREE.Vector3(a.centre[0] + nx * 0.95, Math.min(3.38, a.centre[1] + 1.9), a.centre[2] + nz * 0.95);
}

/** the canvas: her painting, the bake on it, its relief and its varnish */
export function paintMaterial(tex: THREE.Texture, baked: BakedLight, light: THREE.Vector3, relief: THREE.Texture,
  lk: [number, number] = [1, 1]) {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, envMapIntensity: 0.5 });
  m.normalMap = relief;
  m.normalScale.set(0.22, 0.22);
  const sheen = { pos: { value: light }, k: { value: 0.16 } };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSheenPos = sheen.pos;
    shader.uniforms.uSheenK = sheen.k;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform vec3 uSheenPos; uniform float uSheenK;`)
      .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
        {
          // the varnish: the gallery light's reflection, broad and low, on the strokes
          vec3 lp = ( viewMatrix * vec4( uSheenPos, 1.0 ) ).xyz;
          vec3 sl = normalize( lp + vViewPosition );
          vec3 sv = normalize( vViewPosition );
          vec3 sh = normalize( sl + sv );
          float nh = max( dot( normal, sh ), 0.0 );
          float fr = 0.04 + 0.96 * pow( 1.0 - max( dot( normal, sv ), 0.0 ), 5.0 );
          // broad and soft: a varnish's glow, never a glitter
          reflectedLight.directSpecular += uSheenK * pow( nh, 12.0 ) * ( 0.5 + fr ) * vec3( 1.0, 0.93, 0.82 );
        }`);
  };
  m.customProgramCacheKey = () => "paint";
  m.userData.sheen = sheen;
  return baked.apply(m, lk);
}

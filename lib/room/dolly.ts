import * as THREE from "three";
import { DropInViewer, SceneRevealMode } from "@mkkellogg/gaussian-splats-3d";
import placement from "./dolly-head-placement.json";

/** Her captured head, fitted to the existing figure that holds the brush. */
export class Dolly {
  readonly object: DropInViewer;
  readonly anchor = new THREE.Vector3();
  private disposed = false;
  private loaded = false;
  private sortCamera = new THREE.PerspectiveCamera();
  private shown = false;
  private frustum = new THREE.Frustum();
  private clip = new THREE.Matrix4();
  // Includes every captured Gaussian and its visible support (measured < 0.20 m).
  private bounds = new THREE.Sphere(new THREE.Vector3(), 0.35);
  private worldBounds = new THREE.Sphere();

  constructor(private night: { value: number }, dpr: number, wake: () => void) {
    const object = this.object = new DropInViewer({
      gpuAcceleratedSort: false,
      sharedMemoryForWorkers: false,
      integerBasedSort: false,
      sphericalHarmonicsDegree: 0,
      sceneRevealMode: SceneRevealMode.Instant,
    });
    object.name = "Dolly_head";
    object.userData.noAO = true;
    object.visible = false;
    object.viewer.devicePixelRatio = dpr;
    object.splatMesh.devicePixelRatio = dpr;
    // The walk turns a parent pivot; the sorter needs the camera's world pose.
    object.callbackMesh.onBeforeRender = (renderer, _scene, camera) => {
      this.sortCamera.copy(camera as THREE.PerspectiveCamera, false);
      camera.matrixWorld.decompose(this.sortCamera.position, this.sortCamera.quaternion, this.sortCamera.scale);
      this.sortCamera.updateMatrixWorld(true);
      object.viewer.update(renderer, this.sortCamera);
    };
    // A completed worker sort needs a frame even when the visitor has stopped.
    const force = object.viewer.forceRenderNextFrame.bind(object.viewer);
    object.viewer.forceRenderNextFrame = () => {
      force();
      if (!this.disposed) wake();
    };
  }

  async load() {
    const position = placement.position;
    this.anchor.set(placement.head_center[0], placement.head_center[2], -placement.head_center[1]);
    await this.object.addSplatScene("/art/figure/dolly-head.splat", {
      showLoadingUI: false,
      splatAlphaRemovalThreshold: 9,
      position,
      rotation: placement.rotation,
      scale: [placement.scale, placement.scale, placement.scale],
    });
    if (this.disposed) return;
    const mat = this.object.splatMesh.material;
    mat.uniforms.uNight = this.night;
    mat.fragmentShader = mat.fragmentShader
      .replace("uniform vec3 debugColor;", "uniform vec3 debugColor; uniform float uNight;")
      .replace("gl_FragColor = vec4(color.rgb, opacity);", `
        vec3 linearColour = mix(pow((color + 0.055) / 1.055, vec3(2.4)),
          color / 12.92, step(color, vec3(0.04045)));
        vec3 light = mix(vec3(1.025, 1.0, 0.97), vec3(0.48, 0.45, 0.43), uNight);
        gl_FragColor = vec4(linearColour * light, opacity);`);
    mat.needsUpdate = true;
    this.loaded = true;
  }

  show(on: boolean) { this.shown = on; this.object.visible = this.loaded && !this.disposed && on; }

  /** DropInViewer's callback is never frustum-culled; keep it off-screen too. */
  updateVisibility(camera: THREE.Camera) {
    if (!this.loaded || this.disposed || !this.shown) { this.object.visible = false; return; }
    this.bounds.center.copy(this.anchor);
    this.worldBounds.copy(this.bounds);
    if (this.object.parent) this.worldBounds.applyMatrix4(this.object.parent.matrixWorld);
    this.clip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.clip);
    this.object.visible = this.frustum.intersectsSphere(this.worldBounds);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.object.removeFromParent();
    this.object.callbackMesh.geometry.dispose();
    this.object.callbackMesh.material.dispose();
    void this.object.dispose().catch(() => { /* a cancelled download retains the original painting head */ });
  }
}

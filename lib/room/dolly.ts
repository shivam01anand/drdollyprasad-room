import * as THREE from "three";
import { DropInViewer, SceneRevealMode } from "@mkkellogg/gaussian-splats-3d";

/** Her scan, seated at the easel. The studio's light comes gently into ours. */
export class Dolly {
  readonly object: DropInViewer;
  private disposed = false;
  private loaded = false;
  private sortCamera = new THREE.PerspectiveCamera();

  constructor(private night: { value: number }, dpr: number, wake: () => void) {
    const object = this.object = new DropInViewer({
      gpuAcceleratedSort: false,
      sharedMemoryForWorkers: false,
      integerBasedSort: false,
      sphericalHarmonicsDegree: 0,
      sceneRevealMode: SceneRevealMode.Instant,
    });
    object.name = "Dolly_scan";
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
    // Scaniverse's up is -Y; her forward is (-.74, 0, -.673).
    const flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    const yaw = Math.atan2(-0.766, -0.643) - Math.atan2(-0.74, 0.673);
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(flip);
    const seat = new THREE.Vector3(.045, .36, .27).applyQuaternion(rotation);
    const position = new THREE.Vector3(1.93, .437, -4.12).sub(seat);
    await this.object.addSplatScene("/art/figure/dolly.splat", {
      showLoadingUI: false,
      splatAlphaRemovalThreshold: 45,
      position: position.toArray(),
      rotation: rotation.toArray(),
      scale: [1, 1, 1],
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

  show(on: boolean) { this.object.visible = this.loaded && !this.disposed && on; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.object.removeFromParent();
    this.object.callbackMesh.geometry.dispose();
    this.object.callbackMesh.material.dispose();
    void this.object.dispose().catch(() => { /* a cancelled download leaves an empty stool */ });
  }
}

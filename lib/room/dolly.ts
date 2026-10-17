import * as THREE from "three";
import { DropInViewer, SceneRevealMode } from "@mkkellogg/gaussian-splats-3d";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import placement from "./dolly-placement.json";

/** Her isolated take 124, resting beside the easel in her captured seated pose. */
export class Dolly {
  readonly object: DropInViewer;
  readonly anchor = new THREE.Vector3();
  private seatResources: { dispose(): void }[] = [];
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
    // Scaniverse's up is -Y. Face the visitor so her actual likeness is visible;
    // preserve the captured hands-in-lap pose rather than inventing a brush grip.
    const flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    const yaw = THREE.MathUtils.degToRad(placement.yaw_degrees);
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(flip);
    const seat = new THREE.Vector3(...placement.source_seat).multiplyScalar(placement.scale).applyQuaternion(rotation);
    const position = new THREE.Vector3(...placement.studio_seat).sub(seat);
    this.anchor.set(0, .14, -.1).multiplyScalar(placement.scale).applyQuaternion(rotation).add(position);
    await this.object.addSplatScene("/art/figure/dolly-124.splat", {
      showLoadingUI: false,
      splatAlphaRemovalThreshold: 45,
      position: position.toArray(),
      rotation: rotation.toArray(),
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
    this.buildSeat(yaw);
    this.loaded = true;
  }

  private buildSeat(yaw: number) {
    const group = new THREE.Group();
    group.name = "Dolly_seat";
    group.position.set(placement.studio_seat[0], 0, placement.studio_seat[2]);
    group.rotation.y = yaw;
    const wood = new THREE.MeshStandardMaterial({ color: 0x65442e, roughness: .82 });
    const linen = new THREE.MeshStandardMaterial({ color: 0xbeb196, roughness: 1 });
    this.seatResources.push(wood, linen);
    const part = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const geometry = new RoundedBoxGeometry(w, h, d, 2, Math.min(.015, h / 4));
      this.seatResources.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };
    const w = placement.seat_width, d = placement.seat_depth;
    part(w, .08, d, 0, .385, 0, wood);
    part(w - .04, .07, d - .04, 0, .425, 0, linen);
    for (const x of [-1, 1]) for (const z of [-1, 1])
      part(.055, .35, .055, x * (w / 2 - .07), .175, z * (d / 2 - .07), wood);
    this.object.add(group);
  }

  show(on: boolean) { this.object.visible = this.loaded && !this.disposed && on; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.object.removeFromParent();
    this.object.callbackMesh.geometry.dispose();
    this.object.callbackMesh.material.dispose();
    this.seatResources.forEach(resource => resource.dispose());
    void this.object.dispose().catch(() => { /* a cancelled download leaves an empty stool */ });
  }
}

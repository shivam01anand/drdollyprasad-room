/** The small part of GaussianSplats3D 0.4.7 used by the house. */
declare module "@mkkellogg/gaussian-splats-3d" {
  import * as THREE from "three";
  export const SceneRevealMode: { Instant: number };
  export class DropInViewer extends THREE.Group {
    constructor(options: {
      gpuAcceleratedSort: boolean;
      sharedMemoryForWorkers: boolean;
      integerBasedSort: boolean;
      sphericalHarmonicsDegree: number;
      sceneRevealMode: number;
    });
    splatMesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> & { devicePixelRatio: number };
    callbackMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    viewer: {
      devicePixelRatio: number;
      forceRenderNextFrame(): void;
      update(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void;
    };
    addSplatScene(path: string, options: {
      showLoadingUI: boolean;
      splatAlphaRemovalThreshold: number;
      position: number[];
      rotation: number[];
      scale: number[];
    }): PromiseLike<void>;
    dispose(): Promise<void>;
  }
}

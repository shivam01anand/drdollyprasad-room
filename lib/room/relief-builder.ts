import * as THREE from "three";
import { reliefMap } from "./paint";

type Reply = { id: number; width: number; height: number; data: ArrayBuffer } | { id: number; error: string };

/** Preserve the same brushwork while keeping its pixel work off the animation thread. */
export class ReliefBuilder {
  private worker?: Worker;
  private nextId = 0;
  private disposed = false;
  private unavailable = false;
  private pending = new Map<number, { resolve(texture: THREE.Texture): void; reject(error: Error): void }>();

  async build(image: HTMLImageElement, longest: number): Promise<THREE.Texture> {
    if (this.disposed) throw new Error("disposed");
    if (!this.unavailable && typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined") {
      try {
        if (!this.worker) {
          this.worker = new Worker(new URL("./relief.worker.ts", import.meta.url), { type: "module" });
          this.worker.onmessage = ({ data }: MessageEvent<Reply>) => {
            const job = this.pending.get(data.id);
            if (!job) return;
            this.pending.delete(data.id);
            if ("error" in data) { job.reject(new Error(data.error)); return; }
            const texture = new THREE.DataTexture(new Uint8Array(data.data), data.width, data.height);
            texture.colorSpace = THREE.NoColorSpace;
            texture.flipY = false;
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            job.resolve(texture);
          };
          this.worker.onerror = () => {
            this.unavailable = true;
            this.worker?.terminate();
            this.worker = undefined;
            this.rejectPending(new Error("Relief worker unavailable"));
          };
        }
        const imageBitmap = await createImageBitmap(image);
        if (this.disposed) { imageBitmap.close(); throw new Error("disposed"); }
        const id = this.nextId++;
        return await new Promise<THREE.Texture>((resolve, reject) => {
          this.pending.set(id, { resolve, reject });
          try {
            this.worker!.postMessage({ id, image: imageBitmap, longest }, [imageBitmap]);
          } catch (error) {
            this.pending.delete(id);
            imageBitmap.close();
            reject(error);
          }
        });
      } catch {
        if (this.disposed) throw new Error("disposed");
      }
    }
    // Older browsers retain the original rendering path and appearance.
    return reliefMap(image, longest);
  }

  private rejectPending(error: Error) {
    for (const job of this.pending.values()) job.reject(error);
    this.pending.clear();
  }

  dispose() {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = undefined;
    this.rejectPending(new Error("disposed"));
  }
}

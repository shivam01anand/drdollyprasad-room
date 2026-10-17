import { reliefPixels } from "./relief-pixels";

type Job = { id: number; image: ImageBitmap; longest: number };
type Reply = { id: number; width: number; height: number; data: ArrayBuffer } | { id: number; error: string };
const worker = self as unknown as {
  onmessage: ((event: MessageEvent<Job>) => void) | null;
  postMessage(message: Reply, transfer?: Transferable[]): void;
};

worker.onmessage = ({ data: { id, image, longest } }) => {
  try {
    const k = longest / Math.max(image.width, image.height);
    const width = Math.max(8, Math.round(image.width * k));
    const height = Math.max(8, Math.round(image.height * k));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("No canvas context");
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    reliefPixels(pixels, width, height);
    const data = pixels.buffer as ArrayBuffer;
    worker.postMessage({ id, width, height, data }, [data]);
  } catch (error) {
    worker.postMessage({ id, error: String(error) });
  } finally {
    image.close();
  }
};

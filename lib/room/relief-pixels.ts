/** The original painting-relief calculation, usable on a worker or the main thread.
 * Mutates decoded RGBA pixels in place; resolution and arithmetic are unchanged. */
export function reliefPixels(px: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const lum = new Float32Array(n), tmp = new Float32Array(n), hp = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) lum[i] = (0.2126 * px[j] + 0.7152 * px[j + 1] + 0.0722 * px[j + 2]) / 255;
  // first a light 3×3 blur: a photograph's grain and varnish glints are not brushwork,
  // and left in they glitter under the light like sandpaper
  {
    const src = lum.slice();
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        lum[i] = (4 * src[i] + 2 * (src[i - 1] + src[i + 1] + src[i - w] + src[i + w])
          + src[i - w - 1] + src[i - w + 1] + src[i + w - 1] + src[i + w + 1]) / 16;
      }
  }
  // high pass: the photograph less a 5×5 box of itself (two separable passes, edges clamped)
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let d = -2; d <= 2; d++) { const xx = x + d; s += lum[row + (xx < 0 ? 0 : xx >= w ? w - 1 : xx)]; }
      tmp[row + x] = s * 0.2;
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let d = -2; d <= 2; d++) { const yy = y + d; s += tmp[(yy < 0 ? 0 : yy >= h ? h - 1 : yy) * w + x]; }
      hp[y * w + x] = lum[y * w + x] - s * 0.2;
    }
  // Sobel on the detail; v runs down the canvas (glTF), as rows do. The border keeps a flat normal.
  const strength = 2.4;
  for (let j = 0; j < n * 4; j += 4) { px[j] = 128; px[j + 1] = 128; px[j + 2] = 255; px[j + 3] = 255; }
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, u = i - w, d = i + w;
      const dx = hp[u + 1] + 2 * hp[i + 1] + hp[d + 1] - hp[u - 1] - 2 * hp[i - 1] - hp[d - 1];
      const dy = hp[d - 1] + 2 * hp[d] + hp[d + 1] - hp[u - 1] - 2 * hp[u] - hp[u + 1];
      const nx = -dx * strength, ny = -dy * strength;
      const l = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const j = i * 4;
      px[j] = (nx * l * 0.5 + 0.5) * 255;
      px[j + 1] = (ny * l * 0.5 + 0.5) * 255;
      px[j + 2] = (l * 0.5 + 0.5) * 255;
    }
}

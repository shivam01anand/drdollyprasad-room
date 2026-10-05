"""cut a white-background reference into an RGBA card: background = white pixels
connected to the border; edges feathered and de-fringed (the white unmixed)"""
import sys, cv2, numpy as np
for name in sys.argv[1:]:
    im = cv2.imread(f"{name}.png").astype(np.float32) / 255
    h, w = im.shape[:2]
    white = (im.min(axis=2) > 0.9).astype(np.uint8)
    ff = white.copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    for (x, y) in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)] + [(x, 0) for x in range(0, w, 16)] + [(x, h - 1) for x in range(0, w, 16)] + [(0, y) for y in range(0, h, 16)] + [(w - 1, y) for y in range(0, h, 16)]:
        if ff[y, x] == 1:
            cv2.floodFill(ff, mask, (x, y), 2)
    bg = (ff == 2).astype(np.float32)
    if name != "banana_leaf":
        # a spray has white enclosed between its branches: every near-white pixel is background
        bg = np.maximum(bg, (im.min(axis=2) > 0.86).astype(np.float32))
    # soft edge: how white a pixel is, but only next to the background
    near = cv2.dilate(bg, np.ones((5, 5), np.uint8))
    whiteness = np.clip((im.min(axis=2) - 0.72) / 0.28, 0, 1)
    a = 1 - np.where(near > 0, np.maximum(bg, whiteness * near), 0)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    a = np.clip(a, 0, 1)
    rgb = np.clip((im - (1 - a[..., None]) * 1.0) / np.maximum(a[..., None], 0.05), 0, 1)
    out = np.dstack([rgb, a])
    # bleed colour into transparent pixels so mipmaps never pull in white
    col = (rgb * 255).astype(np.uint8); m = (a < 0.02).astype(np.uint8)
    col = cv2.inpaint(col, m, 3, cv2.INPAINT_TELEA)
    rgba = np.dstack([col, (a * 255 + 0.5).astype(np.uint8)])
    ys, xs = np.where(a > 0.02)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(f"{name}_cut.png", rgba)
    print(name, rgba.shape, f"coverage {float((a > 0.5).mean()):.2f}")

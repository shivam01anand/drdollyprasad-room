"""
Turn a bake into what the site loads.

    python3 scripts/bake/encode.py <bake dir> <public/bake dir>

The lightmap is linear diffuse lighting (Cycles: colour = albedo × this).
It ships as 8-bit sRGB WebP with one scale: texel = (L / MAX) encoded with
the sRGB curve, which three decodes back to linear, so the site uses
lightMapIntensity = MAX × π (three's lightmap is irradiance; Lambert / π).
A 2048 px copy goes to phones. Triangular dither keeps 8 bits from banding.
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
L = np.load(os.path.join(src, "lightmap.npy")).astype(np.float32)
L = np.nan_to_num(np.maximum(L, 0.0))
lum = L @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
covered = lum > 1e-6
MAX = float(np.percentile(lum[covered], 99.8)) * 1.08


def srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


rng = np.random.default_rng(7)
dither = (rng.random(L.shape[:2] + (1,), dtype=np.float32) - rng.random(L.shape[:2] + (1,), dtype=np.float32)) / 255.0
enc = np.clip(srgb(L / MAX) + dither, 0, 1)
img = Image.fromarray((enc * 255 + 0.5).astype(np.uint8), "RGB")
res = img.width
img.save(os.path.join(dst, "lightmap.webp"), quality=92, method=6)
img.resize((min(2048, res), min(2048, res)), Image.LANCZOS).save(os.path.join(dst, "lightmap-2k.webp"), quality=90, method=6)
img.resize((1024, 1024), Image.LANCZOS).save(os.path.join(src, "preview.png"))
shutil.copy(os.path.join(src, "lm-uv.bin"), os.path.join(dst, "lm-uv.bin"))
meta = json.load(open(os.path.join(src, "lm.json")))
meta["max"] = MAX
json.dump(meta, open(os.path.join(dst, "lm.json"), "w"), indent=1)
print(f"MAX={MAX:.3f}  res={res}  covered={covered.mean():.1%}  "
      f"webp={os.path.getsize(os.path.join(dst, 'lightmap.webp')) / 1e6:.2f} MB")

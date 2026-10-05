"""
Put an exported house into the site.

    python3 scripts/house/publish.py <export dir> <build dir>

<export dir> holds house.glb and lm-{day,night}.npy (export.py);
<build dir> holds house.json (build.py, Blender coordinates).

Writes public/house/:
  house.glb
  lm-day.webp, lm-night.webp      (and -2k for phones): 8-bit sRGB, one scale each
  house.json                      in three.js coordinates (y up: (x, y, z)b -> (x, z, -y)t),
                                  with each lightmap's scale
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

src, build = sys.argv[1], sys.argv[2]
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "house")
os.makedirs(dst, exist_ok=True)


def srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


scales = {}
rng = np.random.default_rng(7)
for tag in ("day", "night"):
    p = os.path.join(src, f"lm-{tag}.npy")
    if not os.path.exists(p):
        continue
    L = np.nan_to_num(np.maximum(np.load(p).astype(np.float32), 0))
    lum = L @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    cov = lum > 1e-6
    mx = float(np.percentile(lum[cov], 99.7)) * 1.1
    scales[tag] = mx
    d = (rng.random(L.shape[:2] + (1,), dtype=np.float32) - rng.random(L.shape[:2] + (1,), dtype=np.float32)) / 255
    im = Image.fromarray((np.clip(srgb(L / mx) + d, 0, 1) * 255 + 0.5).astype(np.uint8))
    im.save(os.path.join(dst, f"lm-{tag}.webp"), quality=90, method=6)
    im.resize((min(2048, im.width),) * 2, Image.LANCZOS).save(os.path.join(dst, f"lm-{tag}-2k.webp"), quality=88, method=6)
    print(tag, "max", round(mx, 3), os.path.getsize(os.path.join(dst, f"lm-{tag}.webp")) // 1024, "KB")

# the model: textures capped at 1024 and re-encoded as WebP, geometry Draco-compressed
import subprocess
G = os.path.join(os.path.dirname(os.path.abspath(__file__)), "node_modules", ".bin", "gltf-transform")
tmp = os.path.join(src, "_t")
os.makedirs(tmp, exist_ok=True)
subprocess.run([G, "resize", os.path.join(src, "house.glb"), f"{tmp}/a.glb", "--width", "1024", "--height", "1024"], check=True)
subprocess.run([G, "webp", f"{tmp}/a.glb", f"{tmp}/b.glb", "--quality", "82"], check=True)
subprocess.run([G, "draco", f"{tmp}/b.glb", os.path.join(dst, "house.glb")], check=True)
shutil.rmtree(tmp)
info = json.load(open(os.path.join(build, "house.json")))


def t(p):
    return [p[0], p[2], -p[1]]


out = {
    "lightmap": scales,
    "art": {k: {"w": v["w"], "h": v["h"], "side": v["side"], "centre": t(v["centre"])} for k, v in info["art"].items()},
    "cams": {k: {"eye": t(v["eye"]), "target": t(v["target"]), "fov": v["fov"]} for k, v in info["cams"].items()},
    "anchors": {k: t(v) for k, v in info["anchors"].items()},
    "sun": {"toSun": t(info["lights"]["sun"]["toSun"])},
    # boxes: Blender [x0,x1,y0,y1,z0,z1] -> three min/max
    "colliders": [[c[0], c[4], -c[3], c[1], c[5], -c[2]] for c in info["colliders"]],
    "plan": info.get("plan", {}),
    "props": info["props"],
}
json.dump(out, open(os.path.join(dst, "house.json"), "w"), indent=1)
print("published", sorted(os.listdir(dst)), round(os.path.getsize(os.path.join(dst, "house.glb")) / 1e6, 2), "MB glb")

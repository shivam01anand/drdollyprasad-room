"""
The opening's still life into the site: WebP in public/intro, the layout in lib/intro.json.

    python3 scripts/intro/publish.py <render dir>
"""
import json
import os
import sys

from PIL import Image

OUT = sys.argv[1]
d = json.load(open(os.path.join(OUT, "intro.json")))
W, HT = d["w"], d["h"]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
dst = os.path.join(ROOT, "public", "intro")
os.makedirs(dst, exist_ok=True)
Image.open(os.path.join(OUT, "lamp.png")).save(os.path.join(dst, "lamp.webp"), quality=88, method=6)
# the shadow, kept to the pool at the lamp's foot: the catcher also holds a faint
# wash from the sky across the whole floor, which would show the image's edges
import numpy as np
sh = np.asarray(Image.open(os.path.join(OUT, "shadow.png")).convert("RGBA")).astype(np.float32)
yy, xx = np.mgrid[0:HT, 0:W]
bx, by = W * 0.5, HT * d["base"][1]
dist = np.sqrt(((xx - bx) / (W * 0.42)) ** 2 + ((yy - by) / (HT * 0.075)) ** 2)
fade = np.clip((1.0 - dist) / 0.55, 0, 1)
sh[..., 3] *= fade * fade * (3 - 2 * fade)
Image.fromarray(sh.astype(np.uint8)).resize((W // 2, HT // 2), Image.LANCZOS).save(os.path.join(dst, "shadow.webp"), quality=80, method=6)
for k in range(6):
    Image.open(os.path.join(OUT, f"marigold-{k}.png")).resize((96, 96), Image.LANCZOS).save(os.path.join(dst, f"marigold-{k}.webp"), quality=88, method=6)
# the layout the preloader composes from: compact, imported by components/Preloader.tsx
r = lambda v: round(v, 4)
json.dump({"aspect": round(W / HT, 4), "head": r(d["head"]), "base": [r(d["base"][0]), r(d["base"][1])], "wicks": [[r(x), r(y)] for x, y in d["wicks"]],
           "ring": [[r(f["x"]), r(f["y"]), int(f["behind"]), f["v"], f["s"], f["r"], int(f["m"])] for f in d["ring"]]},
          open(os.path.join(ROOT, "lib", "intro.json"), "w"), separators=(",", ":"))
for f in sorted(os.listdir(dst)):
    print(f, os.path.getsize(os.path.join(dst, f)) // 1024, "KB")

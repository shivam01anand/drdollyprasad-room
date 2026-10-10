"""
The house's painting textures (public/art/room), sized to how large each canvas can ever be seen:
1300 px per metre of its longest side, capped at 1200 px, re-encoded only where that saves a
fifth or more. The lightbox and the work pages use their own files; these are for the room only.

    python3 scripts/art/textures.py          (reads the canvas sizes from public/house/house.json)
"""
import io
import json
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROOM = os.path.join(ROOT, "public", "art", "room")
art = json.load(open(os.path.join(ROOT, "public", "house", "house.json")))["art"]
saved = 0
for wid, a in sorted(art.items()):
    p = os.path.join(ROOM, f"{wid}.jpg")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB")
    want = min(1200, round(max(a["w"], a["h"]) * 1300))
    if max(im.size) > want:
        k = want / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=88, optimize=True, progressive=True, subsampling=0)
    before = os.path.getsize(p)
    if b.tell() < before * 0.8:
        open(p, "wb").write(b.getvalue())
        saved += before - b.tell()
        print(f"{wid:28s} {before // 1024:4d}K -> {b.tell() // 1024:4d}K  {im.size}")
print(f"saved {saved / 1e6:.2f} MB")

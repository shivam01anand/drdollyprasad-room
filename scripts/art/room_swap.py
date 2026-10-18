"""Swap a painting inside a rendered room photo, keeping the room's light on it.
usage: room_swap.py <repo> <id> <new photo> <longest cm> <pxPerCm> <floor> <cx> <sill> <out.webp> <old photo> [debug.jpg]"""
import sys
from PIL import Image, ImageFilter, ImageChops
repo, wid, newp, cm, ppc, floor, cx, sill, out = sys.argv[1:10]
cm, ppc, floor, cx, sill = map(float, (cm, ppc, floor, cx, sill))
room = Image.open(f"{repo}/public/art/rooms/{wid}.webp").convert("RGB")
old = Image.open(sys.argv[10]).convert("RGB")
asp = old.width / old.height
L = cm * ppc
w = L if asp >= 1 else L * asp; h = L / asp if asp >= 1 else L
x0 = cx - w / 2; y0 = floor - sill * ppc - h
box = (round(x0), round(y0), round(x0 + w), round(y0 + h))
bw, bh = box[2] - box[0], box[3] - box[1]
crop = room.crop(box)
olds = old.resize((bw, bh), Image.LANCZOS)
new = Image.open(newp).convert("RGB").resize((bw, bh), Image.LANCZOS)
r = 12
# light = render / photo, smoothed; apply to the new photo
import numpy as np
c = np.asarray(crop, np.float32); o = np.asarray(olds, np.float32); n = np.asarray(new, np.float32)
def blur(a): return np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32)
light = (blur(c) + 1) / (blur(o) + 1)
res = np.clip(n * light, 0, 255).astype(np.uint8)
outim = room.copy(); outim.paste(Image.fromarray(res), box[:2])
outim.save(out, "WEBP", quality=88, method=6)
outim.resize((240, 160), Image.LANCZOS).save(out.replace(".webp", "-thumb.webp"), "WEBP", quality=82, method=6)
if len(sys.argv) > 11:
    pad = 60; b2 = (max(0, box[0]-pad), max(0, box[1]-pad), box[2]+pad, box[3]+pad)
    a, b = room.crop(b2), outim.crop(b2)
    d = Image.new("RGB", (a.width*2+10, a.height), "white"); d.paste(a, (0, 0)); d.paste(b, (a.width+10, 0)); d.save(sys.argv[11])
print(wid, "box", box, "diff before swap (should be small):", float(np.abs(blur(c)/ (blur(o)+1)).std()))

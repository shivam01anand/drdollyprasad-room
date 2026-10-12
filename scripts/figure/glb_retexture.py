"""
Her colours changed without a rebake: a baked house.glb's images replaced by name (her fleece, her
top), nothing else in it touched — its geometry and its light layouts stay exactly as baked, so the
lightmaps baked with it still fit.

    python3 scripts/figure/glb_retexture.py <house.glb> top=assets/figure/tex/top.png fleece=assets/figure/tex/fleece.png

(Each image is written at the size the one it replaces had.)
"""
import io
import json
import struct
import sys

from PIL import Image

path = sys.argv[1]
swaps = dict(a.split("=", 1) for a in sys.argv[2:])
b = open(path, "rb").read()
magic, ver, length = struct.unpack("<III", b[:12])
assert magic == 0x46546C67, "not a GLB"
jl, jt = struct.unpack("<II", b[12:20])
js = json.loads(b[20:20 + jl])
bl, bt = struct.unpack("<II", b[20 + jl:28 + jl])
bin_ = bytearray(b[28 + jl:28 + jl + bl])
done = []
for im in js["images"]:
    name = im.get("name")
    if name not in swaps:
        continue
    bv = js["bufferViews"][im["bufferView"]]
    old = Image.open(io.BytesIO(bytes(bin_[bv.get("byteOffset", 0):bv.get("byteOffset", 0) + bv["byteLength"]])))
    new = Image.open(swaps[name]).convert(old.mode if old.mode in ("RGB", "RGBA") else "RGBA").resize(old.size, Image.LANCZOS)
    out = io.BytesIO()
    new.save(out, "PNG")
    data = out.getvalue()
    while len(bin_) % 4:
        bin_.append(0)
    js["bufferViews"].append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(data)})
    bin_ += data
    im["bufferView"] = len(js["bufferViews"]) - 1
    im["mimeType"] = "image/png"
    done.append(f"{name} {old.size[0]}x{old.size[1]}")
while len(bin_) % 4:
    bin_.append(0)
js["buffers"][0]["byteLength"] = len(bin_)
jb = json.dumps(js, separators=(",", ":")).encode()
while len(jb) % 4:
    jb += b" "
glb = struct.pack("<III", magic, ver, 12 + 8 + len(jb) + 8 + len(bin_)) + struct.pack("<II", len(jb), jt) + jb + \
    struct.pack("<II", len(bin_), bt) + bytes(bin_)
open(path, "wb").write(glb)
print("replaced:", ", ".join(done) or "nothing")

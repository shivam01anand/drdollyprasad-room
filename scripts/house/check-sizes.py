"""
Every painting in the house hangs at its knowledge-base size.

    python3 scripts/house/check-sizes.py [public/house] [path/to/kb/paintings.json] [--tol=0.02]

Compares each canvas in house.json (art[id].w, .h, metres) and each Art_<id> mesh in house.glb
(its bounding box, from the accessor's min/max) with kb/paintings.json `size_in` (height × width,
inches; 1 in = 0.0254 m). The KB value is used whatever its status, `conflict` included. The kb id
is matched to the site id through the KB's image file name ("01-rickshaw-puller-and-coin.jpg").
Exits 1 if any work is missing or off by more than the tolerance (2 % by default).
"""
import json
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
pub = args[0] if args else os.path.join(HERE, "..", "..", "public", "house")
kb_path = args[1] if len(args) > 1 else os.path.expanduser("~/Desktop/Shubham-code/dolly-engine/kb/paintings.json")
tol = float(opts.get("tol", 0.02))
IN = 0.0254

kb = {}
for p in json.load(open(kb_path))["paintings"]:
    slug = os.path.splitext(p["image_file"])[0].split("-", 1)[1]
    s = p["size_in"]
    kb[slug] = (p["id"], p["title"]["value"], s["width"] * IN, s["height"] * IN, s.get("status"))

info = json.load(open(os.path.join(pub, "house.json")))

# the glb's canvases: the front face spans width × height; depth is the stretcher's
glb = open(os.path.join(pub, "house.glb"), "rb").read()
n = struct.unpack("<I", glb[12:16])[0]
g = json.loads(glb[20:20 + n])
mesh_box = {}
for node in g["nodes"]:
    name = node.get("name", "")
    if not name.startswith("Art_") or "mesh" not in node:
        continue
    lo, hi = [1e9] * 3, [-1e9] * 3
    for prim in g["meshes"][node["mesh"]]["primitives"]:
        acc = g["accessors"][prim["attributes"]["POSITION"]]
        lo = [min(a, b) for a, b in zip(lo, acc["min"])]
        hi = [max(a, b) for a, b in zip(hi, acc["max"])]
    sx = node.get("scale", [1, 1, 1])
    ext = sorted(abs(h - l) * abs(s) for l, h, s in zip(lo, hi, sx))
    mesh_box[name[4:]] = ext            # [depth, a, b]; the two larger are the face


def off(a, b):
    return abs(a - b) / b


ok = 0
bad = []
rows = []
for slug, (kid, title, kw, kh, status) in sorted(kb.items(), key=lambda kv: kv[1][0]):
    a = info["art"].get(slug)
    if not a:
        bad.append(f"{kid} {title}: not in house.json")
        continue
    ej = max(off(a["w"], kw), off(a["h"], kh))
    mb = mesh_box.get(slug)
    em = None
    if mb:
        face = sorted([kw, kh])
        em = max(off(mb[1], face[0]), off(mb[2], face[1]))
    worst = max(ej, em if em is not None else 0)
    flag = "ok" if worst <= tol and mb else "OFF"
    if flag == "ok":
        ok += 1
    else:
        bad.append(f"{kid} {title}: json {a['w']:.3f}×{a['h']:.3f} m, glb {mb}, kb {kw:.3f}×{kh:.3f} m")
    rows.append(f"{kid}  {title:28.28s} kb {kh / IN:4.0f}×{kw / IN:<4.0f} in  json {a['h'] / IN:5.1f}×{a['w'] / IN:<5.1f} in"
                f"  glb {'%.1f%%' % (em * 100) if em is not None else 'missing':>7}  {flag}"
                f"{'  (kb ' + status + ')' if status not in (None, 'confirmed') else ''}")

print("\n".join(rows))
print(f"\n{ok}/{len(kb)} within {tol:.0%} of the kb size (house.json and house.glb)")
for b in bad:
    print("  " + b)
sys.exit(0 if not bad else 1)

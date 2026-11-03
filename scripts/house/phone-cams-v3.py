"""Phone single-painting cams, V3 review fixes (COO, 3 Nov). Run after stop-cams.mjs; idempotent.
1. Two-row hangs (Portraits east): no neighbour may show. Shift the view up or down (and, if that is not
   enough, tighten it, keeping the painting at most 92 % of the width) until only its own painting is in the band.
2. The first painting of a room with a plant pair beside it: widen 10 % (painting still about 65 % of the width)
   so the pair frames it."""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
H = json.load(open(R / "public/house/house.json"))
art, cams = H["art"], H["cams"]
WIDEN = ["woman-with-bird", "monk-and-green-buddha", "rickshaw-puller-and-coin", "milkman-on-bicycle"]
F = 0.03                                  # frame + a little air
def along(a): return a["centre"][0] if a["side"] in "NS" else a["centre"][2]
def clash(id, cu, cy, sw, sh):
    a = art[id]
    for k, b in art.items():
        if k == id or b.get("study") or b["side"] != a["side"]: continue
        if abs((b["centre"][2] if a["side"] in "NS" else b["centre"][0]) - (a["centre"][2] if a["side"] in "NS" else a["centre"][0])) > 0.05: continue
        u, y = along(b), b["centre"][1]
        if abs(u - cu) < sw / 2 + b["w"] / 2 + F and abs(y - cy) < sh / 2 + b["h"] / 2 + F: return True
    return False
done = H.setdefault("_phoneV3", {})
for key in [k for k in cams if k.startswith("n:s:p:") and "+" not in k]:
    id = key[6:]; c = cams[key]
    base = done.get(key) or {"eye": c["eye"], "target": c["target"], "span": c["span"]}
    done[key] = base
    c.update(json.loads(json.dumps(base)))
    a = art[id]; cu, cy = along(a), a["centre"][1]
    sw, sh = c["span"]; r = sh / sw
    if clash(id, cu, cy, sw, sh):
        best = None
        for k in range(0, 25):
            w2 = sw * (1 - 0.01 * k)
            if a["w"] / w2 > 0.92: break
            h2 = w2 * r
            room = (h2 - a["h"]) / 2 - 0.06
            for j in range(0, 41):
                for sgn in (1, -1):
                    dy = sgn * 0.02 * j
                    if abs(dy) > room: continue
                    if not clash(id, cu, cy + dy, w2, h2): best = (w2, dy); break
                if best: break
            if best: break
        if best:
            w2, dy = best
            c["span"] = [round(w2, 4), round(w2 * r, 4)]
            c["target"] = [c["target"][0], round(c["target"][1] + dy, 4), c["target"][2]]
            c["eye"] = [c["eye"][0], round(c["eye"][1] + dy, 4), c["eye"][2]]
            print("clear", id, "span", c["span"][0], "dy", round(dy, 2))
        else: print("STILL NEIGHBOUR", id)
    if id in WIDEN:
        c["span"] = [round(c["span"][0] * 1.1, 4), round(c["span"][1] * 1.1, 4)]
        print("widen", id, c["span"])
json.dump(H, open(R / "public/house/house.json", "w"), indent=1)

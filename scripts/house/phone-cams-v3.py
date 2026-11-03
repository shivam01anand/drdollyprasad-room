"""Phone single-painting cams (and one laptop cam, below), V3 review fixes (COO, 3 Nov). Run after stop-cams.mjs; idempotent.
1. Two-row hangs (Portraits east): no neighbour may show. Shift the view up or down (and, if that is not
   enough, tighten it, keeping the painting at most 92 % of the width) until only its own painting is in the band.
   Prefer a little tightening (painting up to 92 % wide) to a big shift that shows wall above or below.
2. The first painting of a room with a plant pair beside it: widen 10 % (painting still about 65 % of the width)
   so the pair frames it."""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
H = json.load(open(R / "public/house/house.json"))
art, cams = H["art"], H["cams"]
WIDEN = ["woman-with-bird", "monk-and-green-buddha", "rickshaw-puller-and-coin", "milkman-on-bicycle"]
F = 0.03                                  # frame + a little air
HEAD = 56 / 622
# Portraits east, lower row: on phone their picture lights step aside while a top-row portrait is in view
# (Room.ts LOW_ROW), so only their frames count as neighbours there
LOW_ROW = {"patterned-turban-portrait", "riverside-figures"}                           # the header's strip over the band, as a share of the band's height
def along(a): return a["centre"][0] if a["side"] in "NS" else a["centre"][2]
def clash(id, cu, cy, sw, sh):
    a = art[id]
    for k, b in art.items():
        if k == id or b.get("study") or b["side"] != a["side"]: continue
        if abs((b["centre"][2] if a["side"] in "NS" else b["centre"][0]) - (a["centre"][2] if a["side"] in "NS" else a["centre"][0])) > 0.05: continue
        u, y = along(b), b["centre"][1]
        # the wall shows behind the header too (56 of the band's 622 px above it): count that strip
        # a neighbour reaches 0.13 m over its frame: its brass picture light
        top, bot = cy + sh / 2 + HEAD * sh, cy - sh / 2
        lamp = 0.025 if k in LOW_ROW and y < a["centre"][1] else 0.13
        if abs(u - cu) < sw / 2 + b["w"] / 2 + F and y - b["h"] / 2 - F < top and y + b["h"] / 2 + lamp > bot: return True
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
        # the smallest move up or down that clears every neighbour, for each tightening step; prefer the
        # least tightening that keeps the painting near the middle (|dy| <= 0.12 m), so no wall band shows
        opts = []
        for k in range(0, 25):
            w2 = sw * (1 - 0.01 * k)
            if a["w"] / w2 > 0.92: break
            h2 = w2 * r; room = (h2 - a["h"]) / 2 - 0.06
            for j in range(0, 41):
                hit = [sg * 0.02 * j for sg in (1, -1) if 0.02 * j <= room and not clash(id, cu, cy + sg * 0.02 * j, w2, h2)]
                if hit: opts.append((w2, hit[0])); break
        # the most centred option (QC 3 Nov: the painting sits in the middle of the band), then the least tightening
        best = min(opts, key=lambda o: (round(abs(o[1]), 2), -o[0])) if opts else None
        if best:
            w2, dy = best
            c["span"] = [round(w2, 4), round(w2 * r, 4)]
            c["target"] = [c["target"][0], round(c["target"][1] + dy, 4), c["target"][2]]
            # level: eye at the aim's height, so the frames stay square (no keystone)
            c["eye"] = [c["eye"][0], c["target"][1], c["eye"][2]]
            print("clear", id, "span", c["span"][0], "dy", round(dy, 2))
        else: print("STILL NEIGHBOUR", id)
    if id in WIDEN:
        # Buddha Under the Bodhi is tall (height-limited): 10 % more shows the clerestory over the Faith
        # partition as a green box under the header (QC 3 Nov). 3 % keeps the plant pair at the edges.
        k = 1.03 if id == "monk-and-green-buddha" else 1.1
        c["span"] = [round(c["span"][0] * k, 4), round(c["span"][1] * k, 4)]
        print("widen", id, c["span"])
# laptop, Shree 420 on the street's east wall: Terracotta Pots on the south wall showed as a 17 % sliver
# at the right edge. Pan the eye 0.5 m and the aim 0.27 m away from that corner and tighten 15 %:
# the painting is 85 % of the band's height, a little right of centre, and no neighbour shows.
key = "s:d:street:1"; c = cams[key]
base = done.get(key) or {"eye": c["eye"], "target": c["target"], "span": c["span"]}
done[key] = base; c.update(json.loads(json.dumps(base)))
c["eye"] = [c["eye"][0], c["eye"][1], round(c["eye"][2] - 0.5, 4)]
c["target"] = [c["target"][0], c["target"][1], round(c["target"][2] - 0.27, 4)]
c["span"] = [round(v * 0.85, 4) for v in c["span"]]
print("street:1", c)
json.dump(H, open(R / "public/house/house.json", "w"), indent=1)

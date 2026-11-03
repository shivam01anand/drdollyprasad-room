#!/usr/bin/env python3
"""Find where each painting really sits in its WORKS-FINAL room photo (the manifest rectangles lag behind
the images). Usage: locate-art.py <WORKS-FINAL dir> <out.json>. Template-matches public/art/works/<slug>.jpg."""
import sys, json, os, cv2
src, out = sys.argv[1], sys.argv[2]
res = {}
for f in sorted(os.listdir(os.path.join(src, "16x9"))):
    slug = f[:-4]
    wp = os.path.join("public/art/works", slug + ".jpg")
    if not os.path.exists(wp): continue
    room = cv2.imread(os.path.join(src, "16x9", f), cv2.IMREAD_GRAYSCALE)
    art = cv2.imread(wp, cv2.IMREAD_GRAYSCALE)
    H0, W0 = room.shape
    k = 1000 / W0
    r = cv2.resize(room, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
    H, W = r.shape
    ar = art.shape[1] / art.shape[0]
    best = (-1, 0, 0, 0, 0)
    for tw in range(40, int(W * 0.5), 4):
        th = int(round(tw / ar))
        if th >= H: continue
        t = cv2.resize(art, (tw, th), interpolation=cv2.INTER_AREA)
        m = cv2.matchTemplate(r, t, cv2.TM_CCOEFF_NORMED)
        _, mx, _, loc = cv2.minMaxLoc(m)
        if mx > best[0]: best = (mx, loc[0], loc[1], tw, th)
    sc, x, y, w, h = best
    res[slug] = {"score": round(sc, 3), "x": round(x / W * 100, 1), "y": round(y / H * 100, 1), "w": round(w / W * 100, 1), "h": round(h / H * 100, 1)}
    print(slug, res[slug], file=sys.stderr)
json.dump(res, open(out, "w"))

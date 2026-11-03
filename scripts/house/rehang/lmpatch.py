"""Fill the baked lightmap where a painting used to hang (its dark back and frame shadow on the wall),
from the wall's light around it. usage: python3 -I lmpatch.py holes.json orig.json skip_ids in.webp out.webp [...]"""
import json, sys
import numpy as np
from PIL import Image

holes_doc = json.load(open(sys.argv[1]))
orig = json.load(open(sys.argv[2]))["art"]
skip = set(sys.argv[3].split(",")) if sys.argv[3] else set()
pairs = list(zip(sys.argv[4::2], sys.argv[5::2]))

NRM = {"N": (0, 0, 1), "S": (0, 0, -1), "E": (-1, 0, 0), "W": (1, 0, 0)}
def right(n): return (n[2], 0, -n[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

holes = [h for h in holes_doc["holes"] if h["id"] not in skip]
# a canvas's mark on the wall: its frame, and the picture light's shadow falling below it
def mark(a): return a["w"] / 2 + 0.085, -0.08, a["h"] / 2 + 0.165
for h in holes:
    a = orig[h["id"]]; hw, dv, hh = mark(a)
    h["hw"], h["hh"] = hw, hh
    h["centre"] = [a["centre"][0], a["centre"][1] + dv, a["centre"][2]]
hole_ids = {h["id"] for h in holes_doc["holes"]}
STEP = 0.01
R = 0.3

for src, dst in pairs:
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    H, W = im.shape[:2]
    out = im.copy()

    def sample(x, y):
        x = np.clip(x, 0, W - 1.001); y = np.clip(y, 0, H - 1.001)
        x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
        fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
        return (im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x0 + 1] * fx * (1 - fy)
                + im[y0 + 1, x0] * (1 - fx) * fy + im[y0 + 1, x0 + 1] * fx * fy)

    for h in holes:
        n = NRM[h["side"]]; r = right(n); c = h["centre"]
        tris = [t for t in holes_doc["tris"] if t["hole"] == h["id"]]
        # triangles in wall coords (u along r, v up) and pixel coords
        T = []
        for t in tris:
            wv = [(dot(p, r) - dot(c, r), p[1] - c[1]) for p in t["v"]]
            px = [(uv[0] * W - 0.5, uv[1] * H - 0.5) for uv in t["uv"]]
            T.append((np.array(wv), np.array(px)))
        # other works on this wall that still hang (their backs are dark too): never sample from them
        blocked = []
        for oid, a in orig.items():
            if a["side"] != h["side"] or abs(dot(a["centre"], n) - dot(c, n)) > 0.02:
                continue
            bw, dv, bh = mark(a)
            blocked.append((dot(a["centre"], r) - dot(c, r), a["centre"][1] + dv - c[1], bw, bh, oid in hole_ids and oid not in skip))
        us = np.arange(-h["hw"] - R, h["hw"] + R + 1e-9, STEP); vs = np.arange(-h["hh"] - R, h["hh"] + R + 1e-9, STEP)
        U, V = np.meshgrid(us, vs)
        px = np.full(U.shape, np.nan); py = np.full(U.shape, np.nan)
        for wv, pp in T:
            a, b, cc = wv
            m = np.array([[b[0] - a[0], cc[0] - a[0]], [b[1] - a[1], cc[1] - a[1]]])
            if abs(np.linalg.det(m)) < 1e-9: continue
            inv = np.linalg.inv(m)
            l1 = inv[0, 0] * (U - a[0]) + inv[0, 1] * (V - a[1]); l2 = inv[1, 0] * (U - a[0]) + inv[1, 1] * (V - a[1])
            ins = (l1 >= -1e-6) & (l2 >= -1e-6) & (l1 + l2 <= 1 + 1e-6)
            px[ins] = (pp[0, 0] + l1 * (pp[1, 0] - pp[0, 0]) + l2 * (pp[2, 0] - pp[0, 0]))[ins]
            py[ins] = (pp[0, 1] + l1 * (pp[1, 1] - pp[0, 1]) + l2 * (pp[2, 1] - pp[0, 1]))[ins]
        valid = ~np.isnan(px)
        fill = np.zeros(U.shape, bool); bad = np.zeros(U.shape, bool)
        for bu, bv, bw, bh, isHole in blocked:
            inside = (np.abs(U - bu) <= bw) & (np.abs(V - bv) <= bh)
            bad |= inside
        # this hole alone: its neighbours' marks are filled from their own grids
        fill = (np.abs(U) <= h["hw"]) & (np.abs(V) <= h["hh"]) & valid
        G = np.zeros(U.shape + (3,), np.float32)
        G[valid] = sample(px[valid], py[valid])
        good = valid & ~bad
        # fill: inverse-distance blend of the nearest good cell left, right, above and below
        F = G.copy()
        ys, xs = np.nonzero(fill)
        for y, x in zip(ys, xs):
            acc = np.zeros(3); wsum = 0.0
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                k, yy, xx = 1, y + dy, x + dx
                while 0 <= yy < U.shape[0] and 0 <= xx < U.shape[1] and not good[yy, xx]:
                    k += 1; yy += dy; xx += dx
                if 0 <= yy < U.shape[0] and 0 <= xx < U.shape[1]:
                    # average a few cells beyond the edge, so one noisy texel does not streak
                    vals = [G[yy + dy * j, xx + dx * j] for j in range(4)
                            if 0 <= yy + dy * j < U.shape[0] and 0 <= xx + dx * j < U.shape[1] and good[yy + dy * j, xx + dx * j]]
                    acc += np.mean(vals, axis=0) / k; wsum += 1 / k
            if wsum: F[y, x] = acc / wsum
        # write back: every texel of these triangles whose wall point is in a filled cell (2 px of bleed)
        changed = 0
        for wv, pp in T:
            x0, x1 = int(np.floor(pp[:, 0].min())) - 2, int(np.ceil(pp[:, 0].max())) + 2
            y0, y1 = int(np.floor(pp[:, 1].min())) - 2, int(np.ceil(pp[:, 1].max())) + 2
            X, Y = np.meshgrid(np.arange(max(0, x0), min(W, x1 + 1)), np.arange(max(0, y0), min(H, y1 + 1)))
            a, b, cc = pp
            m = np.array([[b[0] - a[0], cc[0] - a[0]], [b[1] - a[1], cc[1] - a[1]]])
            if abs(np.linalg.det(m)) < 1e-9: continue
            inv = np.linalg.inv(m)
            l1 = inv[0, 0] * (X - a[0]) + inv[0, 1] * (Y - a[1]); l2 = inv[1, 0] * (X - a[0]) + inv[1, 1] * (Y - a[1])
            tol = 2.5 / max(1.0, np.abs(m).max())
            ins = (l1 >= -tol) & (l2 >= -tol) & (l1 + l2 <= 1 + tol)
            Uw = wv[0, 0] + l1 * (wv[1, 0] - wv[0, 0]) + l2 * (wv[2, 0] - wv[0, 0])
            Vw = wv[0, 1] + l1 * (wv[1, 1] - wv[0, 1]) + l2 * (wv[2, 1] - wv[0, 1])
            gi0 = np.round((Uw - us[0]) / STEP).astype(int); gj0 = np.round((Vw - vs[0]) / STEP).astype(int)
            inb = (gi0 >= 0) & (gi0 < U.shape[1]) & (gj0 >= 0) & (gj0 < U.shape[0])
            gi = np.clip(gi0, 0, U.shape[1] - 1); gj = np.clip(gj0, 0, U.shape[0] - 1)
            sel = ins & inb & fill[gj, gi]
            out[Y[sel], X[sel]] = F[gj[sel], gi[sel]]
            changed += int(sel.sum())
        print(src, h["id"], "texels", changed)
    q = 88 if "-2k" in src else 90
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=q, method=6)

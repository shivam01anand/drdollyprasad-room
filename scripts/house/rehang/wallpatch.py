"""Fill the baked wall light where a prop stood against a wall (its shadow on the wall), from the wall either side.
usage: python3 -I wallpatch.py walltris.json in.webp out.webp [...]"""
import json, sys
import numpy as np
from PIL import Image

d = json.load(open(sys.argv[1]))
pairs = list(zip(sys.argv[2::2], sys.argv[3::2]))
STEP, R = 0.01, 0.5
# (u along the wall, height): the shadow's box, from the floor up
gone = [(h["u0"], h["u1"], 0.0, h["y1"]) for h in d["holes"]]
others = []

def bary(pp, X, Y, tol=0.0):
    a, b, c = pp
    m = np.array([[b[0] - a[0], c[0] - a[0]], [b[1] - a[1], c[1] - a[1]]])
    if abs(np.linalg.det(m)) < 1e-12: return None
    inv = np.linalg.inv(m)
    l1 = inv[0, 0] * (X - a[0]) + inv[0, 1] * (Y - a[1]); l2 = inv[1, 0] * (X - a[0]) + inv[1, 1] * (Y - a[1])
    return l1, l2, (l1 >= -tol) & (l2 >= -tol) & (l1 + l2 <= 1 + tol), m

for src, dst in pairs:
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    H, W = im.shape[:2]; out = im.copy()
    def sample(x, y):
        x = np.clip(x, 0, W - 1.001); y = np.clip(y, 0, H - 1.001)
        x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
        fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
        return (im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x0 + 1] * fx * (1 - fy)
                + im[y0 + 1, x0] * (1 - fx) * fy + im[y0 + 1, x0 + 1] * fx * fy)
    for k, h in enumerate(d["holes"]):
        fx0, fx1, fz0, fz1 = gone[k]
        T = [(np.array(t["v"]), np.array([(u * W - 0.5, v * H - 0.5) for u, v in t["uv"]])) for t in d["tris"] if t["hole"] == h["id"]]
        xs = np.arange(fx0 - R, fx1 + R + 1e-9, STEP); zs = np.arange(0.0, fz1 + 0.2 + 1e-9, STEP)
        X, Z = np.meshgrid(xs, zs)
        px = np.full(X.shape, np.nan); py = np.full(X.shape, np.nan)
        for wv, pp in T:
            r = bary(wv, X, Z, 1e-6)
            if r is None: continue
            l1, l2, ins, _ = r
            px[ins] = (pp[0, 0] + l1 * (pp[1, 0] - pp[0, 0]) + l2 * (pp[2, 0] - pp[0, 0]))[ins]
            py[ins] = (pp[0, 1] + l1 * (pp[1, 1] - pp[0, 1]) + l2 * (pp[2, 1] - pp[0, 1]))[ins]
        valid = ~np.isnan(px)
        bad = np.zeros(X.shape, bool)
        for a0, a1, b0, b1 in gone + others: bad |= (X >= a0) & (X <= a1) & (Z >= b0) & (Z <= b1)
        fill = (X >= fx0) & (X <= fx1) & (Z >= fz0) & (Z <= fz1) & valid
        G = np.zeros(X.shape + (3,), np.float32); G[valid] = sample(px[valid], py[valid])
        good = valid & ~bad
        F = G.copy()
        # along the wall only: the falloff toward the floor is kept
        dirs = ((0, 1), (0, -1))
        for y, x in zip(*np.nonzero(fill)):
            acc = np.zeros(3); ws = 0.0
            for dy, dx in dirs:
                kk, yy, xx = 1, y + dy, x + dx
                while 0 <= yy < X.shape[0] and 0 <= xx < X.shape[1] and not good[yy, xx]:
                    kk += 1; yy += dy; xx += dx
                if 0 <= yy < X.shape[0] and 0 <= xx < X.shape[1]:
                    vals = [G[yy + dy * j, xx + dx * j] for j in range(5)
                            if 0 <= yy + dy * j < X.shape[0] and 0 <= xx + dx * j < X.shape[1] and good[yy + dy * j, xx + dx * j]]
                    acc += np.mean(vals, axis=0) / kk; ws += 1 / kk
            if ws: F[y, x] = acc / ws
        changed = 0
        for wv, pp in T:
            x0, x1 = int(np.floor(pp[:, 0].min())) - 2, int(np.ceil(pp[:, 0].max())) + 2
            y0, y1 = int(np.floor(pp[:, 1].min())) - 2, int(np.ceil(pp[:, 1].max())) + 2
            PX, PY = np.meshgrid(np.arange(max(0, x0), min(W, x1 + 1)), np.arange(max(0, y0), min(H, y1 + 1)))
            r = bary(pp, PX, PY)
            if r is None: continue
            l1, l2, _, m = r
            tol = 2.5 / max(1.0, np.abs(m).max())
            ins = (l1 >= -tol) & (l2 >= -tol) & (l1 + l2 <= 1 + tol)
            Xw = wv[0, 0] + l1 * (wv[1, 0] - wv[0, 0]) + l2 * (wv[2, 0] - wv[0, 0])
            Zw = wv[0, 1] + l1 * (wv[1, 1] - wv[0, 1]) + l2 * (wv[2, 1] - wv[0, 1])
            gi0 = np.round((Xw - xs[0]) / STEP).astype(int); gj0 = np.round((Zw - zs[0]) / STEP).astype(int)
            inb = (gi0 >= 0) & (gi0 < X.shape[1]) & (gj0 >= 0) & (gj0 < X.shape[0])
            gi = np.clip(gi0, 0, X.shape[1] - 1); gj = np.clip(gj0, 0, X.shape[0] - 1)
            sel = ins & inb & fill[gj, gi]
            out[PY[sel], PX[sel]] = F[gj[sel], gi[sel]]
            changed += int(sel.sum())
        print(src, h["id"], "texels", changed)
    q = 88 if "-2k" in src else 90
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=q, method=6)

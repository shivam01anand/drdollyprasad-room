"""
Her at her easel, from her own photograph (assets/figure/at-the-easel.jpg, October 2026): the
canvas she is working on, and her, for the corner of the courtyard where she paints.

    swiftc -O -o /tmp/lift scripts/figure/lift.swift
    /tmp/lift assets/figure/at-the-easel.jpg assets/figure/at-the-easel-lift.png   # Apple's subject lifting
    python3 scripts/figure/make.py

Out:
  public/art/room/in-progress.jpg   the canvas, squared up: her pencil grid shows the squares are
                                    near enough square to straighten it along its top and left edges;
                                    where she, her brush and a phone clamp hide it, bare primed canvas;
                                    her upside-down underdrawing on its left taken off (unsketch)
  assets/figure/dolly.png           her, lifted out, with the brush redrawn along the line she holds it
                                    (a reference: she is modelled in 3D by model.py, not shown from it)
  assets/figure/dolly.json          where things are in it: the brush tip, the cut at the bottom,
                                    and the canvas point the brush touches
Both are white-balanced from the bare canvas, so she and her painting are in the same light.
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FIG = os.path.join(ROOT, "assets", "figure")
src = cv2.imread(os.path.join(FIG, "at-the-easel.jpg"))
lift = cv2.imread(os.path.join(FIG, "at-the-easel-lift.png"), cv2.IMREAD_UNCHANGED)
hsv = cv2.cvtColor(src, cv2.COLOR_BGR2HSV)
H, W = src.shape[:2]

# ---------------------------------------------------------------- the canvas
TL, TR, BL = (348, 516), (1040, 547.6), (338.3, 1180)            # its top-left corner, along its top and left edges
cw = np.hypot(TR[0] - TL[0], TR[1] - TL[1]); ch = np.hypot(BL[0] - TL[0], BL[1] - TL[1])
S = 1.5
A = cv2.getAffineTransform(np.float32([TL, TR, BL]), np.float32([[0, 0], [cw * S, 0], [0, ch * S]]))
RW, RH = int(cw * S), int(ch * S)
rect = cv2.warpAffine(src, A, (RW, RH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
a = lift[:, :, 3].astype(np.float32) / 255
green = ((hsv[:, :, 0] > 28) & (hsv[:, :, 0] < 55) & (hsv[:, :, 1] > 60)).astype(np.float32)
occ = cv2.dilate((np.clip(a - green, 0, 1) > 0.35).astype(np.uint8), np.ones((9, 9), np.uint8))
mrect = cv2.warpAffine(occ * 255, A, (RW, RH), flags=cv2.INTER_NEAREST)
y0, x0, y1 = 10, 8, 860                                           # a sliver of wall above and left; her sleeve below
rect, mrect = rect[y0:y1, x0:], mrect[y0:y1, x0:]
blank = rect[40:110, 760:960].reshape(-1, 3).astype(np.float64)
gain = np.array([214, 229, 236], np.float64) / np.median(blank, 0)      # bare canvas to a warm primed white
bal = np.clip(rect.astype(np.float64) * gain, 0, 255)
CH, CW = mrect.shape
gray = cv2.cvtColor(bal.astype(np.uint8), cv2.COLOR_BGR2GRAY)
clamp = np.zeros_like(mrect)
band = (slice(430, 830), slice(820, CW))                          # the phone clamp at the right edge
clamp[band] = (gray[band] < 150).astype(np.uint8) * 255
clamp = cv2.dilate(cv2.morphologyEx(clamp, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8)), np.ones((17, 17), np.uint8))
hard = np.maximum(mrect, clamp) > 0
m = cv2.GaussianBlur(cv2.dilate(hard.astype(np.float32), np.ones((5, 5), np.uint8)), (0, 0), 3)
keep = (~hard & (gray >= 165)).astype(np.float64)
local = cv2.GaussianBlur(bal * keep[..., None], (0, 0), 45) / np.maximum(cv2.GaussianBlur(keep, (0, 0), 45), 1e-3)[..., None]
patch = bal[40:110, 760:960]
grain = cv2.resize(patch - patch.reshape(-1, 3).mean(0), (CW, CH), interpolation=cv2.INTER_LINEAR) * 0.55
canvas = np.clip(bal * (1 - m[..., None]) + (local + grain) * m[..., None], 0, 255).astype(np.uint8)


def unsketch(img, dense_too):
    """her ochre underdrawing of an upside-down figure, on the canvas's left (a figure turned over so
    she draws its shapes, not what it is), taken off down to the bare ground: a stroke is warmer, more
    saturated and darker than the ground around it; her grey pencil grid is not, and stays"""
    hsv_ = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    S_, V_, H_ = hsv_[:, :, 1].astype(np.int16), hsv_[:, :, 2].astype(np.int16), hsv_[:, :, 0]
    bgV = cv2.medianBlur(hsv_[:, :, 2], 41).astype(np.int16)
    bgS = cv2.medianBlur(hsv_[:, :, 1], 41).astype(np.int16)
    warm = (H_ >= 5) & (H_ <= 34)
    yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
    # (the left of the canvas, clear of the woman she has painted, her hands and her hair)
    region = (xx < 343) | ((xx < 448) & (yy < 292)) | ((xx < 500) & (yy < 185))
    if dense_too:
        line = warm & ((((S_ - bgS) > 14) & ((bgV - V_) > 8)) | ((S_ - bgS) > 26))
        face = ((xx - 190) / 105.0) ** 2 + ((yy - 610) / 140.0) ** 2 < 1      # its face: oval, eyes, nose, mouth
        hands = (xx > 300) & (xx < 505) & (yy < 150)                           # its hands, along the top
        line |= (face | hands) & warm & (((S_ - bgS) > 6) | ((bgV - V_) > 6))
    else:
        line = warm & ((S_ - bgS) > 8) & ((bgV - V_) > 4)                      # what is left of it, fainter
    mask_ = cv2.dilate((line & region).astype(np.uint8), np.ones((5, 5), np.uint8))
    return cv2.inpaint(img, mask_, 5, cv2.INPAINT_TELEA)


canvas = unsketch(unsketch(canvas, True), False)
cv2.imwrite(os.path.join(ROOT, "public", "art", "room", "in-progress.jpg"), canvas, [cv2.IMWRITE_JPEG_QUALITY, 88])

# ---------------------------------------------------------------- her
a = np.clip(a - cv2.dilate(green, np.ones((3, 3), np.uint8)), 0, 1)
n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
a *= cv2.dilate((lab == np.argmax(stats[1:, cv2.CC_STAT_AREA]) + 1).astype(np.float32), np.ones((5, 5), np.uint8))
rgb = np.clip(src.astype(np.float64) * gain, 0, 255)
rgb = (rgb - 128) * 0.92 + 128                                    # a little softer, and warmer: afternoon, not a tube light
rgb[:, :, 2] *= 1.03
rgb[:, :, 0] *= 0.96
rgb = np.clip(rgb, 0, 255)
hand_top = 961
base, tip = np.array([543.0, 990.0]), np.array([534.0, 884.0])  # the brush, from her fingers to its tip
a[:hand_top + 4, 470:640] = 0                                      # the photograph's brush, blurred into the canvas
Z = 4
layer = np.zeros((H * Z, W * Z, 4), np.uint8)
for t0, t1, w, bgr in ((0.0, 0.80, 4.4, (58, 112, 168)), (0.80, 0.91, 4.8, (168, 170, 174)), (0.91, 1.0, 3.8, (40, 52, 66))):
    p0, p1 = base + (tip - base) * t0, base + (tip - base) * t1
    cv2.line(layer, tuple(int(v * Z) for v in p0), tuple(int(v * Z) for v in p1), (*bgr, 255), int(w * Z), cv2.LINE_AA)
small = cv2.resize(layer, (W, H), interpolation=cv2.INTER_AREA).astype(np.float64)
la = small[:, :, 3:4] / 255
rgb = rgb * (1 - la) + small[:, :, :3] * la
a = np.maximum(a, la[:, :, 0])
ys, xs = np.where(a > 0.02)
fx0, fx1, fy0, fy1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
fig = np.dstack([rgb.astype(np.uint8), (a * 255).astype(np.uint8)])[fy0:fy1, fx0:fx1]
cv2.imwrite(os.path.join(FIG, "dolly.png"), fig)

# where the brush tip touches her canvas, in the canvas texture's own coordinates (0..1, from top left)
p = A @ np.array([tip[0], tip[1], 1.0])
u, v = (p[0] - x0) / CW, (p[1] - y0) / CH
json.dump({
    "figure": {"w": fig.shape[1], "h": fig.shape[0],
               "tip": [float(tip[0] - fx0), float(tip[1] - fy0)],            # px from its top left
               "crown": 105, "spine": 230},                                   # her head's top row, her spine's column
    "canvas": {"w": CW, "h": CH, "aspect": CW / CH, "touch": [float(u), float(v)]},
}, open(os.path.join(FIG, "dolly.json"), "w"), indent=1)
print("canvas", CW, "x", CH, "| figure", fig.shape[1], "x", fig.shape[0], "| brush touches canvas at", round(u, 3), round(v, 3))

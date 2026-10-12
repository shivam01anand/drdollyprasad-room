"""Her colours, from MakeHuman's CC0 textures (assets/mpfb/pack) and her own photographs (IMG_1197/1199,
white-balanced from the bare canvas beside her): a light olive-wheat skin, dark brown hair with warm
brown through it (and her bun's, wound), her dusty-pink fleece hoodie (the blouse's folds kept, its
stripes gone; the hood's fleece tiles), charcoal trousers.

    python3 scripts/figure/textures.py    -> assets/figure/tex/*.png
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PACK = os.path.join(ROOT, "assets", "mpfb", "pack")
OUT = os.path.join(ROOT, "assets", "figure", "tex")
os.makedirs(OUT, exist_ok=True)


def load(rel):
    return np.asarray(Image.open(os.path.join(PACK, rel)).convert("RGBA")).astype(np.float64) / 255


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name))


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


# skin: the light-skinned texture's detail, re-toned to hers (her hand in the photographs, its warm
# light taken out: red 1, green 0.76, blue 0.59; sRGB ~ #BD8F70 at mid)
s = load("skins/old_asian_female/old_lightskinned_female_diffuse2.png")
L = lum(s)
detail = L / max(1e-3, np.median(L[L > 0.05]))
base = np.array([0.74, 0.56, 0.44])
skin = np.dstack([np.clip(base[i] * detail ** 1.1, 0, 1) for i in range(3)] + [s[..., 3]])
save(skin, "skin.png")

# her hair, drawn back, and her bun: dark brown strands with warmer ones through them, the strands
# along the image's width; it tiles both ways (strands repeat round her head and along her bun)
rng = np.random.default_rng(7)
H_, W_ = 256, 1024
fy = np.fft.fftfreq(H_)[:, None] * H_
fx = np.fft.fftfreq(W_)[None, :] * W_
def strands(cut_y, cut_x):
    spec = (rng.normal(size=(H_, W_)) + 1j * rng.normal(size=(H_, W_))) * np.exp(-(fy / cut_y) ** 2 - (fx / cut_x) ** 2)
    a = np.real(np.fft.ifft2(spec))
    return (a - a.mean()) / a.std()
t = 0.85 * strands(90, 3) + 0.15 * strands(16, 2) + 0.3 * strands(160, 12)
t = np.clip(0.45 + 0.2 * t, 0, 1) ** 1.8
dark, warm = np.array([0.06, 0.045, 0.035]), np.array([0.27, 0.18, 0.125])     # (her hair: ~#241B15 at mid)
hair = np.dstack([dark[i] + (warm[i] - dark[i]) * t for i in range(3)] + [np.ones_like(t)])
save(hair, "hair.png")
for old in ("bun.png",):                      # (made by an earlier version)
    if os.path.exists(os.path.join(OUT, old)):
        os.remove(os.path.join(OUT, old))

# her loose hairs, over the rest: thin strands with air between (the alpha), along the same flow
t2 = strands(220, 4)
a2 = np.clip((t2 - 1.0) / 0.5, 0, 1) ** 1.3
col = dark + (warm - dark) * 0.35
save(np.dstack([np.full_like(a2, col[i]) for i in range(3)] + [a2]), "frizz.png")

# the hoodie: her dusty mauve-pink fleece over the blouse's own folds (its AO; a man's sweatshirt fits
# her arm badly when it is raised), a fleece's soft unevenness on it; the blouse's stripes are not used
ao = np.asarray(Image.open(os.path.join(PACK, "clothes/female_elegantsuit01/female_elegantsuit01_ao.png")).convert("L")).astype(np.float64) / 255
pink = np.array([0.80, 0.56, 0.61])


def fleece(h, w, seed):
    """a fleece's surface: soft blotches (pilling) and fine fibre noise, around 1, tiling both ways"""
    r = np.random.default_rng(seed)
    fy_ = np.fft.fftfreq(h)[:, None] * h
    fx_ = np.fft.fftfreq(w)[None, :] * w
    out = np.zeros((h, w))
    for cut, amp in ((6, 0.016), (40, 0.018), (220, 0.026)):           # (even, as hers is: no pattern in it)
        spec = (r.normal(size=(h, w)) + 1j * r.normal(size=(h, w))) * np.exp(-(fy_ ** 2 + fx_ ** 2) / cut ** 2)
        a = np.real(np.fft.ifft2(spec))
        out += amp * (a - a.mean()) / a.std()
    return 1 + out


shade = (0.74 + 0.26 * ao) * fleece(*ao.shape, 11)
top = np.dstack([np.clip(pink[i] * shade, 0, 1) for i in range(3)] + [np.ones_like(ao)])
save(top, "top.png")
f_ = fleece(512, 512, 12)
save(np.dstack([np.clip(pink[i] * 0.97 * f_, 0, 1) for i in range(3)] + [np.ones_like(f_)]), "fleece.png")

# trousers: the jeans' weave, darkened to charcoal
j = load("clothes/female_casualsuit01/female_casualsuit01_diffuse.png")
L = lum(j)
d = L / max(1e-3, np.median(L[L > 0.05]))
char = np.array([0.075, 0.075, 0.085])
trousers = np.dstack([np.clip(char[i] * d ** 0.6, 0, 1) for i in range(3)] + [j[..., 3]])
save(trousers, "trousers.png")
print("textures:", sorted(os.listdir(OUT)))

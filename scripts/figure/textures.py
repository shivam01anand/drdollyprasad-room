"""Her colours, from MakeHuman's CC0 textures (assets/mpfb/pack): a warm medium-brown skin, dark brown
hair with warmer strands through it (and her bun's, wound), a soft fleece-pink top (its folds kept, its
stripes gone), charcoal trousers.

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


# skin: the light-skinned texture's detail, re-toned to a warm medium brown (sRGB ~ #A8714F at mid)
s = load("skins/old_asian_female/old_lightskinned_female_diffuse2.png")
L = lum(s)
detail = L / max(1e-3, np.median(L[L > 0.05]))
base = np.array([0.57, 0.38, 0.26])
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
dark, warm = np.array([0.05, 0.036, 0.028]), np.array([0.25, 0.165, 0.11])
hair = np.dstack([dark[i] + (warm[i] - dark[i]) * t for i in range(3)] + [np.ones_like(t)])
save(hair, "hair.png")
for old in ("bun.png",):                      # (made by an earlier version)
    if os.path.exists(os.path.join(OUT, old)):
        os.remove(os.path.join(OUT, old))

# the top: a soft dusty pink fleece, the blouse's folds and seams as shading, its stripes gone
b = load("clothes/female_elegantsuit01/female_elegantsuit01_diffuse.png")
ao = np.asarray(Image.open(os.path.join(PACK, "clothes/female_elegantsuit01/female_elegantsuit01_ao.png")).convert("L")).astype(np.float64) / 255
ao = np.asarray(Image.fromarray((ao * 255).astype(np.uint8)).resize(b.shape[1::-1])).astype(np.float64) / 255
pink = np.array([0.86, 0.62, 0.66])
shade = 0.72 + 0.28 * ao
top = np.dstack([pink[i] * shade for i in range(3)] + [b[..., 3]])
save(top, "top.png")

# trousers: the jeans' weave, darkened to charcoal
j = load("clothes/female_casualsuit01/female_casualsuit01_diffuse.png")
L = lum(j)
d = L / max(1e-3, np.median(L[L > 0.05]))
char = np.array([0.075, 0.075, 0.085])
trousers = np.dstack([np.clip(char[i] * d ** 0.6, 0, 1) for i in range(3)] + [j[..., 3]])
save(trousers, "trousers.png")
print("textures:", sorted(os.listdir(OUT)))

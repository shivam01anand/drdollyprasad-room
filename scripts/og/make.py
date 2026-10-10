"""
The picture a link to one painting shows when it is shared (WhatsApp, iMessage, mail):
the painting whole on her paper colour, in a slim dark frame, 1200 × 630.

    python3 scripts/og/make.py        -> public/og/<id>.jpg, one per work in public/art/works
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "public", "art")
OUT = os.path.join(ROOT, "public", "og")
W, H, PAD, FRAME = 1200, 630, 46, 7
PAPER, FRAME_INK = (240, 234, 223), (47, 35, 27)

os.makedirs(OUT, exist_ok=True)
for name in sorted(os.listdir(os.path.join(ART, "works"))):
    if not name.endswith(".jpg"):
        continue
    wid = name[:-4]
    big = os.path.join(ART, "large", name)
    im = Image.open(big if os.path.exists(big) else os.path.join(ART, "works", name)).convert("RGB")
    k = min((W - 2 * PAD - 2 * FRAME) / im.width, (H - 2 * PAD - 2 * FRAME) / im.height)
    pw, ph = round(im.width * k), round(im.height * k)
    im = im.resize((pw, ph), Image.LANCZOS)
    card = Image.new("RGB", (W, H), PAPER)
    x, y = (W - pw) // 2, (H - ph) // 2
    # a soft shadow below the frame, as a wall gives one
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rectangle((x - FRAME + 6, y - FRAME + 10, x + pw + FRAME + 6, y + ph + FRAME + 14), fill=70)
    from PIL import ImageFilter
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    card.paste(Image.new("RGB", (W, H), (120, 100, 84)), (0, 0), shadow)
    ImageDraw.Draw(card).rectangle((x - FRAME, y - FRAME, x + pw + FRAME - 1, y + ph + FRAME - 1), fill=FRAME_INK)
    card.paste(im, (x, y))
    card.save(os.path.join(OUT, f"{wid}.jpg"), quality=84, optimize=True, progressive=True)
print(len(os.listdir(OUT)), "cards")

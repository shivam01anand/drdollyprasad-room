"""
The picture a link shows when it is shared (WhatsApp, iMessage, mail), 1200 x 630.

One card per painting: the whole painting, never cropped, in the site's black frame and cream mat
on the Khadi ground, with its title and "Dr Dolly Prasad" beside it in the site's type (Cormorant
Garamond and Jost, read from node_modules/@fontsource). The home card (public/og.jpg) is the same
card with her name and the tagline in place of a title. Titles come from lib/works.ts, which
follows dolly-engine kb/paintings.json.

    pip install pillow
    python3 scripts/og/make.py        -> public/og/<id>.jpg for every work, and public/og.jpg
"""
import os, re
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "public", "art")
OUT = os.path.join(ROOT, "public", "og")
FONTS = os.path.join(ROOT, "node_modules", "@fontsource")
W, H = 1200, 630
KHADI, INK, MUTED, RED = (245, 244, 240), (26, 22, 20), (106, 97, 91), (212, 32, 42)
FRAME_INK, MAT = (28, 27, 26), (242, 237, 229)
FRAME, MATW = 7, 9                      # frame and mat widths, even on all four sides
BOX_W, BOX_H = 600, 500                 # the most room the framed painting may take
GAP, TEXT_W = 64, 380                   # air between painting and words; the words' column
HOME = "temple-bells"                   # the home card's painting (Threads of Faith), whole

serif = lambda px: ImageFont.truetype(os.path.join(FONTS, "cormorant-garamond", "files", "cormorant-garamond-latin-500-normal.woff"), px)
sans = lambda px: ImageFont.truetype(os.path.join(FONTS, "jost", "files", "jost-latin-400-normal.woff"), px)

TITLES = dict(re.findall(r'W\("([a-z0-9-]+)",\s*"([^"]+)"', open(os.path.join(ROOT, "lib", "works.ts"), encoding="utf-8").read()))


def wrap(draw, text, font, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if line and draw.textlength(trial, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line]


def card(wid, big, small, red=None):
    """big: the serif line(s); small: the quiet sans line under it; red: one word of `small` set in the site's red"""
    name = f"{wid}.jpg"
    large = os.path.join(ART, "large", name)
    im = Image.open(large if os.path.exists(large) else os.path.join(ART, "works", name)).convert("RGB")
    edge = 2 * (FRAME + MATW)
    # the whole painting, scaled to fit; a small photograph is not blown up past twice its size
    k = min((BOX_W - edge) / im.width, (BOX_H - edge) / im.height, 2.0)
    pw, ph = round(im.width * k), round(im.height * k)
    im = im.resize((pw, ph), Image.LANCZOS)
    fw, fh = pw + edge, ph + edge

    out = Image.new("RGB", (W, H), KHADI)
    d = ImageDraw.Draw(out)
    f_big = serif(60)
    lines = wrap(d, big, f_big, TEXT_W)
    if len(lines) > 3:
        f_big = serif(50)
        lines = wrap(d, big, f_big, TEXT_W)
    f_small = sans(26)
    text_w = max([d.textlength(l, font=f_big) for l in lines] + [d.textlength(small, font=f_small)])
    lh = round(f_big.size * 1.08)
    text_h = lh * len(lines) + 22 + 34

    x = int(W - (fw + GAP + text_w)) // 2
    y = (H - fh) // 2
    # one small contact shadow, as on the site (--lift)
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rectangle((x + 1, y + 6, x + fw - 1, y + fh + 6), fill=46)
    out.paste(Image.new("RGB", (W, H), (20, 12, 6)), (0, 0), sh.filter(ImageFilter.GaussianBlur(7)))
    d.rectangle((x, y, x + fw - 1, y + fh - 1), fill=FRAME_INK)
    d.rectangle((x + FRAME, y + FRAME, x + fw - FRAME - 1, y + fh - FRAME - 1), fill=MAT)
    out.paste(im, (x + FRAME + MATW, y + FRAME + MATW))

    tx = x + fw + GAP
    ty = (H - text_h) // 2
    for l in lines:
        d.text((tx, ty), l, font=f_big, fill=INK)
        ty += lh
    ty += 22
    if red and red in small:
        before = small.split(red)[0]
        d.text((tx, ty), before, font=f_small, fill=MUTED)
        rx = tx + d.textlength(before, font=f_small)
        d.text((rx, ty), red, font=f_small, fill=RED)
        d.text((rx + d.textlength(red, font=f_small), ty), small.split(red)[1], font=f_small, fill=MUTED)
    else:
        d.text((tx, ty), small, font=f_small, fill=MUTED)
    return out


os.makedirs(OUT, exist_ok=True)
n = 0
for name in sorted(os.listdir(os.path.join(ART, "works"))):
    if not name.endswith(".jpg"):
        continue
    wid = name[:-4]
    card(wid, TITLES[wid], "Dr Dolly Prasad").save(os.path.join(OUT, name), quality=88, optimize=True, progressive=True, subsampling=0)
    n += 1
card(HOME, "Dr Dolly Prasad", "The everyday, held sacred.", red="sacred").save(os.path.join(ROOT, "public", "og.jpg"), quality=88, optimize=True, progressive=True, subsampling=0)
print(n, "painting cards and the home card")

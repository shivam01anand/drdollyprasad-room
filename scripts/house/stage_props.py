"""Stage approved cut-outs (ChatGPT, Team Handoffs/021-studio-plants) into public/house/props as webp
(<= 400 KB), with a floor-shadow crop and opaque sample points for the clash QA.
usage: python3 -I stage_props.py <cutouts dir> name [name ...]   (writes lib/studio-props.json entries)"""
import json, os, sys
from PIL import Image
SRC = sys.argv[1]; names = sys.argv[2:]
import pathlib
REPO = str(pathlib.Path(__file__).resolve().parents[2]) + "/"
OUT = REPO + "public/house/props/"; MAN = REPO + "lib/studio-props.json"
meta = json.load(open(MAN)) if os.path.exists(MAN) else {}
for name in names:
    if name.startswith("07-") or name.startswith("08-warm") or name.startswith("09-"):
        im = Image.open(os.path.join(SRC, name + ".png"))
        im = im.convert("RGBA" if name.startswith("09-") else "RGB"); im.thumbnail((1024, 1024), Image.LANCZOS)
        im.save(OUT + name + ".webp", "WEBP", quality=82); print(name, os.path.getsize(OUT + name + ".webp") // 1000, "KB"); continue
    im = Image.open(os.path.join(SRC, name + ".png")).convert("RGBA")
    bb = im.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bb)
    srel = None
    sp = os.path.join(SRC, name + "-shadow.png")
    if not os.path.exists(sp) and not name.startswith("06-picture-light"):
        # no shadow delivered: a soft ellipse under the pot's foot (its opaque width in the bottom 3 %)
        a = im.split()[3]; W, H = a.size
        foot = a.crop((0, int(H * 0.97), W, H)).point(lambda v: 255 if v > 100 else 0).getbbox()
        fx0, fx1 = (foot[0], foot[2]) if foot else (W * 0.35, W * 0.65)
        from PIL import ImageDraw, ImageFilter
        sh = Image.new("RGBA", (256, 128), (0, 0, 0, 0)); g = ImageDraw.Draw(sh)
        g.ellipse((28, 30, 228, 98), fill=(0, 0, 0, 190)); sh = sh.filter(ImageFilter.GaussianBlur(14))
        sh.save(OUT + name + "-shadow.webp", "WEBP", quality=80)
        cx, hw = (fx0 + fx1) / 2 / W, (fx1 - fx0) / W * 0.8
        meta[name] = {"shadow": [round(cx - hw, 3), 0.97, round(cx + hw, 3), 1.0]}
    if os.path.exists(sp):
        sh = Image.open(sp).convert("RGBA")
        sbb = sh.split()[3].point(lambda a: 255 if a > 4 else 0).getbbox()
        srel = [round((sbb[0] - bb[0]) / (bb[2] - bb[0]), 3), round((sbb[1] - bb[1]) / (bb[3] - bb[1]), 3),
                round((sbb[2] - bb[0]) / (bb[2] - bb[0]), 3), round((sbb[3] - bb[1]) / (bb[3] - bb[1]), 3)]
        sh = sh.crop(sbb)
        k = min(1, 512 / max(sh.size)); sh = sh.resize((max(8, round(sh.width * k)), max(8, round(sh.height * k))), Image.LANCZOS)
        sh.save(OUT + name + "-shadow.webp", "WEBP", quality=80)
    longest = 1400 if im.width > im.height * 1.5 else 1100
    k = longest / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    for q in (84, 78, 70, 62, 55):
        im.save(OUT + name + ".webp", "WEBP", quality=q, method=6)
        if os.path.getsize(OUT + name + ".webp") < 400_000: break
    a = im.split()[3]; W, H = a.size; pts = []
    for j in range(60):
        for i in range(40):
            if a.getpixel((int((i + .5) * W / 40), int((j + .5) * H / 60))) > 100:
                pts.append([round((i + .5) / 40, 3), round(1 - (j + .5) / 60, 3)])
    srel = srel or (meta.get(name) or {}).get("shadow")
    meta[name] = {"aspect": round(im.width / im.height, 4), "shadow": srel, "samples": pts}
    print(name, im.size, os.path.getsize(OUT + name + ".webp") // 1000, "KB")
json.dump(meta, open(MAN, "w"))

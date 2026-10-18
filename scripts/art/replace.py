"""
Put new photographs of her paintings on the website, in every size the site serves.

    python3 scripts/art/replace.py <folder> [id ...]

<folder> holds one photograph per painting, named "<id>.<ext>" or "<nn>-<id>.<ext>" (the
Final/Artwork naming). With ids, only those are replaced. For each painting it writes:

- art/works/<id>.jpg   ≤ 1100 px: the collage, Featured, the first image of the lightbox
- art/large/<id>.jpg   ≤ 1800 px, when the photograph is larger than the works file
- art/xl/<id>.jpg      removed when the new photograph is under 2000 px (never upscaled)
- art/room/<id>.jpg    the canvas in the house, at the canvas's own shape (house.json): the
                       canvases are part of the baked house, so the photograph is fitted to
                       them; the script prints how far that fit departs from the photograph
- art/manifest.json    the works file's size

and lists the ids to add to LARGE (lib/works.ts) or take out of XL (lib/xl.ts). The tailored
room photographs and the share cards are made after it (scripts/art/room_swap.py,
scripts/og/make.py).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "public", "art")


def fit(im, longest):
    k = min(1, longest / max(im.size))
    return im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def save(im, path, q):
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True, subsampling=0 if q >= 86 else 2)


def main():
    folder, only = sys.argv[1], set(sys.argv[2:])
    house = json.load(open(os.path.join(ROOT, "public", "house", "house.json")))["art"]
    manifest_path = os.path.join(ART, "manifest.json")
    manifest = json.load(open(manifest_path))
    sizes = {w["id"]: w for w in manifest["works"]}
    large_add, xl_drop = [], []
    for name in sorted(os.listdir(folder)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"):
            continue
        wid = stem.split("-", 1)[1] if stem[:2].isdigit() and "-" in stem else stem
        if wid not in sizes or (only and wid not in only):
            continue
        im = Image.open(os.path.join(folder, name)).convert("RGB")

        works = fit(im, 1100)
        save(works, os.path.join(ART, "works", f"{wid}.jpg"), 82)
        sizes[wid]["w"], sizes[wid]["h"] = works.size

        large = os.path.join(ART, "large", f"{wid}.jpg")
        if max(im.size) > 1100:
            if not os.path.exists(large):
                large_add.append(wid)
            save(fit(im, 1800), large, 88)

        xl = os.path.join(ART, "xl", f"{wid}.jpg")
        if os.path.exists(xl):
            if max(im.size) >= 2000:
                save(im, xl, 88)
            else:
                os.remove(xl)
                xl_drop.append(wid)

        a = house.get(wid)
        if a and not a.get("study"):
            want = min(1200, round(max(a["w"], a["h"]) * 1300))
            aspect = a["w"] / a["h"]
            tw, th = (want, round(want / aspect)) if aspect >= 1 else (round(want * aspect), want)
            # never larger than the photograph itself
            k = min(1, max(im.size) / max(tw, th))
            tw, th = round(tw * k), round(th * k)
            save(im.resize((tw, th), Image.LANCZOS), os.path.join(ART, "room", f"{wid}.jpg"), 88)
            fitted = (im.width / im.height) / aspect - 1
            print(f"{wid:28s} {im.size} -> works {works.size}, room {tw}x{th}"
                  f"{f'  (canvas fit {fitted:+.1%})' if abs(fitted) > 0.002 else ''}")
        else:
            print(f"{wid:28s} {im.size} -> works {works.size} (not in the house)")

    json.dump(manifest, open(manifest_path, "w"), indent=1)
    print("add to LARGE:", large_add)
    print("take out of XL:", xl_drop)


main()

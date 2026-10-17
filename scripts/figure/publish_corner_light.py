"""Publish a denoised artist-corner bake while retaining other rooms' light.

python3 scripts/figure/publish_corner_light.py review/scan-corner
Run scripts/bake/denoise.py on both lightmaps in that directory first.
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image
from splat import ROOT

parser = argparse.ArgumentParser()
parser.add_argument('bake_dir', type=Path)
args = parser.parse_args()
house = ROOT/'public/house'
scales = json.loads((house/'house.json').read_text())['lightmap']
report = {}
for tag in ['day','night']:
    original = np.load(ROOT/f'scripts/house/work/v17/final/lm-{tag}.npy')
    changed = np.load(args.bake_dir/f'lm-{tag}.npy')
    coverage = np.load(args.bake_dir/f'mask-{tag}.npy')
    if changed.shape != original.shape or coverage.shape != original.shape[:2]:
        raise ValueError('Bake must use the published atlas dimensions')
    if not np.isfinite(changed).all() or not coverage.any():
        raise ValueError('Invalid or empty corner lightmap')
    light = np.where(coverage[:,:,None],changed,original)
    assert np.array_equal(light[~coverage],original[~coverage])
    x = np.clip(light/scales[tag],0,1)
    srgb = np.where(x <= .0031308,x*12.92,1.055*x**(1/2.4)-.055)
    updated = Image.fromarray(np.clip(np.round(srgb*255),0,255).astype('uint8'))
    previous = Image.open(house/f'lm-{tag}.webp').convert('RGB')
    # Preserve the published image outside the new bake, including its dithering.
    pixels = np.asarray(previous).copy()
    pixels[coverage] = np.asarray(updated)[coverage]
    image = Image.fromarray(pixels)
    image.save(house/f'lm-{tag}.webp',quality=90,method=6)
    image.resize((2048,2048),Image.Resampling.LANCZOS).save(house/f'lm-{tag}-2k.webp',quality=88,method=6)
    report[tag] = {'replaced_texels':int(coverage.sum()),'atlas_texels':int(coverage.size),
                   'mean_linear_change':float(np.abs(light[coverage]-original[coverage]).mean())}
print(json.dumps(report,indent=2))

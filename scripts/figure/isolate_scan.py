#!/usr/bin/env python3
"""Select original Gaussians inside reviewed person silhouettes; export PLY/SPLAT.

The source is never rewritten. Masks must share the camera projection in the
profile. This is 3D selection, not a flattened PNG cutout or generated detail.
"""
from pathlib import Path
from itertools import product
import argparse
import hashlib
import json
import numpy as np
from PIL import Image
from splat import read_ply, values, colour, write_splat


def largest_component(selected, voxel):
    cells, inverse, counts = np.unique(
        np.floor(values(selected, 'xyz') / voxel).astype(int), axis=0,
        return_inverse=True, return_counts=True,
    )
    index = {tuple(cell): i for i, cell in enumerate(cells)}
    remaining = set(index)
    neighbours = list(product([-1, 0, 1], repeat=3))
    best, mass = [], 0
    while remaining:
        queue, group = [remaining.pop()], []
        while queue:
            cell = queue.pop()
            group.append(index[cell])
            for dx, dy, dz in neighbours:
                other = (cell[0] + dx, cell[1] + dy, cell[2] + dz)
                if other in remaining:
                    remaining.remove(other)
                    queue.append(other)
        weight = counts[group].sum()
        if weight > mass:
            best, mass = group, weight
    return selected[np.isin(inverse, best)]


def isolate(raw, profile, mask_dir):
    position = values(raw, 'xyz')
    scale = np.exp(values(raw, ['scale_0', 'scale_1', 'scale_2']))
    opacity = 1 / (1 + np.exp(-np.clip(raw['opacity'], -60, 60)))
    rotation = values(raw, ['rot_0', 'rot_1', 'rot_2', 'rot_3'])
    keep = np.isfinite(position).all(axis=1) & np.isfinite(scale).all(axis=1)
    keep &= np.isfinite(rotation).all(axis=1) & (np.linalg.norm(rotation, axis=1) > 0)
    keep &= (opacity >= profile['min_opacity']) & (scale.max(axis=1) < profile['max_scale'])
    limits = profile['world_bounds']
    keep &= (position >= limits[0]).all(axis=1) & (position <= limits[1]).all(axis=1)
    for view in profile['views']:
        mask = np.asarray(Image.open(mask_dir / view['mask']).convert('L'))
        if mask.shape != (view['size'], view['size']) or mask.max() < 128:
            raise ValueError(f"Invalid or empty person mask: {view['mask']}")
        forward = -np.asarray(view['offset'], dtype=float)
        forward /= np.linalg.norm(forward)
        right = np.cross(forward, [0, -1, 0])
        right /= np.linalg.norm(right)
        up = np.cross(right, forward)
        projected = (position - view['target']) @ np.stack([right, -up, forward]).T
        pixel = np.round(projected[:, :2] * view['size'] / view['span'] + view['size'] / 2).astype(int)
        inside = (pixel >= 0).all(axis=1) & (pixel < view['size']).all(axis=1)
        accepted = np.zeros(len(raw), dtype=bool)
        accepted[inside] = mask[pixel[inside, 1], pixel[inside, 0]] > view['threshold']
        keep &= accepted
    # This take's red bedding touches the hem. A reviewed, local colour exclusion
    # removes it below the waist without touching the face or changing any colours.
    red = profile.get('red_bedding')
    if red:
        c = colour(raw)
        keep &= ~((position[:, 1] > red['below_y'])
                  & (c[:, 0] > c[:, 1] * red['red_green_ratio'])
                  & (c[:, 0] > c[:, 2] * red['red_blue_ratio']))
    selected = raw[keep]
    if len(selected) < 1000:
        raise ValueError('Person crop is empty or implausibly small; no output written')
    return largest_component(selected, profile['voxel_size'])


def write_ply(selected, path):
    # Retain all 62 original fields, including the higher-order SH coefficients.
    header = ('ply\nformat binary_little_endian 1.0\n'
              f'element vertex {len(selected)}\n'
              + ''.join(f'property float {name}\n' for name in selected.dtype.names)
              + 'end_header\n')
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('wb') as output:
        output.write(header.encode('ascii'))
        selected.tofile(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--profile', type=Path, default=Path(__file__).with_name('sector-124.json'))
    parser.add_argument('--mask-dir', type=Path, default=Path(__file__).with_name('masks'))
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--ply-output', type=Path)
    parser.add_argument('--cache', type=Path)
    args = parser.parse_args()
    profile = json.loads(args.profile.read_text())
    source_hash = hashlib.sha256()
    with args.input.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            source_hash.update(chunk)
    digest = source_hash.hexdigest()
    if digest != profile['source_sha256']:
        raise ValueError('This profile belongs to a different scan; regenerate views and masks first')
    if args.output.resolve() == args.input.resolve() or (args.ply_output and args.ply_output.resolve() == args.input.resolve()):
        raise ValueError('The source scan must never be overwritten')
    raw = read_ply(args.input)
    selected = isolate(raw, profile, args.mask_dir)
    size = write_splat(selected, args.output)
    if args.ply_output:
        write_ply(selected, args.ply_output)
    if args.cache:
        args.cache.parent.mkdir(parents=True, exist_ok=True)
        np.save(args.cache, selected)
    print(json.dumps({'source': args.input.name, 'source_gaussians': len(raw),
                      'isolated_gaussians': len(selected), 'splat_bytes': size,
                      'source_sha256': digest, 'output': str(args.output)}))


if __name__ == '__main__':
    main()

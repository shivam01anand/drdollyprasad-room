#!/usr/bin/env python3
"""Crop Dolly's local Scaniverse take; write a degree-zero, 32-byte .splat.

python3 scripts/figure/splat.py
Requires numpy. Raw scans never leave assets/figure/scan/.
The supplied takes show a floral jacket and a cross-legged pose, not the
pink hoodie in the original figure photographs. Preserve the scanned pose.
"""
from pathlib import Path
import argparse
from itertools import product
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SEAT = np.array([.045, .36, .27])
FORWARD = np.array([-.74, 0, -.673]); FORWARD /= np.linalg.norm(FORWARD)
RIGHT = np.array([-FORWARD[2], 0, FORWARD[0]])


def read_ply(path):
    with path.open('rb') as f:
        fields = []
        count = 0
        while True:
            line = f.readline().decode('ascii').strip()
            if line.startswith('format '):
                if line != 'format binary_little_endian 1.0':
                    raise ValueError('Expected little-endian Scaniverse PLY')
            if line.startswith('element vertex '):
                count = int(line.split()[-1])
            if line.startswith('property '):
                _, kind, name = line.split()
                if kind != 'float':
                    raise ValueError('Expected float properties')
                fields.append((name, '<f4'))
            if line == 'end_header':
                break
            if not line:
                raise ValueError('Incomplete PLY header')
        data = np.fromfile(f, dtype=np.dtype(fields), count=count)
        if len(data) != count:
            raise ValueError('Incomplete PLY vertices')
        return data


def values(a, names):
    return np.stack([a[n] for n in names], axis=1)


def colour(a):
    return np.clip(.5 + .28209479177387814 * values(a, ['f_dc_0', 'f_dc_1', 'f_dc_2']), 0, 1)


def local(a):
    p = values(a, 'xyz') - SEAT
    return np.stack([p @ RIGHT, -p[:, 1], p @ FORWARD], axis=1)


def polygon(x, y, points):
    inside = np.zeros(len(x), dtype=bool)
    for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1]):
        if y0 == y1:
            continue
        inside ^= ((y0 > y) != (y1 > y)) & (x < (x1-x0)*(y-y0)/(y1-y0)+x0)
    return inside


def crop(a):
    side, height, front = local(a).T
    scales = np.exp(values(a, ['scale_0', 'scale_1', 'scale_2']))
    opacity = 1 / (1 + np.exp(-np.clip(a['opacity'], -60, 60)))
    # Her profile: hair and bun, shoulders, painting arm and folded legs.
    outline = [(-.16,.015),(-.16,.18),(-.10,.36),(.015,.47),
               (.015,.62),(.065,.68),(.20,.68),(.28,.58),(.27,.48),
               (.24,.43),(.33,.33),(.46,.26),(.61,.245),(.625,.17),
               (.46,.155),(.47,.025),(.36,.012)]
    keep = polygon(front, height, outline)
    width = np.interp(height, [0,.1,.3,.43,.48,.7], [.31,.32,.28,.21,.145,.14])
    centre = np.interp(height, [0,.35,.48,.7], [.035,.04,.11,.11])
    keep &= abs(side-centre) < width
    keep &= (opacity >= .18) & (scales.max(axis=1) < .025)
    keep &= ~((height < .15) & (scales.max(axis=1) > .015))
    keep &= np.isfinite(values(a, 'xyz')).all(axis=1)
    # The palette in front of her lap, and the phone beside her left hand.
    keep &= ~((front > .29) & (height > .055) & (height < .235) & (side > .03))
    keep &= ~((front > .29) & (height < .195))
    keep &= ~((front > .26) & (height < .15) & (side > .24))
    # Blue bedding meets the underside of her folded trousers.
    c = colour(a)
    keep &= ~((height < .15) & (c[:,2] > c[:,0]*1.12) & (c[:,2] > c[:,1]*1.04))
    # Detached fragments beneath the palette and around the bedding are not her.
    selected = a[keep]
    cells, inverse, counts = np.unique(np.floor(local(selected)/.018).astype(int),
                                      axis=0, return_inverse=True, return_counts=True)
    index = {tuple(cell): i for i, cell in enumerate(cells)}
    remaining = set(index)
    neighbours = list(product([-1, 0, 1], repeat=3))
    largest, largest_count = [], 0
    while remaining:
        queue = [remaining.pop()]
        component = []
        while queue:
            cell = queue.pop()
            component.append(index[cell])
            for dx, dy, dz in neighbours:
                neighbour = (cell[0]+dx, cell[1]+dy, cell[2]+dz)
                if neighbour in remaining:
                    remaining.remove(neighbour)
                    queue.append(neighbour)
        count = counts[component].sum()
        if count > largest_count:
            largest, largest_count = component, count
    return selected[np.isin(inverse, largest)]


def write_splat(a, path):
    out = np.zeros(len(a), dtype=[('position','<f4',3), ('scale','<f4',3),
                                 ('rgba','u1',4), ('rotation','u1',4)])
    out['position'] = values(a, 'xyz')
    out['scale'] = np.exp(values(a, ['scale_0', 'scale_1', 'scale_2']))
    out['rgba'][:,:3] = np.round(colour(a)*255)
    out['rgba'][:,3] = np.round(255/(1+np.exp(-np.clip(a['opacity'], -60, 60))))
    q = values(a, ['rot_0', 'rot_1', 'rot_2', 'rot_3'])
    q /= np.linalg.norm(q, axis=1)[:,None]
    out['rotation'] = np.clip(np.round(q*128+128), 0, 255)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.tofile(path)
    return out.nbytes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'public/art/figure/dolly.splat')
    args = parser.parse_args()
    raw = read_ply(ROOT/'assets/figure/scan/take-122.ply')
    cropped = crop(raw)
    size = write_splat(cropped, args.output)
    print(f'take-122: {len(raw):,} → {len(cropped):,} splats; SH 0; {size:,} bytes')


if __name__ == '__main__':
    main()

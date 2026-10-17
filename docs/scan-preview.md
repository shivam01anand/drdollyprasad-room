# Artist scan preview

The normal studio uses the modelled figure in `public/house/house.glb`. The
Gaussian-splat integration is preserved as an experiment and disabled by default.
It does not establish that the supplied scans are suitable for the site.

The two older Scaniverse takes supplied on 13 October show a cross-legged pose on a bed,
in a floral jacket. The face and painting hand are motion-softened, and the lap is
incomplete where the bedding obscured it. On 14 October, review rejected these
takes: the figure looked ghost-like in the studio and did not match the easel pose.
Replacing the existing figure with this asset should not be enabled for a release.

## Preserved implementation

- `scripts/figure/splat.py` crops take 122 into an SH-0 `.splat`: 96,761 splats,
  3,096,352 bytes. The raw PLY files stay local in ignored `assets/figure/scan/`.
- `scripts/figure/splat_review.py` makes local CPU previews with NumPy and Pillow.
- `lib/room/dolly.ts` loads the scan after the welcome, uses a CPU sorting worker
  without shared memory, and shares the room's depth and day/night lighting.
- Sorting completion requests a frame from the room's render-on-demand loop.
- The modelled figure stays visible until the optional scan loads successfully.
  A load failure retains the model. The scan hides in plan/rearrange views and
  disposes its renderer when the room is destroyed.

To examine the experiment locally:

```sh
NEXT_PUBLIC_DOLLY_SCAN=true npm run dev -- -p 3841
```

The environment variable is a build-time option. Leave it unset for normal builds.
The repository includes cropped drafts, not the original scans, review
recordings, credentials, dependencies, or bake intermediates.

## New take 124: isolated person

On 18 October, takes 123 and 124 were compared from matching camera angles. Take
124 has the clearer face and more coherent hands. Its bed and room have now been
removed from the actual 3D data. The new asset is
`public/art/figure/dolly-124.splat` (268,201 Gaussians; 8,582,432 bytes).
It is separate from the older room experiment and has not replaced that asset.

Two reviewed frontal person silhouettes select the original Gaussians in 3D.
An opacity/scale filter, a local red-bedding exclusion below the waist, and the
largest connected component remove the remaining surrounding fragments. The
checked masks and exact projection/profile are in `scripts/figure/`. Rear masks
are deliberately excluded: bedding occludes her torso from behind, so intersecting
that silhouette would also delete real body points. Front, side and rear renders
were reviewed instead.

Reproduce from the local, unmodified source (NumPy and Pillow required):

```sh
python3 scripts/figure/isolate_scan.py \
  --input "$HOME/Downloads/Sector 124.ply" \
  --output public/art/figure/dolly-124.splat \
  --ply-output "$HOME/Desktop/DrDollyPrasad_Isolated_Sector124.ply"
```

The profile checks the source SHA-256 before exporting. PLY retains all 62 source
fields and their exact values, including higher-order spherical harmonics. SPLAT
uses SH-0 colour for the browser. Source opacity logits include positive infinity
(fully opaque); these are preserved in PLY and safely mapped to alpha 255 in SPLAT.
The exported PLY was checked as an exact subset of the source, and its round trip
matches the selected data byte for byte.

Review the cleaned asset locally without changing the house:

```sh
node scripts/figure/preview.cjs "$HOME/Desktop/DrDollyPrasad_Isolated_Sector124.ply"
```

Open `http://127.0.0.1:3842`. Drag to rotate, scroll to zoom, or reset the view.
The server binds only to loopback and serves an explicit list of cleaned assets.
The preview was checked in Chrome with rotation and reset, with no console errors.

The seated pose, face, hands and clothing come from the scan. Lower clothing edges
and the underside of the legs remain soft/incomplete in the source, and no missing
feet or body detail has been invented. Placement in the studio still needs a
separate review; the production website and its modelled figure are unchanged.

## Next step

A replacement scan needs a still painting pose, bright even light, visible feet
and legs, and clear face/hand detail. Crop and inspect it before changing placement.
Then check desktop and phone views, day/night colour, house occlusion, camera turns,
sorting, missing-asset fallback, and plan/rearrange transitions. A final release
also needs a new house bake without the old model's baked shadow.

GitHub publication preserves the development work. It does not deploy these
unreleased changes to drdollyprasad.com.

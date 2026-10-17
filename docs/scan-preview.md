# Artist in her studio

Her isolated take 124 is the normal studio figure. `lib/room/dolly.ts` loads it
after the welcome and places it beside the easel. The approximate MPFB figure and
its small round stool disappear only after the scan has loaded successfully.
A failed download retains the fallback model and stool.

The 11–14 October Claude discussion asked for a real likeness in the house,
correct scale, day/night light and removal of the mannequin. The older takes
121/122 were rejected for smeared face/hands and a pose mismatch. Take 124 has the
clearer face and more coherent hands. Its bed and room are now removed from the
actual 3D data. The website loads `public/art/figure/dolly-124.splat`
(268,201 Gaussians; 8,582,432 bytes), not the rejected take 122 draft.

## Placement and runtime

`lib/room/dolly-placement.json` is shared by the web placement and local bake tools.
Her source coordinates are preserved, with -Y up, then rotated and scaled 1.15×
into the house. The seat reference is [1.93, .46, -4.12] in three.js coordinates.
The 74° yaw presents her face to the existing chapter camera. A broad, low wooden
seat with a linen cushion supports the captured pose; no painting hand or feet
are generated. Her body bounds are [1.574, .409, -4.468] to [2.294, 1.361, -3.759].

The renderer uses a CPU sort worker without shared memory. Sorting completion
wakes the room's demand renderer, and a world-space copy of the rig camera keeps
the sort correct during turns. It shares the room's depth buffer and day/night
colour. Her scan and new seat hide in plan/rearrange views and dispose with the
room. `NEXT_PUBLIC_DOLLY_SCAN=false` is a build-time fallback switch; leave it
unset for the normal experience.

The local corner bake uses the published GLB's exact UVs, source house lights,
and a shadow-only hull of the scan. The mannequin and its old stool do not cast
shadows into that bake. The hull is never exported as her visible body. The
covered floor/wall/canvas texels are rebaked for day and night; other rooms retain
their existing light. Reproduce with:

```sh
blender -b scripts/house/work/v17/house.blend \
  -P scripts/figure/rebake_scan_corner.py -- \
  --scan "$HOME/Desktop/DrDollyPrasad_Isolated_Sector124.ply" \
  --out review/scan-corner --samples 96
blender -b -P scripts/bake/denoise.py -- review/scan-corner lm-day
blender -b -P scripts/bake/denoise.py -- review/scan-corner lm-night
python3 scripts/figure/publish_corner_light.py review/scan-corner
```

A local CPU perspective composition (`review_placement.py`) checks scale and
seating against the chapter's Blender camera. It does not replace browser QA.
Raw scans, review files and bake intermediates stay local and ignored.

## Isolating take 124

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
feet or body detail has been invented. Her studio is arranged around that pose.

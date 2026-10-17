# Her likeness on the painting figure

The studio keeps its original painting pose: pink hoodie, seated on the small
round stool, right hand gripping the brush, brush tip touching the canvas, left
hand in her lap. Only the generic head is replaced with her actual captured head.
The full seated scan and its hands-in-lap pose are not loaded into the house.

`scripts/figure/prepare_painter_head.py` crops take 124 to the skull, hair and
central neck, excludes the patterned shirt, and fades the lower neck boundary.
A measured similarity transform matches the original painter's head scale and
neck. Her face points toward the brush contact. The transform is shared by the
web renderer and local scene review in `lib/room/dolly-head-placement.json`.

`scripts/figure/separate_painter_head.py` separates the original body's head faces
into `Figure_dollyHeadFallback`. The head, hair and glasses carry `headFallback`
metadata. No arm, hand, brush, clothing or stool vertices move. Both texture UVs
and the original day/night lightmap UVs are preserved. The original painting-pose
lightmaps are restored; the abandoned full-scan bench bake is not used.

After the welcome, `lib/room/dolly.ts` loads only `dolly-head.splat` (about 1 MB).
Once it succeeds, `Room.ts` hides only the generic head meshes. The body, hands,
brush and stool remain visible. A failed head download keeps the original head
in place. The head shares scene depth, camera sorting and the day/night blend.
There is no additional seat and no full-body scan load.

## Reproduce locally

Raw scans and review outputs remain local and ignored. Prepare the cleaned take
with `isolate_scan.py` as before, writing full scan exports under
`assets/figure/scan/`, not under `public/`.

The head preparation requires NumPy, SciPy and Pillow. Blender 5 supplies the
figure mesh tools. Run the separation against the original published house
(commit 286624c), before copying the resulting GLB over it:

```sh
python3 scripts/figure/prepare_painter_head.py \
  --scan "$HOME/Desktop/DrDollyPrasad_Isolated_Sector124.ply" \
  --out review/painter-head
blender -b -P scripts/figure/separate_painter_head.py -- review/painter-head
```

`assets/figure/dolly-pose.json` records the original frame, neck, brush grip and
canvas contact; `model.py` also writes this metadata when regenerating the model.
The separation preserves every original body vertex position and both UV layers.

Review the head from the actual chapter camera, face-on and in profile:

```sh
blender -b scripts/house/work/v17/house.blend \
  -P scripts/figure/review_painter_head.py -- review/painter-head
python3 scripts/figure/compose_painter_head.py review/painter-head
```

These are local 3D placement/likeness checks, not browser screenshots. They use
the exact head transform and camera projection. The scan's fine hair and ears
retain the capture's softness. Full seated-scan review remains available through
`node scripts/figure/preview.cjs /path/to/isolated.ply`, bound only to loopback.

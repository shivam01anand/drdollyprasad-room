# Artist scan preview

The normal studio uses the modelled figure in `public/house/house.glb`. The
Gaussian-splat integration is preserved as an experiment and disabled by default.
It does not establish that the supplied scans are suitable for the site.

The two Scaniverse takes supplied on 13 October show a cross-legged pose on a bed,
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
The repository includes only the cropped draft, not the original scans, review
recordings, credentials, dependencies, or bake intermediates.

## Next step

A replacement scan needs a still painting pose, bright even light, visible feet
and legs, and clear face/hand detail. Crop and inspect it before changing placement.
Then check desktop and phone views, day/night colour, house occlusion, camera turns,
sorting, missing-asset fallback, and plan/rearrange transitions. A final release
also needs a new house bake without the old model's baked shadow.

GitHub publication preserves the development work. It does not deploy these
unreleased changes to drdollyprasad.com.

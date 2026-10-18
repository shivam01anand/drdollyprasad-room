# Performance audit — 18 October 2026

Baseline: `8ba9d33`, the painter correction with Shake the room removed.
This pass preserves the artwork files, model, lighting, shader effects, render
resolution, camera path and intentional animation durations.

## Findings and changes

| Area | Before | Change |
| --- | --- | --- |
| Before the greeting | A third-party Google Fonts stylesheet blocks painting, then fonts load from a second origin. | Serve the identical WOFF2 files locally, preload the four welcome fonts, and cache their hashed filenames. All 27 font-face definitions and Unicode ranges are retained. |
| Opening the house | Near-room photographs start only after the GLB, its embedded images and both lightmaps finish loading and decoding. | Read the small house manifest independently and start photographs, model and surfaces together. Preload the model/manifest from HTML and fetch the Draco decoder while the model downloads. |
| Hero painting | The welcome downloads the large photo, then the room downloads a second, smaller version. | Reuse the welcome's larger photo in the room. This removes a 280,248-byte download while increasing the room hero's source resolution. |
| Individual painting pages | The shared layout preloads the studio hero even when opening a different painting directly. | Keep studio assets and welcome-only font preloads on the home page; individual painting pages preload just their shared text fonts. |
| Painting surfaces | Normal-map generation runs on the main thread during the opening and gallery loading. | Move the unchanged pixel algorithm into a dedicated worker using OffscreenCanvas and transferable image/pixel buffers. The original path remains for browsers without those APIs. |
| Gallery photographs | Three-at-a-time batches wait for the slowest photo and its synchronous relief, with 600 ms before the first batch and 120 ms between batches. | Keep three requests continuously in flight, separate relief work from downloads, and prioritize the requested chapter and neighboring walls. |
| First navigation | The artist head starts downloading/building only after the intro finishes. | Start it while the welcome still covers the ready room, without making it a prerequisite for opening. |
| Stationary views | Wall-label layout and projections repeat even when the camera and viewport have stopped changing. | Reposition on camera/viewport changes, resize or label reveal; share one canvas rectangle across projections. |
| Header contrast | `readPixels` synchronously reads the displayed frame every time header contrast is sampled. | Read the same pixels through a WebGL 2 pixel buffer and fence, then apply the same luminance calculation after completion. |

## Measurements available without browser control

These are repository measurements and a local arithmetic benchmark. They are not
browser load-time, frame-rate, or real-phone measurements.

| Opening assets, uncompressed transfer sizes | Bytes |
| --- | ---: |
| House model, lighting and manifest | 5,436,852 |
| Architecture PBR textures | 5,793,440 |
| Original near-room paintings | 4,208,939 |
| Welcome hero photo | 417,910 |
| Baseline total for those assets | 15,857,141 |
| Total after reusing the hero | 15,576,893 |

The four welcome font files total 120,356 bytes. Other font subsets load only
when needed. Image/model bytes otherwise remain unchanged; parallel loading
removes a dependency rather than reducing their quality or resolution.

On this machine, the original relief calculation at 768 × 548 pixels took
99.1 ms cold and a median 22.0 ms after warm-up in Node/V8. Canvas sampling,
image decode and GPU upload are excluded. Moving that calculation into a worker
removes its arithmetic from the animation thread; it does not claim the same
number of milliseconds saved in a browser.

## Verification and remaining profile

- Production build and TypeScript validation.
- SHA-256 comparison: every original file under `public/` matches the baseline.
- The relief arithmetic is unchanged from the original function.
- Existing welcome and camera animation timings are untouched.
- The baseline is retained locally for a controlled comparison.

The normal browser-control connection is unavailable. Headless Chrome profiling
requires the user's pending approval; no FPS or browser timing improvement is
claimed before that run. Desktop/mobile navigation, contrast, the worker fallback,
lightbox/zoom, filters and day/night transitions need the browser regression pass
before promoting the changes to the live domain.

Measure cold and repeat loads, greeting-visible/room-ready times, long animation
frames and CPU tasks while visiting every stop, opening a painting, zooming,
switching day/night, filtering works and returning to the studio.

## Further optimizations to evaluate from that profile

1. The two shader warm-ups and six-view environment capture are on the opening
   path. If they dominate, export/cache the same prefiltered environment rather
   than regenerating it on every visit; compare reflections before changing it.
2. The opening still requests about 15.6 MB of full-quality room assets. A smaller
   first-view set with ahead-of-camera loading can reduce that, but must be tested
   against fast Index jumps and the exhibition plan to prevent blank paintings.
3. Evaluate GPU-compressed textures against reference renders. They may reduce
   texture memory and upload cost, especially on phones; avoid accepting visible
   changes in painting detail, normal maps or lighting to improve a score.
4. The collage has 7.93 MB of lazy-loaded source photos. Responsive derivatives
   can reduce downloads at small display sizes while keeping original lightbox
   and zoom assets. Check opening transitions at desktop and phone pixel ratios.

Fonts can be refreshed manually with
`python3 scripts/performance/vendor-fonts.py`. Normal builds have no external font
download dependency. Their OFL license files are included in `public/fonts/`.

## Phone framing and glide follow-up

The phone's `n:<view>` cameras intentionally selected one work from multi-painting
hangs. Phone stops now fit all the labelled works, including their frame edges,
at the actual viewport aspect. Camera positions stay within the room, and the
lens changes continuously during the move. The desktop poses and path were
compared with `2acd359` at 2,595 positions across three viewport sizes: the camera
world and projection matrices match exactly. The new painter and gallery remain.

Motion uses the live site's 1.6 s touch-scroll glide and 2.6 s camera step limit.
The later desktop auto-snap has been removed. A layout measurement no longer
finishes an in-progress glide or copies the scroll target straight into the live
camera. Real size changes remap the current position and continue the remaining
move. Phone browser-bar height changes are coalesced for 120 ms before resizing
the GPU targets; width/orientation changes still apply immediately.

`DropInViewer` disables frustum culling on its update callback. The head now has
a conservative world-space visibility bound, so its sorter and draw are skipped
when outside the view. All captured splats, including three standard deviations
of their support, fit inside 0.20 m of the placement's head centre; the cull bound
uses 0.35 m. Background normal-map attachment and texture preuploads drain one at
a time while the camera rests. Photograph downloads and their priority remain;
an image that becomes visible before its preupload can still upload on that frame.
Artwork, lighting, render resolution and antialiasing quality are unchanged.

Validation: `npm run check:motion` checks whole-group framing on five portrait
sizes with normal and reduced motion, plus 30/60/120 Hz simulated camera updates
and resize continuity. With the local Blender source supplied as its optional
argument it also checks all camera paths against walls and door openings at six
viewport sizes. Six offline portrait renders confirm the wall compositions.
These checks do not measure browser frame rates or prove that all device-specific
stuttering is resolved. The actual browser regression/profile is still pending
the disconnected browser connection or permission for headless Chrome.

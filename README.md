# drdollyprasad.com — the house

An adaptation of the davidlee.studio technique (teardown: `~/projects/davidlee-studio-teardown`)
for Dr Dolly Prasad. The mechanics are the original's; the house, its light and everything in
it are hers: a gallery inside a Delhi home, built and lit in Blender.

    NEXT_PUBLIC_VARIANT=daylight npx next dev -p 3841

## The journey

1. **Preloader** — the original beat for beat: `%` and a counter in the corners, the counter
   becomes the name (`→ Dr Dolly` / `Prasad`), both Flip into a centred lockup, then into the
   header. Then hers: *Woman with Poppies* is shown clean with "Welcome to my studio", placed at
   the exact rectangle the 3D painting occupies (`Room.heroRect()`), so when the panel lifts the
   courtyard appears around the painting.
2. **The house is shown, then the camera moves in.** Her things fall into place as the panel
   lifts (`bounce.out` from two metres, as the original drops its furniture).
3. **A ten-step walk**, one section each, one source (`lib/chapters.ts`) for copy and camera:
   - **the Aangan**, a courtyard garden open to the sky: "Woman with Poppies", the floral works,
     "Under Canopy of Greens", then the arch;
   - **the Quiet Room**: the Bodhi Buddha under one light with her poem, then "The Blue Buddha"
     and "Threads of Faith" by the door;
   - **the Red Room** by the lane: "The Bullocks" and "Terracotta" on the red wall, then
     "Shree 420" and "Three Women in Red";
   - then up out of the house for **Featured** and **the plan** (exhibitions, her own words).

   Each turn is at most a quarter; every room change passes through a doorway
   (`scripts/house/pathcheck.py` proves it for the landscape and the portrait walk).
4. **Featured** — the original's slider; a click opens the work in a Flip lightbox, where it can
   be looked at closely (click, scroll, pinch) or seen in a room at its stated size.
5. **The collage** — every work, shown to relative scale where she has stated the size.
6. **About and contact** — her statement, her biography verbatim.

Also: **Shake the room** (the dollhouse view; drag tilts the house, her things tumble; Reset
hops them home) and **the diya** (dark mode: evening falls, the gallery lights and the brass
lamp come on — a second bake, not a filter).

## How it is built

| | |
|---|---|
| The house | `scripts/house/build.py` builds it in Blender 5 from code: lime-washed walls with deep reveals and softened edges, an arch, panelled studded teak doors, timber ceilings, CC0 props (Poly Haven, `assets/polyhaven`), modelled charpais, a brass lamp, milk cans and a cart wheel, and leaf-card foliage (bougainvillea, banana, peepal). |
| Light | `scripts/house/export.py` path-traces the diffuse light twice in Cycles into one lightmap atlas: the afternoon (sun from the west-south-west, sky, gallery lights) and the evening (sky down, gallery lights and lamps up). OpenImageDenoise cleans both. |
| Into the site | `scripts/house/publish.py` writes `public/house/`: the GLB (textures ≤1024 WebP, Draco), the two lightmaps (and 2k copies for phones) and `house.json` (cameras, canvases, colliders, anchors) in three's coordinates. |
| Materials | the architecture keeps the photographed PBR sets in `public/tex` (`lib/room/materials.ts`), laid in metres from world position at load; one shader patch (`lib/room/house.ts`) puts the baked light in place of live diffuse (`uBake`) and moves afternoon → evening (`uNight`). Live light remains for the things that move, the brass's glint, and Shake the room. |
| Rendering | one `gsap.ticker` loop drives Lenis and `Room.renderFrame(now)`. Render-on-demand; shadow maps re-render only while things move; half-res GTAO, MSAA 2, DPR ≤ 1.5 (phones 1.25, no MSAA, no AO). |
| Robustness | one terminal failure path (asset error, timeout, WebGL context loss, render exception) disposes the room and turns the page into the paintings; `prefers-reduced-motion` cuts between chapters; scroll locks have one owner. |

### Rebuilding the house

```sh
blender -b -P scripts/house/build.py -- scripts/house/work/vN --save=1          # add --render=presence,… to look
python3 scripts/house/pathcheck.py scripts/house/work/vN/house.json [narrow]   # no wall crossed
nohup blender -b scripts/house/work/vN/house.blend -P scripts/house/export.py -- scripts/house/work/vN/final --res=3072 --spp=144 &
blender -b -P scripts/bake/denoise.py -- scripts/house/work/vN/final lm-day     # and lm-night
python3 scripts/house/publish.py scripts/house/work/vN/final scripts/house/work/vN
```

The final bake takes about an hour on an M1; run it with `nohup`. Camera-only changes need no
rebake: rebuild with `--save=0` and copy the cams into `public/house/house.json`.

## Layout

    lib/chapters.ts        the walk: copy + Blender view per chapter, portrait views, poses
    lib/works.ts           the catalogue: titles, series, years, stated sizes, Available/Sold
    lib/motion.ts          GSAP plugins, genEase, ScrambleText with her glyph pool
    lib/room/Room.ts       engine: load, light, post, physics, input, public API
    lib/room/house.ts      the house: GLB, lightmaps, the baked-light patch, assembly
    lib/room/materials.ts  PBR roles, metric UVs, shader patches
    lib/room/rig.ts        camera rig, intro, scroll timeline, rearrange blend
    lib/closelook.ts       the lightbox's close look; lib/rooms.ts its rooms at scale
    components/            Studio (page + HUD + copy), Preloader, Featured, Lightbox, Works, Cursor
    scripts/house/         build, export, publish, pathcheck (Blender + tools)

## Checking it

The Chrome extension's tab is usually hidden, and hidden tabs get no animation frames, so
WebGL screenshots time out there. In development:

- `?fast` skips the preloader, `?shot=<chapter id>` lands on a beat, `?mode=dark` lights the diya,
  `?bake=0` shows the live light without the bake;
- `window.__studio.go(id)`, `.top(y)`, `.mode(m)`, `.rearrange(on)`;
- `window.__advance(ms)` steps the animation clock by hand in a hidden tab.

Headless Chrome via `puppeteer-core` against the installed Chrome renders everything
(`review/polish/tools`).

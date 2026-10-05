# drdollyprasad.com — the room

An adaptation of the davidlee.studio technique (teardown: `~/projects/davidlee-studio-teardown`)
for Dr Dolly Prasad. The mechanics are the original's; everything you see is hers.

    NEXT_PUBLIC_VARIANT=daylight npx next dev -p 3841

## The journey

1. **Preloader** — the original beat for beat: `%` and a counter in the corners, the counter
   becomes the name (`→ Dr Dolly` / `Prasad`), both Flip into a centred lockup, then into the
   header. Then hers: *Twenty Paise* is shown clean with "Welcome to my studio", placed at the
   exact rectangle the 3D painting occupies (`Room.heroRect()`), so when the panel lifts the
   room appears around the painting.
2. **The room is shown, then the camera moves in on one painting.** Her objects fall into
   place as the panel lifts (`bounce.out` from two metres, as the original drops its furniture).
3. **Seven chapters**, one per section, one source (`lib/chapters.ts`) for copy and camera:
   presence · what is leaving · what is still · the close read (the door's padlock) ·
   the shrine (the poem) · Featured · the plan (exhibitions, her own words).
4. **Featured** — the original's slider: heading, arrows, "All work", two card widths,
   captions alternating above and below, status pills, clip reveals, drag with inertia;
   a click opens the work in a Flip lightbox (a native `<dialog>`).
5. **The collage** — every work, shown to relative scale where she has stated the size.
6. **About and contact** — her biography, verbatim.

Also: **Shake the room** (the original's rearrange: dollhouse view, drag tilts the room, the
objects tumble; Reset hops them home) and **the diya** (dark mode: the lamp in the niche is
the only light, as in *Vakratunda* and *The Aarti*).

## How it is built

| | |
|---|---|
| Surfaces | Photographed CC0 PBR sets (Poly Haven) in `public/tex`, WebP, at real physical scale; `public/tex/1k` for phones (1024 colour, 512 normal/roughness). Static geometry is merged by material with world-space UVs in metres, so a wall built of nine boxes is one continuous plaster surface (~50 draw calls in all). |
| Shader additions | `materials.ts`: an 8 m macro-variation noise so the 2 m plaster never shows its repeat; walls darken toward the floor and soot toward the ceiling. |
| Light | sun through the grille (with a ray-marched haze volume), the open door dappled by a courtyard canopy that exists only in the shadow map, the open side as one large `RectAreaLight`, and the room's own light captured once into a PMREM environment (one bounce). Khronos PBR Neutral tone mapping, so canvases keep their colour. |
| Rendering | one `gsap.ticker` loop drives Lenis and `Room.renderFrame(now)`. Render-on-demand: a frame is drawn only when the camera, an animation or the physics changed something; shadow maps re-render only while things move. Half-res GTAO, MSAA 2, DPR ≤ 1.5 (phones 1.25, no MSAA, no AO). About 1 ms a frame on an M-series Mac. |
| Engine loading | `three` arrives as its own chunk alongside its textures; `cannon-es` loads only the first time the room is shaken. |
| Robustness | one terminal failure path (asset error, timeout, WebGL context loss, render exception) disposes the room and turns the page into the paintings; `prefers-reduced-motion` cuts between chapters instead of travelling; scroll locks have one owner; disposal waits for async shader compilation. |

## Layout

    lib/chapters.ts        the seven chapters: copy + camera, landscape and portrait framings
    lib/works.ts           the catalogue: titles, series, years, stated sizes, Available/Sold
    lib/motion.ts          GSAP plugins, genEase, ScrambleText with her glyph pool
    lib/room/Room.ts       engine: load, merge, light, post, physics, input, public API
    lib/room/materials.ts  PBR roles, metric UVs, shader patches, the carved राम
    lib/room/shell.ts      the room: walls, niche, door and hardware, window, courtyard
    lib/room/objects.ts    her objects, as lathe profiles
    lib/room/hang.ts       where each painting hangs, and how it is framed
    lib/room/rig.ts        camera rig, intro, scroll timeline, rearrange blend
    components/            Studio (page + HUD + copy), Preloader, Featured, Lightbox, Works

## Checking it

The Chrome extension's tab is usually hidden, and hidden tabs get no animation frames, so
WebGL screenshots time out there. In development:

- `?fast` skips the preloader, `?shot=<chapter id>` lands on a beat, `?mode=dark` lights the diya;
- `window.__studio.go(id)`, `.top(y)`, `.mode(m)`, `.rearrange(on)`;
- `window.__advance(ms)` steps the animation clock by hand in a hidden tab.

Headless Chrome via `puppeteer-core` against the installed Chrome renders everything,
including the header and copy.

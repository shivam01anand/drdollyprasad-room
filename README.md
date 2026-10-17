# drdollyprasad.com — the house

An adaptation of the davidlee.studio technique (teardown: `~/projects/davidlee-studio-teardown`)
for Dr Dolly Prasad. The mechanics are the original's; the house, its light and everything in
it are hers: a gallery inside a Delhi home, built and lit in Blender.

    NEXT_PUBLIC_VARIANT=daylight npx next dev -p 3841

## The journey

1. **The welcome** — warm paper, lamplight from above, and her greeting word by word: नमस्ते,
   then "Welcome to my studio" (Cormorant Garamond italic), her name, a hairline that fills as the
   house loads, and it goes straight in. The music begins with the visitor's first touch, click or
   key (a browser allows sound only then): a warm piece in D major synthesised in the browser,
   `lib/music.ts` — a canon's progression under a soft string pad, a felt piano rolling the chords
   and singing short phrases in the major pentatonic (Bhupali's notes), never the same twice; on
   unless the visitor turns it off, with a control in the header. Her name rises into the header, *Woman with Poppies* is shown clean at
   the exact rectangle the 3D painting occupies (`Room.heroRect()`), and the panel lifts with the
   courtyard around it. A second visit in a session is welcomed back and goes straight in.
2. **The house is shown, then the camera moves in.** Her things fall into place as the panel
   lifts (`bounce.out` from two metres, as the original drops its furniture).
3. **A nineteen-step walk**, one section each, one source (`lib/chapters.ts`) for copy and camera:
   - **the Aangan**, a courtyard garden open to the sky: "Woman with Poppies", the floral works,
     "Under Canopy of Greens" under two green-enamel studio lamps; then **her, at her easel** in the
     corner by the banana, painting: the canvas she is working on now, from her own photograph
     (`scripts/figure/make.py`: her pencil grid squares it; her upside-down underdrawing on its
     left taken off), and her modelled figure on the round stool in her pink hoodie (`scripts/figure`,
     below), baked into the house's afternoon and evening light; her palette, paints and brushes on a painted
     stool beside the easel, and her statement-poem with her; then the walk turns to the arch
     — the tall brass lamp of her openings beside it in a ring of marigolds — and goes straight
     through into the Quiet Room without stopping (a chapter's `via`: the rig runs power2.in to
     the passing pose and power2.out from it);
   - **the Quiet Room**: the Bodhi Buddha under one light, then its south-east
     corner — "The Blue Buddha" on the wall with the door, "Threads of Faith" on the wall beside
     it, one painting to a wall;
   - **the Red Room** by the lane: "The Bullocks" and "Terracotta" on the red wall, with her
     photograph — interviewed beside "The Bullocks" — on an easel between them; then "Shree 420"
     and "Three Women in Red", with Bandh Darwaze I–IV in a row on the wall to their left;
   - **the gallery**, through a doorway in the Red Room's east wall: a hall in the language of the
     India Habitat Centre, where she has shown — red-brown brick with grey concrete bands, the
     work on white panels between brick piers, the roof open under a space frame hung with folded
     teal and cream sunshades (the afternoon falls through it on the floor, never on a painting),
     and at the far end a window onto a court of palms. The rest of her work hangs in close
     groups, each its own stop, seen near (`HALL` in `build.py`): along the south wall Gone Are
     The Days — three, a pair, the six small panels in two rows; Faith a pair either side of the
     palm window; back along the north wall the portraits in two rows, a pair, and three. Its
     cards sit centred under the works (above them for a group's top row) and say only the title
     and whether it is free; its photographs load after the house has opened (`late`);
   - every canvas hangs in a float frame (a dark lip round a shadow gap, nothing of the canvas
     covered) and carries a printed wall label, typed in once the camera lands (`WallLabels`);
   - **the afternoon goes as you go in**: each chapter has a `dusk`, and the light moves toward
     the evening bake along the walk, the lamps coming up behind it; dark mode is all of it;
   - then up out of the house for **Featured** and **the plan** (exhibitions, her own words).

   On a computer the wheel, a trackpad or the keys move the walk freely, and when they come to
   rest it settles on a stop, as a phone's swipe does: a nudge settles back, a real scroll goes
   on to the next stop (a walk left between stops shows no labels and frames no wall). A window
   made larger or smaller keeps the visitor where they stood (every stop moves with the window's
   height; the walk is carried over in stops, not pixels), and the wall labels are placed again
   for the new size. The header's lettering is light where the room behind it is dark and dark
   where it is light, read from the frame as drawn (`Room.readLumaBehind`): the same wall sits
   behind it on one screen and not on another.

   Every room change passes through a doorway, through passing poses where a turn is long
   (`scripts/house/pathcheck.py` proves it for the landscape and the portrait walk). The camera
   walks: it follows the scroll softly and never takes a step faster than 3.4 s (`Rig.STEP_S`).
4. **Featured** — the original's slider; a click opens the work on a card over the house (the
   room stays in view, dimmed a little; a click outside puts it away), where it can be looked at
   closely (click, scroll, pinch) or seen in the room made for it (`lib/rooms.ts`, Blender renders
   in `review/rooms/blender`); the card shows the work, then the work in its room, and back, until
   the reader takes over (a swipe across the figure turns between them). Sizes appear only where
   she has stated them; those works hang at true size in the house, the rest a little larger.
5. **The collage** — every work, shown to relative scale where she has stated the size, with
   All · Available · Sold. **Quick access**: an Index tab on the left edge (the phone's dock sheet
   on a phone) lists every stop and her work by availability, for a visitor who would rather not walk.
6. **About and contact** — her statement, her biography verbatim.
7. **Every painting has its own page** (`app/work/[id]`, static): the work on her paper in its
   dark frame, its label, Enquire (a mail that names the work and links its page), Share, the room
   made for it, and **See it in her studio**, which opens the house, walks to the wall it hangs on
   and opens it there (`/#work=<id>`). A shared link shows the painting in the preview
   (`public/og`, from `scripts/og/make.py`). The card over the house shares the same page, and
   turns to the previous and next work (← →) in the order the walk or the collage shows them.
   `sitemap.xml`, `robots.txt` and schema.org data (her, and each work) are for search.

The canvases are paint, not prints (`lib/room/paint.ts`): a relief normal map read from each
photograph's fine detail, and a soft varnish sheen from its gallery light that slides as the camera
moves.

Also: **Shake the room** (the dollhouse view; drag tilts the house, her things tumble; Reset
hops them home) and **the diya** (dark mode: evening falls, the gallery lights and the brass
lamp come on — a second bake, not a filter).

## On a phone

Designed for the thumb, not shrunk from the desktop:

- **the walk in the hand** — a finger dragging up moves the walk toward the next wall (never
  further), release carries on there at a walking pace, a nudge settles back; a sideways swipe
  turns to the next wall (left) or the last (right), and so do the ‹ › arrows at the screen's
  edges; a first visit gets a hint; a tap on a painting opens it (on the tap itself);
  past the last stop the page scrolls freely through the works and the contact;
- phones render sharp: twice their pixels, 4× MSAA, the full lightmaps (only a weak machine
  gets the light set);
- **the dock** — one bar where the desktop has four pills: where you are (`04/19 · At her
  easel`) and a menu; the menu is a sheet from the bottom edge (`Stops`) with every stop,
  all her works, Shake the room, contact, mail and Instagram;
- every copy label sits clear of its painting (the portrait cameras frame each painting high,
  and on a short phone the poem sets in its two stanzas side by side);
- Featured is a carousel with its plate number (`03 / 12`); a painting opens on a tap, closes
  from a round chip in the corner or with a pull down;
- **Shake the room** uses the phone: tilt it and the house tilts, shake it and her things fly.

## How it is built

| | |
|---|---|
| The house | `scripts/house/build.py` builds it in Blender 5 from code: lime-washed walls with deep reveals and softened edges, an arch, panelled studded teak doors, timber ceilings, CC0 props (Poly Haven, `assets/polyhaven`), modelled charpais, a brass lamp, milk cans and a cart wheel, and leaf-card foliage (bougainvillea, banana, peepal). |
| Light | `scripts/house/export.py` path-traces the diffuse light twice in Cycles into one lightmap atlas: the afternoon (sun from the west-south-west, sky, gallery lights) and the evening (sky down, gallery lights and lamps up). OpenImageDenoise cleans both. It measures the light on each canvas, and `publish.py` evens it (`lk` per work in `house.json`): a painting under a strong spot is brought down so it is never washed out, one in a dim corner lifted a little. |
| Her | The default figure is built with MPFB by `scripts/figure/model.py` and baked into the house. An opt-in scan renderer (`lib/room/dolly.ts`, GaussianSplats3D 0.4.7) loads after the welcome and uses the house's depth and day/night light. It replaces the model only after loading succeeds. The supplied scan is a rejected draft; see [scan preview notes](docs/scan-preview.md). |
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

The experimental scan is converted locally (numpy; Pillow for the optional CPU previews):

```sh
python3 scripts/figure/splat.py
python3 scripts/figure/splat_review.py
NEXT_PUBLIC_DOLLY_SCAN=true npm run dev -- -p 3841
```

The raw takes stay in the ignored `assets/figure/scan/` directory. Only the cropped
`public/art/figure/dolly.splat` is included as a draft asset. The scan is disabled by
default: the supplied takes have a pose mismatch and insufficient face/hand detail.
[Scan preview notes](docs/scan-preview.md) record the limitations and next steps.
The original MPFB figure remains the default, including when a scan fails to load.

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

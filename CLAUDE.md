# drdollyprasad.com

Next.js site for the painter Dr Dolly Prasad: the 2D pages and the 3D studio (a Blender-built house walked in the browser with three.js). Deployed by Vercel from `main`; every branch gets a preview.

## Status: maintenance
The site is landed. Change only what Shubham flags. Never push to `main`; merging needs his "final approval" on that exact change, given on the iMessage board as a numbered SITE item.
Procedure (branch, preview, checks, separate reviewer, humanizer, approval, merge, record): `.claude/skills/site-change/SKILL.md` in the dolly-engine repo (`~/Desktop/Shubham-code/dolly-engine`).

## Where the words come from
- All copy, titles, sizes and years come from dolly-engine `kb/` (`kb/voice.md`, `kb/paintings.json`, `kb/site-copy.md` is the live text). Never invent a fact; nothing is presented as her words.
- After a merge, the live text is recorded in dolly-engine `kb/site-copy.md`.

## Checks
- `npm run build`, `npm run check:rooms`, `npm run check:motion`, `npm run check:type` (`check:analytics` when PostHog changes).
- Headless Chrome on the studio needs `--use-angle=swiftshader --enable-unsafe-swiftshader`.
- Known debt on main (23 Nov 2026): `check:motion` fails at 320 x 740 on the Red Room wall (riverside-figures cropped).
- [unconfirmed] Reported 23 Nov: at 320 px the move from the courtyard opener to the Bahaar stop hits a wall. `pathcheck.py` (normal and narrow) and `check:motion` don't catch it; confirm with mid-move frames before fixing.

## The studio
- `lib/chapters.ts` owns the copy and the camera of every stop. The rooms connect in one line (Aangan, gallery hall, Red Room, Quiet Room, courtyard) and every move passes through a doorway, so stop order is limited by geometry. A reorder is Blender work, never a copy edit.
- House pipeline (`scripts/house/`):
  1. `blender -b -P scripts/house/build.py -- <out dir>`: builds the house, writes house.blend and house.json.
  2. `blender -b <house.blend> -P scripts/house/export.py -- <out dir>`: bakes the day and night lightmaps, exports house.glb.
  3. `python3 scripts/house/publish.py <export dir> <build dir>`: writes `public/house/`.
  4. `python3 scripts/house/check-sizes.py` (every canvas at its kb size) and `python3 scripts/house/pathcheck.py <build dir>/house.json` (also with `narrow`): no camera through a wall.
  5. Then `check:rooms`, `check:motion`, mid-move frames at 320 and 390 px, and cold-load time with the network throttled to 10 Mbps.
- Blender work files (`scripts/house/work/`), `assets/polyhaven/` and other source assets are git-ignored and exist only on Shubham's Mac. Don't delete them; there is no other copy.

## Never
- Commit secrets or `.env*` files.
- Alter a painting image; presentation only.

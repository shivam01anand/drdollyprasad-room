# The light bake

The room is lit twice. Live, three.js lights it every frame: the sun through the grille,
the door light, the open side as a RectAreaLight, and hemisphere and ambient fill. That
lighting has no bounce and no soft occlusion, and it reads as a game. Baked, Blender's
Cycles path-traces the same lights once, with every bounce, soft sun, the canopy's dapple
and real contact shadow. It writes the result into one lightmap atlas that the site lays
back over the same geometry (`lib/room/bake.ts`).

The baked light holds in the daylight room at rest. In dark mode (the diya) and in
rearrange (where things move), the room fades back to live light over 0.9 s.

## Rebuild after changing the room

Any change to geometry in `shell.ts`, `objects.ts`, `hang.ts` or `Room.ts` invalidates
the bake. Meshes whose vertex count no longer matches simply stay live-lit, so nothing
breaks, but rebake before shipping.

```sh
# 1. dev server running, then export the scene, exactly as the site builds it
npx next dev -p 3841        # in another terminal (DIST_DIR=.next-dev)
node review/polish/tools/export-bake.mjs "$PWD/scripts/bake/work/scene.json"

# 2. bake (Blender 5.x, Metal GPU) at 4096 px and 160 samples: about 50 min on an M1
blender -b -P scripts/bake/bake.py -- scripts/bake/work/scene.json scripts/bake/work/final 4096 160

# 3. denoise (OpenImageDenoise, through Blender's compositor)
blender -b -P scripts/bake/denoise.py -- scripts/bake/work/final

# 4. encode for the site: public/bake/{lightmap.webp, lightmap-2k.webp, lm-uv.bin, lm.json}
python3 scripts/bake/encode.py scripts/bake/work/final public/bake
```

For a quick check, `1024 48` bakes in about 1.5 min. To render a site camera in Cycles,
`render_view.py` takes the camera from `review/polish/tools/campose.mjs`.

## How it fits together

- **Export** (`Room.exportForBake`, development only): every mesh, in world space and
  site vertex order, plus its material role, colour and roughness, and the lights. Moving
  objects go in at their rest pose as shadow casters. The canopy is shadow-only.
- **Bake** (`bake.py`):
  - Rebuilds the materials from the same photographed sets in `public/tex`.
  - Converts y-up to z-up.
  - Welds vertices for unwrapping, but keeps corner *i* of face *f* as original vertex
    3*f*+*i*, so the UVs map back one to one.
  - Smart-projects, averages texel density and scales each mesh by its `lm` density:
    far ground 0.06, courtyard 0.2. Then packs everything into one atlas.
  - Bakes DIFFUSE as direct + indirect without albedo, i.e. lighting only.
- **Encode**: 8-bit sRGB WebP with one scale, `MAX`, at the 99.8th percentile. The site
  sets `lightMapIntensity = MAX × π`, because three's lightmap is irradiance.
- **Runtime**: `uv2` from `lm-uv.bin`; cloned materials, so moving objects keep live
  light; and a shader patch that replaces live diffuse with the bake by `uBake`. Direct
  specular stays live, so the metal still glints. Screen-space AO drops to 0.22 while
  baked, since the bake carries the contact shadow.

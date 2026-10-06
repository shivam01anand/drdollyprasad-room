/**
 * Visual directions for the same room, so they can be seen side by side.
 *
 * Each one is argued from her canvases, not invented. Geometry, objects, hang
 * and camera are identical in all of them — only surface, light and ground
 * change. Daylight is the direction taken (ROOM-DESIGN.md, 4 Oct); the rest
 * stay runnable for comparison with ./run-variants.sh.
 */

export type Variant = {
  id: string;
  label: string;
  /** what in her work argues for it */
  note: string;
  /** the sky through the window and the open side */
  clear: number;
  exposure: number;
  sun: { color: number; intensity: number; pos: [number, number, number] };
  door: { color: number; intensity: number };
  /** the open side of the room, as one large soft window — what lights the
   *  walls evenly, the way a gallery lights a hang */
  front: { color: number; intensity: number };
  ambient: { color: number; intensity: number };
  hemi: { sky: number; ground: number; intensity: number };
  /** the room's own light, captured once and bounced back into it */
  env: number;
  /** multiplied into every room material */
  tint: number;
  /** <1 pulls the room toward grey, >1 pushes it toward its own hue */
  sat: number;
  /** the window shaft's haze */
  haze: number;
  startDark?: boolean;
};

const base = {
  clear: 0xefe9df,
  // the site matches Blender's PBR Neutral render of the bake; 1.12 keeps
  // the sunlit lime wash just short of white
  exposure: 1.12,
  sun: { color: 0xffe7c9, intensity: 4.0, pos: [7.8, 4.6, 0.9] as [number, number, number] },
  door: { color: 0xffd7a8, intensity: 1.35 },
  front: { color: 0xfff1e0, intensity: 9.0 },
  ambient: { color: 0xf3e6d2, intensity: 0.12 },
  hemi: { sky: 0xe6e1d8, ground: 0xc8b49a, intensity: 0.55 },
  env: 0.65,
  tint: 0xffffff,
  sat: 1,
  haze: 0.22,
};

export const VARIANTS: Record<string, Variant> = {
  /* the direction taken: a worn room off a courtyard, late afternoon */
  daylight: {
    ...base, id: "daylight", label: "Daylight",
    note: "Her plaster grounds — Mother and Son, The Newspaper Reader, The Chai Boy. " +
          "A worn room lit twice: the grille and the open door.",
  },
  /* the room gives up almost all colour, so the art holds every bit of it */
  grisaille: {
    ...base, id: "grisaille", label: "Grisaille",
    note: "Her own device in Twenty Paise and Mother and Son: a near-colourless ground with " +
          "the chroma rationed to one or two notes.",
    clear: 0xe9e8e4, sun: { ...base.sun, color: 0xfff6ec }, tint: 0xeceae6, sat: 0.18,
  },
  /* one flame, which is how she lights her devotional paintings */
  diya: {
    ...base, id: "diya", label: "Diya",
    note: "In Vakratunda and The Aarti the flame is the only light source and the only " +
          "broken-out colour. The whole room at night, lit by the lamp in its niche.",
    startDark: true,
  },
  /* room and art share one hue family and differ only by saturation */
  ochre: {
    ...base, id: "ochre", label: "Ochre",
    note: "Vakratunda and Gayatri are entire canvases in a single ochre key.",
    clear: 0xe6c9a0, tint: 0xffdcaa, sat: 1.3, sun: { ...base.sun, color: 0xffd9a6 },
  },
};

export const VARIANT_ID = (process.env.NEXT_PUBLIC_VARIANT as string) || "daylight";

export function activeVariant(): Variant {
  return VARIANTS[VARIANT_ID] ?? VARIANTS.daylight;
}

/** what the dark mode becomes: the diya, a little moonlight at the grille */
export const NIGHT = {
  clear: 0x0d0a08,
  exposure: 1.2,
  sun: { color: 0x8ea4c8, intensity: 0.32 },
  door: 0.0,
  // a breath of fill from the open side, so the hero still reads by lamplight
  front: 0.85,
  ambient: 0.07,
  hemi: 0.08,
  env: 0.12,
  diya: 1.5,
  haze: 0.0,
};

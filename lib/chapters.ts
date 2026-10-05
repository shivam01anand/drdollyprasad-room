import { aim, type Pose } from "./room/rig";
import type { HouseInfo, V3 } from "./room/house";

/**
 * One chapter model owns the copy and the camera, so the two can never drift
 * apart. The camera framings are the house's own views (scripts/house),
 * made in Blender and walked in order: each turn is at most a quarter, and
 * every move from one room to the next passes through a doorway
 * (scripts/house/pathcheck.py proves it).
 *
 * The journey: the Aangan, the courtyard garden, opens on "Woman with
 * Poppies"; through the arch into the Quiet Room; through its door into the
 * Red Room by the lane; then up, out of the house, for Featured and the plan.
 */
export type Chapter = {
  id: string;
  /** the label above the copy; also the accessible name of the beat */
  eyebrow: string;
  /** rendered as a paragraph; omit for a beat the house carries alone */
  body?: string;
  /** her own words, set as a quotation */
  quote?: string;
  /** rendered as verse, one line per line */
  verse?: string;
  /** the section is content of its own (the featured slider) */
  slot?: "featured";
  /** the header sits on dark material in this framing: set it in light ink */
  ink?: "light";
  /** the Blender view this chapter frames (house.json cams) */
  view: string;
};

export const POEM = `They are not things,
They are everything
They come to me
They hold my hand
They give me a brush
Then sit quietly
In front of me
I put them on canvas
I don’t paint
Am not a painter`;

export const CHAPTERS: Chapter[] = [
  { id: "presence", eyebrow: "“Woman with Poppies”", view: "presence" },
  {
    id: "floral",
    eyebrow: "Recent work · 2024–",
    body:
      "Hotter reds, a darker ground, and green entering her palette for the first time. Her own " +
      "words for these: pause, stillness, silence, listening. Two have already gone to New York " +
      "and London.",
    view: "floral",
  },
  { id: "canopy", eyebrow: "“Under Canopy of Greens” · 2025", view: "canopy" },
  { id: "threshold", eyebrow: "Faith · c. 2005–2015", view: "threshold" },
  { id: "bodhi", eyebrow: "Artist’s statement", verse: POEM, view: "bodhi" },
  {
    id: "faith",
    eyebrow: "“Threads of Faith” · 2026",
    body: "On view at Sacred Fragments: A Journey Home. New Delhi, 18–21 October 2026.",
    view: "faith",
  },
  {
    id: "street",
    eyebrow: "Gone Are The Days · c. 2016–2018",
    body:
      "Fourteen paintings of a country’s discarded equipment. Withdrawn coins, a pillar " +
      "postbox, hand-lettered posters for the last single-screen cinemas, a tonga going " +
      "out as an auto-rickshaw arrives. What is leaving she paints in full oil; what is " +
      "arriving she draws as a single bare line.",
    view: "street",
  },
  { id: "redwall", eyebrow: "“Shree 420” · “Three Women in Red”", view: "redwall" },
  { id: "featured", eyebrow: "Featured", slot: "featured", view: "featured" },
  {
    id: "plan",
    eyebrow: "Eighteen solo exhibitions · 2005–2018",
    body:
      "Triveni Kala Sangam · India Habitat Centre · ICCR · Travancore Art Gallery · " +
      "Lalit Kala Akademi · Nehru Art Gallery, Bombay.",
    quote:
      "As an artist whose work knows no borders, my pieces have journeyed far and wide, " +
      "finding their place in numerous private art collections globally. My creative " +
      "expression has resonated with diverse audiences, building connections that span " +
      "continents.",
    view: "plan",
  },
];

/** the painting the preloader shows, and the first the house frames */
export const HERO_ID = "woman-with-poppies";

/**
 * A Blender view as a rig pose: the pivot at the target, the camera `dist`
 * back along the line of sight. `prevYaw` unwraps the turn, so the camera
 * always takes the short way round.
 */
export function viewPose(v: { eye: V3; target: V3 }, prevYaw?: number, back = 1): Pose {
  const d: V3 = [v.target[0] - v.eye[0], v.target[1] - v.eye[1], v.target[2] - v.eye[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  const n = d.map((x) => x / len) as V3;
  // straight down: north is up the screen, as on a plan
  let yaw = Math.abs(n[1]) < 0.999 ? Math.atan2(-n[0], -n[2]) : 0;
  if (prevYaw !== undefined) {
    while (yaw - prevYaw > Math.PI) yaw -= 2 * Math.PI;
    while (yaw - prevYaw < -Math.PI) yaw += 2 * Math.PI;
  }
  const orbit = Math.asin(Math.max(-1, Math.min(1, n[1])));
  return aim(v.target, yaw, len * back, 0, orbit);
}

/** portrait screens keep the framings: the rig widens the lens instead
 *  (stepping back would put the camera through the wall behind it) */
const NARROW_BACK = 1;

/** a portrait screen has its own framing of a view where Blender made one ("n:<view>") */
const cam = (info: HouseInfo, view: string, narrow: boolean) => (narrow && info.cams[`n:${view}`]) || info.cams[view];

export function resolvePoses(info: HouseInfo, narrow = false): Pose[] {
  let prev: number | undefined;
  return CHAPTERS.map((c) => {
    const p = viewPose(cam(info, c.view, narrow), prev, NARROW_BACK);
    prev = p.pivotRot[1];
    return p;
  });
}

/** the establishing shot: the hero's wall, from the courtyard's far side */
export const startPose = (info: HouseInfo, narrow = false) => viewPose(cam(info, "start", narrow));
/** rearrange: the dollhouse view, high over the house */
export const messPose = (info: HouseInfo) => viewPose(info.cams.mess);

/** portrait screens get their own framings */
export const isNarrow = (aspect: number) => aspect < 0.85;

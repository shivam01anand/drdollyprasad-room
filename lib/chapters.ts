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
  /** how far the afternoon has gone when you stand here, 0…1 (1 is the evening) */
  dusk?: number;
  /** the canvases in this framing that get a wall label */
  labels?: string[];
  /** the stop's short name, for the phone's dock and the list of stops */
  stop: string;
  /** where in the house it is */
  room?: string;
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
  { id: "presence", eyebrow: "“Woman with Poppies”", stop: "Woman with Poppies", room: "The courtyard", view: "presence", labels: ["woman-with-poppies"] },
  {
    id: "floral",
    eyebrow: "Recent work · 2024–",
    stop: "Recent work",
    room: "The courtyard",
    body:
      "Hotter reds, a darker ground, and green entering her palette for the first time. Her own " +
      "words for these: pause, stillness, silence, listening. Two have already gone to New York " +
      "and London.",
    view: "floral",
    labels: ["child-among-flowers", "woman-with-red-flower", "woman-with-bird"],
  },
  { id: "canopy", eyebrow: "“Under Canopy of Greens” · 2025", stop: "Under Canopy of Greens", room: "The courtyard", view: "canopy", dusk: 0.04, labels: ["boy-with-bananas"] },
  { id: "threshold", eyebrow: "Faith · c. 2005–2015", stop: "The arch", room: "The courtyard", view: "threshold", dusk: 0.1 },
  { id: "bodhi", eyebrow: "Artist’s statement", stop: "Artist’s statement", room: "The Quiet Room", verse: POEM, view: "bodhi", dusk: 0.22, labels: ["monk-and-green-buddha"] },
  {
    id: "faith",
    eyebrow: "“Threads of Faith” · 2026",
    stop: "Threads of Faith",
    room: "The Quiet Room",
    body: "On view at Sacred Fragments: A Journey Home. New Delhi, 18–21 October 2026.",
    view: "faith",
    dusk: 0.28,
    labels: ["monks-and-blue-buddha", "temple-bells"],
  },
  {
    id: "street",
    eyebrow: "Gone Are The Days · c. 2016–2018",
    stop: "Gone Are The Days",
    room: "The Red Room",
    body:
      "Fourteen paintings of a country’s discarded equipment. Withdrawn coins, a pillar " +
      "postbox, hand-lettered posters for the last single-screen cinemas, a tonga going " +
      "out as an auto-rickshaw arrives. What is leaving she paints in full oil; what is " +
      "arriving she draws as a single bare line.",
    ink: "light",
    view: "street",
    dusk: 0.38,
    labels: ["terracotta-pots", "bulls-and-wheel"],
  },
  { id: "redwall", eyebrow: "“Shree 420” · “Three Women in Red”", stop: "Shree 420 · Three Women", room: "The Red Room", view: "redwall", dusk: 0.45, labels: ["shree-420-and-milk-cans", "three-veiled-women"] },
  { id: "featured", eyebrow: "Featured", stop: "Featured works", slot: "featured", view: "featured", dusk: 0.45 },
  {
    id: "plan",
    eyebrow: "Eighteen solo exhibitions · 2005–2018",
    stop: "Exhibitions",
    body:
      "Triveni Kala Sangam · India Habitat Centre · ICCR · Travancore Art Gallery · " +
      "Lalit Kala Akademi · Nehru Art Gallery, Bombay.",
    quote:
      "As an artist whose work knows no borders, my pieces have journeyed far and wide, " +
      "finding their place in numerous private art collections globally. My creative " +
      "expression has resonated with diverse audiences, building connections that span " +
      "continents.",
    view: "plan",
    dusk: 0.4,
  },
];

/**
 * The afternoon goes as you go in: the evening the walk has reached at
 * camera progress p (0…1), eased within each step as the camera is.
 */
export function duskAt(p: number) {
  const x = Math.min(1, Math.max(0, p)) * (CHAPTERS.length - 1);
  const i = Math.min(CHAPTERS.length - 2, Math.floor(x));
  const k = x - i, s = k * k * (3 - 2 * k);
  const a = CHAPTERS[i].dusk ?? 0, b = CHAPTERS[i + 1].dusk ?? 0;
  return a + (b - a) * s;
}

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

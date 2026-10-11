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
  /** a view the camera passes through, without stopping, on its way here */
  via?: string;
  /** how far the afternoon has gone when you stand here, 0…1 (1 is the evening) */
  dusk?: number;
  /** the canvases in this framing that get a wall label */
  labels?: string[];
  /** captions for things in the framing that are not her works (a house anchor and its words,
   *  and the thing's size in metres, so no wall label covers it) */
  asides?: { anchor: string; title: string; line: string; size: [number, number] }[];
  /** which side of its canvas a label tries first (a door or a corner on the other) */
  labelSide?: "left" | "right" | "below";
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
    // her own words, written for "Petals of Thought"
    quote:
      "Sometimes thoughts don’t need words… they just sit quietly, like a flower beside you. " +
      "A pause, a breath, a space where the mind softens and listens.",
    view: "floral",
    labels: ["child-among-flowers", "woman-with-red-flower", "woman-with-bird"],
  },
  { id: "canopy", eyebrow: "“Under Canopy of Greens” · 2025", stop: "Under Canopy of Greens", room: "The courtyard", view: "canopy", dusk: 0.04, labels: ["boy-with-bananas"],
    labelSide: "left",
    // her own words for the painting
    quote: "A young boy stands quietly beneath the shelter of large banana leaves. The bananas on his head look like a natural crown from the earth." },
  // her easel in the corner by the banana, a canvas primed and not yet begun: her statement beside it
  { id: "easel", eyebrow: "Artist’s statement", stop: "The easel", room: "The courtyard", verse: POEM, view: "easel",
    via: "easelvia", dusk: 0.12 },
  // from the easel the walk turns to the arch and goes straight through it into the Quiet Room
  { id: "bodhi", eyebrow: "“Buddha Under the Bodhi Tree” · c. 2005–2015", stop: "Buddha Under the Bodhi Tree", room: "The Quiet Room",
    view: "bodhi", via: "threshold", dusk: 0.22, labels: ["monk-and-green-buddha"] },
  {
    id: "faith",
    eyebrow: "“Threads of Faith” · 2026",
    via: "faithvia",
    stop: "Threads of Faith",
    room: "The Quiet Room",
    // her own words for the painting, then where it is showing
    quote: "Every thread representing a hope, desire, promise, or prayer.",
    body: "Showing at Sacred Fragments: A Journey Home, New Delhi, 18–21 October 2026.",
    view: "faith",
    dusk: 0.28,
    labels: ["monks-and-blue-buddha", "temple-bells"],
  },
  {
    id: "street",
    eyebrow: "Gone Are The Days · c. 2016–2018",
    stop: "Gone Are The Days",
    room: "The Red Room",
    // a portrait screen faces Threads of Faith: it turns to the passage before going through
    via: "streetvia",
    // the framed print on its easel is 0.64 × 0.48 m (scripts/house/build.py press_easel)
    asides: [{ anchor: "press", title: "The artist, in conversation", line: "Beside “The Bullocks”, at her exhibition", size: [0.64, 0.48] }],
    // her own words (her studio page, drdollyprasad.wordpress.com, 2018)
    quote:
      "The shades that touched me, the live frames that seemed to tell a story larger than the " +
      "attention they seemed to draw.",
    ink: "light",
    view: "street",
    dusk: 0.38,
    labels: ["terracotta-pots", "bulls-and-wheel"],
  },
  { id: "redwall", eyebrow: "“Shree 420” · “Three Women in Red”", stop: "Shree 420 · Three Women", room: "The Red Room", view: "redwall",
    via: "redvia", dusk: 0.45, labels: ["shree-420-and-milk-cans", "three-veiled-women"] },
  // through the Red Room's east doorway: the gallery hall, where the rest of her work hangs as an
  // exhibition hangs, one line at eye level, a series to a wall (scripts/house/build.py)
  { id: "gallery", ink: "light", eyebrow: "The gallery", stop: "The gallery", room: "The gallery",
    view: "gallery", via: "galleryvia", dusk: 0.5 },
  { id: "rupaya", ink: "light", eyebrow: "Gone Are The Days · c. 2016–2018", stop: "Mother India · Twenty Paise", room: "The gallery",
    view: "rupaya", dusk: 0.5, labelSide: "below",
    labels: ["rickshaw-puller-and-coin", "postbox-and-stamps", "mother-india-and-kettles", "cycle-rickshaw", "rickshaw-rest-framed"] },
  { id: "panels", ink: "light", eyebrow: "Gone Are The Days · c. 2016–2018", stop: "The Matka · The Rickshaw-wala", room: "The gallery",
    view: "panels", dusk: 0.52, labelSide: "below",
    labels: ["horse-cart-and-autorickshaw", "carriage-and-autorickshaw", "coins-and-clay-bank", "rickshaw-rest",
      "bullock-cart-and-truck", "rickshaw-and-autorickshaw"] },
  // either side of the window onto the palm court
  { id: "palms", ink: "light", eyebrow: "Faith · c. 2005–2015", stop: "Faith", room: "The gallery", view: "palms", dusk: 0.52,
    labelSide: "below", labels: ["offering-of-light", "prayer-and-scripture", "priest-with-flame", "sacred-tree"] },
  {
    id: "portraits",
    ink: "light",
    eyebrow: "Portraits · c. 2005–2015",
    stop: "Portraits",
    room: "The gallery",
    // her own page's words about her, as written there (drdollyprasad.wordpress.com)
    body: "Play of emotions, be it on the faces around her or on the canvas, have always fascinated her.",
    view: "portraits",
    dusk: 0.54,
    labelSide: "below",
    labels: ["red-turban-portrait", "yellow-turban-portrait", "elder-woman-portrait", "patterned-turban-portrait", "riverside-figures"],
  },
  { id: "doodhwala", ink: "light", eyebrow: "Portraits · c. 2005–2015", stop: "Mother and Son · The Doodhwala", room: "The gallery",
    view: "doodhwala", dusk: 0.55, labelSide: "below",
    labels: ["milkman-on-bicycle", "newspaper-reader", "mother-and-child", "boy-and-kettle", "man-among-metal-pans"] },
  { id: "featured", eyebrow: "Featured", stop: "Featured works", slot: "featured", view: "featured", dusk: 0.45 },
  {
    id: "plan",
    eyebrow: "Eighteen solo exhibitions · 2005–2018",
    stop: "Exhibitions",
    body:
      "Triveni Kala Sangam · India Habitat Centre · ICCR · Travancore Art Gallery · " +
      "Lalit Kala Akademi · Nehru Art Gallery, Bombay.",
    // the close of her studio page (drdollyprasad.wordpress.com, 2018)
    quote:
      "Each of these paintings reminds me I have yet to pick up many more hues to fill up some " +
      "empty lines, some yet to be filled up nooks. I hope it would be a life-long unraveling " +
      "with these tinges, an affair to last a lifetime…",
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

/**
 * The walk as the rig needs it: one pose per chapter, and for each step
 * between two chapters the pose it passes through, or null. Yaw is unwrapped
 * along the whole path, through the passing poses too.
 */
export function resolveWalk(info: HouseInfo, narrow = false): { shots: Pose[]; vias: (Pose | null)[] } {
  let prev: number | undefined;
  const shots: Pose[] = [], vias: (Pose | null)[] = [];
  CHAPTERS.forEach((c, i) => {
    if (i > 0) {
      // a passing pose the house has (an older build may not): otherwise straight on
      const vc = c.via ? cam(info, c.via, narrow) : undefined;
      const v = vc ? viewPose(vc, prev, NARROW_BACK) : null;
      if (v) prev = v.pivotRot[1];
      vias.push(v);
    }
    const p = viewPose(cam(info, c.view, narrow), prev, NARROW_BACK);
    prev = p.pivotRot[1];
    shots.push(p);
  });
  return { shots, vias };
}

/** the establishing shot: the hero's wall, from the courtyard's far side */
export const startPose = (info: HouseInfo, narrow = false) => viewPose(cam(info, "start", narrow));
/** rearrange: the dollhouse view, high over the house */
export const messPose = (info: HouseInfo) => viewPose(info.cams.mess);

/** portrait screens get their own framings */
export const isNarrow = (aspect: number) => aspect < 0.85;

/** Bandh Darwaze I–IV hang on the Red Room's north wall, seen from the Shree 420 stop (unlabelled) */
const BANDH_WALL = ["weathered-door-ring", "red-and-teal-door-lock", "teal-door-bolt", "carved-door-knocker"];

/** every work in the order the walk passes it, wall by wall (Bandh Darwaze with Shree 420) */
export const WALK_ORDER: string[] = CHAPTERS.flatMap((c) => [...(c.labels ?? []), ...(c.id === "redwall" ? BANDH_WALL : [])]);

/** the stop a work is seen at: the chapter that labels it, or the wall it hangs on; -1 if none */
export function stopOf(id: string) {
  const i = CHAPTERS.findIndex((c) => c.labels?.includes(id));
  return i >= 0 ? i : BANDH_WALL.includes(id) ? CHAPTERS.findIndex((c) => c.id === "redwall") : -1;
}

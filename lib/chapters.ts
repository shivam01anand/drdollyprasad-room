import { aim, type Pose } from "./room/rig";
import type { HouseInfo, V3 } from "./room/house";
import { phoneGroupView } from "./room/phone-framing";

/**
 * One chapter model owns the copy and the camera, so the two can never drift
 * apart. The camera framings are the house's own views (scripts/house),
 * made in Blender and walked in order: each turn is at most a quarter, and
 * every move from one room to the next passes through a doorway
 * (scripts/house/pathcheck.py proves it).
 *
 * The journey (re-hung by series, 27 Oct 2026): the Aangan opens on "Woman
 * with Poppies" and her at her easel, then Onset of Spring; through the arch into
 * the Quiet Room (Faith); through its door into the Red Room (Bandh Darwaze,
 * then Gone Are The Days), on along the gallery's south wall; back along its
 * north wall (Portraits); her desk at its east end.
 */
export type Chapter = {
  id: string;
  /** the label above the copy; also the accessible name of the beat */
  eyebrow: string;
  /** rendered as a paragraph; omit for a beat the house carries alone */
  body?: string;
  /** YYYY-MM-DD (New Delhi): the body line is shown only until the end of this day (components/Until) */
  bodyUntil?: string;
  /** her own words, set as a quotation */
  quote?: string;
  /** rendered as verse, one line per line */
  verse?: string;
  /** the header sits on dark material in this framing: light ink. Only until the room is drawn (or
   *  if it fails): then the header reads its ink from the frame itself (Studio, Room.readLumaBehind) */
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
  /** the room of the walk it belongs to (the menu's name) */
  room?: RoomName;
  /** the house's space it stands in (house.json plan): the phone frames a group inside it */
  space?: "aangan" | "quiet" | "red" | "gallery";
  /** About her: press and film ids, in order */
  press?: string[];
  /** a call to action under the copy */
  cta?: { label: string; href: string };
};

/** her poem, verbatim; its opening two lines were withdrawn (Shubham, with her agreement, 18 Oct 2026): do not restore */
export const POEM = `They come to me
They hold my hand
They give me a brush
Then sit quietly
In front of me
I put them on canvas
I don’t paint
Am not a painter`;

/** the rooms of the walk, in order: the menu's names (the door belongs to "About her") */
export const ROOMS = ["About her", "Onset of Spring", "Faith", "Bandh Darwaze", "Gone Are The Days", "Portraits", "Her desk"] as const;
export type RoomName = (typeof ROOMS)[number];

/** the room lines (locked by Shubham, 27 Oct 2026): ours, never presented as hers */
export const ROOM_LINE: Partial<Record<RoomName, string>> = {
  "Onset of Spring": "Some thoughts only need company.",
  Faith: "Where prayer is part of an ordinary day.",
  "Bandh Darwaze": "Weathered doors, still guarding what they hold.",
  "Gone Are The Days": "A twenty paise world, still in motion.",
  Portraits: "A whole life, folded into one glance.",
};

/** About her: the press and films, in this order (lib/press.ts ids) */
export const ABOUT_PRESS = ["ihc-press-01", "tv-ncr-2010", "delhi-times", "ihc-press-06", "ihc-press-03", "tv-archive"];

/*
 * The re-hang (27 Oct 2026): each series together, walked in Shubham's order.
 * The courtyard: Woman with Poppies at the door, her at her easel, Onset of Spring on the east and
 * south walls (Threads of Faith by the front door). The Quiet Room: Faith, all seven. The Red
 * Room: Bandh Darwaze on the north wall, Gone Are The Days on the south and east; the gallery's
 * south wall goes on with Gone Are The Days, its north wall is Portraits, its east end her desk.
 */
export const CHAPTERS: Chapter[] = [
  { id: "presence", eyebrow: "“Woman with Poppies”", stop: "Woman with Poppies", room: "About her", space: "aangan",
    view: "presence", labels: ["woman-with-poppies"] },
  // About her: her, at her easel, painting; the press and films beside (copy locked 27 Oct)
  // her words and the press are drawn by components/AboutHer.tsx (copy locked 27 Oct)
  { id: "about", eyebrow: "About her", stop: "About her", room: "About her", space: "aangan",
    press: ABOUT_PRESS, view: "easel", dusk: 0.04,
    // the canvas she is working on, from her own photograph (scripts/figure/make.py)
    asides: [{ anchor: "easel", title: "On her easel", line: "A new painting, in progress", size: [1.28, 1.06] }] },
  {
    id: "floral",
    eyebrow: "Onset of Spring · 2024 to 2026",
    stop: "Onset of Spring",
    room: "Onset of Spring",
    space: "aangan",
    body: ROOM_LINE["Onset of Spring"],
    // her own words, written for "Petals of Thought"
    quote:
      "Sometimes thoughts don’t need words… they just sit quietly, like a flower beside you. " +
      "A pause, a breath, a space where the mind softens and listens.",
    // from her easel, back past the door before turning to the east wall
    via: "presence",
    view: "floral",
    dusk: 0.08,
    labels: ["child-among-flowers", "woman-with-red-flower", "woman-with-bird"],
  },
  { id: "recent", eyebrow: "“Threads of Faith” · “Under Canopy of Greens”", stop: "Threads of Faith · Under Canopy of Greens",
    room: "Onset of Spring", space: "aangan", view: "recent", dusk: 0.12, labels: ["temple-bells", "boy-with-bananas"],
    // her own words for "Threads of Faith"
    quote: "Every thread representing a hope, desire, promise, or prayer." },
  // through the arch into the Quiet Room
  { id: "bodhi", eyebrow: "Faith · 2005 to 2015", stop: "Buddha Under the Bodhi Tree", room: "Faith", space: "quiet",
    body: ROOM_LINE.Faith, view: "bodhi", via: "threshold", dusk: 0.2, labels: ["monk-and-green-buddha"] },
  { id: "faithn", eyebrow: "“The Peepal Shrine” · “Gayatri” · “Vakratunda”", stop: "The Peepal Shrine · Gayatri · Vakratunda",
    room: "Faith", space: "quiet", view: "faithn", dusk: 0.24, labelSide: "below",
    labels: ["sacred-tree", "prayer-and-scripture", "offering-of-light"] },
  { id: "faith", eyebrow: "“The Aarti” · “The Blue Buddha” · “The Newspaper Reader”", stop: "The Aarti · The Blue Buddha",
    room: "Faith", space: "quiet", view: "faith", via: "faithturn", dusk: 0.28, labelSide: "below",
    labels: ["priest-with-flame", "monks-and-blue-buddha", "newspaper-reader"] },
  // through the Quiet Room's door into the Red Room: the doors on its north wall
  { id: "bandh", eyebrow: "Bandh Darwaze · 2018", stop: "Bandh Darwaze", room: "Bandh Darwaze", space: "red",
    body: ROOM_LINE["Bandh Darwaze"], view: "bandh", via: "bandhvia", dusk: 0.34, labelSide: "below",
    labels: ["weathered-door-ring", "red-and-teal-door-lock", "teal-door-bolt", "carved-door-knocker"] },
  {
    id: "street",
    eyebrow: "Gone Are The Days · 2016 to 2018",
    stop: "The Bullocks · Terracotta · Shree 420",
    room: "Gone Are The Days",
    space: "red",
    via: "streetturn",
    body: ROOM_LINE["Gone Are The Days"],
    // the framed print on its easel is 0.64 × 0.48 m (scripts/house/build.py press_easel)
    asides: [{ anchor: "press", title: "The artist, in conversation", line: "Beside “The Bullocks”, at her exhibition", size: [0.64, 0.48] }],
    // her own words (her studio page, drdollyprasad.wordpress.com, 2018)
    quote:
      "The shades that touched me, the live frames that seemed to tell a story larger than the " +
      "attention they seemed to draw.",
    ink: "light",
    view: "street",
    dusk: 0.4,
    labels: ["bulls-and-wheel", "terracotta-pots", "shree-420-and-milk-cans"],
  },
  // through the Red Room's east doorway: the gallery's south wall goes on with the series
  { id: "gatdhall", eyebrow: "Gone Are The Days · 2016 to 2018", stop: "Twenty Paise · The Cart-Man", room: "Gone Are The Days",
    space: "gallery", view: "gatdhall", via: "galleryvia", dusk: 0.46, labelSide: "below",
    labels: ["rickshaw-puller-and-coin", "postbox-and-stamps", "mother-india-and-kettles", "cycle-rickshaw", "rickshaw-rest-framed"] },
  { id: "panels", eyebrow: "Gone Are The Days · 2016 to 2018", stop: "The small panels", room: "Gone Are The Days", space: "gallery",
    view: "panels", dusk: 0.5, labelSide: "below",
    labels: ["horse-cart-and-autorickshaw", "coins-and-clay-bank", "rickshaw-and-autorickshaw", "carriage-and-autorickshaw",
      "rickshaw-rest", "bullock-cart-and-truck"] },
  // back along the hall to the north wall
  { id: "portraitsw", ink: "light", eyebrow: "Portraits · 2005 to 2015", stop: "The Doodhwala · Three Women in Red", room: "Portraits",
    space: "gallery", view: "portraitsw", via: "hallwest", dusk: 0.52, labelSide: "below",
    body: ROOM_LINE.Portraits,
    labels: ["milkman-on-bicycle", "three-veiled-women", "mother-and-child", "boy-and-kettle", "man-among-metal-pans"] },
  {
    id: "portraits",
    ink: "light",
    eyebrow: "Portraits · 2005 to 2015",
    stop: "The Turbans · The Boatmen",
    room: "Portraits",
    space: "gallery",
    // her own page's words about her, as written there (drdollyprasad.wordpress.com)
    body: "Play of emotions, be it on the faces around her or on the canvas, have always fascinated her.",
    view: "portraits",
    dusk: 0.54,
    labelSide: "below",
    labels: ["red-turban-portrait", "elder-woman-portrait", "yellow-turban-portrait", "patterned-turban-portrait", "riverside-figures"],
  },
  // the close: her desk at the hall's east end, the exhibitions wall either side of the palm window
  { id: "desk", eyebrow: "Her desk", stop: "Her desk", room: "Her desk", space: "gallery",
    // heading, line and button are drawn by components/Desk.tsx (copy locked 27 Oct)
    cta: { label: "Ask about a painting", href: "/enquire" },
    view: "desk", dusk: 0.58 },
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
export function resolveWalk(info: HouseInfo, narrow = false, aspect = 390 / 844): { shots: Pose[]; vias: (Pose | null)[] } {
  let prev: number | undefined;
  const shots: Pose[] = [], vias: (Pose | null)[] = [];
  CHAPTERS.forEach((c, i) => {
    if (i > 0) {
      // a passing pose the house has (an older build may not): otherwise straight on
      let vc = c.via ? cam(info, c.via, narrow) : undefined;
      // Turn toward the floral wall before stepping back to see its full hang.
      if (narrow && c.id === "floral") vc = info.cams.floral;
      const v = vc ? viewPose(vc, prev, NARROW_BACK) : null;
      if (v) prev = v.pivotRot[1];
      vias.push(v);
    }
    const group = narrow ? phoneGroupView(info, c.view, c.labels ?? [], c.space, aspect) : null;
    const p = viewPose(group ?? cam(info, c.view, narrow), prev, NARROW_BACK);
    if (group) p.fov = group.fov;
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

/** every work in the order the walk passes it, wall by wall */
export const WALK_ORDER: string[] = CHAPTERS.flatMap((c) => c.labels ?? []);

/** the stop a work is seen at: the chapter that labels it; -1 if none */
export function stopOf(id: string) {
  return CHAPTERS.findIndex((c) => c.labels?.includes(id));
}

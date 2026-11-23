import { aim, type Pose } from "./room/rig";
import type { HouseInfo, V3 } from "./room/house";
import { phoneGroupView } from "./room/phone-framing";

/**
 * One chapter model owns the copy and the camera, so the two can never drift
 * apart. The camera framings are the house’s own views (scripts/house),
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
  /** the label above the copy (the series and its years at a painting stop; the stop name is the accessible name) */
  eyebrow: string;
  /** rendered as a paragraph; omit for a beat the house carries alone */
  body?: string;
  /** YYYY-MM-DD (New Delhi): the body line is shown only until the end of this day (components/Until) */
  bodyUntil?: string;
  /** rendered as verse, one line per line */
  verse?: string;
  /** the section is content of its own (the featured slider) */
  slot?: "featured";
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
  /** the canvases a phone's framing gathers, when not all the labelled ones (default: labels) */
  frame?: string[];
  /** captions for things in the framing that are not her works (a house anchor and its words,
   *  and the thing’s size in metres, so no wall label covers it) */
  asides?: { anchor: string; title: string; line: string; size: [number, number] }[];
  /** which side of its canvas a label tries first (a door or a corner on the other) */
  labelSide?: "left" | "right" | "below";
  /** the stop’s short name, for the phone’s dock and the list of stops */
  stop: string;
  /** where in the house it is */
  room?: string;
};

/** the easel paragraph: Shubham’s words, shown unsigned; set as prose, not verse. Its own text since the content
 *  elevate (2026-11-22): the theme’s four words become the route of the walk. About has its own paragraph (lib/site.ts STATEMENT). */
export const THEME = `Each painting in this house starts with something seen every day and hardly noticed, a shut door or a cart in the road, and gives it the time a passer-by never did. The whispers are here in the courtyard. Through the arch, the Quiet Room is for wishing and worship, and in the Red Room past it, the old street waits.`;

export const CHAPTERS: Chapter[] = [
  { id: "presence", eyebrow: "Bahaar · 2024 to 2025", stop: "Khwaab", room: "The courtyard", view: "presence", labels: ["woman-with-poppies"],
    body: "The walk starts here in the courtyard and goes on through the house one room at a time." },
  {
    id: "floral",
    eyebrow: "Bahaar · 2024 to 2025",
    stop: "Bahaar",
    room: "The courtyard",
    body: "Spring is all around them, and each of them keeps a thought to themselves.",
    view: "floral",
    labels: ["child-among-flowers", "woman-with-red-flower", "woman-with-bird"],
  },
  { id: "canopy", eyebrow: "Bahaar · 2024 to 2025", stop: "Under Canopy of Greens", room: "The courtyard", view: "canopy", dusk: 0.04, labels: ["boy-with-bananas"],
    labelSide: "left",
    body: "He is the only one in Bahaar with a load to carry, and even he has stopped to look straight back at you." },
  // her corner by the banana: she paints at her easel, the theme paragraph beside her
  { id: "easel", eyebrow: "The everyday", stop: "At her easel", room: "The courtyard", body: THEME, view: "easel",
    via: "easelvia", dusk: 0.12,
    // the canvas she is working on, from her own photograph (scripts/figure/make.py)
    asides: [{ anchor: "easel", title: "On her easel", line: "A new painting, in progress", size: [1.28, 1.06] }] },
  // from the easel the walk turns to the arch and goes straight through it into the Quiet Room
  { id: "bodhi", eyebrow: "Faith · 2007 to 2026", stop: "Mannat", room: "The Quiet Room",
    view: "bodhi", via: "threshold", dusk: 0.22, labels: ["sacred-tree"],
    body: "The Quiet Room begins with wishing, the part of faith that asks for something and then has to wait." },
  {
    id: "faith",
    eyebrow: "Faith · 2007 to 2026",
    via: "faithvia",
    stop: "Dhyan · Threads of Faith",
    room: "The Quiet Room",
    body: "In one painting faith is still being learned, and in the other it has already got what it asked for.",
    view: "faith",
    dusk: 0.28,
    labels: ["monks-and-blue-buddha", "temple-bells"],
  },
  {
    id: "street",
    eyebrow: "Gone Are The Days · 2007 to 2018",
    stop: "Gone Are The Days",
    room: "The Red Room",
    // a portrait screen faces Threads of Faith: it turns to the passage before going through
    via: "streetvia",
    // the framed print on its easel is 0.64 × 0.48 m (scripts/house/build.py press_easel)
    asides: [{ anchor: "press", title: "The artist, in conversation", line: "Beside “Before the Engines”, at her exhibition", size: [0.64, 0.48] }],
    body: "The Red Room belongs to Gone Are The Days, and it opens with one painting from indoors and one from the road.",
    ink: "light",
    view: "street",
    dusk: 0.38,
    labels: ["terracotta-pots", "bulls-and-wheel"],
  },
  { id: "redwall", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Shree 420 · Evening at the Ghat", room: "The Red Room", view: "redwall",
    via: "redvia", dusk: 0.45, labels: ["shree-420-and-milk-cans", "riverside-figures"],
    body: "The day had its fixed points then, and this wall keeps the first and the last of them." },
  // Bandh Darwaze, four doors a foot square on the Red Room’s north wall: a stop of their own,
  // square on, so all four are seen and named together
  { id: "doors", eyebrow: "Bandh Darwaze · 2018", stop: "Bandh Darwaze I to IV", room: "The Red Room", view: "doors",
    dusk: 0.47, labelSide: "below",
    labels: ["weathered-door-ring", "red-and-teal-door-lock", "teal-door-bolt", "carved-door-knocker"],
    body: "Four shut doors, and behind each one a house waiting for a knock or for someone to come home." },
  // through the Red Room’s east doorway: the gallery hall, where the rest of her work hangs as an
  // exhibition hangs, one line at eye level, a series to a wall (scripts/house/build.py)
  { id: "gallery", ink: "light", eyebrow: "The gallery", stop: "The gallery", room: "The gallery",
    view: "gallery", via: "galleryvia", dusk: 0.5,
    body: "The rest of her work hangs here, one series to a wall, the way it would at an exhibition." },
  { id: "rupaya", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Twenty Paise · Patra Petika · Mother India", room: "The gallery",
    view: "rupaya", dusk: 0.5, labelSide: "below",
    labels: ["rickshaw-puller-and-coin", "postbox-and-stamps", "mother-india-and-kettles"],
    body: "Small change paid for most of daily life in those years, and each painting on this wall shows where some of it went." },
  { id: "cartman", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Last of the Pedals · Ek Rupaya", room: "The gallery",
    view: "cartman", dusk: 0.5, labelSide: "below", labels: ["cycle-rickshaw", "rickshaw-rest-framed"],
    body: "These two men are in the same trade, one at work and one between fares, and neither gets to stop for long." },
  { id: "panels", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Then and now", room: "The gallery",
    view: "panels", dusk: 0.52, labelSide: "below",
    labels: ["horse-cart-and-autorickshaw", "coins-and-clay-bank", "rickshaw-and-autorickshaw", "carriage-and-autorickshaw",
      "rickshaw-rest", "bullock-cart-and-truck"],
    body: "Four of the six paintings here put the old way of getting about next to the engine that replaced it." },
  // Faith, either side of the window onto the palm court
  { id: "shrine", eyebrow: "Faith · 2007 to 2026", stop: "Sharan · Aarti", room: "The gallery",
    view: "shrine", dusk: 0.52, labelSide: "below", labels: ["monk-and-green-buddha", "priest-with-flame"],
    body: "One man worships alone, and the other leads it for whoever comes." },
  { id: "gayatri", eyebrow: "Faith · 2007 to 2026", stop: "Gayatri · Vakratunda", room: "The gallery",
    view: "gayatri", dusk: 0.53, labelSide: "below", labels: ["prayer-and-scripture", "offering-of-light"],
    body: "In these two, worship is the same words repeated until they belong to the person saying them." },
  {
    id: "portraits",
    ink: "light",
    eyebrow: "Portraits · 2007 to 2012",
    stop: "Portraits",
    room: "The gallery",
    body: "Ordinary faces painted close, most of them named for the feeling they carry.",
    view: "portraits",
    dusk: 0.54,
    labelSide: "below",
    labels: ["three-veiled-women", "red-turban-portrait", "elder-woman-portrait", "yellow-turban-portrait", "patterned-turban-portrait", "mother-and-child"],
  },
  { id: "kadhai", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Bachpan · Intezar", room: "The gallery",
    view: "kadhai", dusk: 0.55, labelSide: "below", labels: ["boy-and-kettle", "man-among-metal-pans"],
    body: "Two street sellers sit out the slow part of the day here, and one of them is young to be working at all." },
  { id: "doodhwala", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Before the Chai · Morning Ritual", room: "The gallery",
    view: "doodhwala", dusk: 0.55, labelSide: "below", labels: ["milkman-on-bicycle", "newspaper-reader"],
    body: "Both men are up early, and only one of them has to be anywhere yet." },
  { id: "featured", eyebrow: "Featured", stop: "Featured works", slot: "featured", view: "featured", dusk: 0.45 },
  {
    id: "plan",
    eyebrow: "Nineteen exhibitions and art fairs · 2005 to 2026",
    stop: "Exhibitions",
    body:
      "Triveni Kala Sangam · India Habitat Centre · ICCR · Travancore Art Gallery · " +
      "Lalit Kala Akademi · Nehru Art Gallery, Bombay.",
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
export function resolveWalk(info: HouseInfo, narrow = false, aspect = 390 / 844): { shots: Pose[]; vias: (Pose | null)[] } {
  let prev: number | undefined;
  const shots: Pose[] = [], vias: (Pose | null)[] = [];
  CHAPTERS.forEach((c, i) => {
    if (i > 0) {
      // a passing pose the house has (an older build may not): otherwise straight on
      let vc = c.via ? cam(info, c.via, narrow) : undefined;
      // Turn toward the floral wall before stepping back to see its full hang.
      if (narrow && c.id === "floral") vc = info.cams.floral;
      if (narrow && c.id === "faith" && vc) vc = {
        ...vc, eye: [vc.eye[0], 1.55, vc.eye[2]], target: [vc.target[0], 1.4, vc.target[2]],
      };
      // The wider phone view approaches the Red Room through the door’s centre.
      if (narrow && c.id === "street" && vc) vc = {
        ...vc, eye: [-4.6, 1.55, -2.2], target: [-4.3, 1.4, 0.2],
      };
      const v = vc ? viewPose(vc, prev, NARROW_BACK) : null;
      if (v) prev = v.pivotRot[1];
      vias.push(v);
    }
    const group = narrow ? phoneGroupView(info, c.view, c.frame ?? c.labels ?? [], c.room, aspect) : null;
    const p = viewPose(group ?? cam(info, c.view, narrow), prev, NARROW_BACK);
    if (group) p.fov = group.fov;
    prev = p.pivotRot[1];
    shots.push(p);
  });
  return { shots, vias };
}

/** the establishing shot: the hero’s wall, from the courtyard’s far side */
export const startPose = (info: HouseInfo, narrow = false) => viewPose(cam(info, "start", narrow));
/** rearrange: the dollhouse view, high over the house */
export const messPose = (info: HouseInfo) => viewPose(info.cams.mess);

/** portrait screens get their own framings */
export const isNarrow = (aspect: number) => aspect < 0.85;

/** every work in the order the walk passes it, wall by wall */
export const WALK_ORDER: string[] = CHAPTERS.flatMap((c) => c.labels ?? []);

/** the stop a work is seen at: the chapter that labels it; -1 if none */
export const stopOf = (id: string) => CHAPTERS.findIndex((c) => c.labels?.includes(id));

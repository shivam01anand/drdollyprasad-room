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
 * Poppies"; through the open front doors into the gallery hall, round it;
 * through its west doorway into the Red Room by the lane; through its door into
 * the Quiet Room; out through the arch into the courtyard, and up, out of the
 * house, for Featured and the plan.
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
  /** the wall about her is set at this stop (components/HerWall, lib/her-wall.ts) */
  herWall?: boolean;
  /** which side of its canvas a label tries first (a door or a corner on the other) */
  labelSide?: "left" | "right" | "below";
  /** the stop’s short name, for the phone’s dock and the list of stops */
  stop: string;
  /** where in the house it is */
  room?: string;
};

/** the easel paragraph: Shubham’s words, shown unsigned; set as prose, not verse. Its own text since the content
 *  elevate (2026-11-22): the theme’s four words become the route of the walk. About has its own paragraph (lib/site.ts STATEMENT). */
export const THEME = `Each painting in this house starts with something seen every day and hardly noticed, a shut door or a cart in the road, and gives it the time a passer-by never did. The whispers are here in the courtyard. Inside, the hall holds the street and its faces, the Red Room keeps the waiting, and the walk ends in the Quiet Room with wishing and worship.`;

export const CHAPTERS: Chapter[] = [
  { id: "presence", eyebrow: "Bahaar · 2024 to 2025", stop: "Khwaab", room: "The courtyard", view: "presence", labels: ["woman-with-poppies"],
    body: "The longest conversation in anyone's life is the silent one they have with themselves. Khwaab opens the house in the middle of it, and the rooms beyond keep to that hush." },
  {
    id: "floral",
    eyebrow: "Bahaar · 2024 to 2025",
    stop: "Bahaar",
    room: "The courtyard",
    body: "Here each flower is a feeling given colour. In a girl it is a first secret held behind her hand, and in a grown woman it is a calm she has learned to keep.",
    view: "floral",
    labels: ["child-among-flowers", "woman-with-red-flower", "woman-with-bird"],
  },
  { id: "canopy", eyebrow: "Bahaar · 2024 to 2025", stop: "Under Canopy of Greens", room: "The courtyard", view: "canopy", dusk: 0.04, labels: ["boy-with-bananas"],
    labelSide: "left",
    body: "A village childhood runs on no clock. Under these leaves a boy brings the bananas home in his own good time, and his small smile invites us to slow down with him." },
  // the wall about her, where her easel stood (2026-11-26): the courtyard's north wall, square on (lib/her-wall.ts)
  { id: "easel", eyebrow: "The everyday", stop: "About the painter", room: "The courtyard", body: THEME, view: "herwall",
    via: "easelvia", dusk: 0.12, herWall: true },
  // through the courtyard's front doors, open since 2026-11-23: the gallery hall, where her work hangs as an
  // exhibition hangs, one line at eye level, a series to a wall (scripts/house/build.py)
  { id: "gallery", ink: "light", eyebrow: "The gallery", stop: "The gallery", room: "The gallery",
    view: "hall", via: "frontdoor", dusk: 0.18,
    body: "Through the front doors the hall opens out, one collection to a wall, the way her work hangs at an exhibition." },
  { id: "rupaya", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Twenty Paise · Patra Petika · Mother India", room: "The gallery",
    view: "rupaya", dusk: 0.2, labelSide: "below",
    labels: ["rickshaw-puller-and-coin", "postbox-and-stamps", "mother-india-and-kettles"],
    body: "In those years a few paise went a long way, across town on a rickshaw or home to a mother in a letter. Few coins have ever carried so much." },
  { id: "cartman", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Last of the Pedals · Ek Rupaya", room: "The gallery",
    view: "cartman", dusk: 0.22, labelSide: "below", labels: ["cycle-rickshaw", "rickshaw-rest-framed"],
    body: "A whole city once got to work on the strength of a rickshaw man's legs. These two have earned their place on this wall, one in the thick of the traffic and one in the short rest between fares." },
  // Faith, either side of the window onto the palm court
  { id: "shrine", eyebrow: "Faith · 2007 to 2026", stop: "Sharan · Aarti", room: "The gallery",
    view: "shrine", dusk: 0.24, labelSide: "below", labels: ["monk-and-green-buddha", "priest-with-flame"],
    body: "This wall belongs to Faith, prayer as Indian homes and temples keep it, at the same hour every day. Stand a moment behind the figures here, and the quiet they keep becomes yours." },
  { id: "gayatri", eyebrow: "Faith · 2007 to 2026", stop: "Gayatri · Vakratunda", room: "The gallery",
    view: "gayatri", dusk: 0.26, labelSide: "below", labels: ["prayer-and-scripture", "offering-of-light"],
    body: "The prayers we say without thinking were once new to a child. Here a boy lifts his lamp to the words, and a man who has said them all his life still sits before them with the same care." },
  {
    id: "portraits",
    ink: "light",
    eyebrow: "Portraits · 2007 to 2012",
    stop: "Portraits",
    room: "The gallery",
    body: "Nobody on this wall is named. Each painting is titled for a feeling, Sabr for patience, Fikr for worry, and the title turns a stranger's face into one you have worn yourself.",
    view: "portraits",
    dusk: 0.28,
    labelSide: "below",
    labels: ["three-veiled-women", "red-turban-portrait", "elder-woman-portrait", "yellow-turban-portrait", "patterned-turban-portrait", "mother-and-child"],
  },
  { id: "kadhai", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Bachpan · Intezar", room: "The gallery",
    view: "kadhai", dusk: 0.3, labelSide: "below", labels: ["boy-and-kettle", "man-among-metal-pans"],
    body: "Intezar means waiting, and most of a street trade is just that. A boy beside his kettle and a man among his empty pans sit through the same long hours, hoping the next footstep stops for them." },
  { id: "doodhwala", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Before the Chai · Morning Ritual", room: "The gallery",
    view: "doodhwala", dusk: 0.32, labelSide: "below", labels: ["milkman-on-bicycle", "newspaper-reader"],
    body: "An Indian morning starts long before we do. A milkman pedals out with his cans and an old man settles down with the news, and the house wakes to a morning already begun for it." },
  // the busiest wall, six small canvases, closes the hall: from the north wall the walk turns
  // east down the hall's middle (hallvia), then on to the south wall, so neither turn is more than a quarter
  { id: "panels", eyebrow: "Gone Are The Days · 2007 to 2018", stop: "Old road, new traffic", room: "The gallery",
    view: "panels", via: "hallvia", dusk: 0.34, labelSide: "below",
    labels: ["horse-cart-and-autorickshaw", "coins-and-clay-bank", "rickshaw-and-autorickshaw", "carriage-and-autorickshaw",
      "rickshaw-rest", "bullock-cart-and-truck"],
    body: "This wall closes the hall with the slower life the engines overtook, from the tonga on the road to the gullak at home. Each small canvas honours how long that life held on." },
  {
    id: "street",
    eyebrow: "Gone Are The Days · 2007 to 2018",
    stop: "Gone Are The Days",
    room: "The Red Room",
    // from the far end of the hall, back along it and through the Red Room's east doorway
    via: "redin",
    // the framed print on its easel is 0.64 × 0.48 m (scripts/house/build.py press_easel)
    asides: [{ anchor: "press", title: "The artist, in conversation", line: "Beside “Before the Engines”, at her exhibition", size: [0.64, 0.48] }],
    body: "In the Red Room the old street comes indoors, copper kadhais from a busy kitchen and a pair of bullocks who pulled side by side for years. Each was looked after with pride, because a family's living depended on it.",
    ink: "light",
    view: "street",
    dusk: 0.38,
    labels: ["terracotta-pots", "bulls-and-wheel"],
  },
  // Shree 420 and Evening at the Ghat on the east wall, Bandh Darwaze on the north wall to the left: one stop
  // since the walk was shortened (2026-11-23). The view is the east wall's; the four doors come into it at the
  // edge, are seen whole on the turn in from the street, and keep their labels here, so the list of stops,
  // a painting's "See it in the studio" and a click still reach them. A phone frames the east wall (frame).
  { id: "redwall", eyebrow: "Gone Are The Days · Bandh Darwaze · 2007 to 2018", stop: "Shree 420 · Bandh Darwaze", room: "The Red Room",
    view: "redwall", via: "redvia", dusk: 0.42,
    labels: ["shree-420-and-milk-cans", "riverside-figures", "weathered-door-ring", "red-and-teal-door-lock", "teal-door-bolt", "carved-door-knocker"],
    frame: ["shree-420-and-milk-cans", "riverside-figures"],
    body: "This corner is evening, once the day's work is done. A film poster hangs on years after its last show, and beside it four old doors keep faith with their families, home or away." },
  // from the Red Room through the Quiet Room’s door, turning to the peepal on its west wall
  { id: "bodhi", eyebrow: "Faith · 2007 to 2026", stop: "Mannat", room: "The Quiet Room",
    view: "bodhi", via: "redout", dusk: 0.46, labels: ["sacred-tree"],
    body: "The Quiet Room opens with a wish. Every thread around this peepal was tied by someone who asked for something and then went home, trusting the tree to keep it safe." },
  {
    id: "faith",
    eyebrow: "Faith · 2007 to 2026",
    via: "faithvia",
    stop: "Dhyan · Threads of Faith",
    room: "The Quiet Room",
    body: "Devotion begins as discipline and, if it lasts, turns into thanks. This room keeps both, the monks still learning to sit through a prayer and the bells left by people whose prayers were heard.",
    view: "faith",
    dusk: 0.5,
    labels: ["monks-and-blue-buddha", "temple-bells"],
  },
  { id: "featured", eyebrow: "Featured", stop: "Featured works", slot: "featured", view: "featured", via: "archout", dusk: 0.45 },
  {
    id: "plan",
    eyebrow: "The end of the walk",
    stop: "From above",
    body: "From up here the whole walk fits in one view. If a painting stayed with you on the way, write by email to ask about it.",
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
const cam = (info: HouseInfo, view: string, narrow: boolean) =>
  (narrow && info.cams[`n:${view}`]) || info.cams[view] || PASSING[view];

/** passing poses the walk needs and the house build has not made (site coordinates: y up, the hall's
 *  north wall at z 0.45). "hallvia": the middle of the gallery hall, facing east toward the palm
 *  window, between the north wall and the south one, so the about-turn is two quarter turns */
const PASSING: Record<string, { eye: V3; target: V3; fov: number }> = {
  hallvia: { eye: [8.6, 1.62, 4.65], target: [12.6, 1.6, 4.65], fov: 40 },
  // the courtyard's north wall (z -6) square on, where her easel stood: the wall about her (lib/her-wall.ts)
  herwall: { eye: [2.05, 1.45, -2.4], target: [2.05, 1.45, -6], fov: 40 },
};

const NEAR_PIVOT = new Set(["street", "redwall"]);
/** a point `d` metres from `eye` toward `target`: the same framing, a nearer pivot */
const nearTarget = (eye: V3, target: V3, d: number): V3 => {
  const v = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
  const k = d / Math.hypot(v[0], v[1], v[2]);
  return [eye[0] + v[0] * k, eye[1] + v[1] * k, eye[2] + v[2] * k];
};

/**
 * The walk as the rig needs it: one pose per chapter, and for each step
 * between two chapters the pose it passes through, or null. Yaw is unwrapped
 * along the whole path, through the passing poses too.
 */
export function resolveWalk(info: HouseInfo, narrow = false, aspect = 390 / 844): { shots: Pose[]; vias: (Pose | null)[]; views: { eye: V3; target: V3; fov?: number }[] } {
  let prev: number | undefined;
  const shots: Pose[] = [], vias: (Pose | null)[] = [], views: { eye: V3; target: V3; fov?: number }[] = [];
  CHAPTERS.forEach((c, i) => {
    if (i > 0) {
      // a passing pose the house has (an older build may not): otherwise straight on
      let vc = c.via ? cam(info, c.via, narrow) : undefined;
      // Turn toward the floral wall before stepping back to see its full hang.
      if (narrow && c.id === "floral") vc = info.cams.floral;
      if (narrow && c.id === "faith" && vc) vc = {
        ...vc, eye: [vc.eye[0], 1.55, vc.eye[2]], target: [vc.target[0], 1.4, vc.target[2]],
      };
      const v = vc ? viewPose(vc, prev, NARROW_BACK) : null;
      if (v) prev = v.pivotRot[1];
      vias.push(v);
    }
    const group = narrow ? phoneGroupView(info, c.view, c.frame ?? c.labels ?? [], c.room, aspect) : null;
    let view = group ?? cam(info, c.view, narrow);
    // on a phone the stops either side of the Red Room's doorways turn round a near pivot, on the same
    // line of sight (the same framing): the walk comes in by its east doorway and leaves by the Quiet
    // Room's door, close to their walls
    if (narrow && NEAR_PIVOT.has(c.id)) view = { ...view, target: nearTarget(view.eye, view.target, 1.6) };
    const p = viewPose(view, prev, NARROW_BACK);
    if (group) p.fov = group.fov;
    prev = p.pivotRot[1];
    shots.push(p);
    views.push({ eye: view.eye, target: view.target, fov: group?.fov });
  });
  return { shots, vias, views };
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

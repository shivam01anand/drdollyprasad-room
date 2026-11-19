import { WORKS, type Work, EMAIL, INSTAGRAM, SITE, quoted, workPath } from "./works";

/**
 * The website around the studio: the series stories and her exhibitions.
 *
 * All words on this site are Shubham's (kb/voice.md). Nothing is presented as hers.
 * The label (title, medium, size, year, series, status) is fact from lib/works.
 */

export { EMAIL, INSTAGRAM, SITE, quoted, workPath };

/** her WhatsApp number in international form without "+" (e.g. "9198xxxxxxxx").
 *  Empty until she chooses the number: the WhatsApp buttons then go to the enquiry page. */
export const WHATSAPP = "";

export const STUDIO_PATH = "/studio";

export const NAV = [
  { href: "/works", label: "Works" },
  { href: "/series", label: "Collections" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/about", label: "About" },
  { href: STUDIO_PATH, label: "Studio" },
] as const;

export const BIO_LINE = "The everyday, held sacred.";
export const BIO_SUB = "Catching the hues of India in its waiting and wishing, its worship and whispers.";

/**
 * One line per painting, in the observer's voice (third person, never hers):
 * what is on the canvas. Source: kb descriptions (2026-11-19).
 */
export const LOOK: Record<string, string> = {
  "rickshaw-puller-and-coin": "He has his back to us, a red cloth across his shoulders, both hands on the rickshaw's shafts and a small bell hanging below one fist. Behind him, she painted a twenty paise coin, far bigger than the man.",
  "carriage-and-autorickshaw": "The tonga is painted in full: grey horse, red harness, a man waiting under the orange hood. The autorickshaw beside it is only a white outline on maroon.",
  "bullock-cart-and-truck": "The bullock cart is drawn in greys, the driver raising his whip over a load of sacks. Beside it stands a Tata public carrier in loud orange paint. Whatever the whip says, the bullock keeps its own pace.",
  "rickshaw-rest-framed": "He looks back over his shoulder, a small bell hanging still from two fingers. The one rupee coin behind him is painted large enough to lean on, wheat ear and all. Until a fare comes, he sits with it at his back.",
  "coins-and-clay-bank": "A clay gullak sits on a bed of old coins: half an anna from 1946, five naye paise from 1963. The slot on top is one dark line. The only way to get the coins back out was to break it.",
  "postbox-and-stamps": "The red letterbox has New Delhi painted on its front in Hindi, with a pin code under it. Behind it the wall is papered with old stamps, Gandhi's face turning up more than once. Each one paid a letter's way through that slot.",
  "mother-india-and-kettles": "Four steel kettles tumble down the left edge at every angle, and only the bottom one lands upright. Behind them, a Mother India poster has faded into the same red as everything else.",
  "shree-420-and-milk-cans": "Three milk cans, dented and rusting in patches, stand in front of a torn Shree 420 poster. It still lists the shows at Maratha Mandir, from 11.30 in the morning to 9.30 at night. The milk was out long before the first one.",
  "bulls-and-wheel": "Two bullocks under one yoke. Someone painted their horns, one pair blue and one green, hung a brass bell at each neck and laid a striped cloth over one back. They were work animals, dressed like family.",
  "cycle-rickshaw": "The cars, autos and the bus behind him are dark red shapes, sunk into the red ground. He is the one she painted in full colour: bare-chested, a white cloth over one shoulder, pedalling past them all.",
  "rickshaw-rest": "He has climbed onto the footboard of the rickshaw, knees up, one arm hanging loose over them. A brass bell dangles from his fingers. For now, nobody needs to hear it.",
  "horse-cart-and-autorickshaw": "The tonga is drawn in brown like an old photograph, three passengers packed in behind a turbaned driver. The autorickshaw is solid teal and yellow, and its back half slips behind that old picture.",
  "rickshaw-and-autorickshaw": "In the brown half of the painting, a thin man walks between the shafts of a hand rickshaw while his passenger sits back. On the red half, an autorickshaw waits. That one runs on its own.",
  "terracotta-pots": "Clay pots tumble over one another, mouths open every which way. She laid the paint on thick and pitted, so the surface looks like fired earth. Deep inside one mouth near the bottom, the clay turns a pale pink.",
  "weathered-door-ring": "The planks have dried to grey and split along the grain. The iron ring on the door has kept its red, with flecks of teal still clinging to it. Above, a small barred window shows only dark.",
  "red-and-teal-door-lock": "The red paint is coming away in flakes, showing grey wood underneath, and the teal frame has worn through in patches. The padlock and its hasp have rusted to a single brown, and the lock still holds.",
  "teal-door-bolt": "Someone slid the long iron bolt across both doors, then hung a padlock from it as well. Around the rusted hardware, the teal paint has fallen away in patches, and the brown wood shows through.",
  "carved-door-knocker": "There is no lock on this door. Its iron handle is shaped like a heart, three studs below it have flowers worked into their centres, and a border of turquoise and copper arcs is carved down one side.",
  "monks-and-blue-buddha": "The Buddha's face fills the canvas in blue, eyes shut. Below it, two of the four monks have shut their eyes as well. The other two are not there yet, one still reading his loose pages, one sitting with his back to us.",
  "monk-and-green-buddha": "A monk in saffron bows his head into his joined hands. Above him the Buddha sits in green under a yellow halo, one hand raised.",
  "offering-of-light": "A boy with a shaved head and a knotted tuft lifts a small lamp towards a wall of tablets. Every tablet carries the same Ganesh prayer, Vakratunda Mahakaya, written over and over.",
  "prayer-and-scripture": "We only see his back, bare, with a saffron cloth gathered over one shoulder. He sits facing a wall written over with the Gayatri mantra, a brass lamp at his side, every tablet saying the same lines.",
  "priest-with-flame": "He has his back to us, bell low in one hand, flaming lamp lifted in the other. Around him the paint goes on thick and fast, fire colours to the left and blue to the right, as though the bell has shaken the air.",
  "sacred-tree": "Red and white thread is wound round the peepal trunk so many times that a broad band of bark disappears under it. People tie these threads when they ask for something. At the roots, a trident and a small red shrine sit in marigolds.",
  "newspaper-reader": "He sits against the wall, barefoot, the morning paper held up close to his face. One section rests on his knee, and another has slipped to the floor by his foot. He is in no hurry to pick it up.",
  "elder-woman-portrait": "Her mouth is set, and three lines of white ash and a red dot cross her forehead. Every line of her face is painted in, and she looks straight back through all of them.",
  "red-turban-portrait": "His eyes have nearly closed with the smile, and his head has dropped a little, the way it does when a laugh is starting. Under the red turban, a gold flower earring catches the light.",
  "yellow-turban-portrait": "The yellow turban is tied high and full, and he keeps his head up under its weight. His face turns aside, but his eyes come round to hold ours.",
  "patterned-turban-portrait": "The turban is bright, a cream lattice over orange, but the face under it has gone the other way. His brow pulls down, his lower lip pushes out, and his eyes stay on the ground.",
  "mother-and-child": "The boy stays half hidden at his mother's side, one small hand wrapped round her arm. She looks down at him. From there, he can afford to look straight out at us.",
  "boy-and-kettle": "She painted the boy and the kettle in the same blue, as if one belongs to the other. He sits with his chin in his hand, watching the stove, while the tea comes to the boil.",
  "man-among-metal-pans": "He sits with his back to us, pale turban and a shawl round his shoulders, in a ring of iron kadhais nearly as wide as he is. Every pan sits empty, waiting to be lifted.",
  "three-veiled-women": "Three women in red have drawn so close that not one face shows. What we get instead are their arms, heavy with silver bangles: one raised high over the others, one holding a veil shut at the face.",
  "milkman-on-bicycle": "We see the milkman only from behind: red turban, white kurta. Steel cans hang off both sides of the bicycle, and one has swung out on its hook.",
  "riverside-figures": "People sit on the ghat steps under big woven umbrellas, wrapped in white and saffron. Bamboo poles slant across them, and the river is a dark blur along the bottom edge. The whole scene has turned the gold of late light.",
  "child-among-flowers": "The bougainvillea takes nearly the whole canvas, and the girl has to fit into one corner of it. She keeps a hand over her mouth and slides her eyes sideways, as if her name had just been called.",
  "woman-with-poppies": "Poppies bigger than her face crowd in from both sides. She looks straight through the yellow one in front of her, somewhere else entirely. Behind her, more poppies sink into the maroon.",
  "temple-bells": "Red thread is wound in thick bunches along the bamboo, and brass bells hang from the loose ends. A red chunri has been left over the top rail. On the wall behind, Ram is written again and again.",
  "woman-with-bird": "The bird at her shoulder has its beak open, mid-call. She keeps her profile still against the square of orange and lets it call.",
  "woman-with-red-flower": "The face is cropped so close that only one eye shows, and it has turned towards the red flower beside her. Her fingertip rests just under that eye. The flower is nearly as big as her face and almost touches her mouth.",
  "boy-with-bananas": "He balances a whole bunch of bananas on his head, one hand up to steady it, and still finds a small smile for us. Up in the leaves hangs the red and purple flower a bunch like his grows from.",
};

/** approved editorial lines (third person), for cards and chapters */
export const LINES: Record<string, string> = {
  "bulls-and-wheel": "The wheel still stands. The road has moved on.",
  "coins-and-clay-bank": "The coins have moved on. The gullak is still here, still holding.",
};

/** the poem: Shubham's words, shown unsigned (approved 2026-11-19) */
export const STATEMENT = [
  "A chai boy, chin in his hand,",
  "lets the kettle steam.",
  "Two bullocks stand in their painted horns.",
  "A red letterbox keeps its corner.",
  "The road hurries past them all.",
  "She stops,",
  "and sits with them",
  "until the paint has set.",
];

export type Chapter = {
  title: string;
  /** works shown, in order */
  works: string[];
  /** a line that comes before the larger one, setting it up */
  setup?: string;
  /** the larger line (editorial) */
  big?: string;
  small?: string;
  /** show the first work in its room photograph */
  room?: boolean;
  dark?: boolean;
};

export type SeriesPage = {
  slug: string;
  label: string;
  period: string;
  /** one line for the overview and the home tiles */
  line: string;
  /** the work that opens the series */
  hero: string;
  /** one short editorial line, unsigned */
  held?: string;
  intro: string[];
  chapters: Chapter[];
};

export const SERIES_PAGES: SeriesPage[] = [
  // R4 B1-3: newest first. This array is the one order source for every listing of the collections.
  {
    slug: "bahaar", label: "Bahaar", period: "2024 to 2026",
    line: "A boy under banana leaves, a girl half lost in bougainvillea.",
    hero: "boy-with-bananas",
    held: "Something is in flower in each of these five paintings.",
    intro: [
      "After the street paintings, these are quiet. Only the boy with the bananas is carrying anything, and even he has stopped to look at you.",
      "Each painting is one person among plants, and the leaves and petals get as much care as the face.",
    ],
    chapters: [
      { title: "Under Canopy of Greens", works: ["boy-with-bananas"], room: true,
        big: "He steadies the bananas with one hand. Behind him, at the left, a red banana flower hangs from its stalk." },
      { title: "Whispers of Stillness", works: ["woman-with-bird"], room: true, dark: true,
        big: "She and the bird face the same way. Only the bird has its beak open." },
      { title: "Petals of Thought", works: ["woman-with-red-flower"],
        big: "Her fingertips rest at the corner of her eye. Beside her is a single red flower with a yellow centre, the only flower in the painting." },
      { title: "Blooming Innocence", works: ["child-among-flowers"], room: true,
        big: "Bougainvillea fills nearly the whole canvas and pushes the girl down to the lower right. She keeps her fist at her mouth and watches you." },
      { title: "Khwaab", works: ["woman-with-poppies"],
        big: "Poppies bigger than her face crowd in from both sides. She looks straight through the yellow one in front of her, somewhere else entirely. Behind her, more poppies sink into the maroon." },
    ],
  },
  {
    slug: "bandh-darwaze", label: "Bandh Darwaze", period: "2018",
    line: "Four shut doors, painted close enough to count the nails.",
    hero: "red-and-teal-door-lock",
    held: "Two of these doors have a knocker for a visitor. The other two are padlocked from outside, which means nobody is home.",
    intro: [
      "Bandh darwaze means closed doors. Each canvas is a foot square and holds one small patch of an old door, painted close up, with no room or person around it.",
      "Where the teal and the red have flaked, bare grey and brown wood shows through.",
    ],
    chapters: [
      { title: "The ring and the lock", works: ["weathered-door-ring", "red-and-teal-door-lock"], dark: true,
        big: "Above the iron ring in Bandh Darwaze I is a small grille, for seeing who has knocked before you open.",
        small: "In II a rusted padlock hangs from the hasp, beside a round iron stud." },
      { title: "The bolt and the knocker", works: ["teal-door-bolt", "carved-door-knocker"],
        big: "Someone carved a row of arches down the edge of the fourth door and gave it a heart-shaped knocker.",
        small: "In III the bolt is drawn across both halves of the door and locked." },
    ],
  },
  {
    slug: "gone-are-the-days", label: "Gone Are The Days", period: "2010 to 2018",
    line: "Tongas and bullock carts, often painted beside the autos and trucks that replaced them.",
    hero: "bulls-and-wheel",
    held: "Nobody waved goodbye to the last tonga.",
    intro: [
      "Most of these paintings put two times side by side. A tonga waits beside an auto, a bullock cart beside a truck, and coins nobody spends any more lie next to the clay gullak that held them.",
      "The rest are the people who kept the street running: a chai boy, a kadhai seller, the milkman on his round, a man with the morning paper, boatmen at the river's edge.",
    ],
    chapters: [
      { title: "Coins and clay", works: ["rickshaw-puller-and-coin", "coins-and-clay-bank", "terracotta-pots"],
        big: "A gullak gets broken open when someone wants the coins. This one is still whole, and most of the coins behind it went out of use long ago.",
        small: "In Twenty Paise the coin is as wide as the canvas, and the man holding the rickshaw shafts stands facing it." },
      { title: "Under one yoke", works: ["bulls-and-wheel"], room: true, dark: true,
        setup: "Two bullocks, and behind them the cart wheel they pulled, a darker red on the red.",
        big: "Both wear brass bells, and someone has painted their horns, one pair blue, one green." },
      { title: "Then and now", works: ["carriage-and-autorickshaw", "bullock-cart-and-truck", "cycle-rickshaw", "rickshaw-rest"],
        big: "In Aakhri Savaari the tonga is painted in full and the auto is only a white outline. In Dheere Dheere the truck gets the colour, and the bullock cart is drawn in grey.",
        small: "In Last of the Pedals the autos and Ambassadors are flat shapes in a darker red. Only the man and his cycle rickshaw are painted solid." },
      { title: "Working lives", works: ["boy-and-kettle", "man-among-metal-pans", "milkman-on-bicycle", "newspaper-reader"], dark: true,
        small: "The milkman is already out on his round. The kadhai seller sits among his pans, waiting for a buyer. Intezar means waiting." },
      { title: "Letters and cinema", works: ["postbox-and-stamps", "mother-india-and-kettles", "shree-420-and-milk-cans"],
        big: "The Shree 420 poster is peeling, but you can still read where it was playing, Maratha Mandir, and that it ran four shows a day.",
        small: "In Patra Petika a red letterbox stands in front of old Indian stamps, with Gandhi's face on several of them." },
    ],
  },
  {
    slug: "portraits", label: "Portraits", period: "2007 to 2012",
    line: "Faces painted close, most of them named for a feeling.",
    hero: "three-veiled-women",
    held: "Lajja means modesty, and it is the one portrait here where no face shows.",
    intro: [
      "Three old men in turbans, each 30 inches square. In all three the turban runs off the top of the canvas, so the face sits low and close.",
      "In Muskaan the smile has almost shut his eyes. In Fikr the corners of the mouth turn down, and the eyes look away.",
    ],
    chapters: [
      { title: "Turbans", works: ["red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait"],
        big: "Garv is the only one of the three who looks straight at you.", small: "Muskaan wears a small gold earring shaped like a flower." },
      { title: "Together", works: ["three-veiled-women", "mother-and-child"], room: true,
        big: "In Aanchal the mother looks down. The child holding her arm looks straight out at you.",
        small: "One woman's arm is raised over her head, bangles stacked to the wrist." },
    ],
  },
  {
    slug: "faith", label: "Faith", period: "2007 to 2014",
    line: "Prayer in its daily form: a lamp lifted to a wall of mantras, a thread tied round a peepal.",
    hero: "offering-of-light",
    held: "Most of the people praying in these paintings are seen from behind, so you stand where they stand.",
    intro: [
      "In Vakratunda and Gayatri the wall itself is the prayer. One is covered in the Vakratunda mantra and the other in the Gayatri mantra, and a figure in saffron faces each.",
      "In Mannat and Threads of Faith nobody is left, only what people tied there: red thread wound round a peepal trunk, and brass bells hung on thread below the name Ram, written over and over on the wall.",
    ],
    chapters: [
      { title: "Light and scripture", works: ["offering-of-light", "prayer-and-scripture"],
        big: "Small drawings of Ganesha sit between the lines of the Vakratunda mantra, the prayer that asks him to clear the way for every task.",
        small: "In Gayatri a tall brass lamp stands beside the seated man, a yellow cloth over his shoulder." },
      { title: "The Buddhas", works: ["monks-and-blue-buddha", "monk-and-green-buddha"], room: true, dark: true,
        big: "In Dhyan the Buddha's face is too big for the canvas. The four monks below it reach only as high as his nose.",
        small: "In Sharan a monk sits, palms pressed to his forehead, before a Buddha in green and gold." },
      { title: "Daily rites", works: ["priest-with-flame", "sacred-tree", "temple-bells"],
        big: "In Aarti the priest has the flame in one hand and the bell in the other.",
        small: "In Threads of Faith someone has left a red cloth hanging from the top pole with the threads." },
    ],
  },
];

/** the one painting that stands for each collection where only one is shown (Shubham, 20 Oct): the strongest image */
export const LEAD: Record<string, string> = {
  "gone-are-the-days": "bulls-and-wheel", "bandh-darwaze": "red-and-teal-door-lock", faith: "monks-and-blue-buddha",
  portraits: "red-turban-portrait", bahaar: "woman-with-poppies",
};

/** the collection order, newest first (R4 B1-3); every listing reads SERIES_PAGES, this is its slug list */
export const SERIES_ORDER = SERIES_PAGES.map((s) => s.slug);
export const SERIES_BY_LABEL = new Map(SERIES_PAGES.map((s) => [s.label, s]));
export const SERIES_BY_SLUG = new Map(SERIES_PAGES.map((s) => [s.slug, s]));
export const seriesPath = (label: string) => `/series/${SERIES_BY_LABEL.get(label)?.slug ?? ""}`;
export const worksIn = (label: string) => WORKS.filter((w) => w.series === label);

/* ---- R4 B2-1: one order, so the switcher, the pager, the story page and the bands cannot disagree ---- */
/** a collection's paintings in her chapter order (flattened), then any not featured in a chapter, in register order */
export function collectionOrder(slug: string): string[] {
  const s = SERIES_BY_SLUG.get(slug);
  if (!s) return [];
  const featured = [...featuredIds(s)];
  return [...featured, ...worksIn(s.label).map((w) => w.id).filter((id) => !featured.includes(id))];
}
/** every painting a story page shows in its chapters, in chapter order */
export const featuredIds = (s: SeriesPage) => new Set(s.chapters.flatMap((c) => c.works));
/** the collections either side, wrapping round (Faith -> Bahaar; Bahaar <- Faith) */
export function seriesNeighbours(slug: string) {
  const i = SERIES_PAGES.findIndex((s) => s.slug === slug), n = SERIES_PAGES.length;
  return { prev: SERIES_PAGES[(i - 1 + n) % n], next: SERIES_PAGES[(i + 1) % n] };
}
/**
 * a painting's neighbours inside its collection. At the ends, prev/next are the last/first painting of the
 * adjacent collection, flagged with `crossesTo` (that collection's slug); the painting page then links to
 * that collection's story page.
 */
export function neighbours(id: string) {
  const w = WORKS.find((x) => x.id === id);
  const s = w ? SERIES_BY_LABEL.get(w.series) : undefined;
  if (!w || !s) return undefined;
  const order = collectionOrder(s.slug), index = order.indexOf(id), total = order.length;
  const { prev: ps, next: ns } = seriesNeighbours(s.slug);
  const prev = index > 0 ? { id: order[index - 1] } : { id: collectionOrder(ps.slug).at(-1)!, crossesTo: ps.slug };
  const next = index < total - 1 ? { id: order[index + 1] } : { id: collectionOrder(ns.slug)[0], crossesTo: ns.slug };
  return { prev, next, index, total, slug: s.slug } as {
    prev: { id: string; crossesTo?: string }; next: { id: string; crossesTo?: string }; index: number; total: number; slug: string };
}

/** these photographs are too small to enlarge; they stay in the catalogue but out of showcases */
export const SMALL_PHOTO = new Set(["elder-woman-portrait", "horse-cart-and-autorickshaw", "rickshaw-and-autorickshaw", "riverside-figures"]);

/** the status line a card shows */
export const statusText = (w: Work) =>
  w.status === "Sold" ? "In a private collection" : w.status === "Enquire" ? "On enquiry" : "Available";

/** the label line: medium · size · year */
export const labelLine = (w: Work) => [w.medium, w.size, shownYear(w)].filter(Boolean).join(" · ");

/** a painting shows one year: the year recorded, or the latest year of the series' range */
export const shownYear = (w: Work) => w.year?.match(/\d{4}(?!.*\d{4})/)?.[0];

const waText = (w?: Work) =>
  w ? `Hello Dr Prasad, I saw ${quoted(w.title)} on your website and would like to know more. ${SITE}${workPath(w.id)}`
    : "Hello Dr Prasad, I saw your paintings on your website and would like to know more.";

/** the WhatsApp link, with the painting named, or the enquiry page when no number is set */
export const whatsappHref = (w?: Work) =>
  WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText(w))}` : enquireHref(w);

export const enquireHref = (w?: Work) => (w ? `/enquire?work=${w.id}` : "/enquire");

/* ---------------------------------------------------------------- exhibitions */

/**
 * From the exhibition archive (Project Memory/exhibitions-master.json and the
 * exhibition post records, 18 Oct 2026). Her record lists nineteen
 * exhibitions and art fairs, 2005 to 2026 (Sacred Fragments, Oct 2026, added on the
 * owner's confirmation); it does not say which were solo, so
 * nothing here calls them all solo. Dates are given only as precisely as the
 * record gives them.
 */

export type Photo = { src: string; alt: string; /** the one-line caption under the photograph (Chief Content 2c, C7); alt stays the full sentence */ cap?: string };
export type Album = { title: string; line: string; photos: Photo[] };
export type Clip = { src: string; poster: string; title: string; line: string };

export type Show = {
  id: string;
  /** one pattern for every show: the place (or the fair's own name) */
  title: string;
  /** the show's own title, where it had one */
  name?: string;
  kind: string;
  /** the one line under the show's title: venue · dates (Chief Content 2c, C3 to C6) */
  where?: string;
  venue: string;
  city: string;
  when: string;
  year: string;
  /** editorial, from the record and the photographs */
  lede: string;
  note?: string;
  albums: Album[];
  clips?: Clip[];
  works?: string[];
};

/** one-line captions, Chief Content 2c (C7), applied verbatim [Ours] */
const CAP: Record<string, string> = {
  "ihc-02": "Visitors around the lit lamp, India Habitat Centre",
  "ihc-03": "Dr Dolly Prasad lights the lamp, India Habitat Centre",
  "ihc-04": "Dr Dolly Prasad with visitors, India Habitat Centre",
  "ihc-05": "Dr Dolly Prasad and visitors, India Habitat Centre",
  "ihc-06": "Photographers at the rickshaw painting, India Habitat Centre",
  "ihc-08": "Dr Dolly Prasad beside Dhyan, India Habitat Centre",
  "ihc-press-a": "Dr Dolly Prasad with a reporter, India Habitat Centre",
  "ihc-press-b": "Dr Dolly Prasad in an interview, India Habitat Centre",
  "ihc-01": "The room, a lamp at its centre, India Habitat Centre",
  "ihc-07": "Three paintings on the walls, India Habitat Centre",
  "ihc-room-a": "Paintings along a partition, India Habitat Centre",
  "ihc-room-b": "Two paintings above the lamp, India Habitat Centre",
  "ihc-room-c": "“Before the Engines” on the wall, India Habitat Centre",
  "ihc-room-e": "Gullak, India Habitat Centre",
  "ihc-room-d": "A painting of a working figure, India Habitat Centre",
  "ihc-room-f": "The rickshaw puller painting, India Habitat Centre",
  "ihc-room-g": "A painting of a seated reader, India Habitat Centre",
  "iccr-speech": "Dr Dolly Prasad speaks at the opening, ICCR",
  "iccr-02": "Dr Dolly Prasad beside Dhyan, ICCR",
  "iccr-sign": "The ICCR sign for A Lifetime to Paint",
  "kala-dolly": "Dr Dolly Prasad beside her painting, Kala Mela",
  "kala-painting": "Ek Rupaya, Kala Mela",
  "kala-selfie": "A visitor’s selfie with the paintings, Kala Mela",
  "kala-booklet": "The First International Kala Mela booklet",
};
const ph = (n: string, alt: string): Photo => ({ src: `/site/ex/${n}.jpg`, alt, ...(CAP[n] ? { cap: CAP[n] } : {}) });

/**
 * The one switch for "Now showing": the home strip, the Exhibitions panel, the note on a
 * painting's page and the studio's welcome note stay hidden until Content/COO confirm a
 * current event record. Set to true only after that confirmation.
 */
export const NOW_SHOWING_CONFIRMED = false;

export const NOW = {
  id: "sacred-fragments", title: "Sacred Fragments: A Journey Home", venue: "Visual Arts Gallery, India Habitat Centre", city: "New Delhi",
  address: "Visual Arts Gallery, India Habitat Centre, Lodhi Road, New Delhi",
  when: "18 to 21 October 2026", until: "2026-10-21",
  line: "Showing Threads of Faith and Under Canopy of Greens.",
  works: ["temple-bells", "boy-with-bananas"],
};

/** the shows as first recorded (the Exhibitions hero wall keeps this column order and its tones) */
export const SHOWS_AS_RECORDED: Show[] = [
  {
    id: "india-habitat-centre-2010", title: "India Habitat Centre", kind: "Exhibition", where: "Open Palm Court, India Habitat Centre, New Delhi · November 2010",
    venue: "Open Palm Court, India Habitat Centre", city: "New Delhi", when: "November 2010", year: "2010",
    lede: "A lamp lit at the opening. “Before the Engines”, the gullak and the rickshaw-walas on red-brick walls. Visitors stopping to talk, to look, to take a photograph. And the press, with their questions, beside the paintings.",
    works: ["bulls-and-wheel", "coins-and-clay-bank", "monks-and-blue-buddha"],
    albums: [
      { title: "The evening", line: "The lamp is lit, and the room fills.", photos: [
        ph("ihc-02", "The opening at Open Palm Court, India Habitat Centre: visitors gathered around the lit brass lamp."),
        ph("ihc-03", "Dr Dolly Prasad lights the brass lamp at the opening, with guests beside her."),
        ph("ihc-04", "Dr Dolly Prasad in conversation with visitors in front of her paintings."),
        ph("ihc-05", "Dr Dolly Prasad and visitors look along a wall of paintings of everyday objects and working lives."),
        ph("ihc-06", "Photographers and visitors in front of a large painting of a rickshaw puller."),
        ph("ihc-08", "Dr Dolly Prasad beside Dhyan, looking across the room."),
      ] },
      { title: "In front of the cameras", line: "Interviews beside the work: a rickshaw-wala behind her in one, “Before the Engines” in the other.", photos: [
        ph("ihc-press-a", "Dr Dolly Prasad smiles in conversation with a reporter beside her rickshaw painting."),
        ph("ihc-press-b", "Dr Dolly Prasad listens during an interview beside “Before the Engines”."),
      ] },
      { title: "A walk through the room", line: "The wide views first, then the canvases up close.", photos: [
        ph("ihc-01", "The empty exhibition room, paintings around the walls and a brass lamp at its centre."),
        ph("ihc-07", "Three framed paintings along the pale and red-brick gallery walls."),
        ph("ihc-room-a", "Paintings along a pale gallery partition and the adjoining wall."),
        ph("ihc-room-b", "Two paintings of working figures above the brass lamp on a red-brick wall."),
        ph("ihc-room-c", "“Before the Engines” in its black frame on the exhibition wall."),
        ph("ihc-room-e", "Gullak in its exhibition frame."),
        ph("ihc-room-d", "A framed painting of a working figure against a large coin."),
        ph("ihc-room-f", "A large framed painting of a rickshaw puller on a red-brick wall."),
        ph("ihc-room-g", "A framed painting of a seated reader against a large coin."),
      ] },
    ],
  },
  {
    id: "a-lifetime-to-paint", title: "ICCR", name: "A Lifetime to Paint", kind: "Exhibition, presented by the Indian Council for Cultural Relations", where: "Azad Bhavan Art Gallery, ICCR, I.P. Estate, New Delhi · 11 to 16 June 2010",
    venue: "Azad Bhavan Art Gallery, ICCR, I.P. Estate", city: "New Delhi", when: "Opened 11 June 2010 · on view 12 to 16 June", year: "2010",
    lede: "She spoke at the opening beside a marigold-decked lamp, Dhyan behind her. The title looks past the walls, to the paintings still to come.",
    note: "Dhyan, then called The Blue Buddha, hung behind the opening.",
    works: ["monks-and-blue-buddha"],
    albums: [
      { title: "The opening", line: "11 June 2010, Azad Bhavan Art Gallery.", photos: [
        ph("iccr-speech", "Dr Dolly Prasad speaks at the opening of A Lifetime to Paint, beside a brass lamp, with Dhyan behind her."),
        ph("iccr-02", "Dr Dolly Prasad, holding flowers, beside Dhyan at ICCR."),
        ph("iccr-sign", "The ICCR sign for A Lifetime to Paint, a painting exhibition by Dr Dolly Prasad, 11 to 16 June 2010."),
      ] },
    ],
  },
  {
    id: "kala-mela-2018", title: "First International Kala Mela", kind: "Art fair, organised by Lalit Kala Akademi", where: "Art fair · Indira Gandhi National Centre for the Arts, New Delhi · 4 to 18 February 2018",
    venue: "Indira Gandhi National Centre for the Arts", city: "New Delhi", when: "4 to 18 February 2018", year: "2018",
    lede: "Artists from India and abroad, and the people who came to meet them. She stood beside Ek Rupaya, a working man at rest against a giant coin; nearby, a visitor raised her phone for a selfie with the paintings.",
    works: ["rickshaw-rest-framed"],
    albums: [
      { title: "At the fair", line: "February 2018, IGNCA.", photos: [
        ph("kala-dolly", "Dr Dolly Prasad in a red coat beside her framed painting at the Kala Mela."),
        ph("kala-painting", "Ek Rupaya in its black frame at the Kala Mela."),
        ph("kala-selfie", "A visitor takes a selfie beside the paintings at the Kala Mela."),
        ph("kala-booklet", "The booklet of the First International Kala Mela."),
      ] },
    ],
  },
];

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
/** a show's date as a number (year * 100 + the last month named in `when`), for newest-first order */
export const showKey = (sh: { year: string; when: string }) => {
  const m = sh.when.toLowerCase().match(new RegExp(MONTHS.join("|"), "g"));
  return Number(sh.year) * 100 + (m ? MONTHS.indexOf(m[m.length - 1]) + 1 : 0);
};
/** R4 fix 7 (Brand P1-5, "latest first"): the one sorted source, newest first: Kala Mela 2018, India Habitat Centre
 *  Nov 2010, A Lifetime to Paint June 2010. Every listing of the shows reads this (Exhibitions sets its own order, R6). */
export const SHOWS: Show[] = [...SHOWS_AS_RECORDED].sort((a, b) => showKey(b) - showKey(a));

export const PRESS = {
  clipping: ph("delhi-times", "A Delhi Times clipping, Must See Must Do, listing Art Today And Tomorrow, a group show at Travancore Art Gallery."),
  clippingLine: "Delhi Times picked Art Today And Tomorrow, a group show of paintings at Travancore Art Gallery, among the week’s Must See, Must Do.",
  clips: [
    { src: "/site/video/tv-archive-2.mp4", poster: "/site/video/tv-archive-2.jpg", title: "On NCR television · June 2010",
      line: "12 June 2010. The camera turns from the paintings to her, speaking in the gallery." },
  ] as Clip[],
};

/** her record, as she lists it (drdollyprasad.wordpress.com/about), newest first */
export type RecordEntry = { year: string; month?: string; venue: string; city: string; show?: string };
export const RECORD: RecordEntry[] = [
  { year: "2026", month: "October", venue: "Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre", city: "New Delhi" },
  { year: "2018", month: "October", venue: "International Art Fair", city: "Jaipur" },
  { year: "2018", month: "February", venue: "International Lalit Kala Art Fair (First International Kala Mela)", city: "Delhi", show: "kala-mela-2018" },
  { year: "2016", month: "March", venue: "Cabinet Secretariat Gallery", city: "Delhi" },
  { year: "2015", month: "May", venue: "CSOI Club", city: "Delhi" },
  { year: "2011", venue: "ICCR", city: "Delhi" },
  { year: "2010", month: "November", venue: "Open Palm Court, India Habitat Centre", city: "Delhi", show: "india-habitat-centre-2010" },
  { year: "2010", month: "June", venue: "ICCR, A Lifetime to Paint", city: "Delhi", show: "a-lifetime-to-paint" },
  { year: "2009", month: "March", venue: "Foyer, Convention Centre, India Habitat Centre", city: "Delhi" },
  { year: "2008", month: "September", venue: "Epicenter", city: "Gurgaon" },
  { year: "2008", month: "August", venue: "India Habitat Centre", city: "New Delhi" },
  { year: "2007", month: "May", venue: "Triveni Kala Sangam", city: "New Delhi" },
  { year: "2007", venue: "Travancore Art Gallery", city: "New Delhi" },
  { year: "2007", venue: "Indraprastha Art Gallery", city: "New Delhi" },
  { year: "2006", venue: "Nehru Art Gallery", city: "Bombay" },
  { year: "2006", venue: "Travancore Art Gallery", city: "New Delhi" },
  { year: "2006", venue: "All India Women Art Show", city: "" },
  { year: "2005", venue: "Indraprastha Art Gallery", city: "New Delhi" },
  { year: "2005", venue: "Sriram Centre", city: "New Delhi" },
];

export const RECORD_LINE = "Nineteen exhibitions and art fairs, 2005 to 2026";

export const PORTRAIT = "/site/dolly.jpg";
export const PORTRAIT_LARGE = "/site/ex/kala-dolly.jpg";

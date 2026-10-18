import { WORKS, type Work, EMAIL, INSTAGRAM, SITE, quoted, workPath } from "./works";

/**
 * The website around the studio: the series stories, her own words on her
 * paintings, and her exhibitions.
 *
 * Three voices, never mixed (brand thesis §12.1):
 *  - `words` are hers, verbatim, only where she has written them;
 *  - `intro`, `lines` and chapter text are editorial, written about the work,
 *    never in her first person;
 *  - the label (title, medium, size, year, series, status) is fact from lib/works.
 * Nothing here states a fact the archive does not record.
 */

export { EMAIL, INSTAGRAM, SITE, quoted, workPath };

/** her WhatsApp number in international form without "+" (e.g. "9198xxxxxxxx").
 *  Empty until she chooses the number: the WhatsApp buttons then go to the enquiry page. */
export const WHATSAPP = "";

export const STUDIO_PATH = "/studio";

export const NAV = [
  { href: "/works", label: "Works" },
  { href: "/series", label: "Series" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/about", label: "About" },
  { href: STUDIO_PATH, label: "Studio" },
] as const;

export const BIO_LINE = "The everyday, held sacred.";
export const BIO_SUB = "Catching the hues of India in its waiting and wishing, its worship and whispers.";

/** her own descriptions of her recent paintings, verbatim */
export const WORDS: Record<string, string> = {
  "child-among-flowers":
    "The girl with wide eyed wonder and pure heart represent the essence of innocence. The bougainvillea flowers with bold colours and delicate petals embody both beauty and fragility of life. The vibrant bougainvillea serves as a reminder that beauty can be found even amidst the thorn of life’s challenges.",
  "temple-bells":
    "The layers of red threads and bells become a contemporary expression of the emotions we quietly carry within us. Every thread representing a hope, desire, promise, or prayer.",
  "woman-with-bird":
    "A quiet moment between thought and nature. I wanted to capture stillness — where nothing is loud, yet everything is felt. The bird, the leaves, the calm face… all connected in silence. Sometimes, I paint not to show, but to pause.",
  "woman-with-red-flower":
    "Sometimes thoughts don’t need words… they just sit quietly, like a flower beside you. In this piece, I wanted to capture that silent moment where emotions bloom within, unseen yet deeply felt. A pause, a breath, a space where the mind softens and listens.",
  "boy-with-bananas":
    "A young boy stands quietly beneath the shelter of large banana leaves. The bananas on his head look like a natural crown from the earth. Surrounded by deep green, he becomes part of the landscape itself. The painting speaks about nature, childhood, and the quiet beauty of everyday.",
};

/** short pulls from her words, for cards */
export const PULL: Record<string, string> = {
  "temple-bells": "Every thread representing a hope, desire, promise, or prayer.",
  "woman-with-bird": "Sometimes, I paint not to show, but to pause.",
  "woman-with-red-flower": "A pause, a breath, a space where the mind softens and listens.",
  "boy-with-bananas": "The bananas on his head look like a natural crown from the earth.",
  "child-among-flowers": "Beauty can be found even amidst the thorn of life’s challenges.",
};

/** approved editorial lines (third person), for cards and chapters */
export const LINES: Record<string, string> = {
  "bulls-and-wheel": "The wheel still stands. The road has moved on.",
  "coins-and-clay-bank": "Now the coins are gone, and the gullak waits.",
};

export const STATEMENT = [
  "They are not things,", "They are everything", "They come to me", "They hold my hand",
  "They give me a brush", "Then sit quietly", "In front of me", "I put them on canvas",
  "I don’t paint", "Am not a painter",
];

export const ON_THE_WORK =
  "My paintings are just a representation of some and many others of the shades and paradigms that I picked up at different stages in my life.";

export const ON_EXHIBITIONS =
  "Each of these paintings reminds me I have yet to pick up many more hues to fill up some empty lines, some yet to be filled up nooks. I hope it would be a life-long unraveling with these tinges, an affair to last a lifetime…";

export type Motif = "days" | "doors" | "faith" | "faces" | "recent" | "home";

export type Chapter = {
  title: string;
  /** works shown, in order */
  works: string[];
  /** the larger line, editorial or hers (`hers`) */
  big?: string;
  small?: string;
  hers?: boolean;
  /** show the first work in its room photograph */
  room?: boolean;
  dark?: boolean;
};

export type SeriesPage = {
  slug: string;
  label: string;
  period: string;
  motif: Motif;
  /** one line for the overview and the home tiles */
  line: string;
  /** the work that opens the series */
  hero: string;
  /** her words on the series, verbatim, where she has written them */
  quote?: string;
  intro: string[];
  chapters: Chapter[];
};

export const SERIES_PAGES: SeriesPage[] = [
  {
    slug: "gone-are-the-days", label: "Gone Are The Days", period: "c. 2016–2018", motif: "days",
    line: "Rickshaws, coins, clay and cinema posters from an India slipping out of view.",
    hero: "bulls-and-wheel",
    quote: "The shades that touched me, the live frames that seemed to tell a story larger than the attention they seemed to draw.",
    intro: [
      "Fourteen canvases gather the things daily life is letting go of: the tonga and the bullock cart, the twenty-paise coin, the clay gullak, the red letterbox, the hand-painted cinema poster.",
      "Again and again an old thing shares the canvas with what replaced it — a bullock cart beside a truck, a tonga beside an autorickshaw. Each painting holds two times at once.",
    ],
    chapters: [
      { title: "Coins and clay", works: ["rickshaw-puller-and-coin", "coins-and-clay-bank", "terracotta-pots"],
        big: "A clay gullak, and the coins it was made to hold: 20 paise, 5 naye paise, 4 annas.",
        small: "Now the coins are gone, and the gullak waits." },
      { title: "Roads", works: ["bulls-and-wheel"], room: true, dark: true,
        small: "Before engines, there were these two. Shoulder to shoulder under one yoke, pulling the wheel that carried a village’s harvest, its weddings, its markets.",
        big: "The wheel still stands. The road has moved on." },
      { title: "Then and now", works: ["carriage-and-autorickshaw", "bullock-cart-and-truck", "cycle-rickshaw", "rickshaw-rest"],
        big: "A tonga beside an autorickshaw. A bullock cart beside a truck.",
        small: "Two ways of moving through the same street, painted on one canvas." },
      { title: "Letters and cinema", works: ["postbox-and-stamps", "mother-india-and-kettles", "shree-420-and-milk-cans"],
        big: "A red letterbox, and the posters of films a whole country knew by heart." },
    ],
  },
  {
    slug: "bandh-darwaze", label: "Bandh Darwaze", period: "2018", motif: "doors",
    line: "Closed doors: a ring, a lock, a bolt and a carved knocker, painted close.",
    hero: "red-and-teal-door-lock",
    intro: [
      "Bandh darwaze — closed doors. Four square canvases look closely at the hardware of old doors: a weathered ring, a red and teal lock, a teal bolt, a carved knocker.",
      "There are no people in this series, only the things hands reach for at a threshold, painted on worn, colour-washed wood.",
    ],
    chapters: [
      { title: "The ring and the lock", works: ["weathered-door-ring", "red-and-teal-door-lock"],
        big: "A ring to knock with. A lock that keeps the rest out of view." },
      { title: "The bolt and the knocker", works: ["teal-door-bolt", "carved-door-knocker"],
        small: "Four canvases, one wall: the series is made to be seen together." },
    ],
  },
  {
    slug: "faith", label: "Faith", period: "c. 2005–2015", motif: "faith",
    line: "Lamps, threads, scripture and stillness: devotion as daily practice.",
    hero: "offering-of-light",
    intro: [
      "Devotion here is not spectacle. A monk raises a lamp to a wall of scripture, a devotee sits before it, a priest lifts a flame, a trunk is wound with red thread.",
      "Faith, in these paintings, lives in habit — even in a man reading his morning paper.",
    ],
    chapters: [
      { title: "Light and scripture", works: ["offering-of-light", "prayer-and-scripture"],
        big: "What do you bring to a prayer?", small: "And what do you hope to leave behind?" },
      { title: "The Buddhas", works: ["monks-and-blue-buddha", "monk-and-green-buddha"], room: true, dark: true,
        big: "Stillness, held in blue and green." },
      { title: "Daily rites", works: ["priest-with-flame", "sacred-tree", "newspaper-reader"],
        small: "A flame, a tree wound with thread, the morning news: the rituals of an ordinary day." },
    ],
  },
  {
    slug: "portraits", label: "Portraits", period: "c. 2005–2015", motif: "faces",
    line: "Faces and working lives: turbans, a chai boy, a kadhai seller, a milkman on his round.",
    hero: "three-veiled-women",
    intro: [
      "The play of emotions on a face has always held her. These portraits stay with people and the work of their hands: elders in turbans, a boy between orders of chai, a seller among his pans, a milkman on his round.",
    ],
    chapters: [
      { title: "Turbans", works: ["red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait"],
        big: "Three turbans, three ways of meeting the world." },
      { title: "Working lives", works: ["boy-and-kettle", "man-among-metal-pans", "milkman-on-bicycle"],
        small: "A kettle, a stack of kadhais, milk cans on a bicycle: each figure is painted with the things of their day." },
      { title: "Together", works: ["three-veiled-women", "mother-and-child"], room: true, dark: true,
        big: "Red veils, gathered close." },
    ],
  },
  {
    slug: "recent-work", label: "Recent work", period: "2024–", motif: "recent",
    line: "Flowers, birds and stillness — most of them described in her own words.",
    hero: "boy-with-bananas",
    intro: [
      "Her recent paintings turn inward: women and children with flowers, birds and leaves, pauses and breath. Five of the six come with her own words, and here they are given in full.",
    ],
    chapters: [
      { title: "Under Canopy of Greens", works: ["boy-with-bananas"], room: true, hers: true, big: WORDS["boy-with-bananas"] },
      { title: "Threads of Faith", works: ["temple-bells"], hers: true, big: WORDS["temple-bells"] },
      { title: "Whispers of Stillness", works: ["woman-with-bird"], room: true, dark: true, hers: true, big: WORDS["woman-with-bird"] },
      { title: "Petals of Thought", works: ["woman-with-red-flower"], hers: true, big: WORDS["woman-with-red-flower"] },
      { title: "Blooming Innocence", works: ["child-among-flowers"], room: true, hers: true, big: WORDS["child-among-flowers"] },
      { title: "Woman with Poppies", works: ["woman-with-poppies"] },
    ],
  },
];

export const SERIES_BY_LABEL = new Map(SERIES_PAGES.map((s) => [s.label, s]));
export const SERIES_BY_SLUG = new Map(SERIES_PAGES.map((s) => [s.slug, s]));
export const seriesPath = (label: string) => `/series/${SERIES_BY_LABEL.get(label)?.slug ?? ""}`;
export const worksIn = (label: string) => WORKS.filter((w) => w.series === label);

/** these photographs are too small to enlarge; they stay in the catalogue but out of showcases */
export const SMALL_PHOTO = new Set(["elder-woman-portrait", "horse-cart-and-autorickshaw", "rickshaw-and-autorickshaw", "riverside-figures"]);

/** the status line a card shows */
export const statusText = (w: Work) =>
  w.status === "Sold" ? "Sold" : w.status === "Enquire" ? "On enquiry" : "Available · Price on request";

/** the label line: medium · size · year */
export const labelLine = (w: Work) => [w.medium, w.size, w.year].filter(Boolean).join(" · ");

const waText = (w?: Work) =>
  w ? `Hello Dr Prasad, I saw ${quoted(w.title)} on your website and would like to know more. ${SITE}${workPath(w.id)}`
    : "Hello Dr Prasad, I saw your paintings on your website and would like to know more.";

/** the WhatsApp link, with the painting named, or the enquiry page when no number is set */
export const whatsappHref = (w?: Work) =>
  WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText(w))}` : enquireHref(w);

export const enquireHref = (w?: Work) => (w ? `/enquire?work=${w.id}` : "/enquire");

/* ---------------------------------------------------------------- exhibitions */

export type Photo = { src: string; alt: string };

export type Exhibition = {
  id: string;
  title: string;
  kind: string;
  venue: string;
  city: string;
  /** when, as the record states it; empty when it does not */
  when: string;
  year?: string;
  /** a line from the record, never invented */
  note?: string;
  photos: Photo[];
  /** works known to have been shown */
  works?: string[];
  /** ends after this ISO day (the current show) */
  until?: string;
};

const ex = (n: string, alt: string): Photo => ({ src: `/site/ex/${n}.jpg`, alt });

export const EXHIBITIONS: Exhibition[] = [
  {
    id: "sacred-fragments", title: "Sacred Fragments: A Journey Home", kind: "Now showing",
    venue: "", city: "New Delhi", when: "18–21 October 2026", year: "2026", until: "2026-10-21",
    note: "Showing Threads of Faith and Under Canopy of Greens.",
    works: ["temple-bells", "boy-with-bananas"], photos: [],
  },
  {
    id: "india-habitat-centre", title: "India Habitat Centre", kind: "Solo exhibition",
    venue: "India Habitat Centre", city: "New Delhi", when: "",
    note: "The opening lamp, conversations beside the canvases, and the press in front of The Bullocks.",
    works: ["bulls-and-wheel", "rickshaw-rest-framed", "coins-and-clay-bank", "rickshaw-puller-and-coin", "monks-and-blue-buddha"],
    photos: [
      ex("ihc-room-01", "The exhibition room at India Habitat Centre, paintings around the walls and a brass lamp in the centre."),
      ex("ihc-evening-01", "Dr Dolly Prasad lights the brass lamp at the opening, with guests beside her."),
      ex("ihc-press-01", "Dr Dolly Prasad is interviewed beside The Bullocks, with cameras and microphones in front of her."),
      ex("ihc-evening-06", "Dr Dolly Prasad in conversation with visitors in front of her paintings."),
      ex("ihc-room-02", "Three framed paintings along the pale and red-brick gallery walls."),
      ex("ihc-evening-12", "Dr Dolly Prasad beside The Blue Buddha, looking across the room."),
      ex("ihc-room-04", "Two paintings of working figures above the brass lamp on a red-brick wall."),
      ex("ihc-evening-10", "Photographers and visitors in front of a large painting of a rickshaw puller."),
      ex("ihc-press-02", "Dr Dolly Prasad speaks to the press beside a large rickshaw painting."),
      ex("ihc-room-03", "Paintings along a pale gallery partition and the adjoining wall."),
      ex("ihc-evening-09", "Visitors looking along a wall of her paintings."),
      ex("ihc-evening-04", "Dr Dolly Prasad with a visitor holding a bouquet."),
    ],
  },
  {
    id: "a-lifetime-to-paint", title: "A Lifetime to Paint", kind: "Solo exhibition",
    venue: "Indian Council for Cultural Relations, Azad Bhavan Art Gallery", city: "I.P. Estate, New Delhi",
    when: "Opened 11 June 2010 · 12–16 June 2010", year: "2010",
    note: "Presented by the Indian Council for Cultural Relations.",
    works: ["monks-and-blue-buddha"],
    photos: [
      ex("iccr-01", "Dr Dolly Prasad speaks at the opening of A Lifetime to Paint, beside a brass lamp, with The Blue Buddha behind her."),
      ex("iccr-02", "Dr Dolly Prasad, holding flowers, beside The Blue Buddha at ICCR."),
      ex("iccr-03", "The ICCR sign for A Lifetime to Paint, with the June 2010 dates and the Azad Bhavan Art Gallery."),
    ],
  },
  {
    id: "triveni-2007", title: "An exhibition of recent paintings", kind: "Two-artist exhibition, with Sangeeta Sharma",
    venue: "Triveni Kala Sangam, Mandi House", city: "New Delhi", when: "10–20 May 2007", year: "2007",
    photos: [ex("paper-01", "The invitation to an exhibition of recent paintings by Dolly Prasad and Sangeeta Sharma, Triveni Kala Sangam, 10–20 May 2007 (recreated from the original).")],
  },
  {
    id: "art-today-and-tomorrow", title: "Art Today And Tomorrow", kind: "Group exhibition",
    venue: "Travancore Art Gallery", city: "New Delhi", when: "",
    note: "Listed in Delhi Times, The Times of India.",
    photos: [ex("paper-04", "The Delhi Times listing for Art Today And Tomorrow at Travancore Art Gallery.")],
  },
  {
    id: "kala-mela", title: "First International Kala Mela", kind: "Art fair", venue: "", city: "", when: "",
    photos: [
      ex("kala-mela-01", "Dr Dolly Prasad beside her framed painting at the First International Kala Mela."),
      ex("kala-mela-02", "The booklet of the First International Kala Mela."),
      ex("kala-mela-04", "Her painting of a seated working man against a rupee, in its black frame at the Kala Mela."),
    ],
  },
];

/** the venues of her solo exhibitions, as recorded */
export const VENUES = [
  "Triveni Kala Sangam", "India Habitat Centre", "ICCR", "Travancore Art Gallery", "Lalit Kala Akademi", "Nehru Art Gallery, Bombay",
];

export const PORTRAIT = "/site/dolly.jpg";
export const PORTRAIT_LARGE = "/site/ex/kala-mela-01.jpg";

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
  { href: "/series", label: "Collections" },
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

/** short pulls from her words, for cards — each a whole sentence of hers */
export const PULL: Record<string, string> = {
  "temple-bells": "Every thread representing a hope, desire, promise, or prayer.",
  "woman-with-bird": "Sometimes, I paint not to show, but to pause.",
  "woman-with-red-flower": "A pause, a breath, a space where the mind softens and listens.",
  "boy-with-bananas": "The bananas on his head look like a natural crown from the earth.",
  "child-among-flowers": "The vibrant bougainvillea serves as a reminder that beauty can be found even amidst the thorn of life’s challenges.",
};

/**
 * One line per painting, in the observer's voice (third person, never hers):
 * what is on the canvas, and a thought to leave with. Nothing about the
 * sitters' lives that the painting itself does not show.
 */
export const LOOK: Record<string, string> = {
  "rickshaw-puller-and-coin": "Broad shoulders in front, a twenty-paise coin behind. What is earned and what is carried, on one canvas.",
  "carriage-and-autorickshaw": "A tonga and an autorickshaw on the same road. One is arriving; the other has almost gone.",
  "bullock-cart-and-truck": "A bullock cart beside a truck. Two speeds, one street.",
  "rickshaw-rest-framed": "A working man at rest against a giant rupee. For a moment, the money waits for him.",
  "coins-and-clay-bank": "A clay gullak, and the coins it was made to hold: 20 paise, 5 naye paise, 4 annas. Now the coins are gone, and the gullak waits.",
  "postbox-and-stamps": "Patra petika: the red letterbox, set against a field of stamps. Letters went in; the world came back.",
  "mother-india-and-kettles": "Steel kettles in front of a Mother India poster: the street’s tea, and the street’s cinema.",
  "shree-420-and-milk-cans": "Milk cans beneath a peeling Shree 420 poster. The morning round passes an old film still on the wall.",
  "bulls-and-wheel": "Before engines, there were these two, shoulder to shoulder under one yoke. The wheel still stands. The road has moved on.",
  "cycle-rickshaw": "A rickshaw-wala and his cycle, large against a red field of smaller vehicles.",
  "rickshaw-rest": "Between fares, an arm across the wheel. The rest is part of the work.",
  "horse-cart-and-autorickshaw": "A small panel from Gone Are The Days: older and newer ways of travelling, side by side.",
  "rickshaw-and-autorickshaw": "A second small panel: the cycle and the motor, sharing one road.",
  "terracotta-pots": "Clay pots, mouth after mouth, in the colour of the earth they were made from.",
  "weathered-door-ring": "A ring on a weathered door, the paint worn down to its layers.",
  "red-and-teal-door-lock": "Red wood, teal wood, and a lock holding them shut.",
  "teal-door-bolt": "A bolt drawn across teal paint. Whatever is inside stays inside.",
  "carved-door-knocker": "A carved knocker on a turquoise door, waiting for a visitor.",
  "monks-and-blue-buddha": "Small figures in saffron before a vast blue face. Stillness, at two scales.",
  "monk-and-green-buddha": "A monk beneath the Bodhi tree, held in green and gold.",
  "offering-of-light": "A lamp raised to a wall of scripture. What do you bring to a prayer?",
  "prayer-and-scripture": "A devotee sits before the written word. And what do you hope to leave behind?",
  "priest-with-flame": "The aarti flame, lifted: a gesture of seconds, held on canvas.",
  "sacred-tree": "A peepal trunk wound in red thread, a thread for every wish.",
  "newspaper-reader": "The morning paper, opened like a ritual.",
  "elder-woman-portrait": "An elder’s face, painted close.",
  "red-turban-portrait": "A red turban, a gold earring, a smile. The rest of his story stays his own.",
  "yellow-turban-portrait": "The yellow catches you first. Then the eyes, which ask for longer.",
  "patterned-turban-portrait": "A lattice of cloth tied above the face, and the lines of a life beneath it.",
  "mother-and-child": "A mother and her son, close, and the small space between them.",
  "boy-and-kettle": "The chai boy between orders, chin in hand, in a world of blue.",
  "man-among-metal-pans": "The kadhai seller among his pans, circle upon circle.",
  "three-veiled-women": "Three women in red, their veils drawn close together.",
  "milkman-on-bicycle": "The doodhwala on his round, the cans swinging from his bicycle.",
  "riverside-figures": "Boatmen at the water’s edge.",
  "woman-with-poppies": "A face turned to one side, and the poppies in full voice around her.",
};

/** approved editorial lines (third person), for cards and chapters */
export const LINES: Record<string, string> = {
  "bulls-and-wheel": "The wheel still stands. The road has moved on.",
  "coins-and-clay-bank": "Now the coins are gone, and the gullak waits.",
};

/** her poem, verbatim */
export const STATEMENT = [
  "They are not things,", "They are everything", "They come to me", "They hold my hand",
  "They give me a brush", "Then sit quietly", "In front of me", "I put them on canvas",
  "I don’t paint", "Am not a painter",
];

export const ON_THE_WORK =
  "My paintings are just a representation of some and many others of the shades and paradigms that I picked up at different stages in my life.";

export const ON_EXHIBITIONS =
  "Each of these paintings reminds me I have yet to pick up many more hues to fill up some empty lines, some yet to be filled up nooks. I hope it would be a life-long unraveling with these tinges, an affair to last a lifetime…";

export type Chapter = {
  title: string;
  /** works shown, in order */
  works: string[];
  /** a line that comes before the larger one, setting it up */
  setup?: string;
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
    slug: "gone-are-the-days", label: "Gone Are The Days", period: "2016 to 2018",
    line: "The India that is quietly leaving: the tonga, the gullak, the twenty-paise coin.",
    hero: "bulls-and-wheel",
    quote: "The shades that touched me, the live frames that seemed to tell a story larger than the attention they seemed to draw.",
    intro: [
      "Fourteen canvases of the things daily life is letting go of. The bullock cart and the tonga. The clay gullak and its coins. The red letterbox. The hand-painted film poster.",
      "Often an old thing shares the canvas with whatever replaced it.",
    ],
    chapters: [
      { title: "Coins and clay", works: ["rickshaw-puller-and-coin", "coins-and-clay-bank", "terracotta-pots"],
        big: "A clay gullak, and the coins it was made to hold: 20 paise, 5 naye paise, 4 annas.",
        small: "Now the coins are gone, and the gullak waits." },
      { title: "Roads", works: ["bulls-and-wheel"], room: true, dark: true,
        setup: "Before engines, there were these two. Shoulder to shoulder under one yoke, pulling the wheel that carried a village’s harvest, its weddings, its markets.",
        big: "The wheel still stands. The road has moved on." },
      { title: "Then and now", works: ["carriage-and-autorickshaw", "bullock-cart-and-truck", "cycle-rickshaw", "rickshaw-rest"],
        big: "A tonga beside an autorickshaw. A bullock cart beside a truck.",
        small: "Two ways of moving through the same street, on one canvas." },
      { title: "Letters and cinema", works: ["postbox-and-stamps", "mother-india-and-kettles", "shree-420-and-milk-cans"],
        big: "A red letterbox. Steel kettles. Milk cans under a film poster.",
        small: "The street’s post, its tea and its cinema." },
    ],
  },
  {
    slug: "bandh-darwaze", label: "Bandh Darwaze", period: "2018",
    line: "Four closed doors: a ring, a lock, a bolt, a knocker.",
    hero: "red-and-teal-door-lock",
    intro: [
      "Bandh darwaze: closed doors. Four small square canvases, each a close look at the hardware of an old door, painted over worn, colour-washed wood.",
      "No people, no rooms. Only what a hand reaches for at a threshold.",
    ],
    chapters: [
      { title: "The ring and the lock", works: ["weathered-door-ring", "red-and-teal-door-lock"],
        big: "A ring to knock with. A lock to keep the rest unseen." },
      { title: "The bolt and the knocker", works: ["teal-door-bolt", "carved-door-knocker"],
        small: "A foot square each, the four are made to be seen together, on one wall." },
    ],
  },
  {
    slug: "faith", label: "Faith", period: "2005 to 2015",
    line: "Devotion as daily practice: a lamp, a thread, a page of scripture.",
    hero: "offering-of-light",
    intro: [
      "Not spectacle, but habit. A lamp is raised to a wall of scripture. A devotee sits before it. A priest lifts the aarti flame. A peepal is wound in red thread.",
      "And a man opens his morning paper. In these paintings, that too is a kind of faith.",
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
    slug: "portraits", label: "Portraits", period: "2005 to 2015",
    line: "Faces, and the things of their day: a turban, a kettle, a stack of kadhais.",
    hero: "three-veiled-women",
    intro: [
      "The play of emotion on a face has always held her. These portraits stay close: elders in turbans, a chai boy between orders, a kadhai seller among his pans, a doodhwala on his round.",
      "Each figure is painted with the things of their work beside them. The face is where you meet them. The rest is left to them.",
    ],
    chapters: [
      { title: "Turbans", works: ["red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait"],
        big: "Red, yellow, a lattice of cloth.", small: "The colour draws you in. The faces keep you there." },
      { title: "Working lives", works: ["boy-and-kettle", "man-among-metal-pans", "milkman-on-bicycle"],
        small: "A kettle, a stack of kadhais, milk cans on a bicycle: each figure is painted with the things of their day." },
      { title: "Together", works: ["three-veiled-women", "mother-and-child"], room: true, dark: true,
        big: "Red veils, gathered close." },
    ],
  },
  {
    slug: "recent-work", label: "Onset of Spring", period: "2024 to 2026",
    line: "Flowers, leaves, a bird and a pause, in her own words.",
    hero: "boy-with-bananas",
    intro: [
      "Her spring work turns inward. A child beneath banana leaves. A woman beside a bird. Bells hung with red thread.",
      "Five of the six paintings come with her own words. They are given here in full.",
    ],
    chapters: [
      { title: "Under Canopy of Greens", works: ["boy-with-bananas"], room: true, hers: true, big: WORDS["boy-with-bananas"] },
      { title: "Threads of Faith", works: ["temple-bells"], hers: true, big: WORDS["temple-bells"] },
      { title: "Whispers of Stillness", works: ["woman-with-bird"], room: true, dark: true, hers: true, big: WORDS["woman-with-bird"] },
      { title: "Petals of Thought", works: ["woman-with-red-flower"], hers: true, big: WORDS["woman-with-red-flower"] },
      { title: "Blooming Innocence", works: ["child-among-flowers"], room: true, hers: true, big: WORDS["child-among-flowers"] },
      { title: "Woman with Poppies", works: ["woman-with-poppies"], big: LOOK["woman-with-poppies"] },
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
 * exhibition post records, 18 Oct 2026). Her own record lists eighteen
 * exhibitions and art fairs, 2005 to 2018; it does not say which were solo, so
 * nothing here calls them all solo. Dates are given only as precisely as the
 * record gives them.
 */

export type Photo = { src: string; alt: string };
export type Album = { title: string; line: string; photos: Photo[] };
export type Clip = { src: string; poster: string; title: string; line: string };

export type Show = {
  id: string;
  title: string;
  kind: string;
  venue: string;
  city: string;
  when: string;
  year: string;
  /** editorial, from the record and the photographs */
  lede: string;
  /** her words, verbatim, where they belong to this show */
  quote?: string;
  note?: string;
  albums: Album[];
  clips?: Clip[];
  works?: string[];
};

const ph = (n: string, alt: string): Photo => ({ src: `/site/ex/${n}.jpg`, alt });

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

export const SHOWS: Show[] = [
  {
    id: "india-habitat-centre-2010", title: "An evening at India Habitat Centre", kind: "Exhibition",
    venue: "Open Palm Court, India Habitat Centre", city: "New Delhi", when: "November 2010", year: "2010",
    lede: "A lamp lit at the opening. The Bullocks, the gullak and the rickshaw-walas on red-brick walls. Visitors stopping to talk, to look, to take a photograph. And the press, with their questions, beside the paintings.",
    works: ["bulls-and-wheel", "coins-and-clay-bank", "monks-and-blue-buddha"],
    albums: [
      { title: "The evening", line: "The lamp is lit, and the room fills.", photos: [
        ph("ihc-02", "The opening at Open Palm Court, India Habitat Centre: visitors gathered around the lit brass lamp."),
        ph("ihc-03", "Dr Dolly Prasad lights the brass lamp at the opening, with guests beside her."),
        ph("ihc-04", "Dr Dolly Prasad in conversation with visitors in front of her paintings."),
        ph("ihc-05", "Dr Dolly Prasad and visitors look along a wall of paintings of everyday objects and working lives."),
        ph("ihc-06", "Photographers and visitors in front of a large painting of a rickshaw puller."),
        ph("ihc-08", "Dr Dolly Prasad beside The Blue Buddha, looking across the room."),
      ] },
      { title: "In front of the cameras", line: "Interviews beside the work: a rickshaw-wala behind her in one, The Bullocks in the other.", photos: [
        ph("ihc-press-a", "Dr Dolly Prasad smiles in conversation with a reporter beside her rickshaw painting."),
        ph("ihc-press-b", "Dr Dolly Prasad listens during an interview beside The Bullocks."),
      ] },
      { title: "A walk through the room", line: "The wide views first, then the canvases up close.", photos: [
        ph("ihc-01", "The empty exhibition room, paintings around the walls and a brass lamp at its centre."),
        ph("ihc-07", "Three framed paintings along the pale and red-brick gallery walls."),
        ph("ihc-room-a", "Paintings along a pale gallery partition and the adjoining wall."),
        ph("ihc-room-b", "Two paintings of working figures above the brass lamp on a red-brick wall."),
        ph("ihc-room-c", "The Bullocks in its black frame on the exhibition wall."),
        ph("ihc-room-e", "The Matka and the Coins in its exhibition frame."),
        ph("ihc-room-d", "A framed painting of a working figure against a large coin."),
        ph("ihc-room-f", "A large framed painting of a rickshaw puller on a red-brick wall."),
        ph("ihc-room-g", "A framed painting of a seated reader against a large coin."),
      ] },
    ],
  },
  {
    id: "a-lifetime-to-paint", title: "A Lifetime to Paint", kind: "Exhibition, presented by the Indian Council for Cultural Relations",
    venue: "Azad Bhavan Art Gallery, ICCR, I.P. Estate", city: "New Delhi", when: "Opened 11 June 2010 · on view 12 to 16 June", year: "2010",
    lede: "She spoke at the opening beside a marigold-decked lamp, The Blue Buddha behind her. The title looks past the walls, to the paintings still to come.",
    quote: "I hope it would be a life-long unraveling with these tinges, an affair to last a lifetime…",
    works: ["monks-and-blue-buddha"],
    albums: [
      { title: "The opening", line: "11 June 2010, Azad Bhavan Art Gallery.", photos: [
        ph("iccr-speech", "Dr Dolly Prasad speaks at the opening of A Lifetime to Paint, beside a brass lamp, with The Blue Buddha behind her."),
        ph("iccr-02", "Dr Dolly Prasad, holding flowers, beside The Blue Buddha at ICCR."),
        ph("iccr-sign", "The ICCR sign for A Lifetime to Paint, a painting exhibition by Dr Dolly Prasad, 11 to 16 June 2010."),
      ] },
    ],
  },
  {
    id: "kala-mela-2018", title: "First International Kala Mela", kind: "Art fair, organised by Lalit Kala Akademi",
    venue: "Indira Gandhi National Centre for the Arts", city: "New Delhi", when: "4 to 18 February 2018", year: "2018",
    lede: "Artists from India and abroad, and the people who came to meet them. She stood beside The Cart-Man and the Rupaya, a working man at rest against a giant coin; nearby, a visitor raised her phone for a selfie with the paintings.",
    works: ["rickshaw-rest-framed"],
    albums: [
      { title: "At the fair", line: "February 2018, IGNCA.", photos: [
        ph("kala-dolly", "Dr Dolly Prasad in a red coat beside her framed painting at the Kala Mela."),
        ph("kala-painting", "The Cart-Man and the Rupaya in its black frame at the Kala Mela."),
        ph("kala-selfie", "A visitor takes a selfie beside the paintings at the Kala Mela."),
        ph("kala-booklet", "The booklet of the First International Kala Mela."),
      ] },
    ],
  },
  {
    id: "triveni-2007", title: "Recent paintings, with Sangeeta Sharma", kind: "Two-artist exhibition",
    venue: "Triveni Kala Sangam, Mandi House", city: "New Delhi", when: "10 to 20 May 2007", year: "2007",
    lede: "The invitation keeps what no photograph did: two names, ten days in May, and the paintings chosen to introduce them, among them Lajja, Intezar and Mannat.",
    albums: [
      { title: "The invitation", line: "From the paper archive.", photos: [
        ph("triveni-1", "The invitation to an exhibition of recent paintings by Dolly Prasad and Sangeeta Sharma, Triveni Kala Sangam, 10 to 20 May 2007."),
        ph("triveni-2", "The back of the invitation, with paintings and small portraits of Sangeeta Sharma and Dolly Prasad."),
        ph("triveni-3", "The artist sheet: the invitation, her portrait and three paintings, Lajja, Intezar and Mannat."),
      ] },
    ],
  },
];

export const PRESS = {
  clipping: ph("delhi-times", "A Delhi Times clipping, Must See Must Do, listing Art Today And Tomorrow, a group show at Travancore Art Gallery."),
  clippingLine: "Delhi Times picked Art Today And Tomorrow, a group show of paintings at Travancore Art Gallery, among the week’s Must See, Must Do.",
  clips: [
    { src: "/site/video/tv-archive-2.mp4", poster: "/site/video/tv-archive-2.jpg", title: "On NCR television · June 2010",
      line: "12 June 2010. The camera turns from the paintings to her, speaking in the gallery." },
    { src: "/site/video/tv-archive-1.mp4", poster: "/site/video/tv-archive-1.jpg", title: "On television",
      line: "A report from the gallery, with her paintings on the walls behind." },
  ] as Clip[],
};

/** her record, as she lists it (drdollyprasad.wordpress.com/about), newest first */
export type RecordEntry = { year: string; month?: string; venue: string; city: string; show?: string };
export const RECORD: RecordEntry[] = [
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
  { year: "2007", month: "May", venue: "Triveni Kala Sangam", city: "New Delhi", show: "triveni-2007" },
  { year: "2007", venue: "Travancore Art Gallery", city: "New Delhi" },
  { year: "2007", venue: "Indraprastha Art Gallery", city: "New Delhi" },
  { year: "2006", venue: "Nehru Art Gallery", city: "Bombay" },
  { year: "2006", venue: "Travancore Art Gallery", city: "New Delhi" },
  { year: "2006", venue: "All India Women Art Show", city: "" },
  { year: "2005", venue: "Indraprastha Art Gallery", city: "New Delhi" },
  { year: "2005", venue: "Sriram Centre", city: "New Delhi" },
];

export const RECORD_LINE = "Eighteen exhibitions and art fairs, 2005 to 2018";

export const PORTRAIT = "/site/dolly.jpg";
export const PORTRAIT_LARGE = "/site/ex/kala-dolly.jpg";

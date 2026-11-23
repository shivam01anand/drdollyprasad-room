import { WORKS, type Work, EMAIL, INSTAGRAM, SITE, quoted, workPath } from "./works";

/**
 * The website around the studio: the series stories and her exhibitions.
 *
 * All words on this site are Shubham’s (kb/voice.md). Nothing is presented as hers.
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
 * One line per painting, in the observer’s voice (third person, never hers):
 * the story, then what the painting holds. Source: kb descriptions (story-first lines, 2026-11-22).
 */
export const LOOK: Record<string, string> = {
  "rickshaw-puller-and-coin": "He puts his whole back into every fare, for twenty paise coins that matter so little now. This painting gives the coin back the weight it had when a whole family lived on what he pulled.",
  "carriage-and-autorickshaw": "He waits under the orange hood, the grey horse standing ready, for a fare who now flags down an auto instead. Aakhri savaari means the last ride, and the painting never tells us whether his has already gone.",
  "bullock-cart-and-truck": "He lifts the whip over a cartload of sacks, and the bullock walks on at the one speed it has. The truck beside him carries the same sacks, and here it waits in the dark while the bullock sets the pace.",
  "rickshaw-rest-framed": "After a day on his feet he sits back against the rickshaw, and even now he glances over his shoulder in case the next passenger has come. Behind him stands ek rupaya, the coin his whole day was counted in.",
  "coins-and-clay-bank": "Children fed coins through a slot like this for months, and the only way to get them out was to break the clay. Nobody breaks this one, and the annas around it would buy nothing now.",
  "postbox-and-stamps": "A letter went into a red box like this one, and a family looked out for the postman until the reply came. Each stamp on the wall in this painting paid for that wait, a few paise to send a voice across the country.",
  "mother-india-and-kettles": "Kettles like these poured tea all day at a stall, under a Mother India poster nobody ever took down. The film’s mother carried her sons through flood and hunger, and now she fades into the red and goes on minding the stall.",
  "shree-420-and-milk-cans": "Every morning the cans stood against the nearest wall, and that season the wall belonged to Raj Kapoor. Milk and the movies were what every house on the street shared, and this painting keeps that wall the way a family keeps an old photograph.",
  "bulls-and-wheel": "Someone painted their horns blue and green and hung bells at their throats, the way you dress those who do your heaviest work. Before the Engines remembers when a harvest got to market only as fast as these two could walk.",
  "cycle-rickshaw": "He pedals on with a cloth held to his mouth, and the road around him belongs to cars and autos now. For once he has right of way, and every engine has to wait behind him.",
  "rickshaw-rest": "He has climbed onto the footboard to rest his legs, the brass bell hanging from his fingers, ready the moment anyone waves. All the street ever spared him was thodi der, a little while, and on canvas it lasts.",
  "horse-cart-and-autorickshaw": "Three passengers squeezed in behind a turbaned driver, and the tonga took them across town at a trot. In A Ride Together the auto that would one day take his fares has drawn up alongside, and for now the two share the road.",
  "rickshaw-and-autorickshaw": "A thin man walks between the shafts down the old street, and the man he pulls sits back as if he weighed nothing. An auto that runs on its own already waits beside him, and still he pulls.",
  "terracotta-pots": "Copper like this was scrubbed till it shone and sent back to the kitchen, and nobody looked twice. This painting turns each pot to the light and lets the dark between them warm the copper.",
  "weathered-door-ring": "On a door like this, whoever knocked was looked over first through the small barred window. We stand on the visitor’s step, a hand’s reach from the ring, and wait on a face that does not come to the bars.",
  "red-and-teal-door-lock": "Someone padlocked this door from outside, meaning to come back, and the lock has rusted into its hasp. This painting keeps watch on it the way a family watches the lane for someone long overdue.",
  "teal-door-bolt": "Whoever left last slid the bolt across both doors, then hung a padlock on it for good measure. Every rivet is painted with the same care, the way people lock up a house they mean to keep.",
  "carved-door-knocker": "Someone worked a flower into each stud on this door and bent its handle into a heart for a guest’s hand. No lock shows anywhere on it, and it stays as it was made, ready for the next knock.",
  "monks-and-blue-buddha": "Four young monks sit down to the same prayer, and two have shut their eyes while one still reads his loose pages. Over them the Buddha’s eyes are already shut, and the painting gives each boy as many days as it takes to get there.",
  "monk-and-green-buddha": "He presses his face into his joined palms, the way people pray when what they need is too big to say aloud. Sharan means refuge, and he finds it in a raised hand above his bowed head that asks for nothing back.",
  "offering-of-light": "A boy holds his lamp out at arm’s length to a wall of the prayer said before any new beginning. For a boy at the start of nearly everything, this painting finds the right prayer, the one that asks for every road to be clear.",
  "prayer-and-scripture": "He sits bare-backed before the Gayatri, the prayer many Hindus say at sunrise every day of their lives. We sit just behind him, close enough to read the lines he has long known by heart.",
  "priest-with-flame": "A temple’s aarti comes at the same hour every day, and he is the man who lifts the flame for it. Years of that hour have not dulled it, and in this painting the air around him still shakes with the bell.",
  "sacred-tree": "Every turn of thread round this trunk is someone’s mannat, a vow tied on in hope and left with the tree. Nobody can tell now which ones came true, and every one stays wound as tight as the day it was tied.",
  "newspaper-reader": "Before the day asks anything of him he sits with the paper up close, and one page has slipped to the floor. The tilak is the mark of a morning puja, and he reads the news with the same slow care.",
  "elder-woman-portrait": "Whatever the years asked her to wait for, she waited, and each wait left its line on her face. Nobody thanks a woman for patience like hers, so the painting does, and gives it its name, sabr.",
  "red-turban-portrait": "Something has tickled him, and the grin has dipped his head and nearly shut his eyes. A smile like this is gone before anyone looks, and Muskaan keeps it one breath short of the laugh.",
  "yellow-turban-portrait": "He keeps his head up under a turban tied high and full, and his eyes come round to hold yours till you look away. In any crowd he would be one more face, and this painting gives his pride the whole canvas.",
  "patterned-turban-portrait": "Worry has pulled his mouth down and his eyes to the ground, for all the brightness of his turban. He is left to it, the way you let an old man finish a thought.",
  "mother-and-child": "He holds on to his mother’s arm and stares out at the world from the one place it cannot reach him. The painting takes its name from that place, aanchal, the edge of a sari and the first shelter a child knows.",
  "boy-and-kettle": "He looks young enough for a classroom, yet he sits by the stove, chin in hand, till the tea boils. Bachpan is what this painting calls his hours at the stove, and for many boys like him they were all the childhood there was.",
  "man-among-metal-pans": "He has set out his kadhais in a ring on the ground and sits among them, his back to us, until someone stops to buy. Each empty pan in Intezar is one more customer who has not come.",
  "three-veiled-women": "Three women draw their veils close and lean in together, and the world gets only their arms and the silver on them. The red that hides them from us is what makes the three of them one.",
  "milkman-on-bicycle": "He is out before the city wakes, cans swinging at both sides, so every house has milk for its first chai. The title puts him first in the day, and the painting follows a man most homes knew only by the clank at the gate.",
  "riverside-figures": "They sit on the ghat steps under woven umbrellas, wrapped in white and saffron, and wait for whoever comes down to the river next. Evening at the Ghat gives them the hour when the crowds have gone home and the steps are theirs again.",
  "child-among-flowers": "She has been found out at something, or thinks she has, and a hand over her mouth is all the hiding she knows yet. Among the bougainvillea she is one more bloom, held there before life has had its say.",
  "woman-with-poppies": "She has gone somewhere none of us can follow, to talk things over with no one but herself. Khwaab means a dream, and poppies, the old flower of sleep, grow right out to the edges.",
  "temple-bells": "People often come back to hang a bell at a temple once a prayer is answered, and these rails have run out of room. Whoever hung them has gone home, and the brass is left in this painting to go on saying thank you.",
  "woman-with-bird": "Spring is in full voice around her, a bird calling at her shoulder, and she has found the one quiet place left, behind her own eyes. In this painting the bird will never finish its call, and still she does not turn her head.",
  "woman-with-red-flower": "There is something she cannot find the words for, and she sits with it, a fingertip under one eye. The flower at her lips will have to speak for her, and it opens wide and red.",
  "boy-with-bananas": "He wears a whole bunch of bananas like a crown, and his small smile says he knows how fine he looks. In this painting a village errand turns into a coronation, under a flower that will one day fill out into bananas.",
};

/** approved editorial lines (third person), for cards and chapters */
export const LINES: Record<string, string> = {
  "bulls-and-wheel": "The wheel still stands. The road has moved on.",
  "coins-and-clay-bank": "The coins have moved on. The gullak is still here, still holding.",
};

/** the About "Five collections" paragraph: one painting from each collection, Shubham’s words, shown unsigned
 *  (content elevate 2026-11-22). The studio easel has its own text (lib/chapters.ts THEME); the two no longer share. */
export const STATEMENT = [
  "A little girl peeks sideways out of a wall of flowers. Nobody has come back yet to open a locked door, and a milkman in a red turban rides off along a blue road. An old woman with white marks across her forehead does not smile for anyone, and someone has left marigolds at the foot of a peepal.",
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
  // Content elevate (2026-11-22): lines from items/content-elevate-2026-11-22 (reviewer finals), structure per kb/decisions.md.
  {
    slug: "bahaar", label: "Bahaar", period: "2024 to 2025",
    line: "Spring is in flower all around them, and each of them keeps one thought back.",
    hero: "boy-with-bananas",
    held: "Bahaar means spring, and here it comes into flower around people who have gone quiet inside.",
    intro: [
      "A boy smiles out at us from under the banana leaves. At the far end a woman has turned her face away among the poppies, and spring carries on without her.",
      "In between, the thoughts grow longer and harder to read.",
    ],
    chapters: [
      { title: "Under Canopy of Greens", works: ["boy-with-bananas"], room: true,
        big: "Spring at its lightest, and his is the one thought in the series that is easy to read." },
      { title: "Blooming Innocence", works: ["child-among-flowers"], room: true,
        big: "Her secret is a child’s first, and the bougainvillea crowds in to keep it." },
      { title: "Petals of Thought", works: ["woman-with-red-flower"],
        big: "Then the thoughts grow up, and this one is heavy to carry." },
      { title: "Whispers of Stillness", works: ["woman-with-bird"], room: true, dark: true,
        big: "Everything around her has come into season at once, and her mind is somewhere the season hasn’t reached." },
      { title: "Khwaab", works: ["woman-with-poppies"],
        big: "The thought has carried her off now, and the series leaves her to it." },
    ],
  },
  {
    slug: "bandh-darwaze", label: "Bandh Darwaze", period: "2018",
    line: "Old doors pulled shut, waiting for a knock, or for whoever locked them to come home.",
    hero: "red-and-teal-door-lock",
    held: "A shut door is the part of a house that does the waiting.",
    intro: [
      "Bandh darwaze means closed doors. In an old Indian house the door was where the family met the street, and a padlock on the outside told the whole lane that nobody was home.",
      "Seen this close, the teal and the red have flaked away to bare grain, and nobody appears in any of them.",
    ],
    chapters: [
      { title: "Someone may be home", works: ["weathered-door-ring", "carved-door-knocker"], dark: true,
        big: "Nothing locks these two from outside. Someone is expected, and the house will open in its own time." },
      { title: "Gone for now", works: ["red-and-teal-door-lock", "teal-door-bolt"],
        big: "These two were locked from the street side. The house behind them is empty for now, and its doors hold it for the day the key comes home." },
    ],
  },
  {
    slug: "gone-are-the-days", label: "Gone Are The Days", period: "2007 to 2018",
    line: "The men and animals who carried a city through its day, some of them painted beside the engines that took their place.",
    hero: "bulls-and-wheel",
    held: "Nobody waved goodbye to the last tonga.",
    intro: [
      "The street used to run on muscle and patience, a man hauling a rickshaw, a tonga at a trot. Every fare was counted in paise.",
      "Most of it has gone now, and in several of these canvases the auto or the truck that replaced it already shares the frame.",
    ],
    chapters: [
      { title: "What a day was worth", works: ["rickshaw-puller-and-coin", "rickshaw-rest-framed", "coins-and-clay-bank", "terracotta-pots"],
        big: "A day on the street came down to a handful of coins, and a home guarded them as carefully as its copper.",
        small: "Every fare further along this street, every cup of tea, was paid for in coins like these." },
      { title: "Under one yoke", works: ["bulls-and-wheel"], room: true, dark: true,
        big: "Some of the street’s hardest work fell to animals, two under one yoke, step for step." },
      { title: "When the engines came", works: ["carriage-and-autorickshaw", "bullock-cart-and-truck", "horse-cart-and-autorickshaw", "rickshaw-and-autorickshaw", "cycle-rickshaw"],
        big: "Then the engines came. In four of these the old street sits on a worn sheet of its own, as if already put away, with the new traffic painted all round it.",
        small: "By Last of the Pedals the sheet is gone, and the rickshaw is all that is left of the old street." },
      { title: "Dawn to dusk", works: ["milkman-on-bicycle", "newspaper-reader", "boy-and-kettle", "rickshaw-rest", "man-among-metal-pans", "riverside-figures"], dark: true,
        big: "The day began with the milk round before first light and ended on the ghat steps in the evening. Most of what lay between was waiting, and nobody paid for that." },
      { title: "Two ways out", works: ["postbox-and-stamps", "mother-india-and-kettles", "shree-420-and-milk-cans"],
        big: "After work the street had two ways out into the world, a letter in the post and an evening in the dark at the picture hall.",
        small: "The Shree 420 poster has peeled, and you can still read where it played, Maratha Mandir, four shows a day." },
    ],
  },
  {
    slug: "portraits", label: "Portraits", period: "2007 to 2012",
    line: "Ordinary faces, looked at until the feeling behind each one has a name.",
    hero: "three-veiled-women",
    held: "Lajja means modesty, and of all the faces here, these are the ones we are not allowed to see.",
    intro: [
      "You could pass any of these people in a bazaar and never look back. Held still, each face gives up a single feeling, and the painting takes its name from it.",
    ],
    chapters: [
      { title: "Four feelings", works: ["elder-woman-portrait", "red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait"],
        setup: "Sabr, Muskaan, Garv, Fikr: patience, a smile, pride, worry.",
        big: "Each of these faces has had a lifetime to learn its feeling." },
      { title: "Together", works: ["three-veiled-women", "mother-and-child"], room: true,
        big: "Three women keep one modesty between them, and a child is safe for as long as his mother is near." },
    ],
  },
  {
    slug: "faith", label: "Faith", period: "2007 to 2026",
    line: "Prayer at its daily hour: a lamp lifted to a wall of mantras, a thread tied round a peepal for a wish.",
    hero: "offering-of-light",
    held: "Most of them pray with their backs to us, and we take our place behind them.",
    intro: [
      "In an Indian house prayer keeps hours as regular as the kitchen’s. The same words come at the same time, said so often they wear smooth.",
      "Some prayers need nobody to say them. A thread wound round a peepal goes on asking, and a bell hung on a temple rail answers for a prayer that came true.",
    ],
    chapters: [
      { title: "The written prayer", works: ["offering-of-light", "prayer-and-scripture"],
        big: "Words fill the wall, written over and over, and a figure in saffron faces them. Apart from a few small drawings of Ganesha, the god is there only in the words." },
      { title: "Stillness", works: ["monks-and-blue-buddha", "monk-and-green-buddha"], room: true, dark: true,
        big: "Stillness can take a lifetime to reach. The Buddha above them has it already, and the monks are still on the way." },
      { title: "Vows and thanks", works: ["priest-with-flame", "sacred-tree", "temple-bells"],
        big: "The priest lifts the flame for everyone at once. A wish is a private matter, tied on with red thread, and so is the thanks that comes after." },
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
/** a collection’s paintings in her chapter order (flattened), then any not featured in a chapter, in register order */
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
 * a painting’s neighbours inside its collection. At the ends, prev/next are the last/first painting of the
 * adjacent collection, flagged with `crossesTo` (that collection’s slug); the painting page then links to
 * that collection’s story page.
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
 * owner’s confirmation); it does not say which were solo, so
 * nothing here calls them all solo. Dates are given only as precisely as the
 * record gives them.
 */

export type Photo = { src: string; alt: string; /** the one-line caption under the photograph (Chief Content 2c, C7); alt stays the full sentence */ cap?: string };
export type Album = { title: string; line: string; photos: Photo[] };
export type Clip = { src: string; poster: string; title: string; line: string };

export type Show = {
  id: string;
  /** one pattern for every show: the place (or the fair’s own name) */
  title: string;
  /** the show’s own title, where it had one */
  name?: string;
  kind: string;
  /** the one line under the show’s title: venue · dates (Chief Content 2c, C3 to C6) */
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
  "ihc-03": "The opening, India Habitat Centre",
  "ihc-04": "Dr Dolly Prasad with visitors, India Habitat Centre",
  "ihc-05": "Dr Dolly Prasad and visitors by Shree 420 and Patra Petika, India Habitat Centre",
  "ihc-06": "Visitors photograph a rickshaw puller painting on the red-brick wall, India Habitat Centre",
  "ihc-08": "Dr Dolly Prasad beside Dhyan, India Habitat Centre",
  "ihc-press-a": "Dr Dolly Prasad with a reporter, India Habitat Centre",
  "ihc-press-b": "Dr Dolly Prasad in an interview, India Habitat Centre",
  "ihc-01": "The room, a lamp at its centre, India Habitat Centre",
  "ihc-07": "Before the Engines and Twenty Paise, with a rickshaw puller painting between them, India Habitat Centre",
  "ihc-room-a": "Aakhri Savaari, Dheere Dheere and Mitti, India Habitat Centre",
  "ihc-room-b": "A rickshaw puller painting and Twenty Paise, behind the brass lamp, India Habitat Centre",
  "ihc-room-c": "“Before the Engines” on the wall, India Habitat Centre",
  "ihc-room-e": "Gullak, India Habitat Centre",
  "ihc-room-d": "Twenty Paise, India Habitat Centre",
  "ihc-room-f": "A rickshaw puller mid-stride, on the red-brick wall, India Habitat Centre",
  "ihc-room-g": "Ek Rupaya, India Habitat Centre",
  "iccr-speech": "Dr Dolly Prasad speaks at the opening, ICCR",
  "iccr-02": "Dr Dolly Prasad beside Dhyan, ICCR",
  "iccr-sign": "The ICCR sign for A Lifetime to Paint",
  "kala-dolly": "Dr Dolly Prasad beside Ek Rupaya, Kala Mela",
  "kala-painting": "Ek Rupaya, Kala Mela",
  "kala-selfie": "A visitor’s selfie with the paintings, Kala Mela",
  "kala-booklet": "The First International Kala Mela booklet",
  "sf-01": "Dr Dolly Prasad between Under Canopy of Greens and Threads of Faith, India Habitat Centre",
  "sf-02": "Dr Dolly Prasad beside the exhibition poster, India Habitat Centre",
  "sf-03": "A visitor at the two paintings, India Habitat Centre",
  "sf-04": "Dr Dolly Prasad and a visitor at Under Canopy of Greens, India Habitat Centre",
  "sf-05": "A visitor photographs Under Canopy of Greens, India Habitat Centre",
};
const ph = (n: string, alt: string): Photo => ({ src: `/site/ex/${n}.jpg`, alt, ...(CAP[n] ? { cap: CAP[n] } : {}) });

/**
 * The one switch for "Now showing": the home strip, the Exhibitions panel, the note on a
 * painting’s page and the studio’s welcome note stay hidden until Content/COO confirm a
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

/**
 * Sacred Fragments as a show with photographs (Shubham, 22 Nov 2026: Exhibitions and About lead with it).
 * Kept out of SHOWS so the home page and the painting pages stay as they were.
 * Photographs: 06_EXHIBITION_PHOTOS/New exhibition pics (sf-01 from the Under Canopy of Greens carousel,
 * sf-03 to sf-05 from Sacred Fragments Reel 1), resized only.
 */
export const SACRED_FRAGMENTS: Show = {
  id: NOW.id, title: "India Habitat Centre", name: NOW.title, kind: "Art exhibition",
  where: `${NOW.venue}, ${NOW.city} · ${NOW.when}`,
  venue: NOW.venue, city: NOW.city, when: NOW.when, year: "2026",
  lede: "Under Canopy of Greens and Threads of Faith at the Visual Arts Gallery, India Habitat Centre.",
  works: ["boy-with-bananas", "temple-bells"],
  albums: [
    { title: "The exhibition", line: "18 to 21 October 2026, Visual Arts Gallery.", photos: [
      ph("sf-01", "Dr Dolly Prasad stands between her paintings Under Canopy of Greens and Threads of Faith at the Visual Arts Gallery, India Habitat Centre."),
      ph("sf-02", "Dr Dolly Prasad beside the poster for Sacred Fragments: A Journey Home, 18 to 21 October 2026, at India Habitat Centre."),
      ph("sf-03", "A visitor looks at Under Canopy of Greens and Threads of Faith."),
      ph("sf-04", "Dr Dolly Prasad points to a detail of Under Canopy of Greens for a visitor."),
      ph("sf-05", "A visitor photographs Under Canopy of Greens on his phone, Threads of Faith beside it."),
    ] },
  ],
};

/** the shows as first recorded (the Exhibitions hero wall keeps this column order and its tones) */
export const SHOWS_AS_RECORDED: Show[] = [
  {
    id: "india-habitat-centre-2010", title: "India Habitat Centre", kind: "Exhibition", where: "Open Palm Court, India Habitat Centre, New Delhi · November 2010",
    venue: "Open Palm Court, India Habitat Centre", city: "New Delhi", when: "November 2010", year: "2010",
    lede: "“Before the Engines”, the gullak and the rickshaw-walas on red-brick walls. Visitors stopping to talk, to look, to take a photograph. And the press, with their questions, beside the paintings.",
    works: ["bulls-and-wheel", "coins-and-clay-bank", "monks-and-blue-buddha"],
    albums: [
      { title: "The evening", line: "The lamp is lit, and the room fills.", photos: [
        ph("ihc-02", "The opening at Open Palm Court, India Habitat Centre: visitors gathered around the lit brass lamp."),
        ph("ihc-03", "The opening, with guests gathered round the brass lamp."),
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
        ph("ihc-room-d", "Twenty Paise in its frame: a rickshaw puller seen from behind, facing a twenty-paise coin."),
        ph("ihc-room-f", "A large framed painting of a rickshaw puller on a red-brick wall."),
        ph("ihc-room-g", "Ek Rupaya in its frame: a rickshaw puller at rest, looking over his shoulder, a one-rupee coin behind him."),
      ] },
    ],
  },
  {
    id: "a-lifetime-to-paint", title: "ICCR", name: "A Lifetime to Paint", kind: "Exhibition, presented by the Indian Council for Cultural Relations", where: "Azad Bhavan Art Gallery, ICCR, I.P. Estate, New Delhi · 11 to 16 June 2010",
    venue: "Azad Bhavan Art Gallery, ICCR, I.P. Estate", city: "New Delhi", when: "Opened 11 June 2010 · on view 12 to 16 June", year: "2010",
    lede: "She spoke at the opening beside a marigold-decked lamp, Dhyan behind her. The title looks past the walls, to the paintings still to come.",
    note: "Dhyan, then called The Blue Buddha, hung behind her as she spoke at the opening.",
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
/** a show’s date as a number (year * 100 + the last month named in `when`), for newest-first order */
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
  { year: "2026", month: "October", venue: "Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre", city: "New Delhi", show: "sacred-fragments" },
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

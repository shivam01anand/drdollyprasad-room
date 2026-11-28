import { WORKS, type Work, EMAIL, INSTAGRAM, SITE, quoted, workPath } from "./works";

/**
 * The website around the studio: the series stories and her exhibitions.
 *
 * All words on this site are Shubham’s (kb/voice.md). Nothing is presented as hers.
 * The label (title, medium, size, year, series, status) is fact from lib/works.
 */

export { EMAIL, INSTAGRAM, SITE, quoted, workPath };

/** the one delivery line, shown with the way to enquire (Enquire page and painting page) */
export const DELIVERY_LINE = "Paintings ship worldwide.";

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
  "rickshaw-puller-and-coin": "Most of us remember twenty paise as loose change, yet a rickshaw puller laboured through a whole ride to earn it. I have tried to paint the coin as large as that labour, and to honour the man who still pulls towards it.",
  "carriage-and-autorickshaw": "Every city reaches a day when the old way of getting somewhere quietly stops being the way. Here the tonga still holds the road in full colour, and the auto waits beside it in a few white lines, sure of its turn.",
  "bullock-cart-and-truck": "Dheere dheere, slowly, was the only speed a bullock cart ever had. The truck will get there first now, yet for generations this patient pace was enough to feed a city.",
  "rickshaw-rest-framed": "He sits back against his rickshaw, but his eyes have not left the road. To him ek rupaya, one rupee, was never small change. It was supper at home, earned one ride at a time.",
  "coins-and-clay-bank": "Every coin in a gullak was a small promise, a toffee given up or a fare saved for. Together they kept a family's hope for a better tomorrow, and breaking it open was how that tomorrow arrived.",
  "postbox-and-stamps": "A family's news once travelled through a red patra petika like this. A letter in a familiar hand was the next best thing to a visit, and waiting for one was half the joy.",
  "mother-india-and-kettles": "Mother India gave the screen a mother who bore everything for her children. The kettles beside her cared for a working street just as patiently, one cup of tea at a time.",
  "shree-420-and-milk-cans": "With milk at the door each morning and Raj Kapoor on screen at night, a working family asked for little more. The cans and the torn poster have worn down together, from years of the same honest life.",
  "bulls-and-wheel": "Before the engines, a farmer's year rested on two animals walking as one. Dressed in bells and painted horns, they were counted as family, and the harvest was as much theirs as anyone's.",
  "cycle-rickshaw": "Cars and autos have taken over the street, and still he pedals on, the last of his trade. In all that rush, he keeps one gentler seat for anyone happy to ride slow.",
  "rickshaw-rest": "All a long day allows him is thodi der, a little while, crouched on the footboard with the bell loose in his fingers. For that little while, the street can wait.",
  "horse-cart-and-autorickshaw": "A tonga rarely left half empty, and strangers squeezed in shoulder to shoulder for the ride to the bazaar. The auto beside it will get there faster, but few rides since have felt this much like company.",
  "rickshaw-and-autorickshaw": "Not so long ago, one man's legs were enough to carry another across town. The auto has already pulled up beside him, and I have kept him on the canvas a little longer, so the strength he spent is remembered.",
  "terracotta-pots": "A copper kadhai was scrubbed bright after each meal and passed down from mother to daughter. Heaped together here, they hold the glow of a family's kitchen, from festival halwa to a weekday sabzi.",
  "weathered-door-ring": "The little barred window let a house see who had come before it opened up. Lift the ring and let it fall, and someone inside who knows your knock is already on the way.",
  "red-and-teal-door-lock": "Someone locked this door and walked away meaning to return. The rust shows how long it has been, and the lock shows how faithfully it has waited.",
  "teal-door-bolt": "Whoever left last slid the bolt and then added a padlock, the way you lock up a home you love before a long journey. Two locks on one door say how much inside was worth coming back to.",
  "carved-door-knocker": "A heart for a handle and flowers for studs. This door was made to say come in.",
  "monks-and-blue-buddha": "These young monks are still learning to meditate, one with his eyes shut and another following the words on his page. Above them the Buddha's face shows where the path leads, a calm they have a lifetime to reach.",
  "monk-and-green-buddha": "He brings everything he carries to prayer, his face pressed into his hands. Before him the Buddha raises a calm palm, as if to say he may set it all down here.",
  "offering-of-light": "Vakratunda mahakaya is the prayer to Ganesh said before anything new begins. It suits a boy at the start of his own life, holding his small flame up to the words with complete trust.",
  "prayer-and-scripture": "He knows these words better than his own name. Sitting before them, he asks once more for the light they promise.",
  "priest-with-flame": "As the aarti bell begins to ring, one man raises the flame, and a whole crowd prays through his hands. This painting honours a devotion he renews each dusk, on behalf of all who gather.",
  "sacred-tree": "A mannat is a wish tied to a sacred tree with a thread and a prayer. Round this peepal, the hopes of strangers have wound into one strong band, and the old tree carries them all.",
  "newspaper-reader": "For his generation the morning paper was a ritual of its own, read in full while the day waited. The tilak from his puja is fresh, and he gives the news the same unhurried care.",
  "elder-woman-portrait": "Sabr means patience, the quiet kind that holds a family together through decades and never asks for thanks. This portrait offers that gratitude, long overdue.",
  "red-turban-portrait": "Muskaan means a smile, and his is the private kind, head bowed and eyes crinkled at something only he has heard. A moment like this is gone in a breath, and here it stays long enough for us to smile back.",
  "yellow-turban-portrait": "Pride like his is earned the hard way, and the years have written it across his brow. Under the yellow turban he holds his head high and meets our eyes as an equal.",
  "patterned-turban-portrait": "On a face like his, worry is mostly for others, a son far from home or a crop still waiting for rain. Look again and it turns out to be love, the kind that keeps watch.",
  "mother-and-child": "Aanchal is the edge of a mother's sari, the first shelter a child ever knows. With his hand on her arm, he can look the whole world straight in the eye.",
  "boy-and-kettle": "For many boys like him, bachpan meant a tea stall instead of a classroom. Chin in hand, waiting for the kettle, he is still a child, dreaming somewhere far from the stove.",
  "man-among-metal-pans": "He has set his iron pans out in a ring and sat down among them to wait for the day's first buyer. The pans are empty, and the hope is not.",
  "three-veiled-women": "These three keep their modesty together, veils drawn close and faces turned in. The world sees only the silver at their wrists, and whatever they are sharing stays among the three of them.",
  "milkman-on-bicycle": "Long before the lane was awake, he was out on his bicycle with the morning's milk. The street had its tea because he rose first.",
  "riverside-figures": "By evening the ghat slows, and people settle on its steps under the cane umbrellas to let the day go. The river has watched this rest for centuries, and it makes room for anyone who sits.",
  "child-among-flowers": "Something has made her giggle, or blush, and a hand over her mouth is all the hiding she knows yet. The bougainvillea around her is as bright and unguarded as she is.",
  "woman-with-poppies": "Her eyes have drifted far beyond the poppies crowding round her, into a dream of her own. Whatever she sees there has softened her face.",
  "temple-bells": "Every thread tied to these rails is a wish, and every bell is the gratitude of someone whose wish was granted. What this painting holds is a faith that bears no names, one longing shared by all and a chime of thanks that rings out for everyone.",
  "woman-with-bird": "A bird calls at her shoulder with its beak wide open, and she does not turn her head. She is at peace with her thoughts, and the bird can call as long as it likes.",
  "woman-with-red-flower": "She rests a fingertip below one eye, holding a thought she is keeping to herself for now. The red flower at her lips will say it for her when she is ready.",
  "boy-with-bananas": "The bananas sit on his head like a crown, and he knows it. There is no prouder walk than a child carrying something home for the family.",
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
    line: "A spring in full bloom, and the faraway look we all wear when our mind is somewhere else.",
    hero: "boy-with-bananas",
    held: "Spring comes into flower, and the day goes on beneath it, a chore here and a daydream there, as innocent as ever.",
    intro: [
      "Most of us remember a spring afternoon when everything around us was in flower and our mind was somewhere else entirely. I painted Bahaar from that distance, the season at its loudest around people who have gone somewhere of their own, where no blossom can follow.",
    ],
    chapters: [
      { title: "Under Canopy of Greens", works: ["boy-with-bananas"], room: true,
        big: "Childhood hides nothing, and its happiness is there for anyone who looks." },
      { title: "Blooming Innocence", works: ["child-among-flowers"], room: true,
        big: "She keeps her first secret behind one small hand, and the whole bougainvillea leans in to hear it." },
      { title: "Petals of Thought", works: ["woman-with-red-flower"],
        big: "Some feelings arrive before there are words for them, and wait unsaid, close enough to touch." },
      { title: "Whispers of Stillness", works: ["woman-with-bird"], room: true, dark: true,
        big: "Later still, the mind learns to make its own silence, even with everything singing round it." },
      { title: "Khwaab", works: ["woman-with-poppies"],
        big: "Last comes the dream, the longest of our private conversations, and the garden is left outside it." },
    ],
  },
  {
    slug: "bandh-darwaze", label: "Bandh Darwaze", period: "2018",
    line: "Old doors pulled shut, waiting the way we all have waited for someone to come home.",
    hero: "red-and-teal-door-lock",
    held: "Every shut door is a house holding its breath for the hand that will open it.",
    intro: [
      "In the old lanes of India, a shut door told you that the house was waiting. These four have waited through years of sun and rain, some for a knock and some for a key, and what they keep is the simple hope that someone will open them again.",
    ],
    chapters: [
      { title: "Someone may be home", works: ["weathered-door-ring", "carved-door-knocker"], dark: true,
        big: "No padlock hangs on these two from the lane side. Someone is home, and a knock will bring them to the door." },
      { title: "Gone for now", works: ["red-and-teal-door-lock", "teal-door-bolt"],
        big: "The rust has had years, and the promise a family made when it locked these doors still holds." },
    ],
  },
  {
    slug: "gone-are-the-days", label: "Gone Are The Days", period: "2007 to 2018",
    line: "The tongas and bullock carts a city once ran on, before we learned to hurry past the ordinary.",
    hero: "bulls-and-wheel",
    held: "The last tonga left without a goodbye, and a whole way of life went with it.",
    intro: [
      "There was a time when the morning came to the door on a bicycle and getting anywhere meant a bullock cart or a tonga at a trot. A whole city ran on daily toil then, counted out in paise from the first cup of chai to the evening show. These paintings are a tribute to those years and to the hands that carried them.",
    ],
    chapters: [
      { title: "What a day was worth", works: ["rickshaw-puller-and-coin", "rickshaw-rest-framed", "coins-and-clay-bank", "terracotta-pots"],
        big: "What we call loose change is someone's hard-earned pride, every coin a hope for tomorrow.",
        small: "These paintings honour that toil, the honest hours a family gave, day after day, so their children might have more." },
      { title: "Side by side", works: ["bulls-and-wheel"], room: true, dark: true,
        big: "Two bullocks shared the road's hardest loads, pulling as one, and the bells and painted horns were a family's thanks." },
      { title: "When the engines came", works: ["carriage-and-autorickshaw", "bullock-cart-and-truck", "horse-cart-and-autorickshaw", "rickshaw-and-autorickshaw", "cycle-rickshaw"],
        big: "Then came the engines, and for a few years the old pace and the new shared the same street.",
        small: "Here that slower world gets the farewell it never had." },
      { title: "Dawn to dusk", works: ["milkman-on-bicycle", "newspaper-reader", "boy-and-kettle", "rickshaw-rest", "man-among-metal-pans", "riverside-figures"], dark: true,
        big: "From the milk round at first light to the ghat steps at dusk, the day had its slow hours, and people found their peace in them." },
      { title: "Two ways out", works: ["postbox-and-stamps", "mother-india-and-kettles", "shree-420-and-milk-cans"],
        big: "A letter home and an evening at the pictures were how a working street travelled.",
        small: "Both went further than any fare ever could." },
    ],
  },
  {
    slug: "portraits", label: "Portraits", period: "2007 to 2012",
    line: "A handful of faces, each holding a feeling we all know well and rarely stop to see.",
    hero: "three-veiled-women",
    held: "A stranger's worry, held still long enough, turns out to be our own.",
    intro: [
      "We pass faces like these every day, at a bus stop or on a temple step, and never look twice. This collection stops and looks, and in each stranger, from an old woman's patience to a boy holding his mother's arm, it finds a feeling we know as our own.",
    ],
    chapters: [
      { title: "Four feelings", works: ["elder-woman-portrait", "red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait"],
        setup: "Sabr is patience, Muskaan a smile, Garv pride and Fikr worry.",
        big: "A lifetime leaves one feeling on a person more clearly than the rest, and each portrait here is named for it." },
      { title: "Together", works: ["three-veiled-women", "mother-and-child"], room: true,
        big: "Not every feeling belongs to one person, and the gentlest live between us." },
    ],
  },
  {
    slug: "faith", label: "Faith", period: "2007 to 2026",
    line: "The daily prayers of Indian homes and temples, a devotion we all grew up inside.",
    hero: "offering-of-light",
    held: "We stand behind them at prayer and find we have known the words all our lives.",
    intro: [
      "Long before we understood a word of it, most of us knew the sound of a prayer said at dawn in the homes we grew up in. These paintings go back to that sound and find, in strangers bowed before their gods, a devotion we still know by heart.",
    ],
    chapters: [
      { title: "The written prayer", works: ["offering-of-light", "prayer-and-scripture"],
        big: "A prayer starts out written on a wall, and after enough mornings it lives in the one who says it." },
      { title: "Stillness", works: ["monks-and-blue-buddha", "monk-and-green-buddha"], room: true, dark: true,
        big: "In time the reciting falls away, and what remains is a calm that takes a lifetime to reach." },
      { title: "Vows and thanks", works: ["priest-with-flame", "sacred-tree", "temple-bells"],
        big: "A wish is tied on in hope and left to wait, and when it comes true, someone always comes back to say thank you." },
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
  "ihc-room-a": "Aakhri Savaari, Dheere Dheere and Kadhai, India Habitat Centre",
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
    { src: "/site/video/tv-archive-2.mp4", poster: "/site/video/tv-archive-2.jpg", title: "On television · June 2010",
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

export const RECORD_LINE = "From the first show to the latest";

export const PORTRAIT = "/site/dolly.jpg";
export const PORTRAIT_LARGE = "/site/ex/kala-dolly.jpg";

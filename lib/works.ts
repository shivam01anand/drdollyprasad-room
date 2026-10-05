/**
 * The catalogue, once.
 *
 * Titles are hers where she has given them and working titles otherwise.
 * Sizes appear ONLY where she has stated them; everything else is unknown
 * and renders as unknown. Status is the "Available" / "Sold" sorting from
 * her own site, plus what she has offered since (Sacred Fragments, Oct 2026);
 * a recent work with no known status reads "Enquire".
 */

export type Status = "Available" | "Sold" | "Enquire";

export type Work = {
  id: string;
  title: string;
  series: string;
  year?: string;
  medium: string;
  /** her stated size, as she gives it */
  size?: string;
  /** longest side in inches, only when stated — drives the true-scale hang */
  inches?: number;
  status: Status;
};

const OIL = "Oil on canvas";

const W = (id: string, title: string, series: string, status: Status, extra: Partial<Work> = {}): Work =>
  ({ id, title, series, status, medium: OIL, ...extra });

export const WORKS: Work[] = [
  // Gone Are The Days — c. 2016–2018
  W("rickshaw-puller-and-coin", "Twenty Paise", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("carriage-and-autorickshaw", "Gone Are The Days [A]", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("bullock-cart-and-truck", "Gone Are The Days [B]", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("rickshaw-rest-framed", "The Cart-Man and the Rupaya", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("coins-and-clay-bank", "The Matka and the Coins", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("postbox-and-stamps", "Patra Petika", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("mother-india-and-kettles", "Mother India", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("shree-420-and-milk-cans", "Shree 420", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("bulls-and-wheel", "The Bullocks", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("cycle-rickshaw", "The Cycle Rickshaw-wala", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("rickshaw-rest", "The Rickshaw-wala Resting", "Gone Are The Days", "Sold", { year: "c. 2016–2018" }),
  W("horse-cart-and-autorickshaw", "Small Panel I", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("rickshaw-and-autorickshaw", "Small Panel II", "Gone Are The Days", "Available", { year: "c. 2016–2018" }),
  W("terracotta-pots", "Terracotta", "Gone Are The Days", "Available", { year: "2015" }),
  // Bandh Darwaze — 2018, one foot square
  W("weathered-door-ring", "Bandh Darwaze I", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("red-and-teal-door-lock", "Bandh Darwaze II", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("teal-door-bolt", "Bandh Darwaze III", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("carved-door-knocker", "Bandh Darwaze IV", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  // Faith — c. 2005–2015
  W("monks-and-blue-buddha", "The Blue Buddha", "Faith", "Available", { year: "c. 2005–2015" }),
  W("monk-and-green-buddha", "Buddha Under the Bodhi Tree", "Faith", "Available", { year: "c. 2005–2015" }),
  W("offering-of-light", "Vakratunda", "Faith", "Sold", { year: "c. 2005–2015" }),
  W("prayer-and-scripture", "Gayatri", "Faith", "Sold", { year: "c. 2005–2015" }),
  W("priest-with-flame", "The Aarti", "Faith", "Sold", { year: "c. 2005–2015" }),
  W("sacred-tree", "The Peepal Shrine", "Faith", "Sold", { year: "c. 2005–2015" }),
  W("newspaper-reader", "The Newspaper Reader", "Faith", "Sold", { year: "c. 2005–2015" }),
  // Portraits — c. 2005–2015
  W("elder-woman-portrait", "Portrait I — The Elder Woman", "Portraits", "Available", { year: "c. 2005–2015", size: "30 in", inches: 30 }),
  W("red-turban-portrait", "Portrait II — The Red Turban", "Portraits", "Available", { year: "c. 2005–2015", size: "30 in", inches: 30 }),
  W("yellow-turban-portrait", "The Yellow Turban", "Portraits", "Available", { year: "c. 2005–2015" }),
  W("patterned-turban-portrait", "The Lattice Turban", "Portraits", "Available", { year: "c. 2005–2015" }),
  W("mother-and-child", "Mother and Son", "Portraits", "Available", { year: "c. 2005–2015" }),
  W("boy-and-kettle", "The Chai Boy", "Portraits", "Sold", { year: "c. 2005–2015" }),
  W("man-among-metal-pans", "The Kadhai Seller", "Portraits", "Sold", { year: "c. 2005–2015" }),
  W("three-veiled-women", "Three Women in Red", "Portraits", "Sold", { year: "c. 2005–2015" }),
  W("milkman-on-bicycle", "The Doodhwala", "Portraits", "Sold", { year: "c. 2005–2015" }),
  W("riverside-figures", "The Boatmen", "Portraits", "Sold", { year: "c. 2005–2015" }),
  // Recent work — 2024–, her own titles
  W("child-among-flowers", "Blooming Innocence", "Recent work", "Available", { year: "2024" }),
  W("woman-with-poppies", "Woman with Poppies", "Recent work", "Available", { year: "2024" }),
  // both offered at Sacred Fragments, New Delhi, 18–21 Oct 2026
  W("temple-bells", "Threads of Faith", "Recent work", "Available", { year: "2026", size: "36 × 30 in", inches: 36 }),
  W("woman-with-bird", "Whispers of Stillness", "Recent work", "Sold", { year: "2024", size: "24 × 24 in", inches: 24 }),
  W("woman-with-red-flower", "Petals of Thought", "Recent work", "Enquire",
    { year: "2024", size: "24 × 24 in", inches: 24, medium: "Oil and pastel on canvas" }),
  W("boy-with-bananas", "Under Canopy of Greens", "Recent work", "Available", { year: "2025", size: "36 × 36 in", inches: 36 }),
];

export const BY_ID = new Map(WORKS.map((w) => [w.id, w]));

export const SERIES: { label: string; note: string }[] = [
  { label: "Gone Are The Days", note: "c. 2016–2018 · oil on canvas" },
  { label: "Bandh Darwaze", note: "Closed Doors · 2018 · 1 × 1 ft each" },
  { label: "Faith", note: "c. 2005–2015" },
  { label: "Portraits", note: "c. 2005–2015" },
  { label: "Recent work", note: "2024– · her own titles" },
];

/** the featured row, in hanging order; the large files exist for these */
export const FEATURED = [
  "temple-bells", "rickshaw-puller-and-coin", "boy-with-bananas", "red-and-teal-door-lock",
  "woman-with-bird", "terracotta-pots", "child-among-flowers", "boy-and-kettle",
  "woman-with-red-flower", "man-among-metal-pans", "mother-india-and-kettles",
];

/** the works with an 1800 px file in /art/large — the lightbox upgrades to it */
export const LARGE = new Set([
  ...FEATURED, "bullock-cart-and-truck", "weathered-door-ring", "teal-door-bolt", "carved-door-knocker",
]);

export const EMAIL = "drdollyprasad@gmail.com";
export const INSTAGRAM = { handle: "@dolly.creates", url: "https://www.instagram.com/dolly.creates/" };

export const enquiry = (w: Work) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`Enquiry: ${w.title}`)}`;

/** a painting's title as it is shown: in quotation marks */
export const quoted = (title: string) => `“${title}”`;

/** a caption's second line: her stated size and the year, where known */
export const details = (w: Work) => [w.size, w.year].filter(Boolean).join(" · ");

/** the status as a caption states it; a sold work also carries the gallery's red dot */
export const statusLabel = (w: Work) => (w.status === "Enquire" ? "On enquiry" : w.status);

/** what the status pill says */
export const pill = (w: Work) => (w.status === "Enquire" ? "Enquire ↗" : w.status);

/**
 * The catalogue, once.
 *
 * Titles are hers where she has given them and working titles otherwise.
 * Sizes appear ONLY where they are confirmed; everything else is unknown
 * and renders as unknown. Sizes are height × width. (18 Oct 2026: doors are
 * 12 × 12 in; Elder Woman and Red Turban 30 × 30 in; Vakratunda and Gayatri
 * 48 × 30 in; Cart-Man, Mother India, Shree 420 and Mother and Son on request
 * until their height and width are confirmed.) Status is the "Available" / "Sold" sorting from
 * her own site, plus what she has offered since (Sacred Fragments, Oct 2026);
 * a recent work with no known status reads "Enquire".
 */

import { dims } from "./images";

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

const CATALOGUE: Work[] = [
  // Gone Are The Days — 2016 to 2018
  W("rickshaw-puller-and-coin", "Twenty Paise", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("carriage-and-autorickshaw", "Gone Are The Days [A]", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("bullock-cart-and-truck", "Gone Are The Days [B]", "Gone Are The Days", "Available", { year: "2016 to 2018", size: "24 × 24 in", inches: 24 }),
  W("rickshaw-rest-framed", "The Cart-Man and the Rupaya", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("coins-and-clay-bank", "The Matka and the Coins", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("postbox-and-stamps", "Patra Petika", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("mother-india-and-kettles", "Mother India", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("shree-420-and-milk-cans", "Shree 420", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("bulls-and-wheel", "The Bullocks", "Gone Are The Days", "Available", { year: "2016 to 2018", size: "48 × 48 in", inches: 48 }),
  W("cycle-rickshaw", "The Cycle Rickshaw-wala", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("rickshaw-rest", "The Rickshaw-wala Resting", "Gone Are The Days", "Sold", { year: "2016 to 2018" }),
  W("horse-cart-and-autorickshaw", "Small Panel I", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("rickshaw-and-autorickshaw", "Small Panel II", "Gone Are The Days", "Available", { year: "2016 to 2018" }),
  W("terracotta-pots", "Terracotta", "Gone Are The Days", "Available", { year: "2015", size: "36 × 36 in", inches: 36 }),
  // Bandh Darwaze — 2018, one foot square
  W("weathered-door-ring", "Bandh Darwaze I", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("red-and-teal-door-lock", "Bandh Darwaze II", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("teal-door-bolt", "Bandh Darwaze III", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("carved-door-knocker", "Bandh Darwaze IV", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  // Faith — 2005 to 2015
  W("monks-and-blue-buddha", "The Blue Buddha", "Faith", "Available", { year: "2005 to 2015" }),
  W("monk-and-green-buddha", "Buddha Under the Bodhi Tree", "Faith", "Available", { year: "2005 to 2015" }),
  W("offering-of-light", "Vakratunda", "Faith", "Sold", { year: "2005 to 2015", size: "48 × 30 in", inches: 48 }),
  W("prayer-and-scripture", "Gayatri", "Faith", "Sold", { year: "2005 to 2015", size: "48 × 30 in", inches: 48 }),
  W("priest-with-flame", "The Aarti", "Faith", "Sold", { year: "2005 to 2015" }),
  W("sacred-tree", "The Peepal Shrine", "Faith", "Sold", { year: "2005 to 2015" }),
  W("newspaper-reader", "The Newspaper Reader", "Faith", "Sold", { year: "2005 to 2015" }),
  // Portraits — 2005 to 2015
  W("elder-woman-portrait", "The Elder Woman", "Portraits", "Available", { year: "2005 to 2015", size: "30 × 30 in", inches: 30 }),
  W("red-turban-portrait", "The Red Turban", "Portraits", "Available", { year: "2005 to 2015", size: "30 × 30 in", inches: 30 }),
  W("yellow-turban-portrait", "The Yellow Turban", "Portraits", "Available", { year: "2005 to 2015" }),
  W("patterned-turban-portrait", "The Lattice Turban", "Portraits", "Available", { year: "2005 to 2015" }),
  W("mother-and-child", "Mother and Son", "Portraits", "Available", { year: "2005 to 2015" }),
  W("boy-and-kettle", "The Chai Boy", "Portraits", "Sold", { year: "2005 to 2015" }),
  W("man-among-metal-pans", "The Kadhai Seller", "Portraits", "Sold", { year: "2005 to 2015" }),
  W("three-veiled-women", "Three Women in Red", "Portraits", "Sold", { year: "2005 to 2015" }),
  W("milkman-on-bicycle", "The Doodhwala", "Portraits", "Sold", { year: "2005 to 2015" }),
  W("riverside-figures", "The Boatmen", "Portraits", "Sold", { year: "2005 to 2015" }),
  // Onset of Spring — 2024 to 2026, her own titles
  W("child-among-flowers", "Blooming Innocence", "Onset of Spring", "Available", { year: "2024" }),
  W("woman-with-poppies", "Woman with Poppies", "Onset of Spring", "Available", { year: "2024" }),
  // both offered at Sacred Fragments, New Delhi, 18 to 21 Oct 2026
  W("temple-bells", "Threads of Faith", "Onset of Spring", "Available", { year: "2026", size: "36 × 30 in", inches: 36 }),
  W("woman-with-bird", "Whispers of Stillness", "Onset of Spring", "Sold", { year: "2024", size: "24 × 24 in", inches: 24 }),
  W("woman-with-red-flower", "Petals of Thought", "Onset of Spring", "Enquire",
    { year: "2024", size: "24 × 24 in", inches: 24, medium: "Oil and pastel on canvas" }),
  W("boy-with-bananas", "Under Canopy of Greens", "Onset of Spring", "Available", { year: "2025", size: "36 × 36 in", inches: 36 }),
];

/**
 * MISSING SIZES (Shubham, 19 Oct 2026, 01:16; the COO adds "approx." until confirmed).
 * A painting with no stated size is shown by the shape of its photograph:
 *   tall rectangle  -> "approx. 48 × 36 in"   (height × width)
 *   landscape       -> "approx. 36 × 48 in"
 *   square          -> left blank
 * Confirmed sizes are never touched. `inches` stays unset, so an approximate size never
 * drives the true-scale hang or the S / M / L filter. Every id changed is listed in
 * qa-shots/v5/DIMENSIONS.md; replace the entry with her real size when she confirms it.
 */
// 20 Oct 2026 (Shubham): no guessed sizes on the site. A painting shows a size only when it is
// confirmed; the shape-based "approx." sizes are retired. (dims kept imported for other callers.)
const shapeSize = (w: Work): Work => w;
void dims;

export const WORKS: Work[] = CATALOGUE.map(shapeSize);

export const BY_ID = new Map(WORKS.map((w) => [w.id, w]));

export const SERIES: { label: string; note: string }[] = [
  { label: "Gone Are The Days", note: "2016 to 2018 · oil on canvas" },
  { label: "Bandh Darwaze", note: "Closed Doors · 2018 · 12 × 12 in each" },
  { label: "Faith", note: "2005 to 2015" },
  { label: "Portraits", note: "2005 to 2015" },
  { label: "Onset of Spring", note: "2024 to 2026 · her own titles" },
];

/** the featured row, in hanging order; the large files exist for these */
export const FEATURED = [
  "woman-with-poppies", "temple-bells", "bulls-and-wheel", "boy-with-bananas",
  "monk-and-green-buddha", "woman-with-bird", "three-veiled-women", "child-among-flowers",
  "shree-420-and-milk-cans", "woman-with-red-flower", "monks-and-blue-buddha", "terracotta-pots",
];

/** the works with a file larger than /art/works (up to 1800 px) in /art/large — the lightbox upgrades to it */
export const LARGE = new Set([
  ...FEATURED, "rickshaw-puller-and-coin", "red-and-teal-door-lock", "boy-and-kettle", "man-among-metal-pans",
  "mother-india-and-kettles", "bullock-cart-and-truck", "weathered-door-ring", "teal-door-bolt", "carved-door-knocker",
  "rickshaw-rest-framed", "coins-and-clay-bank", "cycle-rickshaw", "rickshaw-rest", "offering-of-light", "priest-with-flame",
  "sacred-tree", "newspaper-reader", "red-turban-portrait", "yellow-turban-portrait", "patterned-turban-portrait",
]);

/** her exhibition, while it is on: her words as the Threads of Faith chapter gives them, and the
 *  works she is showing there */
export const SHOW = {
  line: "Showing at Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre, New Delhi, 18 to 21 October 2026.",
  until: "2026-10-21",
  works: ["temple-bells", "boy-with-bananas"],
};

export const SITE = "https://drdollyprasad.com";

/** a painting's own page */
export const workPath = (id: string) => `/work/${id}`;

/** her stated size as width and height in inches, when she gives both */
/** the two stated numbers, in the order given, plus width and height read
 *  against the photograph's own shape (the longer side gets the larger number) */
export const inchDims = (w: Work, photo?: { w: number; h: number }) => {
  const m = w.size?.match(/^(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)\s*in$/);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  const big = Math.max(a, b), small = Math.min(a, b);
  const landscape = photo ? photo.w >= photo.h : a <= b;
  return { a, b, width: landscape ? big : small, height: landscape ? small : big };
};

export const EMAIL = "drdollyprasad@gmail.com";
export const INSTAGRAM = { handle: "@dolly.creates", url: "https://www.instagram.com/dolly.creates/" };

/** a mail to her about one work, naming it and linking its page, so she knows which it is */
export const enquiry = (w: Work) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`Enquiry: ${w.title}`)}&body=${encodeURIComponent(
    `Hello Dr Prasad,\n\nI saw ${quoted(w.title)} on your website and would like to know more about it.\n\n${SITE}${workPath(w.id)}\n`)}`;

/** a painting's title as it is shown: in quotation marks */
export const quoted = (title: string) => `“${title}”`;

/** a caption's second line: her stated size and the year, where known */
export const details = (w: Work) => [w.size, w.year].filter(Boolean).join(" · ");

/** the status as a caption states it; a sold work also carries the gallery's red dot */
export const statusLabel = (w: Work) => (w.status === "Enquire" ? "On enquiry" : w.status);

/** what the status pill says */
export const pill = (w: Work) => (w.status === "Enquire" ? "Enquire ↗" : w.status);

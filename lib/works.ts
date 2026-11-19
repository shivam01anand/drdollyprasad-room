/**
 * The catalogue, once.
 *
 * Titles, series, sizes and years follow the dolly-engine knowledge base
 * (kb/paintings.json), all confirmed by Shubham on 18 Nov 2026. Instagram keeps
 * the older titles on posts already live; the website uses these.
 * Sizes appear ONLY where they are confirmed; everything else is unknown
 * and renders as unknown. Sizes are height × width. Status is the "Available" / "Sold" sorting from
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
  // Gone Are The Days: 2010 to 2018
  W("rickshaw-puller-and-coin", "Twenty Paise", "Gone Are The Days", "Available", { year: "2016", size: "48 × 36 in", inches: 48 }),
  W("carriage-and-autorickshaw", "Aakhri Savaari", "Gone Are The Days", "Available", { year: "2016", size: "24 × 24 in", inches: 24 }),
  W("bullock-cart-and-truck", "Dheere Dheere", "Gone Are The Days", "Available", { year: "2016", size: "24 × 24 in", inches: 24 }),
  W("rickshaw-rest-framed", "Ek Rupaya", "Gone Are The Days", "Available", { year: "2016", size: "48 × 36 in", inches: 48 }),
  W("coins-and-clay-bank", "Gullak", "Gone Are The Days", "Available", { year: "2010", size: "36 × 36 in", inches: 36 }),
  W("postbox-and-stamps", "Patra Petika", "Gone Are The Days", "Available", { year: "2017", size: "48 × 36 in", inches: 48 }),
  W("mother-india-and-kettles", "Mother India", "Gone Are The Days", "Available", { year: "2017", size: "48 × 36 in", inches: 48 }),
  W("shree-420-and-milk-cans", "Shree 420", "Gone Are The Days", "Available", { year: "2017", size: "48 × 36 in", inches: 48 }),
  W("bulls-and-wheel", "The Bullocks", "Gone Are The Days", "Available", { year: "2010", size: "48 × 48 in", inches: 48 }),
  W("cycle-rickshaw", "Last of the Pedals", "Gone Are The Days", "Available", { year: "2018", size: "36 × 48 in", inches: 48 }),
  W("rickshaw-rest", "Thodi Der", "Gone Are The Days", "Sold", { year: "2018", size: "36 × 36 in", inches: 36 }),
  W("horse-cart-and-autorickshaw", "A Ride Together", "Gone Are The Days", "Available", { year: "2016", size: "24 × 24 in", inches: 24 }),
  W("rickshaw-and-autorickshaw", "Guzra Zamana", "Gone Are The Days", "Available", { year: "2016", size: "24 × 24 in", inches: 24 }),
  W("terracotta-pots", "Mitti", "Gone Are The Days", "Available", { year: "2015", size: "36 × 36 in", inches: 36 }),
  // Bandh Darwaze: 2018, one foot square
  W("weathered-door-ring", "Bandh Darwaze I", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("red-and-teal-door-lock", "Bandh Darwaze II", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("teal-door-bolt", "Bandh Darwaze III", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  W("carved-door-knocker", "Bandh Darwaze IV", "Bandh Darwaze", "Available", { year: "2018", size: "12 × 12 in", inches: 12 }),
  // Faith: 2007 to 2014
  W("monks-and-blue-buddha", "Dhyan", "Faith", "Available", { year: "2010", size: "36 × 48 in", inches: 48 }),
  W("monk-and-green-buddha", "Sharan", "Faith", "Available", { year: "2014", size: "48 × 36 in", inches: 48 }),
  W("offering-of-light", "Vakratunda", "Faith", "Sold", { year: "2011", size: "48 × 36 in", inches: 48 }),
  W("prayer-and-scripture", "Gayatri", "Faith", "Sold", { year: "2011", size: "48 × 36 in", inches: 48 }),
  W("priest-with-flame", "Aarti", "Faith", "Sold", { year: "2012", size: "48 × 36 in", inches: 48 }),
  W("sacred-tree", "Mannat", "Faith", "Sold", { year: "2007", size: "48 × 48 in", inches: 48 }),
  W("newspaper-reader", "Morning Ritual", "Gone Are The Days", "Sold", { year: "2010", size: "36 × 36 in", inches: 36 }),
  // Portraits: 2007 to 2012
  W("elder-woman-portrait", "Sabr", "Portraits", "Available", { year: "2012", size: "30 × 30 in", inches: 30 }),
  W("red-turban-portrait", "Muskaan", "Portraits", "Available", { year: "2012", size: "30 × 30 in", inches: 30 }),
  W("yellow-turban-portrait", "Garv", "Portraits", "Available", { year: "2012", size: "30 × 30 in", inches: 30 }),
  W("patterned-turban-portrait", "Fikr", "Portraits", "Available", { year: "2012", size: "30 × 30 in", inches: 30 }),
  W("mother-and-child", "Aanchal", "Portraits", "Available", { year: "2011", size: "48 × 36 in", inches: 48 }),
  W("boy-and-kettle", "Bachpan", "Gone Are The Days", "Sold", { year: "2010", size: "48 × 48 in", inches: 48 }),
  W("man-among-metal-pans", "Intezar", "Gone Are The Days", "Sold", { year: "2007", size: "36 × 48 in", inches: 48 }),
  W("three-veiled-women", "Lajja", "Portraits", "Sold", { year: "2007", size: "48 × 48 in", inches: 48 }),
  W("milkman-on-bicycle", "Before the Chai", "Gone Are The Days", "Sold", { year: "2010", size: "48 × 36 in", inches: 48 }),
  W("riverside-figures", "Evening at the Ghat", "Gone Are The Days", "Sold", { year: "2010", size: "30 × 36 in", inches: 36 }),
  // Bahaar: 2024 to 2026
  W("child-among-flowers", "Blooming Innocence", "Bahaar", "Available", { year: "2024", size: "36 × 48 in", inches: 48 }),
  W("woman-with-poppies", "Khwaab", "Bahaar", "Available", { year: "2024", size: "36 × 48 in", inches: 48 }),
  // both offered at Sacred Fragments, New Delhi, 18 to 21 Oct 2026
  W("temple-bells", "Threads of Faith", "Faith", "Available", { year: "2026", size: "30 × 36 in", inches: 36 }),
  W("woman-with-bird", "Whispers of Stillness", "Bahaar", "Sold", { year: "2024", size: "24 × 24 in", inches: 24 }),
  W("woman-with-red-flower", "Petals of Thought", "Bahaar", "Enquire",
    { year: "2024", size: "24 × 24 in", inches: 24, medium: "Oil and pastel on canvas" }),
  W("boy-with-bananas", "Under Canopy of Greens", "Bahaar", "Available", { year: "2025", size: "36 × 36 in", inches: 36 }),
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
// 20 Oct 2026 (Shubham, 02:37): he confirms these sizes; shown plainly, without "approx."
const shapeSize = (w: Work): Work => {
  if (w.size) return w;
  const d = dims(`/site/thumbs/${w.id}.jpg`);
  if (!d.width || !d.height) return w;
  const r = d.height / d.width;
  if (r > 1.1) return { ...w, size: "48 × 36 in" };
  if (r < 0.91) return { ...w, size: "36 × 48 in" };
  return w;
};

export const WORKS: Work[] = CATALOGUE.map(shapeSize);

export const BY_ID = new Map(WORKS.map((w) => [w.id, w]));

export const SERIES: { label: string; note: string }[] = [
  { label: "Gone Are The Days", note: "2007 to 2018 · oil on canvas" },
  { label: "Bandh Darwaze", note: "Closed Doors · 2018 · 12 × 12 in each" },
  { label: "Faith", note: "2007 to 2026" },
  { label: "Portraits", note: "2007 to 2012" },
  { label: "Bahaar", note: "2024 to 2025" },
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

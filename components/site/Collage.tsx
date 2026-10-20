import Link from "next/link";
import { BY_ID, workPath } from "@/lib/works";
import { LOOK, SERIES_PAGES, worksIn, ON_EXHIBITIONS, ON_THE_WORK, PRESS, PULL, SHOWS, SMALL_PHOTO, labelLine } from "@/lib/site";
import { dims, smSet } from "@/lib/images";
import { thumb } from "./Card";
import WallDrift from "./WallDrift";

/**
 * The moving wall: columns drifting slowly up and down (alternately) while the
 * whole wall eases left and right. It is made of framed paintings and a few
 * photographs from her exhibitions, nothing else, so the paintings stay the
 * loudest colour on the screen. The wall never stops under the cursor: the
 * painting under it turns over to show its label (the still tile holds the hover; only the card inside turns, so it can never stall edge-on), and an exhibition photograph
 * lifts a little. Each column holds its list twice, so it loops without a seam.
 * Every tile opens on a click or tap; the wall can be dragged by hand and picks
 * up its slow motion again after a moment (WallDrift, lib/drift).
 */

export type Item =
  | { k: "p"; id: string }
  | { k: "x"; src: string; eyebrow: string; title: string; sub: string; alt: string; href: string }
  | { k: "n"; em: string; title: string; sub: string; href: string; tone: "rust" | "dark" | "stone" }
  | { k: "c"; em: string; title: string; sub: string; href: string; tone: "white" | "indigo" }
  | { k: "s"; big: string; mid: string; small: string; href: string }
  | { k: "q"; text: string; by: string; href: string; hers: boolean };

export const P = (id: string): Item => ({ k: "p", id });
export const X = (src: string, eyebrow: string, title: string, sub: string, alt: string, href = "/exhibitions"): Item =>
  ({ k: "x", src, eyebrow, title, sub, alt, href });

/** a venue she has shown at (years from her own record, RECORD in lib/site) */
const V = (title: string, sub: string, tone: "rust" | "dark" | "stone", href = "#record"): Item => ({ k: "n", em: "Exhibited at", title, sub, href, tone });
/** a credential placard, like a museum wall label: a quiet line of fact, white or indigo. Only facts the repo records
 *  (lib/site SHOWS and RECORD): the venue, the show, the fair, the count of her record. */
const C = (em: string, title: string, sub: string, tone: "white" | "indigo", href: string): Item => ({ k: "c", em, title, sub, tone, href });
/** a number from her record */
const S = (big: string, mid: string, small: string, href = "#record"): Item => ({ k: "s", big, mid, small, href });
/** words: hers verbatim (in quote marks, with her name), or a short editorial line about a show */
const Q = (text: string, by: string, href: string, hers: boolean): Item => ({ k: "q", text, by, href, hers });
const lede = (id: string) => SHOWS.find((x) => x.id === id)?.lede.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".") ?? "";

export const HOME: Item[][] = [
  [P("bulls-and-wheel"), P("temple-bells"), P("red-turban-portrait"),
    X("/site/ex/ihc-01.jpg", "Exhibition · November 2010", "India Habitat Centre", "Open Palm Court, New Delhi", "Her paintings around the room at India Habitat Centre", "/exhibitions#india-habitat-centre-2010"),
    P("weathered-door-ring"), P("boy-and-kettle")],
  [P("woman-with-poppies"), P("mother-india-and-kettles"), P("priest-with-flame"), P("offering-of-light"), P("coins-and-clay-bank"), P("milkman-on-bicycle")],
  [X("/site/ex/iccr-sign.jpg", "Indian Council for Cultural Relations", "A Lifetime to Paint", "Azad Bhavan Art Gallery · June 2010", "The ICCR sign for A Lifetime to Paint", "/exhibitions#a-lifetime-to-paint"),
    P("boy-with-bananas"), P("red-and-teal-door-lock"), P("rickshaw-puller-and-coin"), P("patterned-turban-portrait"), P("woman-with-bird")],
  [P("three-veiled-women"), P("bullock-cart-and-truck"), P("monks-and-blue-buddha"),
    X("/site/ex/kala-dolly.jpg", "Art fair · February 2018", "First International Kala Mela", "IGNCA, New Delhi", "Dr Dolly Prasad beside her painting at the First International Kala Mela", "/exhibitions#kala-mela-2018"),
    P("terracotta-pots"), P("man-among-metal-pans")],
  [P("child-among-flowers"), P("postbox-and-stamps"),
    X("/site/ex/ihc-03.jpg", "Opening night · 2010", "Lighting the lamp", "India Habitat Centre", "Dr Dolly Prasad lights the lamp at her exhibition", "/exhibitions#india-habitat-centre-2010"),
    P("yellow-turban-portrait"), P("rickshaw-rest-framed"), P("prayer-and-scripture")],
  [P("shree-420-and-milk-cans"), P("teal-door-bolt"), P("woman-with-red-flower"), P("monk-and-green-buddha"),
    X("/site/ex/ihc-press-b.jpg", "In front of the cameras", "Beside The Bullocks", "India Habitat Centre · 2010", "Dr Dolly Prasad interviewed beside The Bullocks", "/exhibitions#india-habitat-centre-2010"),
    P("cycle-rickshaw")],
  [P("sacred-tree"), P("rickshaw-rest"), P("carriage-and-autorickshaw"), P("newspaper-reader"), P("mother-and-child"), P("carved-door-knocker")],
];

/** the mixed wall (Works, About): her paintings only */
export const MIXED_WALL: Item[][] = [
  [P("bulls-and-wheel"), P("coins-and-clay-bank"), P("cycle-rickshaw"), P("terracotta-pots"), P("postbox-and-stamps")],
  [P("red-and-teal-door-lock"), P("weathered-door-ring"), P("teal-door-bolt"), P("carved-door-knocker"), P("mother-india-and-kettles")],
  [P("offering-of-light"), P("monks-and-blue-buddha"), P("sacred-tree"), P("prayer-and-scripture"), P("priest-with-flame")],
  [P("red-turban-portrait"), P("three-veiled-women"), P("boy-and-kettle"), P("yellow-turban-portrait"), P("newspaper-reader")],
  [P("boy-with-bananas"), P("woman-with-bird"), P("woman-with-poppies"), P("child-among-flowers"), P("temple-bells")],
  [P("shree-420-and-milk-cans"), P("monk-and-green-buddha"), P("patterned-turban-portrait"), P("milkman-on-bicycle"), P("woman-with-red-flower")],
  [P("mother-and-child"), P("man-among-metal-pans"), P("rickshaw-puller-and-coin"), P("bullock-cart-and-truck"), P("carriage-and-autorickshaw")],
];

/** Collections (CR-007): one column per collection, led by its own label tile, then its paintings */
/** the tone cycle the exhibition wall uses by index (unchanged) */
const TONE_CYCLE = ["rust", "dark", "stone", "rust", "dark"] as const;
/** tones keyed by collection, so a reorder of SERIES_PAGES never recolours a tile (R4 B1-4) */
const TONES: Record<string, "rust" | "dark" | "stone"> = {
  "gone-are-the-days": "rust", "bandh-darwaze": "dark", faith: "stone", portraits: "rust", "recent-work": "dark",
};
export const SERIES_WALL: Item[][] = SERIES_PAGES.map((s) => [
  { k: "n", em: "Collection", title: s.label, sub: `${worksIn(s.label).length} works · ${s.period}`, href: `/series/${s.slug}`, tone: TONES[s.slug] ?? "rust" } as Item,
  ...worksIn(s.label).map((w) => P(w.id)),
]);

/** Works and About (CR-006): the same paintings, in another order, so every landing has its wall */
export const WORKS_WALL: Item[][] = [...MIXED_WALL].reverse().map((c) => [...c].reverse());
const ABOUT_BASE: Item[][] = [...MIXED_WALL.slice(3), ...MIXED_WALL.slice(0, 3)].map((c, i) => (i % 2 ? [...c].reverse() : c));
/** About: the same painting-heavy wall, with three placards (about one tile in twelve), quiet and spread across the columns */
const PLACARDS: [number, number, Item][] = [
  [1, 2, C("Exhibited at", "India Habitat Centre", "New Delhi", "white", "/exhibitions#india-habitat-centre-2010")],
  [3, 3, C("Her record", "Eighteen exhibitions and art fairs", "2005–2018", "indigo", "/exhibitions#record")],
  [5, 1, C("ICCR · June 2010", "A Lifetime to Paint", "Azad Bhavan Art Gallery, New Delhi", "white", "/exhibitions#a-lifetime-to-paint")],
];
export const ABOUT_WALL: Item[][] = ABOUT_BASE.map((col, i) => {
  const out = [...col];
  for (const [ci, at, it] of PLACARDS) if (ci === i) out.splice(at, 0, it);
  return out;
});

/**
 * Exhibitions: the shows in photographs, the press, her words on exhibiting and
 * short lines about each show, the venues by name and the numbers from her record.
 * Everything here is from the site's own records (lib/site: SHOWS, PRESS, RECORD).
 */
export const SHOW_WALL: Item[][] = SHOWS.map((sh, i) => [
  { k: "n", em: sh.when, title: sh.name ?? sh.title, sub: `${sh.venue}, ${sh.city}`, href: `#${sh.id}`, tone: TONE_CYCLE[i % TONE_CYCLE.length] } as Item,
  ...sh.albums.flatMap((al) => al.photos.map((ph) => X(ph.src, al.title, sh.title, sh.venue, ph.alt, `#${sh.id}`))),
  ...(sh.works ?? []).map((id) => P(id)),
]);

function Tile({ it }: { it: Item }) {
  if (it.k === "s") {
    return (
      <Link className="tile scard" href={it.href} tabIndex={-1}>
        <b>{it.big}</b><em>{it.mid}</em><small>{it.small}</small>
      </Link>
    );
  }
  if (it.k === "c") {
    return (
      <Link className={`tile ccard ${it.tone}`} href={it.href} tabIndex={-1}>
        <em>{it.em}</em><b>{it.title}</b><small>{it.sub}</small>
      </Link>
    );
  }
  if (it.k === "n") {
    return (
      <Link className={`tile ncard ${it.tone}`} href={it.href} tabIndex={-1}>
        <em>{it.em}</em><b>{it.title}</b><small>{it.sub}</small>
      </Link>
    );
  }
  if (it.k === "q") {
    return (
      <Link className={`tile qcard${it.hers ? " hers" : ""}`} href={it.href} tabIndex={-1}>
        <p>{it.hers ? `“${it.text}”` : it.text}</p>
        <small>{it.by}</small>
      </Link>
    );
  }
  if (it.k === "x") {
    return (
      <Link className="tile xcard" href={it.href} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.src} alt={it.alt} decoding="async" {...dims(it.src)} {...smSet(it.src)} />
        <div><em>{it.eyebrow}</em><b>{it.title}</b><small>{it.sub}</small></div>
      </Link>
    );
  }
  const w = BY_ID.get(it.id);
  if (!w || SMALL_PHOTO.has(w.id)) return null;
  // her words in quote marks; the observer's line without
  const line = PULL[w.id] ? `“${PULL[w.id]}”` : LOOK[w.id];
  return (
    <Link className="tile flip" href={workPath(w.id)} tabIndex={-1}>
      <span className="flipper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="framed" src={thumb(w.id)} alt={w.title} loading="eager" decoding="async" {...dims(thumb(w.id))} {...smSet(thumb(w.id))} />
        <span className="back">
          <em>{w.series}</em>
          <b>{w.title}</b>
          <small>{labelLine(w)}</small>
          {line && <i>{line}</i>}
          <span className="go">View the painting</span>
        </span>
      </span>
    </Link>
  );
}

/** every column holds its list REP times, so it is full at the start and loops without a seam, however tall the wall */
const repFor = (items: Item[]) => (items.length >= 8 ? 2 : 4);

/** every wall is seven columns wide, so a tile is the same size on every page (CR-008); a short wall repeats its columns, the repeats started half way down */
const WALL_COLS = 7;
const half = (items: Item[]) => [...items.slice(Math.ceil(items.length / 2)), ...items.slice(0, Math.ceil(items.length / 2))];

export function Wall({ columns, speed = 95 }: { columns: Item[][]; speed?: number }) {
  const all = Array.from({ length: Math.max(WALL_COLS, columns.length) }, (_, i) => (i < columns.length ? columns[i] : half(columns[i % columns.length])));
  return (
    <WallDrift n={all.length}>
      {all.map((items, i) => (
        <div key={i} data-rep={repFor(items)} className={`col${i % 2 ? " down" : ""}`} style={{ ["--dur" as string]: `${Math.round(speed * (1 + (i % 3) * 0.17))}s` }}>
          {Array.from({ length: repFor(items) }, () => items).flat().map((it, j) => <Tile key={j} it={it} />)}
        </div>
      ))}
    </WallDrift>
  );
}

export default function Collage() {
  return <Wall columns={HOME} />;
}

import Link from "next/link";
import { BY_ID, workPath } from "@/lib/works";
import { LINES, PULL, SERIES_PAGES, SMALL_PHOTO, labelLine, worksIn } from "@/lib/site";
import { thumb } from "./Card";

/**
 * The moving wall: columns drifting slowly up and down (alternately) while the
 * whole wall eases left and right. Framed paintings, title cards in the
 * Instagram manner, exhibition cards and short text cards. Each column holds
 * its list twice, so it loops without a seam.
 */

export type Item =
  | { k: "p"; id: string }
  | { k: "c"; id: string; line: string }
  | { k: "x"; src: string; eyebrow: string; title: string; sub: string; alt: string; href: string }
  | { k: "n"; title: string; sub: string; href: string; tone: "rust" | "dark" | "stone" }
  | { k: "s"; big: string; mid: string; small: string; href: string };

export const P = (id: string): Item => ({ k: "p", id });
export const C = (id: string): Item => ({ k: "c", id, line: PULL[id] ?? LINES[id] ?? "" });
export const X = (src: string, eyebrow: string, title: string, sub: string, alt: string, href = "/exhibitions"): Item =>
  ({ k: "x", src, eyebrow, title, sub, alt, href });
const S = (big: string, mid: string, small: string, href = "/exhibitions"): Item => ({ k: "s", big, mid, small, href });

/** a series' own card: its name, its period and how many works */
const N = (slug: string, tone: "rust" | "dark" | "stone"): Item => {
  const s = SERIES_PAGES.find((x) => x.slug === slug)!;
  return { k: "n", title: s.label, sub: `${s.period} · ${worksIn(s.label).length} works`, href: `/series/${slug}`, tone };
};

const EIGHTEEN = S("18", "Exhibitions and art fairs", "2005–2018 · Delhi, Jaipur, Bombay");
const WORLD = S("3", "Continents", "Private collections in India, the USA and London");

export const HOME: Item[][] = [
  [P("bulls-and-wheel"), C("temple-bells"), P("red-turban-portrait"),
    X("/site/ex/ihc-01.jpg", "Exhibition · November 2010", "India Habitat Centre", "Open Palm Court, New Delhi", "Her paintings around the room at India Habitat Centre", "/exhibitions#india-habitat-centre-2010"),
    P("weathered-door-ring"), P("boy-and-kettle")],
  [P("woman-with-poppies"), P("mother-india-and-kettles"), EIGHTEEN, P("offering-of-light"), C("coins-and-clay-bank"), P("milkman-on-bicycle")],
  [X("/site/ex/iccr-sign.jpg", "Indian Council for Cultural Relations", "A Lifetime to Paint", "Azad Bhavan Art Gallery · June 2010", "The ICCR sign for A Lifetime to Paint", "/exhibitions#a-lifetime-to-paint"),
    P("boy-with-bananas"), P("red-and-teal-door-lock"), P("rickshaw-puller-and-coin"), P("patterned-turban-portrait"), C("woman-with-bird")],
  [P("three-veiled-women"), C("bulls-and-wheel"), P("monks-and-blue-buddha"),
    X("/site/ex/kala-dolly.jpg", "Art fair · February 2018", "First International Kala Mela", "IGNCA, New Delhi", "Dr Dolly Prasad beside her painting at the First International Kala Mela", "/exhibitions#kala-mela-2018"),
    P("terracotta-pots"), P("man-among-metal-pans")],
  [P("child-among-flowers"), P("postbox-and-stamps"),
    X("/site/ex/ihc-03.jpg", "Opening night · 2010", "Lighting the lamp", "India Habitat Centre", "Dr Dolly Prasad lights the lamp at her exhibition", "/exhibitions#india-habitat-centre-2010"),
    P("yellow-turban-portrait"), C("boy-with-bananas"), P("prayer-and-scripture")],
  [P("shree-420-and-milk-cans"), P("teal-door-bolt"), C("woman-with-red-flower"), P("monk-and-green-buddha"),
    X("/site/ex/ihc-press-b.jpg", "In front of the cameras", "Beside The Bullocks", "India Habitat Centre · 2010", "Dr Dolly Prasad interviewed beside The Bullocks", "/exhibitions#india-habitat-centre-2010"),
    P("cycle-rickshaw")],
  [P("sacred-tree"), WORLD, P("carriage-and-autorickshaw"), C("temple-bells"), P("woman-with-bird"), P("carved-door-knocker")],
];

/** the series wall: each series' card among its own paintings */
export const SERIES_WALL: Item[][] = [
  [N("gone-are-the-days", "rust"), P("bulls-and-wheel"), P("coins-and-clay-bank"), P("cycle-rickshaw"), C("terracotta-pots")],
  [P("red-and-teal-door-lock"), N("bandh-darwaze", "dark"), P("weathered-door-ring"), P("teal-door-bolt"), P("carved-door-knocker")],
  [P("offering-of-light"), P("monks-and-blue-buddha"), N("faith", "stone"), P("sacred-tree"), P("prayer-and-scripture")],
  [N("portraits", "dark"), P("red-turban-portrait"), P("three-veiled-women"), P("boy-and-kettle"), P("yellow-turban-portrait")],
  [P("boy-with-bananas"), C("woman-with-bird"), N("recent-work", "rust"), P("woman-with-poppies"), P("child-among-flowers")],
  [P("shree-420-and-milk-cans"), N("faith", "stone"), P("monk-and-green-buddha"), P("patterned-turban-portrait"), P("postbox-and-stamps")],
  [P("temple-bells"), P("mother-india-and-kettles"), N("gone-are-the-days", "dark"), P("man-among-metal-pans"), P("woman-with-red-flower")],
];

/** the exhibitions wall: the shows in photographs, between cards naming them */
export const SHOW_WALL: Item[][] = [
  [X("/site/ex/ihc-03.jpg", "November 2010", "India Habitat Centre", "Open Palm Court, New Delhi", "Dr Dolly Prasad lights the lamp at the opening", "#india-habitat-centre-2010"),
    X("/site/ex/ihc-room-c.jpg", "On the wall", "The Bullocks", "India Habitat Centre", "The Bullocks on the exhibition wall", "#india-habitat-centre-2010"), EIGHTEEN],
  [X("/site/ex/iccr-speech.jpg", "June 2010", "A Lifetime to Paint", "ICCR, Azad Bhavan Art Gallery", "Dr Dolly Prasad speaks at the opening at ICCR", "#a-lifetime-to-paint"),
    X("/site/ex/kala-selfie.jpg", "February 2018", "Kala Mela", "IGNCA, New Delhi", "A visitor takes a selfie with the paintings at the Kala Mela", "#kala-mela-2018")],
  [X("/site/ex/ihc-press-a.jpg", "In front of the cameras", "The press", "India Habitat Centre · 2010", "Dr Dolly Prasad in conversation with a reporter", "#india-habitat-centre-2010"),
    WORLD, X("/site/ex/triveni-3.jpg", "May 2007", "Triveni Kala Sangam", "With Sangeeta Sharma", "The Triveni invitation", "#triveni-2007")],
  [X("/site/ex/kala-dolly.jpg", "February 2018", "First International Kala Mela", "IGNCA, New Delhi", "Dr Dolly Prasad beside her painting at the Kala Mela", "#kala-mela-2018"),
    X("/site/ex/ihc-05.jpg", "The evening", "Along the wall", "India Habitat Centre · 2010", "Visitors look along a wall of her paintings", "#india-habitat-centre-2010")],
  [X("/site/ex/iccr-02.jpg", "June 2010", "Beside The Blue Buddha", "ICCR, New Delhi", "Dr Dolly Prasad beside The Blue Buddha", "#a-lifetime-to-paint"),
    X("/site/video/tv-archive-2.jpg", "12 June 2010", "On NCR television", "From the archive", "A still from the NCR television report", "#on-screen"),
    X("/site/ex/ihc-room-e.jpg", "On the wall", "The Matka and the Coins", "India Habitat Centre", "The Matka and the Coins in its exhibition frame", "#india-habitat-centre-2010")],
  [X("/site/ex/ihc-08.jpg", "November 2010", "The Blue Buddha", "India Habitat Centre", "Dr Dolly Prasad beside The Blue Buddha", "#india-habitat-centre-2010"),
    X("/site/ex/delhi-times.jpg", "In the papers", "Delhi Times", "Art Today And Tomorrow", "A Delhi Times listing", "#on-screen")],
  [X("/site/ex/iccr-sign.jpg", "June 2010", "A Lifetime to Paint", "ICCR", "The ICCR sign for A Lifetime to Paint", "#a-lifetime-to-paint"),
    X("/site/ex/ihc-02.jpg", "Opening night", "The lamp is lit", "India Habitat Centre · 2010", "Visitors gathered around the lit lamp", "#india-habitat-centre-2010")],
];

function Tile({ it }: { it: Item }) {
  if (it.k === "s") {
    return (
      <Link className="tile scard" href={it.href} tabIndex={-1}>
        <b>{it.big}</b><em>{it.mid}</em><small>{it.small}</small>
      </Link>
    );
  }
  if (it.k === "n") {
    return (
      <Link className={`tile ncard ${it.tone}`} href={it.href} tabIndex={-1}>
        <em>Series</em><b>{it.title}</b><small>{it.sub}</small>
      </Link>
    );
  }
  if (it.k === "x") {
    return (
      <Link className="tile xcard" href={it.href} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.src} alt={it.alt} loading="lazy" decoding="async" />
        <div><em>{it.eyebrow}</em><b>{it.title}</b><small>{it.sub}</small></div>
      </Link>
    );
  }
  const w = BY_ID.get(it.id);
  if (!w || SMALL_PHOTO.has(w.id)) return null;
  if (it.k === "c") {
    return (
      <Link className="tile tcard" href={workPath(w.id)} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb(w.id)} alt={w.title} loading="lazy" decoding="async" />
        <b>{w.title}</b>
        <small>{labelLine(w)}</small>
        {it.line && <i>{PULL[w.id] ? `“${it.line}”` : it.line}</i>}
      </Link>
    );
  }
  return (
    <Link className="tile" href={workPath(w.id)} tabIndex={-1}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="framed" src={thumb(w.id)} alt={w.title} loading="lazy" decoding="async" />
    </Link>
  );
}

export function Wall({ columns, speed = 95 }: { columns: Item[][]; speed?: number }) {
  return (
    // the moving wall is decoration over real links elsewhere on the page; keyboard users skip it
    <div className="cols" aria-hidden="true" style={{ ["--n" as string]: columns.length }}>
      {columns.map((items, i) => (
        <div key={i} className={`col${i % 2 ? " down" : ""}`} style={{ ["--dur" as string]: `${Math.round(speed * (1 + (i % 3) * 0.17))}s` }}>
          {[...items, ...items].map((it, j) => <Tile key={j} it={it} />)}
        </div>
      ))}
    </div>
  );
}

export default function Collage() {
  return <Wall columns={HOME} />;
}

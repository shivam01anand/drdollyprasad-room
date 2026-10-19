import Link from "next/link";
import { BY_ID, workPath } from "@/lib/works";
import { LOOK, ON_EXHIBITIONS, ON_THE_WORK, PRESS, PULL, SHOWS, SMALL_PHOTO, labelLine } from "@/lib/site";
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
  | { k: "s"; big: string; mid: string; small: string; href: string }
  | { k: "q"; text: string; by: string; href: string; hers: boolean };

export const P = (id: string): Item => ({ k: "p", id });
export const X = (src: string, eyebrow: string, title: string, sub: string, alt: string, href = "/exhibitions"): Item =>
  ({ k: "x", src, eyebrow, title, sub, alt, href });

/** a venue she has shown at (years from her own record, RECORD in lib/site) */
const V = (title: string, sub: string, tone: "rust" | "dark" | "stone", href = "#record"): Item => ({ k: "n", em: "Exhibited at", title, sub, href, tone });
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

/** Collections: her paintings only, moving behind the page's card */
export const SERIES_WALL: Item[][] = [
  [P("bulls-and-wheel"), P("coins-and-clay-bank"), P("cycle-rickshaw"), P("terracotta-pots"), P("postbox-and-stamps")],
  [P("red-and-teal-door-lock"), P("weathered-door-ring"), P("teal-door-bolt"), P("carved-door-knocker"), P("mother-india-and-kettles")],
  [P("offering-of-light"), P("monks-and-blue-buddha"), P("sacred-tree"), P("prayer-and-scripture"), P("priest-with-flame")],
  [P("red-turban-portrait"), P("three-veiled-women"), P("boy-and-kettle"), P("yellow-turban-portrait"), P("newspaper-reader")],
  [P("boy-with-bananas"), P("woman-with-bird"), P("woman-with-poppies"), P("child-among-flowers"), P("temple-bells")],
  [P("shree-420-and-milk-cans"), P("monk-and-green-buddha"), P("patterned-turban-portrait"), P("milkman-on-bicycle"), P("woman-with-red-flower")],
  [P("mother-and-child"), P("man-among-metal-pans"), P("rickshaw-puller-and-coin"), P("bullock-cart-and-truck"), P("carriage-and-autorickshaw")],
];

/**
 * Exhibitions: the shows in photographs, the press, her words on exhibiting and
 * short lines about each show, the venues by name and the numbers from her record.
 * Everything here is from the site's own records (lib/site: SHOWS, PRESS, RECORD).
 */
export const SHOW_WALL: Item[][] = [
  [V("India Habitat Centre", "New Delhi · 2008, 2009, 2010", "rust", "#india-habitat-centre-2010"),
    X("/site/ex/ihc-03.jpg", "November 2010", "Lighting the lamp", "Open Palm Court, IHC", "Dr Dolly Prasad lights the lamp at the opening", "#india-habitat-centre-2010"),
    Q(lede("india-habitat-centre-2010"), "India Habitat Centre, 2010", "#india-habitat-centre-2010", false),
    X("/site/ex/ihc-room-c.jpg", "On the wall", "The Bullocks", "India Habitat Centre", "The Bullocks on the exhibition wall", "#india-habitat-centre-2010")],
  [S("18", "Exhibitions and art fairs", "2005 to 2018 · Delhi, Gurgaon, Jaipur, Bombay"),
    X("/site/ex/iccr-speech.jpg", "June 2010", "A Lifetime to Paint", "ICCR, Azad Bhavan Art Gallery", "Dr Dolly Prasad speaks at the opening at ICCR", "#a-lifetime-to-paint"),
    V("Nehru Art Gallery", "Bombay · 2006", "dark"),
    X("/site/ex/kala-selfie.jpg", "February 2018", "Kala Mela", "IGNCA, New Delhi", "A visitor takes a selfie with the paintings at the Kala Mela", "#kala-mela-2018")],
  [Q(ON_EXHIBITIONS, "Dr Dolly Prasad, on her exhibitions", "#a-lifetime-to-paint", true),
    X("/site/ex/ihc-press-a.jpg", "In front of the cameras", "The press", "India Habitat Centre · 2010", "Dr Dolly Prasad in conversation with a reporter", "#india-habitat-centre-2010"),
    V("Indian Council for Cultural Relations", "Azad Bhavan, New Delhi · 2010, 2011", "stone", "#a-lifetime-to-paint"),
    X("/site/ex/triveni-3.jpg", "May 2007", "Triveni Kala Sangam", "With Sangeeta Sharma", "The Triveni invitation", "#triveni-2007")],
  [X("/site/ex/kala-dolly.jpg", "February 2018", "First International Kala Mela", "IGNCA, New Delhi", "Dr Dolly Prasad beside her painting at the Kala Mela", "#kala-mela-2018"),
    Q(lede("kala-mela-2018"), "First International Kala Mela, 2018", "#kala-mela-2018", false),
    X("/site/ex/ihc-05.jpg", "The evening", "Along the wall", "India Habitat Centre · 2010", "Visitors look along a wall of her paintings", "#india-habitat-centre-2010"),
    V("Cabinet Secretariat Gallery", "Delhi · 2016", "rust")],
  [V("Triveni Kala Sangam", "Mandi House, New Delhi · 2007", "stone", "#triveni-2007"),
    X("/site/ex/delhi-times.jpg", "In the papers", "Delhi Times", "Must See, Must Do", PRESS.clipping.alt, "#on-screen"),
    Q(PRESS.clippingLine, "In the papers", "#on-screen", false),
    X("/site/ex/iccr-02.jpg", "June 2010", "Beside The Blue Buddha", "ICCR, New Delhi", "Dr Dolly Prasad beside The Blue Buddha", "#a-lifetime-to-paint")],
  [X("/site/video/tv-archive-2.jpg", "12 June 2010", "On NCR television", "In the news", "A still from the NCR television report", "#on-screen"),
    S("3", "Continents", "With private collectors in India, the USA and the UK"),
    X("/site/ex/ihc-08.jpg", "November 2010", "The Blue Buddha", "India Habitat Centre", "Dr Dolly Prasad beside The Blue Buddha", "#india-habitat-centre-2010"),
    V("International Art Fair", "Jaipur · 2018", "dark")],
  [V("Travancore Art Gallery", "New Delhi · 2006, 2007", "stone"),
    X("/site/ex/iccr-sign.jpg", "June 2010", "A Lifetime to Paint", "ICCR", "The ICCR sign for A Lifetime to Paint", "#a-lifetime-to-paint"),
    Q(ON_THE_WORK, "Dr Dolly Prasad, on her work", "/about", true),
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
        <img className="framed" src={thumb(w.id)} alt={w.title} loading="lazy" decoding="async" {...dims(thumb(w.id))} {...smSet(thumb(w.id))} />
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

export function Wall({ columns, speed = 95 }: { columns: Item[][]; speed?: number }) {
  return (
    <WallDrift n={columns.length}>
      {columns.map((items, i) => (
        <div key={i} className={`col${i % 2 ? " down" : ""}`} style={{ ["--dur" as string]: `${Math.round(speed * (1 + (i % 3) * 0.17))}s` }}>
          {[...items, ...items].map((it, j) => <Tile key={j} it={it} />)}
        </div>
      ))}
    </WallDrift>
  );
}

export default function Collage() {
  return <Wall columns={HOME} />;
}

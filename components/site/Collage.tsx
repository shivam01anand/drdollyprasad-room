import Link from "next/link";
import { BY_ID, workPath } from "@/lib/works";
import { LINES, PULL, SMALL_PHOTO, labelLine } from "@/lib/site";
import { thumb } from "./Card";

type Item =
  | { k: "p"; id: string }
  | { k: "c"; id: string; line: string }
  | { k: "x"; src: string; eyebrow: string; title: string; sub: string; alt: string }
  | { k: "s" };

const P = (id: string): Item => ({ k: "p", id });
const C = (id: string): Item => ({ k: "c", id, line: PULL[id] ?? LINES[id] ?? "" });
const X = (src: string, eyebrow: string, title: string, sub: string, alt: string): Item => ({ k: "x", src, eyebrow, title, sub, alt });

/** six columns drifting slowly, alternately up and down: framed paintings, title cards in the
 *  Instagram manner, and her exhibitions. Each column holds its list twice, so it loops. */
const COLUMNS: Item[][] = [
  [P("bulls-and-wheel"), C("temple-bells"), P("red-turban-portrait"),
    X("/site/ex/ihc-01.jpg", "Exhibition · November 2010", "India Habitat Centre", "Open Palm Court, New Delhi", "Her paintings around the room at India Habitat Centre"),
    P("weathered-door-ring"), P("boy-and-kettle")],
  [P("woman-with-poppies"), P("mother-india-and-kettles"), { k: "s" }, P("offering-of-light"), C("coins-and-clay-bank"), P("milkman-on-bicycle")],
  [X("/site/ex/iccr-sign.jpg", "Indian Council for Cultural Relations", "A Lifetime to Paint", "Azad Bhavan Art Gallery · June 2010", "The ICCR sign for A Lifetime to Paint"),
    P("boy-with-bananas"), P("red-and-teal-door-lock"), P("rickshaw-puller-and-coin"), P("patterned-turban-portrait"), C("woman-with-bird")],
  [P("three-veiled-women"), C("bulls-and-wheel"), P("monks-and-blue-buddha"),
    X("/site/ex/kala-dolly.jpg", "Art fair · February 2018", "First International Kala Mela", "IGNCA, New Delhi", "Dr Dolly Prasad beside her painting at the First International Kala Mela"),
    P("terracotta-pots"), P("man-among-metal-pans")],
  [P("child-among-flowers"), P("postbox-and-stamps"),
    X("/site/ex/ihc-03.jpg", "Opening night · 2010", "Lighting the lamp", "India Habitat Centre", "Dr Dolly Prasad lights the lamp at her exhibition"),
    P("yellow-turban-portrait"), C("boy-with-bananas"), P("prayer-and-scripture")],
  [P("shree-420-and-milk-cans"), P("teal-door-bolt"), C("woman-with-red-flower"), P("monk-and-green-buddha"),
    X("/site/ex/ihc-press-b.jpg", "In front of the cameras", "Beside The Bullocks", "India Habitat Centre · 2010", "Dr Dolly Prasad interviewed beside The Bullocks"),
    P("cycle-rickshaw")],
];

function Tile({ it }: { it: Item }) {
  if (it.k === "s") {
    return (
      <Link className="tile scard" href="/exhibitions" tabIndex={-1}>
        <b>18</b><em>Exhibitions and art fairs</em><small>2005–2018 · Delhi, Jaipur, Bombay</small>
      </Link>
    );
  }
  if (it.k === "x") {
    return (
      <Link className="tile xcard" href="/exhibitions" tabIndex={-1}>
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

export default function Collage({ speed = 95 }: { speed?: number }) {
  return (
    // the moving wall is decoration over real links elsewhere on the page; keyboard users skip it
    <div className="cols" aria-hidden="true">
      {COLUMNS.map((items, i) => (
        <div key={i} className={`col${i % 2 ? " down" : ""}`} style={{ ["--dur" as string]: `${Math.round(speed * (1 + (i % 3) * 0.17))}s` }}>
          {[...items, ...items].map((it, j) => <Tile key={j} it={it} />)}
        </div>
      ))}
    </div>
  );
}

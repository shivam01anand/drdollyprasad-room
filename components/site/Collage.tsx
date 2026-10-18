import Link from "next/link";
import { BY_ID, workPath } from "@/lib/works";
import { LOOK, PULL, SMALL_PHOTO, labelLine } from "@/lib/site";
import { dims } from "@/lib/images";
import { thumb } from "./Card";

/**
 * The moving wall: columns drifting slowly up and down (alternately) while the
 * whole wall eases left and right. It is made of framed paintings and a few
 * photographs from her exhibitions, nothing else, so the paintings stay the
 * loudest colour on the screen. The wall never stops under the cursor: the
 * painting under it turns over to show its label, and an exhibition photograph
 * lifts a little. Each column holds its list twice, so it loops without a seam.
 */

export type Item =
  | { k: "p"; id: string }
  | { k: "x"; src: string; eyebrow: string; title: string; sub: string; alt: string; href: string };

export const P = (id: string): Item => ({ k: "p", id });
export const X = (src: string, eyebrow: string, title: string, sub: string, alt: string, href = "/exhibitions"): Item =>
  ({ k: "x", src, eyebrow, title, sub, alt, href });

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

function Tile({ it }: { it: Item }) {
  if (it.k === "x") {
    return (
      <Link className="tile xcard" href={it.href} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.src} alt={it.alt} decoding="async" {...dims(it.src)} />
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="framed" src={thumb(w.id)} alt={w.title} loading="lazy" decoding="async" {...dims(thumb(w.id))} />
      <span className="back">
        <em>{w.series}</em>
        <b>{w.title}</b>
        <small>{labelLine(w)}</small>
        {line && <i>{line}</i>}
        <span className="go">View the painting</span>
      </span>
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

import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import Pic from "@/components/site/Pic";
import { dims } from "@/lib/images";
import { HER_WALL } from "@/lib/her-wall";
import { PRESS_HOME } from "@/lib/press";

const TITLE = "About";
const DESCRIPTION = "Dr Dolly Prasad paints in New Delhi, mostly in oil. Nineteen exhibitions and art fairs since 2005, and paintings in private collections in India, the USA and the UK.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/about"),
};

/*
 * All words are Shubham’s. No line on this page is presented as hers.
 * A serious gallery's artist page: a strict grid, no text wrapped round an image (elevate, 27 Nov 2026).
 */
const SHOWS = [
  { year: "2026", title: "Sacred Fragments: A Journey Home", venue: "Visual Arts Gallery, India Habitat Centre, New Delhi" },
  { year: "2010", title: "Open Palm Court", venue: "India Habitat Centre, New Delhi" },
];

export default function About() {
  const ph = HER_WALL.photo;
  return (
    <>
      <section className="ab2-open wrap">
        <figure className="ab2-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} />
        </figure>
        <div className="ab2-text">
          <p className="eyebrow">About the artist</p>
          <h1 className="page-title">Dr <span className="red">Dolly</span> Prasad</h1>
          <p className="ab2-p">Dr Dolly Prasad is a painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. Her subjects come from the ordinary Indian day: a chai boy beside his kettle, a red letterbox against a wall of old stamps, a temple bell tied with red thread, a woman lost among poppies.</p>
          <p className="ab2-p">Since 2005 her work has been shown at exhibitions and art fairs, most recently at India Habitat Centre in 2026. Her paintings are in private collections in India, the USA and the UK.</p>
          <p><Link className="ab2-link" href="/enquire">Ask about a painting</Link></p>
        </div>
      </section>

      <section className="ab2-sec wrap" aria-labelledby="ab2-ex">
        <h2 id="ab2-ex" className="ab2-h">Selected exhibitions</h2>
        <ol className="ab2-list">
          {SHOWS.map((e) => (
            <li key={e.year + e.title}><span className="ab2-yr">{e.year}</span><span><b>{e.title}</b><span className="ab2-venue">{e.venue}</span></span></li>
          ))}
          <li><span className="ab2-yr" aria-hidden="true" /><span className="ab2-venue">and 17 more since 2005</span></li>
        </ol>
        <p><Link className="ab2-link" href="/exhibitions">All exhibitions</Link></p>
      </section>

      <section className="ab2-sec wrap" aria-labelledby="ab2-press">
        <h2 id="ab2-press" className="ab2-h">Press</h2>
        <ul className="ab2-press">
          {PRESS_HOME.filter((p) => p.id !== "ihc-press-01").map((p) => {
            const src = p.kind === "video" ? p.poster! : p.src;
            return (
              <li key={p.id}>
                <Link href="/exhibitions#press">
                  <span className="ab2-pimg"><Pic src={src} alt={p.alt} sizes="(max-width: 640px) 90vw, 30vw" {...dims(src)} /></span>
                  <b>{p.home.t}</b>
                  <span className="ab2-venue">{p.home.s}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ab2-close">
        <div className="wrap">
          <p className="ab2-coll">In private collections in India, the USA and the UK.</p>
          <p className="ab2-links"><Link className="ab2-link" href="/works">Works</Link><Link className="ab2-link" href="/enquire">Enquire</Link></p>
        </div>
      </section>
    </>
  );
}

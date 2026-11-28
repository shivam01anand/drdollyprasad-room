import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import Pic from "@/components/site/Pic";
import { dims } from "@/lib/images";
import { HER_WALL } from "@/lib/her-wall";
import { PRESS_HOME } from "@/lib/press";
import KeyShows from "@/components/site/KeyShows";
import { KEY_SHOWS, OTHER_SHOWS } from "@/lib/key-shows";

const TITLE = "About";
const DESCRIPTION = "Dr Dolly Prasad, a painter in New Delhi, works mostly in oil on what everyday India walks past. Since 2005 her paintings have hung at nearly twenty exhibitions and art fairs.";
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

export default function About() {
  const ph = HER_WALL.photo;
  return (
    <>
      <section className="ab2-open wrap">
        <figure className="ab2-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ph.large} alt={ph.alt} width={ph.largeWidth} height={ph.largeHeight} />
          <figcaption className="ab2-cap">Open Palm Court, India Habitat Centre, 2010. {ph.caption}</figcaption>
        </figure>
        <div className="ab2-text">
          <p className="eyebrow">About the artist</p>
          <h1 className="page-title">Dr <span className="red">Dolly</span> Prasad</h1>
          <p className="ab2-p">Dr Dolly Prasad paints what everyday India walks past, a twenty-paise coin or a stranger's worry, and gives it the time a passer-by never does. Across five collections, from the old street of Gone Are The Days to the spring of Bahaar, the aim stays the same. Look long enough at the ordinary, and it turns out to be sacred.</p>
          <p className="ab2-p">She works in New Delhi, mostly in oil on canvas, sometimes with charcoal or pastel. Her paintings have been shown at nearly twenty exhibitions and art fairs, and are in private collections in India and abroad.</p>
          <p><Link className="ab2-link" href="/enquire">Ask about a painting</Link></p>
        </div>
      </section>

      <div className="wrap">
        <KeyShows shows={KEY_SHOWS} others={OTHER_SHOWS} />
        <p className="ab2-all"><Link className="ab2-link" href="/exhibitions">All exhibitions</Link></p>
      </div>

      <section className="ab2-sec wrap" aria-labelledby="ab2-press">
        <h2 id="ab2-press" className="ab2-h">Press</h2>
        <ul className="ab2-press">
          {PRESS_HOME.map((p) => {
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
          <p className="ab2-links"><Link className="ab2-link" href="/works">Works</Link><Link className="ab2-link" href="/enquire">Enquire</Link></p>
        </div>
      </section>
    </>
  );
}

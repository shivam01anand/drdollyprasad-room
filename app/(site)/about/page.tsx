import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import Roll, { type RollItem } from "@/components/site/Roll";
import PageHead from "@/components/site/PageHead";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import { LOOK, PORTRAIT_LARGE, STUDIO_PATH, shownYear } from "@/lib/site";
import { BY_ID, WORKS, workPath } from "@/lib/works";

const TITLE = "About";
const DESCRIPTION = "Dr Dolly Prasad paints in New Delhi, mostly in oil. Nineteen exhibitions and art fairs since 2005, and paintings in private collections in India, the USA and the UK.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/about"),
};

/** paintings for a roll: the painting, its title and year, and its one line */
const paint = (ids: string[]): RollItem[] => ids.map((id) => {
  const w = BY_ID.get(id)!;
  return { src: `/site/thumbs/${id}.jpg`, title: `${w.title}${shownYear(w) ? `, ${shownYear(w)}` : ""}`, sub: LOOK[id], href: workPath(id) };
});

const SHOW_PHOTOS: RollItem[] = [
  { src: "/site/ex/sf-01.jpg", title: "Sacred Fragments: A Journey Home, 2026", sub: "With the two paintings she showed there, Under Canopy of Greens and Threads of Faith.", href: "/exhibitions#sacred-fragments", framed: false },
  { src: "/site/ex/ihc-03.jpg", title: "India Habitat Centre, 2010", sub: "The opening, guests gathered round the brass lamp.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/iccr-speech.jpg", title: "A Lifetime to Paint, ICCR, 2010", sub: "Speaking at the opening, Dhyan behind her.", href: "/exhibitions#a-lifetime-to-paint", framed: false },
  { src: "/site/ex/ihc-press-b.jpg", title: "In front of the cameras", sub: "An interview beside “Before the Engines”.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/kala-dolly.jpg", title: "First International Kala Mela, 2018", sub: "Beside Ek Rupaya, at the art fair organised by Lalit Kala Akademi.", href: "/exhibitions#kala-mela-2018", framed: false },
];

/*
 * All words are Shubham’s. No line on this page is presented as hers.
 */

export default function About() {
  return (
    <>
      <PageHead eyebrow="About the artist" title="Dr Dolly Prasad" red="Dolly" line="Painter, New Delhi.">
        <a className="btn btn-solid" href="#story">Her story</a>
        <Link className="btn" href="/works">See her work</Link>
      </PageHead>
      <section id="story" className="ab-band ab-hero">
        <div className="wrap ab-hero-in">
          <figure className="ab-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PORTRAIT_LARGE} alt="Dr Dolly Prasad beside Ek Rupaya at the First International Kala Mela, 2018" />
          </figure>
          <div className="ab-txt">
            <p className="ab-p">Dr Dolly Prasad is a painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. Her subjects come from the ordinary Indian day: a chai boy beside his kettle, a red letterbox against a wall of old stamps, a temple bell tied with red thread, a woman lost among poppies.</p>
            <p className="ab-p">Since 2005 her work has been shown at exhibitions and art fairs, most recently at India Habitat Centre in 2026. Her paintings are in private collections in India, the USA and the UK.</p>
          </div>
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">Who she paints</p>
            <h2>People from the street, one at a time</h2>
            <p className="ab-p">Many of the people she paints are at work or waiting for the next job, and few of them would expect anyone to stop and paint them.</p>
          </div>
          <Roll label="People in her paintings" items={paint(["yellow-turban-portrait", "three-veiled-women", "boy-and-kettle", "red-turban-portrait", "mother-and-child"])} />
        </div>
      </section>

      <section className="ab-band tone-dark">
        <div className="wrap ab-statement">
          <p className="eyebrow">The work</p>
          <h2>Small things, kept at their true weight</h2>
          <p className="ab-p">Her paintings start with what people walk past every day, a twenty-paise coin or a padlock on a door, and give it the size it has in someone’s life. Twenty Paise stands four feet tall.</p>
          <p className="ab-p">A stranger’s patience gets a canvas of its own.</p>
        </div>
      </section>

      {/* In the press (R3): the same moving row of every item as Exhibitions, linking on to it */}
      <section className="ab-band tone-dark band-indigo ab-press" aria-labelledby="ab-press-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">From the archive</p>
              <h2 id="ab-press-h">In the press</h2>
            </div>
          </div>
          <PressRow items={PRESS_ALL} more={{ href: "/exhibitions#press", label: "All the press, on Exhibitions" }} />
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">On the walls, and in the news</p>
            <h2>Nineteen exhibitions and art fairs</h2>
            <p className="ab-p">2026 · Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre, New Delhi</p>
            <p className="ab-p">2010 · Open Palm Court, India Habitat Centre, New Delhi</p>
            <p className="ab-p">and 17 more since 2005</p>
            <Link className="btn btn-solid" href="/exhibitions">All nineteen, on Exhibitions →</Link>
          </div>
          <Roll label="Her exhibitions" items={SHOW_PHOTOS} shape="wide" />
        </div>
      </section>

      <section className="ab-band tone-wall">
        <div className="wrap ab-close">
          <p className="ab-p">Questions about a painting go straight to her, by email.</p>
          <div className="ab-ctas">
            <Link className="btn btn-solid" href="/enquire">Ask about a painting</Link>
            <Link className="btn" href="/works">See all {WORKS.length} paintings</Link>
            <a className="btn" href={STUDIO_PATH}>Walk through the house</a>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Roll, { type RollItem } from "@/components/site/Roll";
import WallHero from "@/components/site/WallHero";
import { ABOUT_WALL } from "@/components/site/Collage";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import { LOOK, STATEMENT, PORTRAIT_LARGE, STUDIO_PATH, shownYear } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";

export const metadata: Metadata = {
  title: "About",
  description: "Dr Dolly Prasad is a doctor and painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. Nineteen exhibitions and art fairs since 2005; paintings in private collections in India, the USA and the UK.",
  alternates: { canonical: "/about" },
};

/** paintings for a roll: the painting, its title and year, and its one line */
const paint = (ids: string[]): RollItem[] => ids.map((id) => {
  const w = BY_ID.get(id)!;
  return { src: `/site/thumbs/${id}.jpg`, title: `${w.title}${shownYear(w) ? `, ${shownYear(w)}` : ""}`, sub: LOOK[id], href: workPath(id) };
});

const SHOW_PHOTOS: RollItem[] = [
  { src: "/site/ex/ihc-03.jpg", title: "India Habitat Centre, 2010", sub: "The opening night.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/iccr-speech.jpg", title: "A Lifetime to Paint, ICCR, 2010", sub: "Speaking at the opening, Dhyan behind her.", href: "/exhibitions#a-lifetime-to-paint", framed: false },
  { src: "/site/ex/ihc-press-b.jpg", title: "In front of the cameras", sub: "An interview beside “Before the Engines”.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/kala-dolly.jpg", title: "First International Kala Mela, 2018", sub: "At the art fair organised by Lalit Kala Akademi.", href: "/exhibitions#kala-mela-2018", framed: false },
];

/*
 * All words are Shubham’s. No line on this page is presented as hers.
 */

export default function About() {
  return (
    <>
      {/* CR-006: About opens like every landing, the white card centred on a wall of her paintings */}
      <WallHero columns={ABOUT_WALL} label="About the artist" eyebrow="About the artist" title="Dr Dolly Prasad" red="Dolly" held="Doctor and painter, New Delhi.">
        <a className="btn btn-solid" href="#story">Her story</a>
        <Link className="btn" href="/works">See her work</Link>
      </WallHero>
      <section id="story" className="ab-band ab-hero">
        <div className="wrap ab-hero-in">
          <figure className="ab-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PORTRAIT_LARGE} alt="Dr Dolly Prasad beside one of her paintings at the First International Kala Mela, 2018" />
          </figure>
          <div className="ab-txt">
            <p className="ab-p">Dr Dolly Prasad is a doctor and painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. She paints what most people pass without a second look: a chai boy beside his kettle, two bullocks under one yoke, a temple bell tied with red thread, a woman lost among poppies.</p>
            <p className="ab-p">Since 2005 her work has been shown at exhibitions and art fairs, most recently at India Habitat Centre in 2026. Her paintings are in private collections in India, the USA and the UK.</p>
          </div>
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">Who she paints</p>
            <h2>The rickshaw puller, the milkman, the kadhai seller</h2>
            <p className="ab-p">Many of the people in her paintings are at work or between jobs: a rickshaw puller resting on his footboard, a kadhai seller among his pans.</p>
            <p className="ab-p">The Portraits turn round: three old men face you, close enough to count the lines.</p>
          </div>
          <Roll label="People in her paintings" items={paint(["red-turban-portrait", "three-veiled-women", "boy-and-kettle", "yellow-turban-portrait", "mother-and-child"])} />
        </div>
      </section>

      <section className="ab-band tone-dark">
        <div className="wrap ab-statement">
          <p className="eyebrow">The work</p>
          <h2>Small things, given a big canvas</h2>
          <p className="ab-p">A twenty-paise coin fills a canvas four feet tall, and a clay gullak with its coins gets one three feet square.</p>
          <p className="ab-p">Bandh Darwaze goes the other way: four door fittings, each on a canvas only a foot square.</p>
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">A doctor’s eye</p>
            <h2>The small sign</h2>
            <p className="ab-p">A doctor learns to look for the small sign that explains the rest. In her paintings it might be the brass bell hanging from a resting rickshaw puller’s fingers, or the sheet of newspaper that has slid to the floor under a reader.</p>
            <Link className="btn btn-solid" href="/series">The five collections</Link>
          </div>
          <Roll label="A few of her paintings" items={paint(["bulls-and-wheel", "offering-of-light", "boy-with-bananas", "temple-bells", "woman-with-bird"])} />
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
            <p className="ab-p">From 2005 to 2026 her paintings were shown at India Habitat Centre, the Indian Council for Cultural Relations, Triveni Kala Sangam and Travancore Art Gallery in New Delhi, at the First International Kala Mela organised by Lalit Kala Akademi, and at Nehru Art Gallery in Bombay. The most recent was Sacred Fragments: A Journey Home, at the Visual Arts Gallery, India Habitat Centre, from 18 to 21 October 2026.</p>
            <p className="ab-p">Television cameras were at the gallery in June 2010, and Delhi Times listed a Travancore group show she was in under Must See, Must Do.</p>
            <Link className="btn btn-solid" href="/exhibitions">See the exhibitions</Link>
          </div>
          <Roll label="Her exhibitions" items={SHOW_PHOTOS} shape="wide" />
        </div>
      </section>

      <section className="ab-band tone-wall">
        <div className="wrap ab-close">
          <p className="ab-quote ab-poem">{STATEMENT.map((ln, i) => <span key={i} style={{ display: "block" }}>{ln}</span>)}</p>
          <div className="ab-ctas">
            <Link className="btn btn-solid" href="/works">See her work</Link>
            <Link className="btn" href="/enquire">Enquire</Link>
            <a className="btn" href={STUDIO_PATH}>Walk through the studio</a>
          </div>
        </div>
      </section>
    </>
  );
}

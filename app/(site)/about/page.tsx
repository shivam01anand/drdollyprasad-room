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
  description: "Dr Dolly Prasad paints in New Delhi, mostly in oil. Nineteen exhibitions and art fairs since 2005, and paintings in private collections in India, the USA and the UK.",
  alternates: { canonical: "/about" },
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
      {/* CR-006: About opens like every landing, the white card centred on a wall of her paintings */}
      <WallHero columns={ABOUT_WALL} label="About the artist" eyebrow="About the artist" title="Dr Dolly Prasad" red="Dolly" held="Painter, New Delhi.">
        <a className="btn btn-solid" href="#story">Her story</a>
        <Link className="btn" href="/works">See her work</Link>
      </WallHero>
      <section id="story" className="ab-band ab-hero">
        <div className="wrap ab-hero-in">
          <figure className="ab-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PORTRAIT_LARGE} alt="Dr Dolly Prasad beside Ek Rupaya at the First International Kala Mela, 2018" />
          </figure>
          <div className="ab-txt">
            <p className="ab-p">Dr Dolly Prasad is a painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. Her subjects come from the ordinary Indian day: a chai boy beside his kettle, two bullocks under one yoke, a temple bell tied with red thread, a woman lost among poppies.</p>
            <p className="ab-p">Since 2005 her work has been shown at exhibitions and art fairs, most recently at India Habitat Centre in 2026. Her paintings are in private collections in India, the USA and the UK.</p>
          </div>
        </div>
      </section>

      {/* content elevate (2026-11-22): the theme, one painting from each collection, moved up in place of the old band */}
      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">The collections</p>
            <h2>What the everyday holds</h2>
            {STATEMENT.map((ln, i) => <p key={i} className="ab-p">{ln}</p>)}
            <Link className="btn btn-solid" href="/series">See the collections</Link>
          </div>
          <Roll label="One painting from each collection" items={paint(["child-among-flowers", "red-and-teal-door-lock", "milkman-on-bicycle", "elder-woman-portrait", "sacred-tree"])} />
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
          <p className="ab-p">A prayer said at sunrise gets the care of a portrait. A stranger’s patience gets a canvas of its own.</p>
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
            <p className="ab-p">In 2005 her paintings were shown at Sriram Centre in New Delhi and at Indraprastha Art Gallery. They have since hung at India Habitat Centre four times, at the Indian Council for Cultural Relations, Triveni Kala Sangam, Travancore Art Gallery and Nehru Art Gallery in Bombay, and at art fairs in Delhi and Jaipur. The most recent was Sacred Fragments: A Journey Home, at the Visual Arts Gallery, India Habitat Centre, from 18 to 21 October 2026.</p>
            <p className="ab-p">Television cameras were at the gallery in June 2010, and Delhi Times listed a Travancore group show she was in under Must See, Must Do.</p>
            <Link className="btn btn-solid" href="/exhibitions">See the exhibitions</Link>
          </div>
          <Roll label="Her exhibitions" items={SHOW_PHOTOS} shape="wide" />
        </div>
      </section>

      <section className="ab-band tone-wall">
        <div className="wrap ab-close">
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

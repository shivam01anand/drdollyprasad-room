import type { Metadata } from "next";
import Link from "next/link";
import Roll, { type RollItem } from "@/components/site/Roll";
import WallHero from "@/components/site/WallHero";
import { ABOUT_WALL } from "@/components/site/Collage";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import { LOOK, PULL, ON_THE_WORK, PORTRAIT_LARGE, STUDIO_PATH, shownYear } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";

export const metadata: Metadata = {
  title: "About",
  description: "Dr Dolly Prasad is a New Delhi artist who makes the everyday memorable: oil paintings of a changing India. Eighteen exhibitions and art fairs; collectors in India, the USA and the UK.",
  alternates: { canonical: "/about" },
};

/** paintings for a roll: the painting, its title and year, and its one line */
const paint = (ids: string[]): RollItem[] => ids.map((id) => {
  const w = BY_ID.get(id)!;
  return { src: `/site/thumbs/${id}.jpg`, title: `${w.title}${shownYear(w) ? `, ${shownYear(w)}` : ""}`, sub: LOOK[id] ?? (PULL[id] ? `“${PULL[id]}”` : undefined), href: workPath(id) };
});

const SHOW_PHOTOS: RollItem[] = [
  { src: "/site/ex/ihc-03.jpg", title: "India Habitat Centre, 2010", sub: "Lighting the lamp at the opening.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/iccr-speech.jpg", title: "A Lifetime to Paint, ICCR, 2010", sub: "Speaking at the opening, The Blue Buddha behind her.", href: "/exhibitions#a-lifetime-to-paint", framed: false },
  { src: "/site/ex/ihc-press-b.jpg", title: "In front of the cameras", sub: "An interview beside The Bullocks.", href: "/exhibitions#india-habitat-centre-2010", framed: false },
  { src: "/site/ex/kala-dolly.jpg", title: "First International Kala Mela, 2018", sub: "At the art fair organised by Lalit Kala Akademi.", href: "/exhibitions#kala-mela-2018", framed: false },
];

/*
 * The drafted first-person "From the artist" line is off the page until she
 * approves or rewrites it (website test, round 2). Its draft is kept in the
 * project notes, not here, so it cannot be shown as hers by mistake.
 *
 * "Who she is" says only what the record supports (brand thesis §2, §6: a
 * practising doctor and a painter; the play of emotion on faces
 * has always fascinated her). The longer hospital-to-easel story waits for
 * her own account (backlog sprint, Needs Mummy).
 */

export default function About() {
  return (
    <>
      {/* CR-006: About opens like every landing, the white card centred on a wall of her paintings */}
      <WallHero columns={ABOUT_WALL} label="About the artist" eyebrow="About the artist" title="The everyday, held sacred" red="sacred" held="Dr Dolly Prasad, New Delhi.">
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
            <p className="ab-p">Dr Dolly Prasad is a New Delhi artist who holds the everyday sacred. For her, the ordinary is never small: a clay gullak, a closed door, a lamp lifted at aarti, a face at the corner of a lane. Each holds a story. Looking back, those ordinary days were the good ones, and she paints them so we can see them clearly now, and keep seeing the ones we are living today.</p>
          </div>
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">Who she is</p>
            <h2>The good days were the everyday</h2>
            <p className="ab-p">She is a doctor, and a painter in oil on canvas. Doctors learn to look at people carefully, and she kept that habit when she picked up the brush: the play of emotion on a face has always held her, at the hospital and on the canvas.</p>
            <p className="ab-p">Her subject is the India around her as it changes: rickshaws sharing the road with autos, coins out of use, old doors shut and kept. She paints them with the warmth of someone who remembers, and the hope of someone who still looks. Never relics; always parts of a life.</p>
          </div>
          <Roll label="Faces from her portraits" items={paint(["red-turban-portrait", "three-veiled-women", "boy-and-kettle", "yellow-turban-portrait", "mother-and-child"])} />
        </div>
      </section>

      <section className="ab-band tone-dark">
        <div className="wrap ab-statement">
          <p className="eyebrow">The work</p>
          <h2>She captures the everyday: its waiting and wishing, its worship and whispers.</h2>
          <p className="ab-p">A clay gullak and the coins it was made to hold. A door nobody opens any more. A lamp raised to a wall of scripture. She gives these ordinary things the scale, the colour and the stillness we usually keep for the sacred.</p>
          <p className="ab-p">Why these things? Because they are what made it home, and they are the first a changing country overlooks. Each painting is a way of saying they matter.</p>
        </div>
      </section>

      <section className="ab-band tone-light">
        <div className="wrap ab-split">
          <div className="ab-txt">
            <p className="eyebrow">A doctor’s eye</p>
            <h2>From a bullock cart to a child beneath banana leaves</h2>
            <p className="ab-p">A doctor is taught to look beneath the surface. She turns that eye on the everyday, a lamp, a thread, a pause, until the thing you walk past is the thing you stop for. In her words: “Sometimes, I paint not to show, but to pause.”</p>
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
            <h2>Eighteen exhibitions and art fairs</h2>
            <p className="ab-p">Between 2005 and 2018 her paintings hung at India Habitat Centre, the Indian Council for Cultural Relations, Triveni Kala Sangam, Travancore Art Gallery and Nehru Art Gallery in Bombay, and at the First International Kala Mela organised by Lalit Kala Akademi.</p>
            <p className="ab-p">Her shows have been covered on television and in the papers. Today her paintings are in private collections in India, the USA and the UK.</p>
            <Link className="btn btn-solid" href="/exhibitions">See the exhibitions</Link>
          </div>
          <Roll label="Her exhibitions" items={SHOW_PHOTOS} shape="wide" />
        </div>
      </section>

      <section className="ab-band tone-wall">
        <div className="wrap ab-close">
          <p className="ab-quote">“{ON_THE_WORK}”</p>
          <p className="eyebrow">Dr Dolly Prasad, on her work</p>
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

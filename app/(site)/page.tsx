import Link from "next/link";
import WallHero from "@/components/site/WallHero";
import { HOME } from "@/components/site/Collage";
import Card, { thumb } from "@/components/site/Card";
import { InstagramIcon } from "@/components/site/Icons";
import Until from "@/components/Until";
import HashRedirect from "@/components/site/HashRedirect";
import {
  BIO_LINE, BIO_SUB, EMAIL, INSTAGRAM, NOW, PORTRAIT, SERIES_PAGES, SHOWS, SITE, STUDIO_PATH, worksIn,
} from "@/lib/site";
import { BY_ID } from "@/lib/works";

const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dr Dolly Prasad",
  honorificPrefix: "Dr",
  jobTitle: "Painter",
  url: SITE,
  image: `${SITE}/og.jpg`,
  email: `mailto:${EMAIL}`,
  address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" },
  sameAs: [INSTAGRAM.url, "https://drdollyprasad.wordpress.com"],
};

const AVAILABLE = ["boy-with-bananas", "temple-bells", "bulls-and-wheel", "woman-with-poppies"];
const IG = ["patterned-turban-portrait", "bulls-and-wheel", "temple-bells", "red-turban-portrait", "coins-and-clay-bank", "offering-of-light", "yellow-turban-portrait", "terracotta-pots", "boy-with-bananas", "red-and-teal-door-lock"];
const now = NOW;
const CARDS = [
  { id: "india-habitat-centre-2010", src: "/site/ex/ihc-03.jpg", alt: "Dr Dolly Prasad lights the lamp at the opening at India Habitat Centre" },
  { id: "a-lifetime-to-paint", src: "/site/ex/iccr-speech.jpg", alt: "Dr Dolly Prasad speaks at the opening of A Lifetime to Paint, ICCR" },
  { id: "kala-mela-2018", src: "/site/ex/kala-dolly.jpg", alt: "Dr Dolly Prasad beside her painting at the First International Kala Mela" },
];

export default function Home() {
  const total = SERIES_PAGES.reduce((n, s) => n + worksIn(s.label).length, 0);
  return (
    <>
      <WallHero columns={HOME} label="Dr Dolly Prasad" size="home" face={PORTRAIT} eyebrow="Oil on canvas · New Delhi"
                title="Dr Dolly Prasad" held={BIO_LINE} sub={BIO_SUB}>
        <Link className="btn btn-solid" href="/works">See all {total} works</Link>
        <a className="btn" href={STUDIO_PATH}>Walk through the studio</a>
      </WallHero>

      <Until until={now.until}>
        <Link className="nowstrip" href="/exhibitions">
          <span className="live"><i aria-hidden="true" />Live now</span><b><span className="nw-long">{now.title}</span><span className="nw-short">{now.title.split(":")[0]}</span></b><span className="nw-where">{now.venue}, {now.city} · {now.when}</span><span className="nw-short nw-when">IHC · 18–21 Oct</span><u>Plan a visit →</u>
        </Link>
      </Until>

      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>Key collections</h2>
            <p className="sec-line">Five collections, five walks of life, from a changing India to faith lived every day.</p>
          </div>
          <Link className="link" href="/series">All collections →</Link>
        </div>
        <div className="grid grid-5 series-tiles snap-row">
          {SERIES_PAGES.map((s) => (
            <Link key={s.slug} className="card flip" href={`/series/${s.slug}`}>
              {/* on a computer the tile turns over on hover: the painting, then the collection in a line */}
              <div className="flip-in">
                <div className="mat flip-front">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="framed thin" src={thumb(s.hero)} alt={`${BY_ID.get(s.hero)?.title}, from ${s.label}`} loading="lazy" />
                </div>
                <div className="flip-back" aria-hidden="true">
                  <em>{worksIn(s.label).length} works · {s.period.replace(/^c\. /, "")}</em>
                  <b>{s.label}</b>
                  <span>{s.line}</span>
                  <u>Read the story →</u>
                </div>
              </div>
              <span className="card-t">{s.label}</span>
              <span className="eyebrow">{worksIn(s.label).length} works <small>{s.period.replace(/^c\. /, "")}</small></span>
              <span className="meta flip-line">{s.line}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sec-tight wrap">
        <div className="sec-head">
          <div>
            <h2>Available now</h2>
            <p className="sec-line">Original oil paintings, ready for a new home. Prices on request.</p>
          </div>
          <Link className="link" href="/works?status=available">All available →</Link>
        </div>
        <div className="grid snap-row">
          {AVAILABLE.map((id) => <Card key={id} w={BY_ID.get(id)!} />)}
        </div>
      </section>

      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>On the walls</h2>
            <p className="sec-line">Eighteen exhibitions and art fairs across India, and collectors in India, the USA and London.</p>
          </div>
          <Link className="link" href="/exhibitions">All exhibitions →</Link>
        </div>
        <div className="shows snap-row">
          {CARDS.map((c) => {
            const e = SHOWS.find((x) => x.id === c.id)!;
            return (
              <Link key={c.id} href={`/exhibitions#${c.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={c.alt} loading="lazy" />
                <span className="eyebrow rust">{e.when.replace(/^Opened 11 /, "").replace(/ · on view.*$/, "")}</span>
                <b>{e.title}</b>
                <span className="meta">{e.venue}, {e.city}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="sec-tight wrap">
        <div className="about-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="round" src="/site/ex/kala-dolly.jpg" alt="Dr Dolly Prasad beside one of her paintings" loading="lazy" />
          <div className="txt">
            <p className="eyebrow">About the artist</p>
            <p className="big">An artist who makes the everyday memorable: an India that is changing fast, held in oil on canvas.</p>
            <p className="meta" style={{ fontSize: 16 }}>She began as a doctor in New Delhi and soon turned to painting. Eighteen exhibitions and art fairs between 2005 and 2018, from Triveni Kala Sangam and India Habitat Centre to ICCR and the First International Kala Mela. Her paintings are with private collectors in India, the USA and London.</p>
            <Link className="link" href="/about">Her story →</Link>
          </div>
        </div>
      </section>

      <section className="ig-band">
        <div className="wrap ig-in">
          <div className="txt">
            <p className="eyebrow">From the studio</p>
            <h2>Follow {INSTAGRAM.handle} on Instagram</h2>
            <p className="meta" style={{ fontSize: 16 }}>The paintings, the stories behind them, and the shows they hung in.</p>
            <a className="btn btn-solid" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />Open Instagram</a>
          </div>
          <div className="ig-roll" aria-hidden="true">
            <div className="ig-track">
              {[...IG, ...IG].map((id, i) => (
                <a key={i} href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(id)} alt="" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HashRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}

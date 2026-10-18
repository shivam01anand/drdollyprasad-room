import Link from "next/link";
import Collage from "@/components/site/Collage";
import Card, { thumb } from "@/components/site/Card";
import { InstagramIcon } from "@/components/site/Icons";
import Until from "@/components/Until";
import HashRedirect from "@/components/site/HashRedirect";
import {
  BIO_LINE, BIO_SUB, EMAIL, INSTAGRAM, NOW, PORTRAIT, RECORD_LINE, SERIES_PAGES, SHOWS, SITE, STUDIO_PATH, worksIn,
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
const IG = ["patterned-turban-portrait", "bulls-and-wheel", "red-turban-portrait", "coins-and-clay-bank", "yellow-turban-portrait", "terracotta-pots"];
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
      <section className="collage-wrap" aria-label="Dr Dolly Prasad">
        <div className="collage">
          <Collage />
        </div>
        <div className="namecard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="face" src={PORTRAIT} alt="Dr Dolly Prasad" width={100} height={100} />
          <p className="eyebrow">Oil on canvas · New Delhi</p>
          <h1>Dr Dolly Prasad</h1>
          <p className="held">{BIO_LINE}</p>
          <p className="sub">{BIO_SUB}</p>
          <div className="ctas">
            <Link className="btn btn-solid" href="/works">See all {total} works</Link>
            <a className="btn" href={STUDIO_PATH}>Walk through the studio</a>
          </div>
        </div>
      </section>

      <Until until={now.until}>
        <Link className="nowstrip" href="/exhibitions">
          <em>Now showing</em><b>{now.title}</b><span>{now.city} · {now.when}</span><u>Details →</u>
        </Link>
      </Until>

      <section className="sec wrap">
        <div className="sec-head">
          <h2>Key series</h2>
          <Link className="link" href="/series">All series and their stories →</Link>
        </div>
        <div className="grid grid-5 series-tiles">
          {SERIES_PAGES.map((s) => (
            <Link key={s.slug} className="card" href={`/series/${s.slug}`}>
              <div className="mat">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="framed thin" src={thumb(s.hero)} alt={`${BY_ID.get(s.hero)?.title}, from ${s.label}`} loading="lazy" />
              </div>
              <span className="card-t">{s.label}</span>
              <span className="eyebrow">{s.period} · {worksIn(s.label).length} works</span>
              <span className="meta">{s.line}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sec-tight wrap">
        <div className="sec-head">
          <h2>Available now</h2>
          <Link className="link" href="/works?status=available">All available works →</Link>
        </div>
        <div className="grid">
          {AVAILABLE.map((id) => <Card key={id} w={BY_ID.get(id)!} />)}
        </div>
      </section>

      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>On the walls</h2>
            <p className="meta" style={{ fontSize: 16, marginTop: 8 }}>{RECORD_LINE}.</p>
          </div>
          <Link className="link" href="/exhibitions">All exhibitions →</Link>
        </div>
        <div className="shows">
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
            <p className="big">She paints what daily life passes by — a clay gullak, a closed door, a lamp raised to scripture — and gives it the stillness we keep for prayer.</p>
            <p className="meta" style={{ fontSize: 16 }}>A doctor and a painter in New Delhi. Eighteen exhibitions and art fairs between 2005 and 2018, from Triveni Kala Sangam and India Habitat Centre to ICCR and the First International Kala Mela. Paintings in private collections in India, the USA and London.</p>
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
          <div className="ig-grid">
            {IG.map((id) => (
              <a key={id} href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" aria-label={`${BY_ID.get(id)?.title} on Instagram`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(id)} alt="" loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <HashRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}

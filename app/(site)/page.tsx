import Link from "next/link";
import Collage from "@/components/site/Collage";
import Card, { thumb } from "@/components/site/Card";
import { InstagramIcon } from "@/components/site/Icons";
import Until from "@/components/Until";
import HashRedirect from "@/components/site/HashRedirect";
import {
  BIO_LINE, BIO_SUB, EMAIL, EXHIBITIONS, INSTAGRAM, PORTRAIT, SERIES_PAGES, SITE, STUDIO_PATH, worksIn,
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
const now = EXHIBITIONS.find((e) => e.until)!;
const SHOWS = [
  { id: "india-habitat-centre", src: "/site/ex/ihc-room-01.jpg", eyebrow: "Solo exhibition", sub: "India Habitat Centre, New Delhi" },
  { id: "a-lifetime-to-paint", src: "/site/ex/iccr-01.jpg", eyebrow: "Solo exhibition · 2010", sub: "ICCR, Azad Bhavan Art Gallery, New Delhi" },
  { id: "triveni-2007", src: "/site/ex/paper-01.jpg", eyebrow: "Exhibition · 2007", sub: "With Sangeeta Sharma · Triveni Kala Sangam, New Delhi" },
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

      <Until until={now.until!}>
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
          <h2>On the walls</h2>
          <Link className="link" href="/exhibitions">All exhibitions →</Link>
        </div>
        <div className="shows">
          {SHOWS.map((s) => {
            const e = EXHIBITIONS.find((x) => x.id === s.id)!;
            return (
              <Link key={s.id} href={`/exhibitions#${s.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={e.photos[0]?.alt ?? e.title} loading="lazy" />
                <span className="eyebrow rust">{s.eyebrow}</span>
                <b>{e.title}</b>
                <span className="meta">{s.sub}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="sec-tight wrap">
        <div className="about-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="round" src="/site/ex/kala-mela-01.jpg" alt="Dr Dolly Prasad beside one of her paintings" loading="lazy" />
          <div className="txt">
            <p className="eyebrow">About the artist</p>
            <p className="big">Dr. Dolly Prasad’s art is the everyday held sacred. Oil on canvas catching the hues of India in its waiting and wishing, its worship and whispers.</p>
            <p className="meta" style={{ fontSize: 16 }}>Eighteen solo exhibitions, 2005–2018, at venues including Triveni Kala Sangam, India Habitat Centre, ICCR and Lalit Kala Akademi. Work in private collections in India, the USA and London.</p>
            <Link className="link" href="/about">Her story →</Link>
          </div>
        </div>
      </section>

      <section className="ig-band">
        <div className="wrap ig-in">
          <div className="txt">
            <p className="eyebrow">From the studio</p>
            <h2>Follow {INSTAGRAM.handle} on Instagram</h2>
            <p className="meta" style={{ fontSize: 16 }}>New paintings, the stories behind them, and her exhibitions.</p>
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

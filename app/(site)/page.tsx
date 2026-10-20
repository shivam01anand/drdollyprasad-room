import Link from "next/link";
import WallHero from "@/components/site/WallHero";
import { HOME } from "@/components/site/Collage";
import Card, { thumb } from "@/components/site/Card";
import { InstagramIcon } from "@/components/site/Icons";
import Until from "@/components/Until";
import HashRedirect from "@/components/site/HashRedirect";
import Marquee from "@/components/site/Marquee";
import IgRoll from "@/components/site/IgRoll";
import {
  BIO_LINE, BIO_SUB, EMAIL, INSTAGRAM, NOW, NOW_SHOWING_CONFIRMED, PORTRAIT, SERIES_PAGES, SHOWS, SITE, STUDIO_PATH, worksIn,
  LEAD,
} from "@/lib/site";
import { BY_ID } from "@/lib/works";
import { dims } from "@/lib/images";

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
                title="Dr Dolly Prasad" red="Dolly" sub={<>The everyday, held <span className="red">sacred</span>.</>}>
        <Link className="btn btn-solid" href="/works">See all {total} works</Link>
        <a className="btn" href={STUDIO_PATH}><span className="lbl-wide">Walk through the studio</span><span className="lbl-phone">Enter the studio</span></a>
      </WallHero>

      {NOW_SHOWING_CONFIRMED && <Until until={now.until}>
        <Link className="nowstrip" href="/exhibitions">
          <span className="live"><i aria-hidden="true" />Live now</span><b><span className="nw-long">{now.title}</span><span className="nw-short">{now.title.split(":")[0]}</span></b><span className="nw-where">{now.venue}, {now.city} · {now.when}</span><span className="nw-short nw-when">IHC · 18 to 21 Oct</span><u>See the show →</u>
        </Link>
      </Until>}

      <div className="layer band-indigo">
      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>Key collections</h2>
          </div>
          <Link className="link" href="/series">All collections →</Link>
        </div>
      </section>
      <Marquee seconds={70} label="The five collections" className="series-tiles">
        {SERIES_PAGES.map((s) => (
          <Link key={s.slug} className="card m-card" href={`/series/${s.slug}`}>
            <div className="mat">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="framed thin" src={thumb(LEAD[s.slug] ?? s.hero)} alt={`${BY_ID.get(LEAD[s.slug] ?? s.hero)?.title}, from ${s.label}`} loading="eager" {...dims(thumb(LEAD[s.slug] ?? s.hero))}
                   style={{ ["--ar" as string]: `${dims(thumb(LEAD[s.slug] ?? s.hero)).width} / ${dims(thumb(LEAD[s.slug] ?? s.hero)).height}` }} />
            </div>
            <span className="card-t">{s.label}</span>
            <span className="meta">{worksIn(s.label).length} works · {s.period}</span>
          </Link>
        ))}
      </Marquee>
      </div>

      <section className="hw-band">
        <div className="wrap hw-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="round" src="/site/ex/kala-dolly.jpg" alt="Dr Dolly Prasad beside one of her paintings" loading="lazy" {...dims("/site/ex/kala-dolly.jpg")} />
          <figure className="hw-q">
            <blockquote>{SERIES_PAGES[0].quote}</blockquote>
            <figcaption>Dr Dolly Prasad, on Gone Are The Days</figcaption>
            <Link className="link" href="/about">Her story →</Link>
          </figure>
        </div>
      </section>

      <div className="layer band-indigo">
      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>On the walls</h2>
            <p className="sec-line">Eighteen exhibitions and art fairs, 2005 to 2018.</p>
          </div>
          <Link className="link" href="/exhibitions">All exhibitions →</Link>
        </div>
      </section>
      <Marquee seconds={55} label="Exhibitions" reverse>
        {CARDS.map((c) => {
          const e = SHOWS.find((x) => x.id === c.id)!;
          return (
            <Link key={c.id} className="show-card" href={`/exhibitions#${c.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="framed" src={c.src} alt={c.alt} loading="eager" {...dims(c.src)} />
              <span className="meta">{e.when.replace(/^Opened 11 /, "").replace(/ · on view.*$/, "")}</span>
              <b>{e.name ?? e.title}</b>
              <span className="meta">{e.venue}, {e.city}</span>
            </Link>
          );
        })}
      </Marquee>
      </div>

      <section className="sec-tight wrap">
        <div className="sec-head">
          <div>
            <h2>Available now</h2>
            <p className="sec-line">Originals still with the artist.</p>
          </div>
          <Link className="link" href="/works?status=available">All available →</Link>
        </div>
      </section>
      <Marquee seconds={50} label="Available paintings" className="avail">
        {AVAILABLE.map((id) => <Card key={id} w={BY_ID.get(id)!} eager />)}
      </Marquee>


      <section className="ig-band">
        <div className="wrap ig-in">
          <div className="txt">
            <h2>Follow {INSTAGRAM.handle}, or ask about a painting</h2>
            <p className="meta ig-sub">The paintings, the small stories behind them, and the shows they hung in.</p>
            <div className="ig-ctas">
              <a className="btn btn-solid" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />Open Instagram</a>
              <Link className="btn" href="/enquire">Enquire</Link>
            </div>
          </div>
          <IgRoll items={IG.map((id) => ({ src: thumb(id), ...dims(thumb(id)) }))} href={INSTAGRAM.url} />
        </div>
      </section>

      <HashRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}

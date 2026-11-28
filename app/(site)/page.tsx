import type { Metadata } from "next";
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
  EMAIL, INSTAGRAM, NOW, NOW_SHOWING_CONFIRMED, PORTRAIT, SACRED_FRAGMENTS, SERIES_PAGES, SHOWS, SITE, STUDIO_PATH, worksIn,
  LEAD,
} from "@/lib/site";
import { BY_ID, PERSON_ID } from "@/lib/works";
import Pic from "@/components/site/Pic";
import { dims } from "@/lib/images";
import { PRESS_HOME } from "@/lib/press";

// the home page is the one address for "/": no second copy under another URL
export const metadata: Metadata = { alternates: { canonical: "/" } };

// elevate (26 Nov 2026): a stable @id that every painting page points its creator at; no image until there is a
// portrait (a painting is not her picture); the retired WordPress site is no longer listed as hers
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Dr Dolly Prasad",
  honorificPrefix: "Dr",
  jobTitle: "Painter",
  url: SITE,
  email: `mailto:${EMAIL}`,
  address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" },
  sameAs: [INSTAGRAM.url],
};

const AVAILABLE = ["boy-with-bananas", "temple-bells", "bulls-and-wheel", "woman-with-poppies"];
const IG = ["patterned-turban-portrait", "bulls-and-wheel", "temple-bells", "red-turban-portrait", "coins-and-clay-bank", "offering-of-light", "yellow-turban-portrait", "terracotta-pots", "boy-with-bananas", "red-and-teal-door-lock"];
const now = NOW;
// R4 fix 7 (Brand P1-5): "On the walls" reads newest first, in the one SHOWS order (Kala Mela first)
// elevate (26 Nov 2026): the newest show leads the row. Its words are kb/exhibitions.json e19 (title, venue, dates),
// its photograph and alt the first one on /exhibitions.
const NEWEST = { id: SACRED_FRAGMENTS.id, ...SACRED_FRAGMENTS.albums[0].photos[0] };
const CARDS = [
  { id: "india-habitat-centre-2010", src: "/site/ex/ihc-03.jpg", alt: "The opening at India Habitat Centre, 2010" },
  { id: "a-lifetime-to-paint", src: "/site/ex/iccr-speech.jpg", alt: "Dr Dolly Prasad speaks at the opening of A Lifetime to Paint, ICCR" },
  { id: "kala-mela-2018", src: "/site/ex/kala-dolly.jpg", alt: "Dr Dolly Prasad beside her painting at the First International Kala Mela" },
].sort((a, b) => SHOWS.findIndex((x) => x.id === a.id) - SHOWS.findIndex((x) => x.id === b.id));

export default function Home() {
  const total = SERIES_PAGES.reduce((n, s) => n + worksIn(s.label).length, 0);
  return (
    <>
      <WallHero columns={HOME} label="Dr Dolly Prasad" size="home" eyebrow="Paintings in oil · New Delhi"
                title="Dr Dolly Prasad" red="Dolly" tagline={<>The everyday, held <span className="red">sacred</span>.</>}
                sub="Paintings of the small things that hold an Indian day together."
                proof="Nineteen exhibitions and art fairs since 2005.">
        <Link className="btn btn-solid" href="/works">See all {total} paintings</Link>
        <a className="btn" href={STUDIO_PATH}><span className="lbl-wide">Walk through the house</span><span className="lbl-phone">Enter the house</span></a>
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
            <h2>Waiting and wishing, worship and whispers</h2>
            <p className="sec-line">Five collections, each a corner of India we know by heart.</p>
          </div>
          <Link className="link" href="/series">All collections →</Link>
        </div>
      </section>
      {/* R6 (Shubham 20 Oct 22:50): a still, smaller row, every painting at one height, never cropped (the hero above already moves) */}
      <div className="series-row wrap" role="list" aria-label="The collections">
        {SERIES_PAGES.map((s) => (
          <Link key={s.slug} className="card m-card" role="listitem" href={`/series/${s.slug}`}>
            <div className="mat">
              <Pic className="framed thin" src={thumb(LEAD[s.slug] ?? s.hero)} alt={`${BY_ID.get(LEAD[s.slug] ?? s.hero)?.title}, from ${s.label}`} sizes="(max-width: 640px) 45vw, 220px" {...dims(thumb(LEAD[s.slug] ?? s.hero))}
                   style={{ ["--ar" as string]: `${dims(thumb(LEAD[s.slug] ?? s.hero)).width} / ${dims(thumb(LEAD[s.slug] ?? s.hero)).height}` }} />
            </div>
            <span className="card-t">{s.label}</span>
            <span className="card-line">{s.line}</span>
            <span className="meta">{worksIn(s.label).length} works · {s.period}</span>
          </Link>
        ))}
      </div>
      </div>

      {/* R6 (4-R6-SPEC §4b, Chief Content R6 §1-2): who she is in five seconds, the proof beside it, then her story */}
      <section className="hw-band" aria-labelledby="hw-h">
        <div className="wrap hw-in">
          <Pic className="round" src="/site/ex/kala-dolly.jpg" alt="Dr Dolly Prasad beside one of her paintings" sizes="(max-width: 640px) 60vw, 320px" {...dims("/site/ex/kala-dolly.jpg")} />
          <div className="hw-intro">
            <p className="eyebrow">The artist</p>
            <h2 id="hw-h">Paintings of what India hurries past</h2>
            <p className="hw-lede">A milkman pedals out before first light, and a priest lifts the aarti flame at dusk. Dr Dolly Prasad paints the hours in between, mostly in oil, and gives them the time a hurried city never could. She works in New Delhi, and her paintings are in private collections in India, the USA and the UK.</p>
            <Link className="link" href="/about">Her story →</Link>
          </div>
          <aside className="hw-press" aria-labelledby="hw-press-h">
            <h3 id="hw-press-h">In the press</h3>
            <ul>
              {PRESS_HOME.map((p) => {
                const src = p.kind === "video" ? p.poster! : p.sm ?? p.src;
                return (
                  <li key={p.id}>
                    <Link className={`hw-pi${p.kind === "video" ? " is-video" : ""}`} href="/exhibitions#press">
                      <span className="hw-pi-img">
                        <Pic src={src} alt={p.alt} sizes="72px" width={72} height={54} />
                      </span>
                      <div className="hw-pi-t"><p className="hw-pi-n"><b>{p.home.t}</b></p><p className="hw-pi-s">{p.home.s}</p></div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link className="link" href="/exhibitions#press">All the press →</Link>
          </aside>
        </div>
      </section>

      <div className="layer band-indigo">
      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>On the walls</h2>
            <p className="sec-line">Most recently Sacred Fragments, at India Habitat Centre, New Delhi, in October 2026.</p>
          </div>
          <Link className="link" href="/exhibitions">All exhibitions →</Link>
        </div>
      </section>
      <Marquee seconds={55} label="Exhibitions" reverse>
        {[NEWEST, ...CARDS].map((c) => {
          const e = c.id === SACRED_FRAGMENTS.id ? SACRED_FRAGMENTS : SHOWS.find((x) => x.id === c.id)!;
          return (
            <Link key={c.id} className="show-card" href={`/exhibitions#${c.id}`}>
              <Pic className="framed" src={c.src} alt={c.alt} sizes="(max-width: 640px) 70vw, 30vw" {...dims(c.src)} />
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
            <p className="sec-line">Originals still with the artist, waiting for a wall of their own.</p>
          </div>
          <Link className="link" href="/works?status=available">All available →</Link>
        </div>
      </section>
      <Marquee seconds={50} label="Available paintings" className="avail">
        {AVAILABLE.map((id) => <Card key={id} w={BY_ID.get(id)!} />)}
      </Marquee>


      <section className="ig-band">
        <div className="wrap ig-in">
          <div className="txt">
            <h2>Follow {INSTAGRAM.handle}</h2>
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

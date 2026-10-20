import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import CollectionsSwitcher from "@/components/site/CollectionsSwitcher";
import { notFound } from "next/navigation";
import Card from "@/components/site/Card";
import { SERIES_BY_SLUG, SERIES_PAGES, WHATSAPP, shownYear, enquireHref, whatsappHref, worksIn, type Chapter } from "@/lib/site";
import { TAILORED } from "@/lib/rooms";
import { BY_ID, LARGE, workPath, type Work } from "@/lib/works";
import manifest from "@/public/art/manifest.json";

const DIM = new Map(manifest.works.map((d) => [d.id, d]));
const wh = (id: string) => { const d = DIM.get(id); return d ? { width: d.w, height: d.h } : {}; };
import { ChatIcon } from "@/components/site/Icons";

export const dynamicParams = false;
export const generateStaticParams = () => SERIES_PAGES.map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = SERIES_BY_SLUG.get((await params).slug);
  if (!s) return {};
  return {
    title: s.label,
    description: `${s.label}, a collection by Dr Dolly Prasad (${s.period}). ${s.line}`,
    alternates: { canonical: `/series/${s.slug}` },
    openGraph: { images: [{ url: `/og/${s.hero}.jpg`, width: 1200, height: 630 }] },
  };
}

/** a photograph of the series out in the world, from her exhibitions */
const PHOTO: Record<string, { src: string; alt: string; cap: string }> = {
  "gone-are-the-days": { src: "/site/ex/ihc-press-b.jpg", alt: "Dr Dolly Prasad interviewed beside The Bullocks",
    cap: "Beside The Bullocks, in front of the cameras at Open Palm Court, India Habitat Centre, New Delhi, November 2010." },
  faith: { src: "/site/ex/iccr-02.jpg", alt: "Dr Dolly Prasad beside The Blue Buddha at ICCR",
    cap: "Beside The Blue Buddha at A Lifetime to Paint, ICCR, New Delhi, June 2010." },
};

const img = (id: string) => (LARGE.has(id) ? `/art/large/${id}.jpg` : `/art/works/${id}.jpg`);
const alt = (w: Work) => `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;

function Words({ c }: { c: Chapter }) {
  return (
    <>
      {c.setup && <p className="chap-small">{c.setup}</p>}
      {c.big && <p className={`chap-big${c.hers ? " hers" : ""}`}>{c.hers ? `“${c.big}”` : c.big}</p>}
      {c.hers && <p className="chap-sig">Dr Dolly Prasad</p>}
      {c.small && <p className="chap-small">{c.small}</p>}
    </>
  );
}

function ChapterView({ c, n }: { c: Chapter; n: number }) {
  const works = c.works.map((id) => BY_ID.get(id)!).filter(Boolean);
  const room = c.room ? TAILORED.find((r) => r.work === works[0]?.id && r.inPhoto) : undefined;
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII"][n];
  const head = (
    <div className="chap-h"><span>{roman}</span><h2>{c.title}</h2></div>
  );
  const body = room ? (
    <div className="chap-split">
      <Link className="roomshot" href={workPath(works[0].id)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={room.src} alt={`${works[0].title} in ${room.label.replace(/^An? /, (a) => a.toLowerCase())}`} loading="lazy" width={room.w} height={room.h} />
      </Link>
      <div className="txt">
        <Words c={c} />
        <p className={c.dark ? "chap-sig" : "meta"}>{works[0].title} · {works[0].medium}{works[0].size ? ` · ${works[0].size}` : ""}</p>
        <Link className="link" href={workPath(works[0].id)}>See the painting →</Link>
      </div>
    </div>
  ) : (
    <>
      <div className={`chap-works n${Math.min(works.length, 4)}`}>
        {works.map((w) => (
          <figure key={w.id}>
            <Link href={workPath(w.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="framed" src={works.length > 2 ? `/site/thumbs/${w.id}.jpg` : img(w.id)} alt={alt(w)} loading="lazy" {...wh(w.id)} />
            </Link>
            <figcaption>{w.title} · {w.medium}{w.status === "Sold" ? " · In a private collection" : ""}</figcaption>
          </figure>
        ))}
      </div>
      <Words c={c} />
    </>
  );
  return c.dark
    ? <section className="chap chap-dark"><div className="wrap">{head}{body}</div></section>
    : <section className="chap wrap">{head}{body}</section>;
}

export default async function SeriesStory({ params }: Props) {
  const s = SERIES_BY_SLUG.get((await params).slug);
  if (!s) notFound();
  const at = SERIES_PAGES.indexOf(s);
  const next = SERIES_PAGES[(at + 1) % SERIES_PAGES.length];
  const hero = BY_ID.get(s.hero)!;
  const works = worksIn(s.label);
  const photo = PHOTO[s.slug];
  return (
    <>
      <CollectionsSwitcher current={s.slug} />
      <section className="story-head wrap">
        <p className="eyebrow">{s.period} · {works.length} works</p>
        <h1>{s.label}</h1>
        <p className="lede">{s.line}</p>
      </section>

      <section className="story-hero">
        <Link href={workPath(hero.id)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="framed" src={img(hero.id)} alt={alt(hero)} fetchPriority="high" {...wh(hero.id)} />
        </Link>
        <p className="meta">{[hero.title, hero.medium, hero.size, shownYear(hero)].filter(Boolean).map((x, i, a) => (
          // each part stays whole; a dot only ever ends a line, never starts one. The space sits
          // between the spans (R4 B1-1), so the caption can wrap instead of pushing the page sideways.
          <Fragment key={i}><span style={{ whiteSpace: "nowrap" }}>{String(x)}{i < a.length - 1 ? " ·" : ""}</span>{i < a.length - 1 ? " " : ""}</Fragment>
        ))}</p>
      </section>

      {s.quote && (
        <section className="story-quote wrap">
          <p className="quote">“{s.quote}”</p>
          <p className="eyebrow" style={{ marginTop: 18 }}>Dr Dolly Prasad, on the collection</p>
        </section>
      )}

      {!s.quote && s.held && (
        <section className="story-quote wrap">
          <p className="quote">{s.held}</p>
        </section>
      )}

      <section className="story-intro wrap" style={s.quote || s.held ? undefined : { paddingTop: 48 }}>
        {s.intro.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      {s.chapters.map((c, i) => <ChapterView key={c.title} c={c} n={i} />)}

      {photo && (
        <section className="sec-tight wrap">
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt} loading="lazy" style={{ width: "100%", maxHeight: 560, objectFit: "cover" }} />
            <figcaption className="meta">{photo.cap}</figcaption>
          </figure>
        </section>
      )}


      <IndigoBand title="The paintings in this collection" href={`/works?series=${s.slug}`} label="Filter in all works">
        <div className="grid grid-5">{works.map((w) => <Card key={w.id} w={w} label={false} />)}</div>
      </IndigoBand>

      <section className="sec-tight wrap">
        <div className="next-series">
          <div className="ask">
            <b>Interested in one of these paintings?</b>
            <p className="meta">Prices on request. Ask about any painting here, or about her work in general.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {WHATSAPP && <a className="btn btn-wa" href={whatsappHref()}><ChatIcon />Ask on WhatsApp</a>}
              <Link className={WHATSAPP ? "btn" : "btn btn-solid"} href={enquireHref()}>Send an enquiry</Link>
            </div>
          </div>
          <Link className="go" href={`/series/${next.slug}`}>
            <span className="eyebrow" style={{ color: "inherit" }}>Next collection</span>
            <b>{next.label.includes(" ") ? <>{next.label.slice(0, next.label.lastIndexOf(" ") + 1)}<span className="nw">{next.label.slice(next.label.lastIndexOf(" ") + 1)} →</span></> : <span className="nw">{next.label} →</span>}</b>
          </Link>
        </div>
      </section>
    </>
  );
}

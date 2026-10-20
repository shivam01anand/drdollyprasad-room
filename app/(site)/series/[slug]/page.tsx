import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import CollectionsSwitcher from "@/components/site/CollectionsSwitcher";
import PrevNext from "@/components/site/PrevNext";
import RoomThumb from "@/components/site/RoomThumb";
import { notFound } from "next/navigation";
import Card from "@/components/site/Card";
import { LEAD, SERIES_BY_SLUG, SERIES_PAGES, featuredIds, seriesNeighbours, shownYear, statusText, worksIn, type Chapter } from "@/lib/site";
import { TAILORED } from "@/lib/rooms";
import { BY_ID, LARGE, workPath, type Work } from "@/lib/works";
import manifest from "@/public/art/manifest.json";

const DIM = new Map(manifest.works.map((d) => [d.id, d]));
const wh = (id: string) => { const d = DIM.get(id); return d ? { width: d.w, height: d.h } : {}; };
/** width / height of a painting (from the manifest), so its frame is reserved at its own shape */
const ar = (id: string) => { const d = DIM.get(id); return d ? d.w / d.h : 1; };

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
const PHOTO: Record<string, { src: string; alt: string; cap: string; w: number; h: number }> = {
  "gone-are-the-days": { src: "/site/ex/ihc-press-b.jpg", w: 1200, h: 803, alt: "Dr Dolly Prasad interviewed beside The Bullocks",
    cap: "Beside The Bullocks, in front of the cameras at Open Palm Court, India Habitat Centre, New Delhi, November 2010." },
  faith: { src: "/site/ex/iccr-02.jpg", w: 1080, h: 1080, alt: "Dr Dolly Prasad beside The Blue Buddha at ICCR",
    cap: "Beside The Blue Buddha at A Lifetime to Paint, ICCR, New Delhi, June 2010." },
};

const img = (id: string) => (LARGE.has(id) ? `/art/large/${id}.jpg` : `/art/works/${id}.jpg`);
const alt = (w: Work) => `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const arStyle = (id: string) => ({ ["--ar" as string]: ar(id).toFixed(4) }) as CSSProperties;

/** her words carry quote marks and her name; our lines (big, setup, small) never do */
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

function Room({ c, works }: { c: Chapter; works: Work[] }) {
  if (!c.room) return null;
  const w = works.find((x) => TAILORED.some((r) => r.work === x.id && r.inPhoto));
  const room = w && TAILORED.find((r) => r.work === w.id && r.inPhoto);
  if (!w || !room) return null;
  const where = room.label.replace(/^An? /, (a) => a.toLowerCase());
  return <RoomThumb src={room.src} thumb={room.thumb} alt={`${w.title} in ${where}`}
                    line={`${w.title}, in ${where}. A room study, not a photograph.`} />;
}

/**
 * R4 B3-3: one chapter component, two variants, all on white; the painting always leads.
 * A (single painting): painting 7/5 beside the text, flipping sides on every other single chapter.
 * B (several): the text left-aligned above one row of one height (a swipe strip on phones).
 */
function ChapterView({ c, n, flip }: { c: Chapter; n: number; flip: boolean }) {
  const works = c.works.map((id) => BY_ID.get(id)!).filter(Boolean);
  const head = (<><span className="chv-n">{ROMAN[n]}</span><h2 className="chv-t">{c.title}</h2></>);
  if (works.length === 1) {
    const w = works[0];
    const facts = [w.title !== c.title ? w.title : "", w.medium, w.size, w.status === "Sold" ? "In a private collection" : statusText(w)].filter(Boolean).join(" · ");
    return (
      <section className={`chap chv single${flip ? " flip" : ""}`} data-chapter>
        <div className="wrap chv-in">
          <div className="chv-art">
            <Link href={workPath(w.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="framed" src={img(w.id)} alt={alt(w)} loading="lazy" decoding="async" {...wh(w.id)} style={arStyle(w.id)} />
            </Link>
          </div>
          <div className="chv-txt">
            {head}
            <div className="chv-words"><Words c={c} /></div>
            <p className="chv-facts">{facts}</p>
            <Link className="link" href={workPath(w.id)}>See the painting →</Link>
            <Room c={c} works={works} />
          </div>
        </div>
      </section>
    );
  }
  // one height for the row: the row fits the content width on one line (cqw), never above 340 px;
  // --rs is the sum of the paintings' shapes, --rmax the widest (phones: the strip never runs wider than the screen)
  const rs = works.reduce((t, w) => t + ar(w.id), 0), rmax = Math.max(...works.map((w) => ar(w.id)));
  // a short row (two paintings: at 340 px it fills under 60 % of the 1,274 px content width) stands beside its text
  // instead of under it, so the chapter is not a half-empty band (S3 fill); phones are unchanged (the strip)
  const beside = (340 - 24) * rs + 48 * works.length - 24 <= 0.6 * 1274;
  return (
    <section className={`chap chv multi${beside ? " beside" : ""}`} data-chapter>
      <div className="wrap chv-in">
        <div className="chv-txt">
          {head}
          <div className="chv-words"><Words c={c} /></div>
          <Room c={c} works={works} />
        </div>
        <div className="chv-rowbox">
        <div className="chv-row" style={{ ["--n" as string]: works.length, ["--rs" as string]: rs.toFixed(4), ["--rmax" as string]: rmax.toFixed(4) } as CSSProperties}>
          {works.map((w) => (
            <figure key={w.id}>
              <Link href={workPath(w.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="framed thin" src={`/site/thumbs/${w.id}.jpg`} alt={alt(w)} loading="lazy" decoding="async" {...wh(w.id)} style={arStyle(w.id)} />
              </Link>
              <figcaption>{w.title}</figcaption>
            </figure>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

export default async function SeriesStory({ params }: Props) {
  const s = SERIES_BY_SLUG.get((await params).slug);
  if (!s) notFound();
  const nb = seriesNeighbours(s.slug);
  // Brand pick (R4 B3 rough, 4): Onset of Spring opens on its LEAD, so its one allowed repeat sits six chapters apart
  const cover = BY_ID.get(s.slug === "recent-work" ? (LEAD[s.slug] ?? s.hero) : s.hero)!;
  const works = worksIn(s.label);
  const photo = PHOTO[s.slug];
  const feat = featuredIds(s);
  // B3-4: only the paintings the chapters have not shown; no section at all when there are none
  const also = works.filter((w) => !feat.has(w.id));
  // Bandh Darwaze: the four doors together, as her note says they are made to be seen ("on one wall")
  const doors = s.slug === "bandh-darwaze" ? s.chapters.flatMap((c) => c.works).map((id) => BY_ID.get(id)!).filter(Boolean) : [];
  let singles = 0;
  return (
    <>
      <CollectionsSwitcher current={s.slug} />

      {/* B3-2: the opening, two columns: the words left, the cover right (one column on phones) */}
      <section className={`story-open wrap${doors.length ? " so-doors" : ""}`}>
        <div className="so-txt">
          <p className="eyebrow">{s.period} · {works.length} works</p>
          <h1>{s.label}</h1>
          <p className="lede">{s.line}</p>
          {s.quote ? (
            <blockquote className="so-epi hers">
              <p>“{s.quote}”</p>
              <p className="so-sig">Dr Dolly Prasad, on the collection</p>
            </blockquote>
          ) : s.held ? <p className="so-epi held">{s.held}</p> : null}
          <div className={`so-intro${photo ? " has-photo" : ""}`}>
            <div className="so-ps">{s.intro.slice(0, 2).map((p, i) => <p key={i} className="so-p">{p}</p>)}</div>
            {photo && (
              <figure className="so-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} decoding="async" />
                <figcaption>{photo.cap}</figcaption>
              </figure>
            )}
          </div>
        </div>
        <div className="so-art">
          {doors.length ? (
            <div className="so-grid">
              {doors.map((w) => (
                <Link key={w.id} href={workPath(w.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="framed" src={img(w.id)} alt={alt(w)} fetchPriority="high" {...wh(w.id)} style={arStyle(w.id)} />
                </Link>
              ))}
            </div>
          ) : (
            <figure>
              <Link href={workPath(cover.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="framed" src={img(cover.id)} alt={alt(cover)} fetchPriority="high" {...wh(cover.id)} style={arStyle(cover.id)} />
              </Link>
              <figcaption className="meta">{[cover.title, cover.medium, cover.size, shownYear(cover)].filter(Boolean).map((x, i, a) => (
                // each part stays whole; the space sits between the parts (R4 B1-1), so the caption wraps
                <Fragment key={i}><span style={{ whiteSpace: "nowrap" }}>{String(x)}{i < a.length - 1 ? " ·" : ""}</span>{i < a.length - 1 ? " " : ""}</Fragment>
              ))}</figcaption>
            </figure>
          )}
        </div>
      </section>

      {s.chapters.map((c, i) => {
        const single = c.works.length === 1;
        const flip = single && singles++ % 2 === 1;
        return <ChapterView key={c.title} c={c} n={i} flip={flip} />;
      })}

      {also.length > 0 && (
        <IndigoBand title="Also in this collection">
          <div className="also-row" data-also>{also.map((w) => <Card key={w.id} w={w} label={false} />)}</div>
        </IndigoBand>
      )}

      {/* B3-5: one ask line, then the collections pager (wrapping round, newest first) */}
      <section className="story-end wrap">
        <p className="se-ask">Interested in one of these paintings? <Link href="/enquire"><b>Send an enquiry</b></Link></p>
        <PrevNext label="Previous and next collection"
                  prev={{ href: `/series/${nb.prev.slug}`, kicker: "Previous collection", label: nb.prev.label }}
                  next={{ href: `/series/${nb.next.slug}`, kicker: "Next collection", label: nb.next.label }} />
      </section>
    </>
  );
}

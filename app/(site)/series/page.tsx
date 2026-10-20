import type { Metadata } from "next";
import { Fragment } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import Card, { thumb } from "@/components/site/Card";
import { ON_THE_WORK, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import { BY_ID } from "@/lib/works";
import { dims } from "@/lib/images";
import Marquee from "@/components/site/Marquee";
import SeriesSlides from "@/components/site/SeriesSlides";
import WallHero from "@/components/site/WallHero";
import FadeReel from "@/components/site/FadeReel";
import { WORKS } from "@/lib/works";
import { SERIES_WALL } from "@/components/site/Collage";

export const metadata: Metadata = {
  title: "Collections",
  description: "Dr Dolly Prasad’s five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her spring work.",
  alternates: { canonical: "/series" },
};

/** the overview: the five collections as large tiles, then each collection as a band of its own */
export default function SeriesIndex() {
  return (
    <>
      <WallHero columns={SERIES_WALL} label="The five collections" eyebrow="Five collections" title="Her Collections" red="Collections"
                sub={<>The everyday, held <span className="red">sacred</span>, in five collections.</>}>
        <a className="btn btn-solid" href="#gone-are-the-days">The five collections</a>
        <Link className="btn" href="/works">See all the works</Link>
      </WallHero>

      <section className="wrap" style={{ paddingBottom: 8 }}>
        <div className="ss-intro">
          <div className="ss-txt">
            <p className="eyebrow">Five collections</p>
            <h2>One painter, looking twice</h2>
            <ol className="ss-list">
              {SERIES_PAGES.map((s, i) => (
                <li key={s.slug}><span>{String(i + 1).padStart(2, "0")}</span>
                  <div><Link href={`/series/${s.slug}`}>{s.label}</Link><small>{s.line}</small></div></li>
              ))}
            </ol>
            <FadeReel items={WORKS.filter((w) => !SMALL_PHOTO.has(w.id)).map((w) => ({ id: w.id, title: w.title, src: thumb(w.id) }))} />
          </div>
          <SeriesSlides slides={SERIES_PAGES.map((s) => ({ slug: s.slug, label: s.label, n: worksIn(s.label).length, src: thumb(s.hero),
            alt: `${BY_ID.get(s.hero)?.title}, from ${s.label}`, ...dims(thumb(s.hero)) }))} />
        </div>
        <p className="quote series-sum-q">“{ON_THE_WORK}”<span className="eyebrow">Dr Dolly Prasad, on her work</span></p>
      </section>

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        const row = [...works].sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"))
          .filter((w) => !SMALL_PHOTO.has(w.id));
        return (
          <Fragment key={s.slug}>
          <section id={s.slug} className={`sband tone-${i % 3}`}>
            <div className="wrap srow">
              <div className="s-txt">
                <span className="s-n">{String(i + 1).padStart(2, "0")}</span>
                <h2><Link href={`/series/${s.slug}`}>{s.label}</Link></h2>
                <span className="eyebrow">{s.period} · {works.length} works</span>
                <p className="s-line">{s.line}</p>
                <Link className="btn" href={`/series/${s.slug}`}>Read the story</Link>
              </div>
              <div className="s-works">
                <Marquee seconds={Math.max(36, row.length * 9)} copies={row.length < 6 ? 6 : 4} reverse={i % 2 === 1} label={`Paintings from ${s.label}`} className="band-marq">
                  {row.map((w) => <Card key={w.id} w={w} label={false} />)}
                </Marquee>
              </div>
            </div>
          </section>
          </Fragment>
        );
      })}
      <IndigoBand title="Ask about a painting" line="Prices are on request. Write about any painting, or about her work in general." href="/enquire" label="Send an enquiry">
        <div className="ibnd-chips"><Link className="btn btn-light" href="/works">See all the works</Link><Link className="btn btn-light" href="/exhibitions">Exhibitions</Link></div>
      </IndigoBand>
    </>
  );
}

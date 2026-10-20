import type { Metadata } from "next";
import { Fragment } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import Card, { thumb } from "@/components/site/Card";
import { LEAD, ON_THE_WORK, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import { BY_ID } from "@/lib/works";
import { dims } from "@/lib/images";
import Marquee from "@/components/site/Marquee";
import FiveBlocks from "@/components/site/FiveBlocks";
import WallHero from "@/components/site/WallHero";
import { SERIES_WALL } from "@/components/site/Collage";

export const metadata: Metadata = {
  title: "Collections",
  description: "Dr Dolly Prasad’s five collections: Onset of Spring, Bandh Darwaze, Gone Are The Days, Portraits and Faith.",
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
        <div className="five-head">
          <p className="eyebrow">Five collections</p>
          <h2>A doctor’s eye, looking deeper into the everyday</h2>
        </div>
        <FiveBlocks blocks={SERIES_PAGES.map((s) => ({ slug: s.slug, label: s.label, n: worksIn(s.label).length, period: s.period,
          pics: [LEAD[s.slug] ?? s.hero, ...worksIn(s.label).map((w) => w.id).filter((id) => id !== (LEAD[s.slug] ?? s.hero) && !SMALL_PHOTO.has(id))]
            .map((id) => ({ src: thumb(id), alt: `${BY_ID.get(id)?.title}, from ${s.label}` })) }))} />
        <p className="quote series-sum-q">“{ON_THE_WORK}”<span className="eyebrow">Dr Dolly Prasad, on her work</span></p>
      </section>

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        const row = [...works].sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"))
          .filter((w) => !SMALL_PHOTO.has(w.id));
        return (
          <Fragment key={s.slug}>
          <section id={s.slug} className={`sband ${i % 2 ? "band-indigo" : "band-white"}`}>
            <div className="wrap srow">
              <div className="s-txt">
                <h2><Link href={`/series/${s.slug}`}>{s.label}</Link></h2>
                <span className="eyebrow">{s.period} · {works.length} works</span>
                <p className="s-line">{s.line}</p>
                <Link className={i % 2 ? "btn btn-light" : "btn"} href={`/series/${s.slug}`}>Read the story</Link>
              </div>
              <div className="s-works">
                <Marquee seconds={Math.max(36, row.length * 9)} copies={row.length < 6 ? 6 : 4} reverse={i % 2 === 1} label={`Paintings from ${s.label}`} className="band-marq">
                  {row.map((w) => <Card key={w.id} w={w} label={false} eager />)}
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

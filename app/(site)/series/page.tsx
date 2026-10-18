import type { Metadata } from "next";
import Link from "next/link";
import TitleBand from "@/components/site/TitleBand";
import Card, { thumb } from "@/components/site/Card";
import { ON_THE_WORK, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import { BY_ID } from "@/lib/works";
import { dims } from "@/lib/images";
import Marquee from "@/components/site/Marquee";

export const metadata: Metadata = {
  title: "Collections",
  description: "Dr Dolly Prasad’s five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her spring work.",
  alternates: { canonical: "/series" },
};

/** the overview: the five collections as large tiles, then each collection as a band of its own */
export default function SeriesIndex() {
  return (
    <>
      <div className="wrap">
        <TitleBand title="Collections" ids={SERIES_PAGES.flatMap((x) => worksIn(x.label).filter((w) => !SMALL_PHOTO.has(w.id)).slice(0, 2).map((w) => w.id))}>
          <p>Five collections, five walks of life: the India that is quietly leaving, closed doors, faith lived every day, working lives, and her spring work.</p>
        </TitleBand>
      </div>

      <section className="wrap" style={{ paddingBottom: 8 }}>
        <div className="big-tiles">
          {SERIES_PAGES.map((s) => (
            <Link key={s.slug} className="big-tile" href={`/series/${s.slug}`}>
              <span className="bt-img" style={{ ["--art" as string]: `url(${thumb(s.hero)})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="framed" src={thumb(s.hero)} alt={`${BY_ID.get(s.hero)?.title}, from ${s.label}`} {...dims(thumb(s.hero))} />
              </span>
              <b>{s.label}</b>
              <span className="meta">{worksIn(s.label).length} works · {s.period}</span>
            </Link>
          ))}
        </div>
        <p className="quote series-sum-q">“{ON_THE_WORK}”<span className="eyebrow">Dr Dolly Prasad, on her work</span></p>
      </section>

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        const row = [...works].sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"))
          .filter((w) => !SMALL_PHOTO.has(w.id));
        return (
          <section key={s.slug} id={s.slug} className={`sband tone-${i % 3}`}>
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
        );
      })}
    </>
  );
}

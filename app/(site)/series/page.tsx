import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/site/Card";
import WallHero from "@/components/site/WallHero";
import { SERIES_WALL } from "@/components/site/Collage";
import { ON_THE_WORK, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import { WORKS } from "@/lib/works";

export const metadata: Metadata = {
  title: "Series",
  description: "Dr Dolly Prasad’s five series: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her recent work.",
  alternates: { canonical: "/series" },
};

/** the overview: a moving wall of the five series, then each series as a band of its own */
export default function SeriesIndex() {
  return (
    <>
      <WallHero columns={SERIES_WALL} label="The five series" eyebrow={`Five series · ${WORKS.length} paintings`} title="Series"
                held="Five ways of looking at everyday India">
        <a className="btn btn-solid" href="#gone-are-the-days">The five series</a>
        <Link className="btn" href="/works">See all {WORKS.length} works</Link>
      </WallHero>

      <section className="wrap series-sum">
        <p className="ex-sum">Five series, five walks of life. The things India is quietly leaving behind. The closed doors of old houses. Faith, as it is lived every day. The faces of working lives. And her recent turn inward, among flowers, leaves and birds.</p>
        <p className="quote series-sum-q">“{ON_THE_WORK}”<span className="eyebrow">Dr Dolly Prasad, on her work</span></p>
        <nav className="ex-jump" aria-label="Go to a series">
          {SERIES_PAGES.map((s) => <a key={s.slug} href={`#${s.slug}`}>{s.label} <span>{worksIn(s.label).length}</span></a>)}
        </nav>
      </section>

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        // a row shows four, available first, then the rest of the series
        const row = [...works].sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"))
          .filter((w) => !SMALL_PHOTO.has(w.id))
          .slice(0, 4);
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
                <div className="grid">{row.map((w) => <Card key={w.id} w={w} label={false} />)}</div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

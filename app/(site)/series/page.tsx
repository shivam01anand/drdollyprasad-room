import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/site/Card";
import { ON_THE_WORK, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";

export const metadata: Metadata = {
  title: "Series",
  description: "Dr Dolly Prasad’s five series: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her recent work.",
  alternates: { canonical: "/series" },
};

/** the overview: each series as a statement and a row of its works; the story is one click on */
export default function SeriesIndex() {
  return (
    <div className="wrap">
      <section className="sec-tight" style={{ paddingBottom: 16 }}>
        <h1 className="page-title">Series</h1>
        <p className="lede quote" style={{ fontSize: 26 }}>“{ON_THE_WORK}”</p>
        <nav className="jump" aria-label="Go to a series">
          {SERIES_PAGES.map((s) => <Link key={s.slug} href={`/series/${s.slug}`}>{s.label} →</Link>)}
        </nav>
      </section>
      <section style={{ paddingBottom: 48 }}>
        {SERIES_PAGES.map((s) => {
          const works = worksIn(s.label);
          // a row shows four, available first, then the rest of the series
          const row = [...works].sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"))
            .filter((w) => !SMALL_PHOTO.has(w.id))
            .slice(0, 4);
          return (
            <div key={s.slug} className="srow">
              <div className="s-txt">
                <h2><Link href={`/series/${s.slug}`}>{s.label}</Link></h2>
                <span className="eyebrow">{s.period} · {works.length} works</span>
                <p className="meta" style={{ fontSize: 16 }}>{s.line}</p>
                <Link className="link" href={`/series/${s.slug}`}>Read the story →</Link>
              </div>
              <div className="s-works">
                <div className="grid">{row.map((w) => <Card key={w.id} w={w} label={false} />)}</div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

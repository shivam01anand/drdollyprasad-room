import type { Metadata } from "next";
import { Fragment } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import Card from "@/components/site/Card";
import { LEAD, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import Marquee from "@/components/site/Marquee";
import CollectionsSwitcher from "@/components/site/CollectionsSwitcher";
import WallHero from "@/components/site/WallHero";
import { SERIES_HERO_WALL } from "@/components/site/Collage";

export const metadata: Metadata = {
  title: "Collections",
  description: "Dr Dolly Prasad’s five collections: Onset of Spring, Bandh Darwaze, Gone Are The Days, Portraits and Faith.",
  alternates: { canonical: "/series" },
};


/**
 * R4 B3-1: the overview. Collage hero (one button) -> the collections switcher (navigation) -> the five
 * collections as bands, newest first (content) -> one Ask row. The five appear twice: switcher and bands.
 */
export default function SeriesIndex() {
  return (
    <>
      <WallHero size="dir" columns={SERIES_HERO_WALL} label="The five collections" eyebrow="Five collections" title="Her Collections" red="Collections"
                sub={<>The everyday, held <span className="red">sacred</span>, in five collections.</>}>
        <Link className="btn btn-solid" href="/series/recent-work">Start with the newest</Link>
      </WallHero>

      <CollectionsSwitcher />

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        // the row opens on the collection's lead painting (unchanged), then the rest, sold last
        const lead = LEAD[s.slug] ?? s.hero;
        const rest = works.filter((w) => w.id !== lead && !SMALL_PHOTO.has(w.id))
          .sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold"));
        const row = [...works.filter((w) => w.id === lead), ...rest];
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
      {/* Chief Content 2c §2: the same line, word for word, as the story pages' ask row */}
      <IndigoBand title="Ask about a painting" line="Prices on request. Ask about any painting here, or about her work in general.">
        <div className="ibnd-one"><Link className="btn btn-solid btn-on-indigo" href="/enquire">Send an enquiry</Link></div>
      </IndigoBand>
    </>
  );
}

import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import { Fragment } from "react";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import Card from "@/components/site/Card";
import { LEAD, SERIES_PAGES, SMALL_PHOTO, worksIn } from "@/lib/site";
import Marquee from "@/components/site/Marquee";
import CollectionsSwitcher from "@/components/site/CollectionsSwitcher";
import PageHead from "@/components/site/PageHead";

const TITLE = "Collections";
const DESCRIPTION = "Dr Dolly Prasad’s five collections: Bahaar, Bandh Darwaze, Gone Are The Days, Portraits and Faith. Forty-one paintings of the everyday, held sacred.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/series" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/series"),
};


/**
 * R4 B3-1: the overview. Collage hero (one button) -> the collections switcher (navigation) -> the five
 * collections as bands, newest first (content) -> one Ask row. The five appear twice: switcher and bands.
 */
export default function SeriesIndex() {
  return (
    <>
      <PageHead eyebrow={<>The everyday, held <span className="red">sacred</span></>} title="Collections" red="Collections"
                line="Each collection keeps to one side of the same ordinary day and stays there long enough to see what it holds, beginning with a thought kept back in spring.">
        <Link className="btn btn-solid" href="/series/bahaar">Start with Bahaar</Link>
      </PageHead>

      <CollectionsSwitcher />

      {SERIES_PAGES.map((s, i) => {
        const works = worksIn(s.label);
        // the row opens on the collection's lead painting (unchanged), then the rest, sold last
        const lead = LEAD[s.slug] ?? s.hero;
        // Sabr opens the Portraits story (2026-11-22), so its small photo stays in the band; the other small photos stay out
        const rest = works.filter((w) => w.id !== lead && (w.id === "elder-woman-portrait" || !SMALL_PHOTO.has(w.id)))
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

import type { Metadata } from "next";
import Link from "next/link";
import IndigoBand from "@/components/site/IndigoBand";
import { SERIES_PAGES } from "@/lib/site";
import WallHero from "@/components/site/WallHero";
import { WORKS_WALL } from "@/components/site/Collage";
import WorksBrowser from "@/components/site/WorksBrowser";
import { INSTAGRAM } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Works",
  description: `All ${WORKS.length} paintings by Dr Dolly Prasad, in five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her spring work.`,
  alternates: { canonical: "/works" },
};


/** the works page opens on the paintings themselves: a title, one line, then the grid */
export default function WorksPage() {
  return (
    <>
    <WallHero columns={WORKS_WALL} label="Her paintings" eyebrow="Oil on canvas" title="Her Works" red="Works"
              held={`All ${WORKS.length} paintings, in five collections.`}>
      <a className="btn btn-solid" href="#all">See the paintings</a>
      <Link className="btn" href="/enquire">Enquire</Link>
    </WallHero>
    <section id="all" style={{ scrollMarginTop: 110 }}>
      <WorksBrowser />
    </section>
    <div className="wrap">
      <section className="sec-tight">
        <a className="note ig-note" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
           style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
          <b>The stories behind each painting are on Instagram</b>
          <span className="link" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><InstagramIcon />{INSTAGRAM.handle} →</span>
        </a>
        <p className="meta" style={{ marginTop: 18 }}>Looking for something in particular? <Link href="/enquire">Ask about a painting</Link>, or see <Link href="/series">the five collections</Link>.</p>
      </section>
    </div>
    <IndigoBand title="Key collections" line="Five collections, one habit: look at an ordinary thing twice." href="/series" label="All collections">
      <div className="ibnd-chips">{SERIES_PAGES.map((s) => <Link key={s.slug} className="btn btn-light" href={`/series/${s.slug}`}>{s.label}</Link>)}</div>
    </IndigoBand>
    </>
  );
}

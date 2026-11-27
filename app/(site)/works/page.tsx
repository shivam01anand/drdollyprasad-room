import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import IndigoBand from "@/components/site/IndigoBand";
import { SERIES_PAGES } from "@/lib/site";
import WallHero from "@/components/site/WallHero";
import { WORKS_WALL } from "@/components/site/Collage";
import WorksBrowser from "@/components/site/WorksBrowser";
import { INSTAGRAM } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

const TITLE = "Works";
const DESCRIPTION = `All ${WORKS.length} paintings by Dr Dolly Prasad, in five collections: Bahaar, Bandh Darwaze, Gone Are The Days, Portraits and Faith.`;
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/works" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/works"),
};


/** the works page opens on the paintings themselves: a title, one line, then the grid */
export default function WorksPage() {
  return (
    <>
    <WallHero columns={WORKS_WALL} label="Her paintings" title="Works" red="Works"
              held={`All ${WORKS.length} paintings on one wall. Walk it at your own pace.`}>
      <a className="btn btn-solid" href="#all">See the paintings</a>
    </WallHero>
    <section id="all" style={{ scrollMarginTop: 110 }}>
      <WorksBrowser />
    </section>
    <div className="wrap">
      <section className="sec-tight">
        <a className="note ig-note" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
           style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
          <b>Follow {INSTAGRAM.handle} on Instagram</b>
          <span className="link" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><InstagramIcon />{INSTAGRAM.handle} →</span>
        </a>
        <p className="meta" style={{ marginTop: 18 }}>Looking for one painting in particular? <Link href="/enquire">Ask about it</Link>, or read <Link href="/series">the stories behind the collections</Link>.</p>
      </section>
    </div>
    <IndigoBand title="The collections" line="Each collection tells its own story. Start with the painting that stopped you." href="/series" label="All collections">
      <div className="ibnd-chips">{SERIES_PAGES.map((s) => <Link key={s.slug} className="btn btn-light" href={`/series/${s.slug}`}>{s.label}</Link>)}</div>
    </IndigoBand>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import WorksBrowser from "@/components/site/WorksBrowser";
import { INSTAGRAM } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Works",
  description: `All ${WORKS.length} paintings by Dr Dolly Prasad, in five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her recent work.`,
  alternates: { canonical: "/works" },
};

/** the works page opens on the paintings themselves: a title, one line, then the grid */
export default function WorksPage() {
  return (
    <div className="wrap">
      <section className="sec-tight" style={{ paddingBottom: 24 }}>
        <h1 className="page-title">Works</h1>
        <p className="lede">All {WORKS.length} paintings, in five collections. Prices on request.</p>
      </section>
      <section id="all" style={{ scrollMarginTop: 110 }}>
        <WorksBrowser />
      </section>
      <section className="sec-tight">
        <a className="note ig-note" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
           style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
          <b>The stories behind each painting are on Instagram</b>
          <span className="link" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><InstagramIcon />{INSTAGRAM.handle} →</span>
        </a>
        <p className="meta" style={{ marginTop: 18 }}>Looking for something in particular? <Link href="/enquire">Ask about a painting</Link>, or see <Link href="/series">the five collections</Link>.</p>
      </section>
    </div>
  );
}

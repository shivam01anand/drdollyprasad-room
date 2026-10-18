import type { Metadata } from "next";
import Link from "next/link";
import TitleBand from "@/components/site/TitleBand";
import WorksBrowser from "@/components/site/WorksBrowser";
import { INSTAGRAM } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Works",
  description: `All ${WORKS.length} paintings by Dr Dolly Prasad, in five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her spring work.`,
  alternates: { canonical: "/works" },
};

const BAND = ["bulls-and-wheel", "temple-bells", "red-turban-portrait", "offering-of-light", "weathered-door-ring", "boy-with-bananas", "postbox-and-stamps", "three-veiled-women", "woman-with-bird", "coins-and-clay-bank"];

/** the works page opens on the paintings themselves: a title, one line, then the grid */
export default function WorksPage() {
  return (
    <div className="wrap">
      <TitleBand title="Works" ids={BAND}>
        <p>All {WORKS.length} paintings, in five collections. Prices on request.</p>
      </TitleBand>
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

import type { Metadata } from "next";
import Link from "next/link";
import WorksBrowser from "@/components/site/WorksBrowser";
import WallHero from "@/components/site/WallHero";
import { P, type Item } from "@/components/site/Collage";
import { INSTAGRAM, SMALL_PHOTO } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Works",
  description: `All ${WORKS.length} paintings by Dr Dolly Prasad, in five collections: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her recent work.`,
  alternates: { canonical: "/works" },
};

/** every painting, dealt into seven columns for the soft wall behind the opening */
const SHOWN = WORKS.filter((w) => !SMALL_PHOTO.has(w.id));
const WALL: Item[][] = Array.from({ length: 7 }, (_, c) => SHOWN.filter((_, i) => i % 7 === c).map((w) => P(w.id)));

export default function WorksPage() {
  return (
    <>
      <WallHero columns={WALL} label="All her paintings" soft eyebrow="Oil on canvas · New Delhi" title="The paintings"
                held="Five collections, one way of seeing"
                sub="Forty-one paintings: the India that is quietly leaving, closed doors, faith as daily practice, the faces of working lives and her recent turn inward. Many now hang with private collectors in India, the USA and London. Prices on request.">
        <a className="btn btn-solid" href="#all">Browse them all</a>
        <Link className="btn" href="/series">The collections</Link>
      </WallHero>
      <div className="wrap" id="all" style={{ scrollMarginTop: 110 }}>
        <section style={{ paddingTop: 36 }}>
          <WorksBrowser />
        </section>
        <section className="sec-tight">
          <a className="note ig-note" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
             style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
            <b>The stories behind each painting are on Instagram</b>
            <span className="link" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><InstagramIcon />{INSTAGRAM.handle} →</span>
          </a>
          <p className="meta" style={{ marginTop: 18 }}>Looking for something in particular? <Link href="/enquire">Ask about a painting</Link>.</p>
        </section>
      </div>
    </>
  );
}

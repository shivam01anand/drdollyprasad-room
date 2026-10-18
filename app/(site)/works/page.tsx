import type { Metadata } from "next";
import Link from "next/link";
import WorksBrowser from "@/components/site/WorksBrowser";
import { INSTAGRAM } from "@/lib/site";
import { WORKS } from "@/lib/works";
import { InstagramIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Works",
  description: `All ${WORKS.length} paintings by Dr Dolly Prasad, by series, with what is available.`,
  alternates: { canonical: "/works" },
};

export default function WorksPage() {
  const sold = WORKS.filter((w) => w.status === "Sold").length;
  return (
    <div className="wrap">
      <section className="sec-tight" style={{ paddingBottom: 12 }}>
        <h1 className="page-title">Works</h1>
        <p className="lede">{WORKS.length} paintings · 5 series · {WORKS.length - sold} available · {sold} sold. Prices on request.</p>
      </section>
      <WorksBrowser />
      <section className="sec-tight">
        <a className="note ig-note" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
           style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
          <b>The stories behind each painting are on Instagram</b>
          <span className="link" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><InstagramIcon />{INSTAGRAM.handle} →</span>
        </a>
        <p className="meta" style={{ marginTop: 18 }}>Looking for something in particular? <Link href="/enquire">Ask about a painting</Link>.</p>
      </section>
    </div>
  );
}

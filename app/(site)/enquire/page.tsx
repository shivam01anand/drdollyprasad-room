import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import EnquireForm from "@/components/site/EnquireForm";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import { SERIES_PAGES } from "@/lib/site";

const TITLE = "Enquire";
const DESCRIPTION = "Ask Dr Dolly Prasad about a painting or an exhibition.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/enquire" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/enquire"),
};

export default function Enquire() {
  return (
    <>
    <div className="wrap">
      <section className="page-head">
        <h1 className="page-title">Enquire</h1>
        <p className="lede">A painting you would like to know more about, an exhibition, or the press. Prices are on request.</p>
      </section>
      <EnquireForm />
    </div>
    <IndigoBand title="The collections" line="Not sure which painting yet? Spend a while with the collections first." href="/series" label="All collections">
      <div className="ibnd-chips">{SERIES_PAGES.map((s) => <Link key={s.slug} className="btn btn-light" href={`/series/${s.slug}`}>{s.label}</Link>)}</div>
    </IndigoBand>
    </>
  );
}

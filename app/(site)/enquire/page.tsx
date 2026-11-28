import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import EnquireForm from "@/components/site/EnquireForm";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import { SERIES_PAGES } from "@/lib/site";

const TITLE = "Enquire";
const DESCRIPTION = "Write to ask about a painting by Dr Dolly Prasad, its price and details, or an exhibition. Every painting can be shipped worldwide.";
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
        <p className="lede">Found a painting you would like to live with? Write by email for its price and details. Every painting can be shipped worldwide.</p>
      </section>
      <EnquireForm />
    </div>
    <IndigoBand title="The collections" line="Not sure which painting yet? Spend a while with the collections first." href="/series" label="All collections">
      <div className="ibnd-chips">{SERIES_PAGES.map((s) => <Link key={s.slug} className="btn btn-light" href={`/series/${s.slug}`}>{s.label}</Link>)}</div>
    </IndigoBand>
    </>
  );
}

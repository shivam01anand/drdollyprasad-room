import type { Metadata } from "next";
import EnquireForm from "@/components/site/EnquireForm";
import IndigoBand from "@/components/site/IndigoBand";
import Link from "next/link";
import { SERIES_PAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Enquire",
  description: "Ask Dr Dolly Prasad about a painting, a commission or an exhibition.",
  alternates: { canonical: "/enquire" },
};

export default function Enquire() {
  return (
    <>
    <div className="wrap">
      <section className="page-head">
        <h1 className="page-title">Enquire</h1>
        <p className="lede">A painting you would like to know more about, an exhibition, the press, or a commission. Prices are on request.</p>
      </section>
      <EnquireForm />
    </div>
    <IndigoBand title="Key collections" line="Look first, then ask: five collections, each with its own story." href="/series" label="All collections">
      <div className="ibnd-chips">{SERIES_PAGES.map((s) => <Link key={s.slug} className="btn btn-light" href={`/series/${s.slug}`}>{s.label}</Link>)}</div>
    </IndigoBand>
    </>
  );
}

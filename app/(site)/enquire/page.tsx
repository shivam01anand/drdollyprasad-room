import type { Metadata } from "next";
import EnquireForm from "@/components/site/EnquireForm";

export const metadata: Metadata = {
  title: "Enquire",
  description: "Ask Dr Dolly Prasad about a painting, a commission or an exhibition.",
  alternates: { canonical: "/enquire" },
};

export default function Enquire() {
  return (
    <div className="wrap">
      <section className="sec-tight" style={{ paddingBottom: 0 }}>
        <h1 className="page-title">Enquire</h1>
        <p className="lede">Ask about a painting, a commission, an exhibition or the press. Prices are on request.</p>
      </section>
      <EnquireForm />
    </div>
  );
}

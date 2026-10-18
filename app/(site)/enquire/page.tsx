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
        <p className="lede">A painting you would like to know more about, an exhibition, the press, or a commission. Prices are on request.</p>
      </section>
      <EnquireForm />
    </div>
  );
}

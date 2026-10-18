import type { Metadata } from "next";
import Link from "next/link";
import { BIO_LINE, BIO_SUB, ON_THE_WORK, PORTRAIT_LARGE, STATEMENT, STUDIO_PATH, VENUES } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Dr Dolly Prasad paints in oil on canvas in New Delhi: the everyday, held sacred. Eighteen solo exhibitions, 2005–2018.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="wrap">
      <section className="about-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PORTRAIT_LARGE} alt="Dr Dolly Prasad beside one of her paintings at the First International Kala Mela" />
        <div className="txt">
          <p className="eyebrow">About the artist</p>
          <h1 className="page-title">Dr Dolly Prasad</h1>
          <p className="quote" style={{ fontSize: 32 }}>{BIO_LINE}</p>
          <p className="lede" style={{ marginTop: 0 }}>{BIO_SUB}</p>
        </div>
      </section>

      <section className="prose" style={{ margin: "0 auto", paddingBottom: 24 }}>
        <p>Dr Dolly Prasad paints in oil on canvas in New Delhi. Her paintings stay with the people, objects and gestures that daily life tends to pass by: a rickshaw puller and a twenty-paise coin, a closed door, a lamp raised to a wall of scripture, a child under banana leaves.</p>
        <p>She is as much an artist as she is a doctor, and the play of emotions — on the faces around her and on the canvas — has always fascinated her.</p>
        <p>She has held eighteen solo exhibitions between 2005 and 2018, at venues including {VENUES.slice(0, -1).join(", ")} and {VENUES.at(-1)}. Her work is in private collections in India, the USA, New York and London.</p>
      </section>

      <section>
        <div className="poem" aria-label="Artist’s statement">
          {STATEMENT.map((l) => <span key={l} style={{ display: "block" }}>{l}</span>)}
          <span className="eyebrow" style={{ display: "block", fontStyle: "normal", marginTop: 22 }}>Artist’s statement</span>
        </div>
      </section>

      <section className="sec-tight" style={{ textAlign: "center" }}>
        <p className="quote" style={{ fontSize: 28, maxWidth: 860, margin: "0 auto" }}>“{ON_THE_WORK}”</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
          <Link className="btn btn-solid" href="/works">See her work</Link>
          <Link className="btn" href="/exhibitions">Exhibitions</Link>
          <a className="btn" href={STUDIO_PATH}>Walk through the studio</a>
        </div>
      </section>
    </div>
  );
}

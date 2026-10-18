import type { Metadata } from "next";
import Link from "next/link";
import {
  ABOUT_THE_WORK, BIO_LINE, BIO_SUB, ON_THE_WORK, PORTRAIT_LARGE, RECORD_LINE, STATEMENT, STUDIO_PATH, THREADS,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Dr Dolly Prasad is a doctor and a painter in New Delhi. Oil on canvas: the everyday, held sacred. Eighteen exhibitions and art fairs, 2005–2018.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="wrap">
      <section className="about-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PORTRAIT_LARGE} alt="Dr Dolly Prasad beside one of her paintings at the First International Kala Mela, 2018" />
        <div className="txt">
          <p className="eyebrow">About the artist</p>
          <h1 className="page-title">Dr Dolly Prasad</h1>
          <p className="quote" style={{ fontSize: 32 }}>{BIO_LINE}</p>
          <p className="lede" style={{ marginTop: 0 }}>{BIO_SUB}</p>
        </div>
      </section>

      <section className="prose" style={{ margin: "0 auto", paddingBottom: 24 }}>
        <p>Dr Dolly Prasad is a doctor and a painter, and lives and works in New Delhi. She paints in oil on canvas, in series: Gone Are The Days, Bandh Darwaze, Faith, Portraits and her recent work.</p>
        <p>She is as much an artist as a doctor. The play of emotion on the faces around her, and on canvas, has always held her.</p>
        <p>{RECORD_LINE}, from Triveni Kala Sangam, India Habitat Centre and ICCR to the First International Kala Mela. Her paintings are in private collections in India, the USA and London.</p>
      </section>

      <section className="statement" aria-labelledby="statement-h">
        <p className="eyebrow">Artist’s statement</p>
        <h2 id="statement-h" className="sr-only">Artist’s statement</h2>
        <p className="statement-open">{ABOUT_THE_WORK[0]}</p>
        {ABOUT_THE_WORK.slice(1).map((p) => <p key={p} className="statement-p">{p}</p>)}
        <div className="threads">
          {THREADS.map((t) => (
            <div key={t.t}>
              <b>{t.t}</b>
              <p>{t.d}</p>
            </div>
          ))}
        </div>
        <p className="statement-p">Red runs through all of it: turbans and veils, threads and doors, the earth of terracotta.</p>
        <p className="statement-close">{BIO_LINE}</p>
      </section>

      <section>
        <div className="poem" aria-label="In her words">
          <span className="eyebrow" style={{ display: "block", fontStyle: "normal", marginBottom: 22 }}>In her words</span>
          {STATEMENT.map((l) => <span key={l} style={{ display: "block" }}>{l}</span>)}
        </div>
      </section>

      <section className="sec-tight" style={{ textAlign: "center" }}>
        <p className="quote" style={{ fontSize: 28, maxWidth: 860, margin: "0 auto" }}>“{ON_THE_WORK}”</p>
        <p className="eyebrow" style={{ marginTop: 14 }}>Dr Dolly Prasad, on her work</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
          <Link className="btn btn-solid" href="/works">See her work</Link>
          <Link className="btn" href="/exhibitions">Exhibitions</Link>
          <a className="btn" href={STUDIO_PATH}>Walk through the studio</a>
        </div>
      </section>
    </div>
  );
}

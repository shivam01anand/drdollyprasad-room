import type { Metadata } from "next";
import Link from "next/link";
import Until from "@/components/Until";
import Slideshow from "@/components/site/Slideshow";
import { NOW, PRESS, RECORD, RECORD_LINE, SHOWS } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Dr Dolly Prasad’s exhibitions: eighteen exhibitions and art fairs, 2005–2018 — India Habitat Centre (2010), A Lifetime to Paint at ICCR (2010), the First International Kala Mela (2018), Triveni Kala Sangam (2007) and more.",
  alternates: { canonical: "/exhibitions" },
};

const years = [...new Set(RECORD.map((r) => r.year))];

export default function Exhibitions() {
  return (
    <div className="wrap">
      <section className="ex-head">
        <p className="eyebrow">Exhibitions</p>
        <h1 className="page-title">When the paintings meet people</h1>
        <p className="lede">{RECORD_LINE}, in Delhi, Gurgaon, Jaipur and Bombay. Here are the shows the archive remembers best — in photographs, invitations and television — and the full record below.</p>
        <nav className="ex-jump" aria-label="On this page">
          {SHOWS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title.replace(/^An evening at /, "")} <span>{s.year}</span></a>)}
          <a href="#on-screen">On screen</a>
          <a href="#record">The record</a>
        </nav>
      </section>

      <Until until={NOW.until}>
        <section id={NOW.id} style={{ paddingBottom: 24 }}>
          <div className="now-box">
            <div className="txt">
              <span className="eyebrow" style={{ color: "inherit" }}>Now showing</span>
              <h2>{NOW.title}</h2>
              <p>{NOW.city} · {NOW.when}</p>
              <p>{NOW.line}</p>
            </div>
            <div className="imgs">
              {NOW.works.map((id) => (
                <Link key={id} href={workPath(id)} aria-label={BY_ID.get(id)?.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/site/thumbs/${id}.jpg`} alt={BY_ID.get(id)?.title ?? ""} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Until>

      {SHOWS.map((s, k) => (
        <section key={s.id} id={s.id} className={`ex-show${k % 2 ? " flip" : ""}`}>
          <div className="ex-txt">
            <span className="eyebrow rust">{s.kind}</span>
            <h2>{s.title}</h2>
            <p className="ex-where">{s.venue}, {s.city}<br /><b>{s.when}</b></p>
            <p className="ex-lede">{s.lede}</p>
            {s.quote && (
              <figure className="ex-quote">
                <blockquote>“{s.quote}”</blockquote>
                <figcaption className="eyebrow">Dr Dolly Prasad, on her exhibitions</figcaption>
              </figure>
            )}
            {s.works && s.works.length > 0 && (
              <p className="ex-works">
                <span className="eyebrow">On the walls</span>
                {s.works.map((id) => <Link key={id} href={workPath(id)}>{BY_ID.get(id)?.title}</Link>)}
              </p>
            )}
            {s.note && <p className="meta">{s.note}</p>}
          </div>
          <Slideshow albums={s.albums} label={`Photographs: ${s.title}`} />
        </section>
      ))}

      <section id="on-screen" className="ex-screen">
        <div className="sec-head">
          <div>
            <p className="eyebrow">From the archive</p>
            <h2>On screen, and in the papers</h2>
          </div>
        </div>
        <div className="ex-screen-grid">
          {PRESS.clips.map((c) => (
            <figure key={c.src} className="clip">
              <video controls preload="none" playsInline poster={c.poster} aria-label={c.title}>
                <source src={c.src} type="video/mp4" />
              </video>
              <figcaption><b>{c.title}</b><span>{c.line}</span><em>Original broadcast sound.</em></figcaption>
            </figure>
          ))}
          <figure className="clip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PRESS.clipping.src} alt={PRESS.clipping.alt} loading="lazy" />
            <figcaption><b>Delhi Times · Art Today And Tomorrow</b><span>{PRESS.clippingLine}</span></figcaption>
          </figure>
        </div>
      </section>

      <section id="record" className="ex-record">
        <div className="sec-head">
          <div>
            <p className="eyebrow">The record</p>
            <h2>{RECORD_LINE}</h2>
          </div>
        </div>
        <ol className="timeline">
          {years.map((y) => (
            <li key={y}>
              <span className="tl-year">{y}</span>
              <ul>
                {RECORD.filter((r) => r.year === y).map((r) => (
                  <li key={`${r.venue}-${r.month ?? ""}`}>
                    {r.show ? <a href={`#${r.show}`}>{r.venue}</a> : <span>{r.venue}</span>}
                    <small>{[r.city, r.month].filter(Boolean).join(" · ")}</small>
                    {r.show && <a className="tl-photos" href={`#${r.show}`}>Photographs ↑</a>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="meta" style={{ marginTop: 18 }}>As listed in her own record. Galleries and art fairs are listed together; dates are given as precisely as the record gives them.</p>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Until from "@/components/Until";
import Slideshow from "@/components/site/Slideshow";
import TitleBand from "@/components/site/TitleBand";
import { NOW, PRESS, RECORD, RECORD_LINE, SHOWS } from "@/lib/site";
import { BY_ID, WORKS, workPath } from "@/lib/works";
import { dims } from "@/lib/images";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Dr Dolly Prasad’s exhibitions: eighteen exhibitions and art fairs, 2005 to 2018, including India Habitat Centre (2010), A Lifetime to Paint at ICCR (2010), the First International Kala Mela (2018), Triveni Kala Sangam (2007) and more.",
  alternates: { canonical: "/exhibitions" },
};

const years = [...new Set(RECORD.map((r) => r.year))];
const BAND = ["monks-and-blue-buddha", "bulls-and-wheel", "rickshaw-rest-framed", "coins-and-clay-bank", "temple-bells", "rickshaw-puller-and-coin", "boy-with-bananas", "mother-india-and-kettles"];

export default function Exhibitions() {
  return (
    <div className="wrap">
      <TitleBand title="Exhibitions" ids={BAND}>
        <p><b>{RECORD_LINE}</b>, in Delhi, Gurgaon, Jaipur and Bombay. Her paintings are with private collectors in India, the USA and the UK.</p>
      </TitleBand>

      <Until until={NOW.until}>
        <section id={NOW.id} className="now-line" aria-label="Now showing">
          <span className="live"><i aria-hidden="true" />Now showing</span>
          <b>{NOW.title}</b>
          <span>{NOW.address} · {NOW.when}</span>
          <span className="now-works">{NOW.works.map((id) => (
            <Link key={id} href={workPath(id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="framed thin" src={`/site/thumbs/sm/${id}.jpg`} alt={BY_ID.get(id)?.title ?? ""} {...dims(`/site/thumbs/sm/${id}.jpg`)} />
            </Link>
          ))}</span>
        </section>
      </Until>

      <nav className="ex-jump" aria-label="On this page">
        {SHOWS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title} <span>{s.year}</span></a>)}
        <a href="#on-screen">In the news</a>
        <a href="#record">The record</a>
      </nav>

      {SHOWS.map((s, k) => (
        <section key={s.id} id={s.id} className={`ex-show${k % 2 ? " flip" : ""}`}>
          <div className="ex-txt">
            <p className="ex-kind">{s.kind} · {s.when}</p>
            <h2>{s.title}</h2>
            <p className="ex-where">{s.name && <><i>{s.name}</i><br /></>}{s.venue}, {s.city}</p>
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
            <h2>In the news</h2>
            <p className="lede" style={{ marginTop: 10 }}>Her exhibitions have been covered on television and listed in the papers. Here are two television reports and a page from Delhi Times.</p>
          </div>
        </div>
        <div className="ex-screen-grid">
          {PRESS.clips.map((c) => (
            <figure key={c.src} className="clip">
              <video controls preload="none" playsInline poster={c.poster} aria-label={c.title}>
                <source src={c.src} type="video/mp4" />
              </video>
              <figcaption><b>{c.title}</b><span>{c.line}</span></figcaption>
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
      </section>

      <section className="sec-tight">
        <div className="next-series">
          <div className="ask">
            <b>See the paintings that hung on these walls</b>
            <p className="meta">All {WORKS.length} works, with the ones still available. Prices on request.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btn-solid" href="/works">See the works</Link>
              <Link className="btn" href="/enquire">Enquire about an exhibition</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

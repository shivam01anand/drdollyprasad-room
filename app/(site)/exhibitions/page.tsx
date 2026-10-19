import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import Until from "@/components/Until";
import ShowMedia from "@/components/site/ShowMedia";
import Press from "@/components/site/Press";
import { PRESS_ITEMS } from "@/lib/press";
import WallHero from "@/components/site/WallHero";
import { SHOW_WALL } from "@/components/site/Collage";
import { NOW, NOW_SHOWING_CONFIRMED, RECORD, RECORD_LINE, SHOWS } from "@/lib/site";
import { BY_ID, WORKS, workPath } from "@/lib/works";
import { dims } from "@/lib/images";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Dr Dolly Prasad’s exhibitions: eighteen exhibitions and art fairs, 2005 to 2018, including India Habitat Centre (2010), A Lifetime to Paint at ICCR (2010), the First International Kala Mela (2018), Triveni Kala Sangam (2007) and more.",
  alternates: { canonical: "/exhibitions" },
};

const years = [...new Set(RECORD.map((r) => r.year))];

export default function Exhibitions() {
  return (
    <>
    <WallHero columns={SHOW_WALL} label="Her exhibitions" eyebrow="2005 to 2018" title="Her Exhibitions" red="Exhibitions"
              held="Eighteen shows, Delhi to Bombay.">
      <a className="btn btn-solid" href="#india-habitat-centre-2010">See the shows</a>
      <a className="btn" href="#record">The full record</a>
    </WallHero>
    <div className="wrap">
      {NOW_SHOWING_CONFIRMED && <Until until={NOW.until}>
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
      </Until>}

      <nav className="ex-index" aria-label="On this page">
        {SHOWS.slice(0, 1).map((s) => <a key={s.id} href={`#${s.id}`}><span>{s.year}</span>{s.name ?? s.title}</a>)}
        <a href="#press"><span>Press</span>In the press</a>
        {SHOWS.slice(1).map((s) => <a key={s.id} href={`#${s.id}`}><span>{s.year}</span>{s.name ?? s.title}</a>)}
        <a href="#record"><span>2005–18</span>The record</a>
      </nav>

      {/* each show a calm chapter: year, title, venue; a few lines; one photograph large and a strip under it (CR-005) */}
      {SHOWS.map((s, k) => {
        const photos = s.albums.flatMap((a) => a.photos);
        return (
          <Fragment key={s.id}>
          <section id={s.id} className={`ex-ch${k % 2 ? " band-cream" : ""}`} aria-labelledby={`${s.id}-h`}>
            <header className="ex-ch-head">
              <span className="ex-ch-year">{s.year}</span>
              <div>
                <h2 id={`${s.id}-h`}>{s.name ?? s.title}</h2>
                <p className="ex-ch-where">{s.venue}, {s.city}</p>
                <p className="ex-kind">{s.kind} · {s.when}</p>
              </div>
            </header>
            <div className="ex-ch-body">
              <div className="ex-ch-txt">
                <p className="ex-lede">{s.lede}</p>
                {s.quote && (
                  <figure className="ex-quote">
                    <blockquote>“{s.quote}”</blockquote>
                    <figcaption>Dr Dolly Prasad, on her exhibitions</figcaption>
                  </figure>
                )}
                {s.works && s.works.length > 0 && (
                  <p className="ex-works">
                    <span>On the walls</span>
                    {s.works.map((id) => <Link key={id} href={workPath(id)}>{BY_ID.get(id)?.title}</Link>)}
                  </p>
                )}
                {s.note && <p className="meta">{s.note}</p>}
              </div>
              <ShowMedia photos={photos} label={`Photographs: ${s.name ?? s.title}`} />
            </div>
          </section>
          {/* In the press is the page's third section: right after India Habitat Centre, the show the interviews are from (QA P1-1) */}
          {k === 0 && (
            <section id="press" className="ex-press band-indigo" aria-labelledby="press-h">
        <span id="on-screen" aria-hidden="true" />
        <div className="sec-head">
          <div>
            <p className="eyebrow">From the archive</p>
            <h2 id="press-h">In the press</h2>
            <p className="sec-line">At India Habitat Centre in November 2010 she was interviewed beside the paintings themselves. Here too are an excerpt from NCR television and a listing from Delhi Times.</p>
          </div>
        </div>
        <Press items={PRESS_ITEMS} />
      </section>
          )}
          </Fragment>
        );
      })}

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
    </>
  );
}

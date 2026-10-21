import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import Until from "@/components/Until";
import ShowMedia from "@/components/site/ShowMedia";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import WallHero from "@/components/site/WallHero";
import { SHOW_WALL } from "@/components/site/Collage";
import { NOW, NOW_SHOWING_CONFIRMED, RECORD, RECORD_LINE, SHOWS } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";
import { dims } from "@/lib/images";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Dr Dolly Prasad’s exhibitions: eighteen exhibitions and art fairs, 2005 to 2018, including India Habitat Centre (2010), A Lifetime to Paint at ICCR (2010), the First International Kala Mela (2018) and more.",
  alternates: { canonical: "/exhibitions" },
};

const years = [...new Set(RECORD.map((r) => r.year))];
// R6 (Shubham, 20 Oct 22:50): his order on this page beats newest-first: India Habitat Centre, then the press,
// then A Lifetime to Paint, then Kala Mela. SHOWS itself stays newest first for every other listing.
const ORDER = ["india-habitat-centre-2010", "a-lifetime-to-paint", "kala-mela-2018"];
const shows = ORDER.map((id) => SHOWS.find((s) => s.id === id)!);
const AFTER_FIRST = "press";

export default function Exhibitions() {
  return (
    <>
    <WallHero columns={SHOW_WALL} label="Her exhibitions" eyebrow="2005 to 2018" title="Her Exhibitions" red="Exhibitions"
              held="Eighteen exhibitions and art fairs, Delhi to Bombay: the things you walk past, hung where you stop.">
      <a className="btn btn-solid" href={`#${shows[0].id}`}>See the shows</a>
      <a className="btn" href="#record">List of exhibitions</a>
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
        {/* R6: the page's own order (India Habitat Centre, the press, A Lifetime to Paint, Kala Mela), then the list */}
        {shows.map((s, k) => (
          <Fragment key={s.id}>
            <a href={`#${s.id}`}><span>{s.year}</span>{s.name ?? s.title}</a>
            {k === 0 && <a href={`#${AFTER_FIRST}`}><span>Press</span>In the press</a>}
          </Fragment>
        ))}
        <a href="#record"><span>2005–18</span>List of exhibitions</a>
      </nav>

      {/* R6: each show one compact row, the photograph and its strip on the left, the heading, her words and the caption on the right */}
      {shows.map((s, k) => {
        const photos = s.albums.flatMap((a) => a.photos);
        return (
          <Fragment key={s.id}>
          <section id={s.id} className="ex-ch" aria-labelledby={`${s.id}-h`}>
            <ShowMedia photos={photos} label={`Photographs: ${s.name ?? s.title}`}
                       walls={s.works?.length ? s.works.map((id, j) => (
                         <Fragment key={id}>{j > 0 && ", "}<Link href={workPath(id)}>{BY_ID.get(id)?.title}</Link></Fragment>
                       )) : undefined}
                       side={<>
                         <header className="ex-ch-head">
                           <span className="ex-ch-year">{s.year}</span>
                           <h2 id={`${s.id}-h`}>{s.name ?? s.title}</h2>
                           <p className="ex-ch-where">{s.where ?? `${s.venue}, ${s.city} · ${s.when}`}</p>
                         </header>
                         {(s.quote || s.note) && (
                           <div className="ex-ch-txt">
                             {s.quote && (
                               <figure className="ex-quote">
                                 <blockquote>“{s.quote}”</blockquote>
                                 <figcaption>Dr Dolly Prasad, on her exhibitions</figcaption>
                               </figure>
                             )}
                             {s.note && <p className="meta">{s.note}</p>}
                           </div>
                         )}
                       </>} />
          </section>
          {k === 0 && (
            <section id="press" className="ex-press band-indigo" aria-labelledby="press-h">
              <span id="on-screen" aria-hidden="true" />
              <div className="sec-head">
                <div>
                  <h2 id="press-h">In the press</h2>
                </div>
              </div>
              <PressRow items={PRESS_ALL} />
            </section>
          )}
          </Fragment>
        );
      })}

      <section id="record" className="ex-record">
        <div className="sec-head">
          <div>
            <p className="eyebrow">List of exhibitions</p>
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

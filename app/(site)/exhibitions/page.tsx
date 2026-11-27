import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import { Fragment } from "react";
import Until from "@/components/Until";
import ShowMedia from "@/components/site/ShowMedia";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import WallHero from "@/components/site/WallHero";
import { SHOW_WALL } from "@/components/site/Collage";
import { NOW, NOW_SHOWING_CONFIRMED, RECORD, RECORD_LINE, SACRED_FRAGMENTS, SHOWS } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";
import { dims } from "@/lib/images";

const TITLE = "Exhibitions";
const DESCRIPTION = "Nineteen exhibitions and art fairs by Dr Dolly Prasad since 2005, most recently Sacred Fragments: A Journey Home at India Habitat Centre, New Delhi, in October 2026.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/exhibitions" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/exhibitions"),
};

const years = [...new Set(RECORD.map((r) => r.year))];
// R6 (Shubham, 20 Oct 22:50): his order on this page beats newest-first: India Habitat Centre, then the press,
// then A Lifetime to Paint, then Kala Mela. SHOWS itself stays newest first for every other listing.
// 22 Nov 2026 (Shubham): the latest exhibition, Sacred Fragments (Oct 2026), leads, with its photographs;
// the R6 order follows it unchanged, the press still straight after India Habitat Centre 2010.
const ORDER = ["india-habitat-centre-2010", "a-lifetime-to-paint", "kala-mela-2018"];
const shows = [SACRED_FRAGMENTS, ...ORDER.map((id) => SHOWS.find((s) => s.id === id)!)];
const PRESS_AFTER = "india-habitat-centre-2010";

export default function Exhibitions() {
  return (
    <>
    <WallHero columns={SHOW_WALL} label="Her exhibitions" eyebrow="2005 to 2026" title="Exhibitions" red="Exhibitions"
              held="Since 2005 the paintings have left home for nineteen exhibitions and art fairs, most of them in Delhi, others in Gurgaon, Jaipur and Bombay.">
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
        {/* Sacred Fragments, then R6: the page’s own order (India Habitat Centre, the press, A Lifetime to Paint, Kala Mela), then the list */}
        {shows.map((s) => (
          <Fragment key={s.id}>
            <a href={`#${s.id}`}><span>{s.year}</span>{s.name ?? s.title}</a>
            {s.id === PRESS_AFTER && <a href="#press"><span>Press</span>In the press</a>}
          </Fragment>
        ))}
        <a href="#record"><span>2005 to 2026</span>List of exhibitions</a>
      </nav>

      {/* R6: each show one compact row, the photograph and its strip on the left, the heading and the note on the right */}
      {shows.map((s) => {
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
                         {s.note && (
                           <div className="ex-ch-txt">
                             <p className="meta">{s.note}</p>
                           </div>
                         )}
                       </>} />
          </section>
          {s.id === PRESS_AFTER && (
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
            <p className="sec-line">The list runs from Sacred Fragments back to her first shows in 2005. Where the record is thin, an entry gives only a place and a date.</p>
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
            <b>Most of the paintings in these photographs are on the Works page, each with its story.</b>
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

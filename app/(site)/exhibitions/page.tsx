import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import Link from "next/link";
import { Fragment } from "react";
import Until from "@/components/Until";
import ShowMedia from "@/components/site/ShowMedia";
import PressRow from "@/components/site/PressRow";
import { PRESS_ALL } from "@/lib/press";
import PageHead from "@/components/site/PageHead";
import KeyShows from "@/components/site/KeyShows";
import { NOW, NOW_SHOWING_CONFIRMED, RECORD, RECORD_LINE, SACRED_FRAGMENTS, SHOWS } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";
import { dims } from "@/lib/images";

const TITLE = "Exhibitions";
const DESCRIPTION = "Nearly twenty exhibitions and art fairs by Dr Dolly Prasad since 2005, most recently Sacred Fragments: A Journey Home at India Habitat Centre, New Delhi, in October 2026.";
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

// the key shows lead the page with their photographs; every other entry on her record runs in the slow row below them
const KEY_SHOWS = [SACRED_FRAGMENTS, SHOWS.find((x) => x.id === "india-habitat-centre-2010")!].map((x) => ({
  id: x.id, name: x.name ?? x.title, where: x.where ?? `${x.venue}, ${x.city} · ${x.when}`, photos: x.albums.flatMap((a) => a.photos),
}));
const OTHERS = RECORD.filter((r) => r.show !== "sacred-fragments" && r.show !== "india-habitat-centre-2010")
  .map((r) => ({ name: r.venue, venue: r.city || "India", year: r.month ? `${r.month} ${r.year}` : r.year }));

export default function Exhibitions() {
  return (
    <>
    <PageHead eyebrow="2005 to 2026" title="Exhibitions" red="Exhibitions"
              line="Since 2005 her paintings have hung at nearly twenty exhibitions and art fairs, from Sriram Centre in New Delhi to Nehru Art Gallery in Bombay. The most recent, Sacred Fragments, was at India Habitat Centre in October 2026.">
      <a className="btn btn-solid" href={`#${shows[0].id}`}>See the shows</a>
      <a className="btn" href="#record">List of exhibitions</a>
    </PageHead>
    <div className="wrap">
      <KeyShows shows={KEY_SHOWS} others={OTHERS} />
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
            <p className="sec-line">Where the record is thin, an entry gives only a place and a date.</p>
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

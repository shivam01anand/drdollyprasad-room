import type { Metadata } from "next";
import Link from "next/link";
import Until from "@/components/Until";
import { EXHIBITIONS, ON_EXHIBITIONS, VENUES } from "@/lib/site";
import { BY_ID, workPath } from "@/lib/works";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Dr Dolly Prasad’s exhibitions: eighteen solo exhibitions 2005–2018, A Lifetime to Paint at ICCR (2010), India Habitat Centre, Triveni Kala Sangam and more.",
  alternates: { canonical: "/exhibitions" },
};

export default function Exhibitions() {
  const now = EXHIBITIONS.find((e) => e.until)!;
  const past = EXHIBITIONS.filter((e) => !e.until);
  return (
    <div className="wrap">
      <section className="sec-tight" style={{ display: "flex", flexWrap: "wrap", gap: "24px 56px", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 420px" }}>
          <h1 className="page-title">Exhibitions</h1>
          <p className="lede">Eighteen solo exhibitions, 2005–2018, at venues including {VENUES.slice(0, -1).join(", ")} and {VENUES.at(-1)}.</p>
        </div>
        <p className="quote" style={{ flex: "1 1 420px", fontSize: 25 }}>“{ON_EXHIBITIONS}”</p>
      </section>

      <Until until={now.until!}>
        <section id={now.id} style={{ paddingBottom: 24 }}>
          <div className="now-box">
            <div className="txt">
              <span className="eyebrow" style={{ color: "inherit" }}>Now showing</span>
              <h2>{now.title}</h2>
              <p>{[now.venue, now.city].filter(Boolean).join(", ")} · {now.when}</p>
              {now.note && <p>{now.note}</p>}
            </div>
            <div className="imgs">
              {now.works?.map((id) => (
                <Link key={id} href={workPath(id)} aria-label={BY_ID.get(id)?.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/site/thumbs/${id}.jpg`} alt={BY_ID.get(id)?.title ?? ""} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Until>

      {past.map((e) => {
        const doc = e.photos.length && e.photos.every((p) => p.src.includes("/paper-"));
        return (
          <section key={e.id} id={e.id} className="show">
            <div className="show-h">
              <span className="eyebrow rust">{[e.kind, e.year].filter(Boolean).join(" · ")}</span>
              <h2>{e.title}</h2>
              <p className="meta" style={{ fontSize: 16 }}>{[e.venue, e.city, e.when].filter(Boolean).join(" · ")}</p>
              {e.note && <p className="meta" style={{ fontSize: 16 }}>{e.note}</p>}
            </div>
            {e.photos.length > 0 && (
              <div className={`gallery${doc ? " doc" : ""}`}>
                {e.photos.map((p, i) => (
                  <figure key={p.src} className={!doc && i === 0 && e.photos.length > 3 ? "wide" : undefined}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.alt} loading="lazy" />
                  </figure>
                ))}
              </div>
            )}
            {e.works && e.works.length > 0 && (
              <p className="meta" style={{ marginTop: 14 }}>
                On the walls:{" "}
                {e.works.map((id, i) => (
                  <span key={id}>{i ? ", " : ""}<Link href={workPath(id)}>{BY_ID.get(id)?.title}</Link></span>
                ))}
              </p>
            )}
          </section>
        );
      })}

      <section className="show">
        <div className="sec-head"><h2>The record</h2></div>
        <table className="record">
          <thead><tr><th>Year</th><th>Exhibition</th><th>Venue</th><th>Type</th></tr></thead>
          <tbody>
            {EXHIBITIONS.map((e) => (
              <tr key={e.id}>
                <td>{e.year ?? "—"}</td>
                <td><a href={`#${e.id}`} style={{ textDecoration: "none" }}>{e.title}</a></td>
                <td>{[e.venue, e.city].filter(Boolean).join(", ") || "—"}</td>
                <td className="meta">{e.until ? "Exhibition" : e.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="meta" style={{ marginTop: 16 }}>More of her eighteen solo exhibitions will be added to this record as the archive is catalogued.</p>
      </section>
    </div>
  );
}

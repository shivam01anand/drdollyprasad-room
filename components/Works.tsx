"use client";

import { useEffect, useState } from "react";
import { WORKS, SERIES, EMAIL, INSTAGRAM, details, quoted, statusLabel, workPath } from "@/lib/works";

export type WorksFilter = "all" | "available" | "sold";
/** the quick-access index (and anything else) shows the works filtered: dispatch this, then scroll to #works */
export const WORKS_FILTER = "dp:works-filter";

type Dims = Record<string, { w: number; h: number }>;

const DEFAULT_IN = 34;

/**
 * Every painting, laid out at true scale where she has stated a size: a one
 * foot door panel is never the size of a three-foot canvas. The words are
 * Shubham’s (kb/voice.md). A click opens the work (the page's one lightbox, wired in Studio).
 */
export default function Works({ dims }: { dims: Dims }) {
  const [filter, setFilter] = useState<WorksFilter>("all");
  useEffect(() => {
    const on = (e: Event) => setFilter((e as CustomEvent<WorksFilter>).detail ?? "all");
    addEventListener(WORKS_FILTER, on);
    return () => removeEventListener(WORKS_FILTER, on);
  }, []);
  // "available" takes in the works on enquiry: neither is sold
  const shows = (status: string) => filter === "all" || (filter === "sold" ? status === "Sold" : status !== "Sold");
  const count = (f: WorksFilter) => WORKS.filter((w) => f === "all" || (f === "sold" ? w.status === "Sold" : w.status !== "Sold")).length;
  return (
    <section className="collage" id="works" aria-labelledby="works-title">
      <div className="collage-head">
        <div className="lab">The work</div>
        <h2 id="works-title" className="collage-title">
          Forty-one paintings, 2007 to 2026
        </h2>
        <div className="works-filter" role="group" aria-label="Show the works">
          {(["all", "available", "sold"] as WorksFilter[]).map((f) => (
            <button type="button" key={f} className="pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "available" ? "Available" : "In private collections"} <span className="works-n">{count(f)}</span>
            </button>
          ))}
        </div>
      </div>

      {SERIES.filter((s) => WORKS.some((w) => w.series === s.label && shows(w.status))).map((s) => (
        <div className="series-block" key={s.label}>
          <div className="series"><h3 className="series-name">{s.label}</h3><span className="lab">{s.note}</span></div>
          <div className="hang">
            {WORKS.filter((w) => w.series === s.label && shows(w.status)).map((w) => {
              const d = dims[w.id];
              if (!d) return null;
              const inches = w.inches ?? DEFAULT_IN;
              // true scale, then capped by what the photograph can carry
              const wanted = 7.4 * inches;
              const capped = Math.min(wanted, d.w * 0.62);
              const ar = d.w / d.h;
              const width = Math.round(ar >= 1 ? capped : capped * ar);
              return (
                <figure className="work" key={w.id} style={{ width }}>
                  <a href={workPath(w.id)} data-work={w.id} aria-label={`Open ${w.title}`} data-cursor="View">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/art/works/${w.id}.jpg`} alt={`${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`}
                         width={d.w} height={d.h} loading="lazy" decoding="async" data-flip-id={w.id} />
                  </a>
                  <figcaption>
                    <span className="cap-title">{quoted(w.title)}</span>
                    {details(w) && <span className="cap-details">{details(w)}</span>}
                    <span className={`cap-status is-${w.status.toLowerCase()}`}>{statusLabel(w)}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

/** the About opening, word for word (app/(site)/about/page.tsx; content elevate 2026-11-22). Shubham’s words, not hers */
const STATEMENT =
  "Dr Dolly Prasad is a painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel.";

/**
 * The About opening (the old WordPress biography is cut, kb/decisions.md 2026-11-22), and the way to reach her.
 */
export function Contact() {
  return (
    <footer className="contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-lead">
        <div className="lab">About</div>
        <p className="statement">{STATEMENT}</p>
      </div>
      <div className="contact-grid">
        <div className="contact-bio">
          <p className="about">
            She paints the small things an Indian day is made of, a coin saved in a gullak or a thread tied for a wish.
          </p>
          <p className="about">
            Her paintings have been shown at nearly twenty exhibitions and art fairs, most recently Sacred Fragments at India Habitat Centre in October 2026, and are in private collections in India and abroad.
          </p>
        </div>
        <div className="contact-side">
          <div className="lab">Write to her</div>
          <h2 id="contact-title" className="contact-title">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </h2>
          <p className="lab contact-note">New Delhi · Enquiries</p>
          <p className="lab contact-note">
            <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer">Instagram {INSTAGRAM.handle} ↗</a>
          </p>
        </div>
      </div>
      <div className="contact-foot lab">
        <span>© {new Date().getFullYear()} Dr Dolly Prasad</span>
        <span>Paintings in oil · New Delhi</span>
      </div>
    </footer>
  );
}

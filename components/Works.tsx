import { WORKS, SERIES, EMAIL, INSTAGRAM, details, quoted, statusLabel } from "@/lib/works";

type Dims = Record<string, { w: number; h: number }>;

const DEFAULT_IN = 34;

/**
 * Every painting, laid out at true scale where she has stated a size: a one
 * foot door panel is never the size of a three-foot canvas. A click opens
 * the work (the page's one lightbox, wired in Studio).
 */
export default function Works({ dims }: { dims: Dims }) {
  return (
    <section className="collage" id="works" aria-labelledby="works-title">
      <div className="collage-head">
        <div className="lab">The work · {WORKS.length} paintings</div>
        <h2 id="works-title" className="collage-title">
          Shown to relative scale where she has given the size. A one-foot door panel is never the size of a three-foot canvas.
        </h2>
      </div>

      {SERIES.map((s) => (
        <div className="series-block" key={s.label}>
          <div className="series"><h3 className="series-name">{s.label}</h3><span className="lab">{s.note}</span></div>
          <div className="hang">
            {WORKS.filter((w) => w.series === s.label).map((w) => {
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
                  <a href={`/art/works/${w.id}.jpg`} data-work={w.id} aria-label={`${w.title} — open`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/art/works/${w.id}.jpg`} alt={`${w.title} — ${w.medium.toLowerCase()}`}
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

/** her approved introduction (the Sacred Fragments catalogue, Oct 2026) */
const STATEMENT =
  "Dr. Dolly Prasad’s art is the everyday held sacred. A\u00A0self-taught painter, she catches the hues of " +
  "India in its waiting and its wishing, its worship and its whispers.";

/**
 * Her statement, her biography verbatim, and the way to reach her.
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
            Dr. Dolly Prasad is as much an artist as she is a doctor, and her multi-faceted persona has,
            indubitably, made her the person that she is. Play of emotions, be it on the faces around her or on
            the canvas, have always fascinated her.
          </p>
          <p className="about">
            Being a doctor, professionally, the hospital became her fountain of manifestation, of life
            affirmation, at its highest intensity. Her paintings speak of various shades of life — some refined,
            some sublime, some just raw. But the quintessential humane element remains intact.
          </p>
        </div>
        <div className="contact-side">
          <div className="lab">Write to me</div>
          <h2 id="contact-title" className="contact-title">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </h2>
          <p className="lab contact-note">Studio · New Delhi · Enquiries and commissions</p>
          <p className="lab contact-note">
            <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer">Instagram {INSTAGRAM.handle} ↗</a>
          </p>
        </div>
      </div>
      <div className="contact-foot lab">
        <span>© {new Date().getFullYear()} Dr Dolly Prasad</span>
        <span>Oil on canvas · New Delhi</span>
      </div>
    </footer>
  );
}

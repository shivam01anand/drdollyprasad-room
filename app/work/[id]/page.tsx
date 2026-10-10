import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BY_ID, LARGE, SHOW, SITE, WORKS, enquiry, inchDims, quoted, statusLabel, workPath, type Work } from "@/lib/works";
import { TAILORED } from "@/lib/rooms";
import manifest from "@/public/art/manifest.json";
import Share from "@/components/Share";
import Until from "@/components/Until";

/**
 * One painting's own page: what a shared link opens, and what a search finds.
 * The work whole on her paper, its facts as a label gives them, the way to ask
 * about it, the room made for it where there is one, and the way into the
 * house, which walks to the wall it hangs on and opens it there.
 */

export const dynamicParams = false;
export const generateStaticParams = () => WORKS.map((w) => ({ id: w.id }));

type Props = { params: Promise<{ id: string }> };

const DIMS = new Map(manifest.works.map((d) => [d.id, d]));

/** the facts in one line, in the order a label gives them */
const facts = (w: Work) =>
  [w.medium, w.size, w.year, w.series, statusLabel(w)].filter(Boolean).join(" · ");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const w = BY_ID.get(id);
  if (!w) return {};
  const title = `${quoted(w.title)} · Dr Dolly Prasad`;
  const description = `${quoted(w.title)}, by Dr Dolly Prasad. ${facts(w)}.`;
  return {
    title,
    description,
    alternates: { canonical: workPath(id) },
    openGraph: {
      type: "website",
      url: workPath(id),
      siteName: "Dr Dolly Prasad",
      title,
      description,
      locale: "en_IN",
      images: [{ url: `/og/${id}.jpg`, width: 1200, height: 630, alt: `${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const w = BY_ID.get(id);
  if (!w) notFound();
  const at = WORKS.indexOf(w);
  const prev = WORKS[(at - 1 + WORKS.length) % WORKS.length];
  const next = WORKS[(at + 1) % WORKS.length];
  const d = DIMS.get(id);
  const src = LARGE.has(id) ? `/art/large/${id}.jpg` : `/art/works/${id}.jpg`;
  const room = TAILORED.find((r) => r.work === id && r.inPhoto);
  const size = inchDims(w);
  const ld = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: w.title,
    url: `${SITE}${workPath(id)}`,
    image: `${SITE}/art/works/${id}.jpg`,
    artform: "Painting",
    artMedium: w.medium,
    creator: { "@type": "Person", name: "Dr Dolly Prasad", url: SITE },
    ...(w.year && /^\d{4}$/.test(w.year) ? { dateCreated: w.year } : {}),
    ...(size ? {
      width: { "@type": "QuantitativeValue", value: size.width, unitCode: "INH" },
      height: { "@type": "QuantitativeValue", value: size.height, unitCode: "INH" },
    } : {}),
  };
  const rows: [string, string][] = [
    ["Medium", w.medium],
    ...(w.size ? [["Size", w.size] as [string, string]] : []),
    ...(w.year ? [["Year", w.year] as [string, string]] : []),
    ["Series", w.series],
  ];

  return (
    <main className="wp">
      <header className="wp-head">
        <a className="wp-brand" href="/">→ Dr Dolly Prasad</a>
        <a className="lab wp-all" href="/#works">All her work</a>
      </header>

      <figure className="wp-fig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`}
             width={d?.w} height={d?.h} fetchPriority="high" decoding="async"
             className={d && Math.max(d.w, d.h) < 600 ? "is-small" : undefined} />
      </figure>

      <section className="wp-text">
        <p className="lab">{w.series}{w.year ? ` · ${w.year}` : ""}</p>
        <h1 className="wp-title">{quoted(w.title)}</h1>
        <dl className="wp-facts">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="lab">{k}</dt><dd>{v}</dd></div>
          ))}
          <div>
            <dt className="lab">Status</dt>
            <dd className={`wp-status is-${w.status.toLowerCase()}`}>{statusLabel(w)}</dd>
          </div>
        </dl>
        <div className="wp-actions">
          <a className="pill pill-solid" href={enquiry(w)}>
            {w.status === "Sold" ? "Ask about her work →" : "Enquire about this work →"}
          </a>
          <a className="pill" href={`/#work=${id}`}>See it in her studio →</a>
          <Share title={`${quoted(w.title)} · Dr Dolly Prasad`} path={workPath(id)} />
        </div>
        {SHOW.works.includes(id) && (
          <Until until={SHOW.until}><p className="wp-show">{SHOW.line}</p></Until>
        )}
        {room && (
          <figure className="wp-room">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={room.src} alt={`${w.title}, as it would hang: ${room.label}`} width={room.w} height={room.h}
                 loading="lazy" decoding="async" />
            <figcaption className="lab">{room.label}</figcaption>
          </figure>
        )}
      </section>

      <nav className="wp-nav" aria-label="More of her work">
        <a href={workPath(prev.id)}><span className="lab">Previous</span>{quoted(prev.title)}</a>
        <a href={workPath(next.id)} className="wp-next"><span className="lab">Next</span>{quoted(next.title)}</a>
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}

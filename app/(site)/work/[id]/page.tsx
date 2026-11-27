import type { Metadata } from "next";
import Link from "next/link";
import IndigoBand from "@/components/site/IndigoBand";
import { notFound } from "next/navigation";
import { BY_ID, LARGE, PERSON_ID, SITE, WORKS, inchDims, quoted, workPath, type Work } from "@/lib/works";
import { altOf } from "@/lib/alt";
import { LOOK, SERIES_BY_SLUG, SHOWS, SMALL_PHOTO, showKey, shownYear, statusText, enquireHref, labelLine, neighbours, seriesPath, worksIn } from "@/lib/site";
import PrevNext from "@/components/site/PrevNext";
import manifest from "@/public/art/manifest.json";
import Card from "@/components/site/Card";
import PaintingStage from "@/components/site/PaintingStage";
import PaintingInfo from "@/components/site/PaintingInfo";
import WpBar from "@/components/site/WpBar";
import Tabs from "@/components/site/Tabs";

/**
 * One painting's own page: what a shared link opens and what a search finds.
 * Its title and label above, the painting hung in a room (to scale where she
 * has stated its size), the ways to ask,
 * and more from the same series.
 */

export const dynamicParams = false;

/** R4 B2-5 / Chief Content 2c §1: wording locked ("Shown at"). ON for the R4 preview; it ships only with Shubham's OK
 *  on that preview. Build with SHOW_SHOWN_AT=0 to hide the row again. */
const SHOW_SHOWN_AT = process.env.SHOW_SHOWN_AT !== "0";
const SHOWN_AT_LABEL = "Shown at";
/** Works whose "Shown at" row stays off. Empty since 18 Nov 2026: The Bullocks and The Matka and the
 *  Coins are now dated 2010, matching their listing under IHC, November 2010 (Shubham). */
const SHOWN_AT_HOLD = new Set<string>([]);
export const generateStaticParams = () => WORKS.map((w) => ({ id: w.id }));

type Props = { params: Promise<{ id: string }> };

const DIMS = new Map(manifest.works.map((d) => [d.id, d]));

const facts = (w: Work) => [w.medium, w.size, shownYear(w), w.series].filter(Boolean).join(" · ");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const w = BY_ID.get(id);
  if (!w) return {};
  const title = quoted(w.title);
  // content elevate (2026-11-22): the share preview carries the first sentence of its painting line; the facts are on the page
  const first = LOOK[id]?.match(/^.*?[.!?](?=\s|$)/)?.[0];
  const description = first ? `${quoted(w.title)}, by Dr Dolly Prasad. ${first}` : `${quoted(w.title)}, by Dr Dolly Prasad. ${facts(w)}. ${statusText(w)}.`;
  return {
    title,
    description,
    alternates: { canonical: workPath(id) },
    openGraph: {
      type: "website", url: workPath(id), siteName: "Dr Dolly Prasad", title: `${title} · Dr Dolly Prasad`, description, locale: "en_IN",
      images: [{ url: `/og/${id}.jpg`, width: 1200, height: 630, alt: altOf(w) }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const w = BY_ID.get(id);
  if (!w) notFound();
  // R4 B2-4: Previous/Next walk her chapter order inside the collection; at the ends they open the adjacent collection's story page
  const nb = neighbours(id)!;
  const coll = SERIES_BY_SLUG.get(nb.slug)!;
  const end = (e: { id: string; crossesTo?: string }, dir: "Previous" | "Next") => e.crossesTo
    ? { href: `/series/${e.crossesTo}`, kicker: `${dir} collection`, label: SERIES_BY_SLUG.get(e.crossesTo)!.label }
    : { href: workPath(e.id), kicker: `${dir} painting`, label: BY_ID.get(e.id)!.title };
  // R4 B2-5: "Shown at", only where SHOWS names this painting; held until Chief Content locks the label
  const shownAt = SHOWN_AT_HOLD.has(id) ? [] : SHOWS.filter((sh) => sh.works?.includes(id)).sort((a, b) => showKey(b) - showKey(a));
  const d = DIMS.get(id);
  const src = LARGE.has(id) ? `/art/large/${id}.jpg` : `/art/works/${id}.jpg`;
  const size = inchDims(w, d ? { w: d.w, h: d.h } : undefined);
  const sold = w.status === "Sold";
  const more = worksIn(w.series).filter((x) => x.id !== id && !SMALL_PHOTO.has(x.id))
    .sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold")).slice(0, 4);

  // elevate (26 Nov 2026): a stable @id, the painting's own line (kb/paintings.json description, as shown on this page),
  // the largest file, her one Person @id, and the availability the page itself states (nothing where it says "on enquiry")
  const ld = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${SITE}${workPath(id)}#artwork`,
    name: w.title,
    url: `${SITE}${workPath(id)}`,
    image: `${SITE}${src}`,
    ...(LOOK[id] ? { description: LOOK[id] } : {}),
    artform: "Painting",
    artMedium: w.medium,
    creator: { "@type": "Person", "@id": PERSON_ID, name: "Dr Dolly Prasad", url: SITE },
    ...(w.status === "Available" || sold ? { offers: { "@type": "Offer", url: `${SITE}${workPath(id)}`, availability: `https://schema.org/${sold ? "SoldOut" : "InStock"}` } } : {}),
    ...(shownYear(w) ? { dateCreated: shownYear(w) } : {}),
    ...(size ? {
      width: { "@type": "QuantitativeValue", value: size.width, unitCode: "INH" },
      height: { "@type": "QuantitativeValue", value: size.height, unitCode: "INH" },
    } : {}),
  };

  const cm = size ? ` · ${Math.round(size.a * 2.54)} × ${Math.round(size.b * 2.54)} cm` : "";
  // the label (medium, size, year, collection) is shown once, under the title; this adds only what it does not say
  const rows: [string, React.ReactNode][] = [
    ["Size", w.size ? `${w.size}${cm} (height × width)` : "On request"],
    ["Status", sold ? "In a private collection" : statusText(w)],
    // Chief Content 2c §1.2-1.3: "{name}, {title}, {year}" (or "{title}, {year}"), one show per line, newest first
    ...(SHOW_SHOWN_AT && shownAt.length ? [[SHOWN_AT_LABEL, <span className="shown-at">{shownAt.map((sh) => (
      <Link key={sh.id} href={`/exhibitions#${sh.id}`}>{sh.name ? `${sh.name}, ${sh.title}` : sh.title}, {sh.year}</Link>
    ))}</span>] as [string, React.ReactNode]] : []),
  ];

  const tabs = [
    { label: "Details and size", body: <dl>{rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> },
    { label: "Delivery and framing", body: (
      <>
        <p>For availability, framing and delivery, write with the painting’s title and your city, and the options will be shared with you.</p>
        <p>The room views on this page are illustrations or virtual room studies, not photographs of a real room.</p>
      </>) },
  ];

  return (
    <div className="wp">
      {/* CR-007: the big painting, the other views under it, then the text */}
      <PaintingStage w={w} src={src} dims={d ? { w: d.w, h: d.h } : undefined}
                     small={!!d && Math.max(d.w, d.h) < 600} sub={labelLine(w)}>
        <PaintingInfo w={w} />
      </PaintingStage>

      <div className="wrap">
      <section className="wp-lower" style={{ paddingBottom: 28 }}>
        <Tabs tabs={tabs} />
      </section>

      {more.length > 0 && (
        <IndigoBand id="more-from" title={`More from ${w.series}`} href={seriesPath(w.series)} label="The collection’s story">
          <div className="grid">{more.map((x) => <Card key={x.id} w={x} />)}</div>
        </IndigoBand>
      )}

      <PrevNext label="Previous and next painting" count={`${nb.index + 1} of ${nb.total} in ${coll.label}`}
                prev={end(nb.prev, "Previous")} next={end(nb.next, "Next")} />

      </div>

      {/* on a phone, the way to ask stays in reach under the thumb */}
      <WpBar>
        <span><b>{w.title}</b><small>{sold ? "In a private collection" : w.status === "Enquire" ? "Availability on enquiry" : "Available · Price on request"}</small></span>
        <Link className="btn btn-solid" href={enquireHref(w)}>{sold ? "Ask" : "Enquire"}</Link>
      </WpBar>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}

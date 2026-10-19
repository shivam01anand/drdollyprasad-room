import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ID, LARGE, SHOW, SITE, WORKS, inchDims, quoted, workPath, type Work } from "@/lib/works";
import { INSTAGRAM, LOOK, NOW_SHOWING_CONFIRMED, PULL, SMALL_PHOTO, shownYear, STUDIO_PATH, WHATSAPP, WORDS, enquireHref, labelLine, seriesPath, whatsappHref, worksIn } from "@/lib/site";
import manifest from "@/public/art/manifest.json";
import Card from "@/components/site/Card";
import PaintingStage from "@/components/site/PaintingStage";
import Tabs from "@/components/site/Tabs";
import Share from "@/components/Share";
import Until from "@/components/Until";
import { ChatIcon, InstagramIcon } from "@/components/site/Icons";

/**
 * One painting's own page: what a shared link opens and what a search finds.
 * Its title and label above, the painting hung in a room (to scale where she
 * has stated its size), the ways to ask, her own words where she has written
 * them, and more from the same series.
 */

export const dynamicParams = false;
export const generateStaticParams = () => WORKS.map((w) => ({ id: w.id }));

type Props = { params: Promise<{ id: string }> };

const DIMS = new Map(manifest.works.map((d) => [d.id, d]));

const facts = (w: Work) => [w.medium, w.size, shownYear(w), w.series].filter(Boolean).join(" · ");
const statusWord = (w: Work) => (w.status === "Sold" ? "Sold" : w.status === "Enquire" ? "On enquiry" : "Available");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const w = BY_ID.get(id);
  if (!w) return {};
  const title = quoted(w.title);
  const description = `${quoted(w.title)}, by Dr Dolly Prasad. ${facts(w)}. ${statusWord(w)}.`;
  return {
    title,
    description,
    alternates: { canonical: workPath(id) },
    openGraph: {
      type: "website", url: workPath(id), siteName: "Dr Dolly Prasad", title: `${title} · Dr Dolly Prasad`, description, locale: "en_IN",
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
  const size = inchDims(w, d ? { w: d.w, h: d.h } : undefined);
  const words = WORDS[id];
  const lead = words ? PULL[id] : LOOK[id];
  const sold = w.status === "Sold";
  const more = worksIn(w.series).filter((x) => x.id !== id && !SMALL_PHOTO.has(x.id))
    .sort((a, b) => Number(a.status === "Sold") - Number(b.status === "Sold")).slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: w.title,
    url: `${SITE}${workPath(id)}`,
    image: `${SITE}/art/works/${id}.jpg`,
    artform: "Painting",
    artMedium: w.medium,
    creator: { "@type": "Person", name: "Dr Dolly Prasad", url: SITE },
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
    ["Status", sold ? "In a private collection" : statusWord(w)],
  ];

  const tabs = [
    ...(words ? [{ label: "In her words", body: (
      <>
        <p className="quote">“{words}”</p>
        <p className="eyebrow" style={{ marginTop: 14 }}>Dr Dolly Prasad</p>
      </>) }] : []),
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
        <div className="pp-text">
          <h1 className="pp-title">{w.title}</h1>
          <p className="pp-facts">{[w.medium, w.size, shownYear(w)].filter(Boolean).join(" · ")}</p>
          <p className="pp-status"><span className={`status st-${sold ? "sold" : w.status === "Enquire" ? "enquire" : "free"}`}><i aria-hidden="true" />{sold ? "In a private collection" : statusWord(w)}</span>
            <Link href={seriesPath(w.series)}>{w.series}</Link></p>
          {lead && <p className="pp-story">{words ? `“${lead}”` : lead}{words && <span>Dr Dolly Prasad</span>}</p>}
        </div>
      </PaintingStage>

      <div className="wrap">
      <div className="pp-text pp-after">
        {NOW_SHOWING_CONFIRMED && SHOW.works.includes(id) && (
          <Until until={SHOW.until}><p className="show-note">{SHOW.line}</p></Until>
        )}
        <div className="pp-ctas">
          <Link className="btn btn-solid" href={enquireHref(w)}>{sold ? "Ask about her work" : "Enquire about this painting"}</Link>
          {WHATSAPP && <a className="btn" href={whatsappHref(w)}><ChatIcon />WhatsApp</a>}
        </div>
        <div className="side-small">
          <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram</a>
          <a href={`${STUDIO_PATH}#work=${id}`}>In her studio →</a>
          <Share title={`${quoted(w.title)} · Dr Dolly Prasad`} path={workPath(id)} className="link share-btn" />
        </div>
      </div>

      <section className="wp-lower" style={{ paddingBottom: 28 }}>
        <Tabs tabs={tabs} />
      </section>

      {more.length > 0 && (
        <section className="sec-tight">
          <div className="sec-head">
            <h2>More from {w.series}</h2>
            <Link className="link" href={seriesPath(w.series)}>The collection’s story →</Link>
          </div>
          <div className="grid">{more.map((x) => <Card key={x.id} w={x} />)}</div>
        </section>
      )}

      <nav className="prevnext" aria-label="More of her work">
        <Link href={workPath(prev.id)}><span>Previous</span><b>{prev.title}</b></Link>
        <Link href={workPath(next.id)} className="nx"><span>Next</span><b>{next.title}</b></Link>
      </nav>

      </div>

      {/* on a phone, the way to ask stays in reach under the thumb */}
      <div className="wp-bar">
        <span><b>{w.title}</b><small>{sold ? "In a private collection" : w.status === "Enquire" ? "Availability on enquiry" : "Available · Price on request"}</small></span>
        <Link className="btn btn-solid" href={enquireHref(w)}>{sold ? "Ask" : "Enquire"}</Link>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}

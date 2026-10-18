import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ID, LARGE, SHOW, SITE, WORKS, inchDims, quoted, workPath, type Work } from "@/lib/works";
import { INSTAGRAM, LOOK, PULL, SMALL_PHOTO, shownYear, STUDIO_PATH, WHATSAPP, WORDS, enquireHref, labelLine, seriesPath, whatsappHref, worksIn } from "@/lib/site";
import manifest from "@/public/art/manifest.json";
import Card from "@/components/site/Card";
import Viewer from "@/components/site/Viewer";
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
  const rows: [string, React.ReactNode][] = [
    ["Title", w.title],
    ["Medium", w.medium],
    ["Size", w.size ? `${w.size}${cm}` : "On request"],
    ["Year", shownYear(w) ?? "On request"],
    ["Collection", <Link key="s" href={seriesPath(w.series)}>{w.series}</Link>],
    ["Status", statusWord(w)],
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
        <p>The room views on this page are illustrations, made to show the painting at its size.</p>
      </>) },
  ];

  return (
    <div className="wrap">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/works">Works</Link> / <Link href={seriesPath(w.series)}>{w.series}</Link> / {w.title}
      </nav>

      <section className="wp-grid">
        <div className="wp-main">
          <div className="wp-head">
            <h1>{w.title}</h1>
            <p className="meta">{labelLine(w)} · From the collection <Link href={seriesPath(w.series)}>{w.series}</Link></p>
            {lead && <p className={`wp-lead${words ? " hers" : ""}`}>{words ? `“${lead}”` : lead}{words && <span>Dr Dolly Prasad</span>}</p>}
          </div>
          <Viewer w={w} src={src} thumb={`/site/thumbs/${id}.jpg`} dims={d ? { w: d.w, h: d.h } : undefined}
                  small={!!d && Math.max(d.w, d.h) < 600} />
        </div>

        <aside className="wp-side">
          <div className="side-facts">
            <span className="eyebrow">{w.series}</span>
            <span>{w.medium}</span>
            {w.size && <span>{w.size}{cm}</span>}
            {w.year && <span>{shownYear(w)}</span>}
            <span>From the collection <Link href={seriesPath(w.series)}>{w.series} →</Link></span>
          </div>
          <div className="side-status">
            <span className={`status${sold ? " is-sold" : w.status === "Enquire" ? " is-enquire" : ""}`}>{statusWord(w)}</span>
            <b>{sold ? "In a private collection" : "Price on request"}</b>
          </div>
          {SHOW.works.includes(id) && (
            <Until until={SHOW.until}><p className="show-note">{SHOW.line}</p></Until>
          )}
          {WHATSAPP && <a className="btn btn-wa" href={whatsappHref(w)}><ChatIcon />{sold ? "Ask about her work" : "Ask on WhatsApp"}</a>}
          <Link className={WHATSAPP ? "btn" : "btn btn-solid"} href={enquireHref(w)}>{sold ? "Ask about her work" : "Enquire about this painting"}</Link>
          <div className="side-small">
            <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />Her paintings on Instagram {INSTAGRAM.handle}</a>
            <a href={`${STUDIO_PATH}#work=${id}`}>See it on the wall in her studio →</a>
            <Share title={`${quoted(w.title)} · Dr Dolly Prasad`} path={workPath(id)} className="link share-btn" />
          </div>
        </aside>
      </section>

      <section style={{ paddingBottom: 40 }}>
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}

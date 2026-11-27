import Link from "next/link";
import { quoted, workPath, type Work } from "@/lib/works";
import { DELIVERY_LINE, INSTAGRAM, LOOK, SERIES_BY_SLUG, STUDIO_PATH, enquireHref, neighbours, shownYear, statusText } from "@/lib/site";
import Share from "@/components/Share";
import { InstagramIcon } from "@/components/site/Icons";

/**
 * The one painting card: what a painting says about itself, wherever it is
 * opened. Its collection, its title, its label (medium · size · year), her
 * words on it, whether it is free, and the ways to ask. The painting's own
 * page (/work/[id]) and the studio's overlay both render this, so the two
 * can never drift apart.
 *
 * `place`: on the painting's page the quiet links lead into the studio; in
 * the studio they lead out to the painting's page instead.
 */
export default function PaintingInfo({ w, place = "page", titleId }: { w: Work; place?: "page" | "studio"; titleId?: string }) {
  const nb = neighbours(w.id);
  const coll = nb ? SERIES_BY_SLUG.get(nb.slug) : undefined;
  const lead = LOOK[w.id];
  const sold = w.status === "Sold";
  const Title = place === "page" ? "h1" : "h2";
  return (
    <div className="pp-text">
      {coll && <Link className="pp-back" href={`/series/${coll.slug}`}>‹ {coll.label}</Link>}
      <Title className="pp-title" id={titleId}>{w.title}</Title>
      <p className="pp-facts">{[w.medium, w.size, shownYear(w)].filter(Boolean).join(" · ")}</p>
      {lead && <p className="pp-story is-ours">{lead}</p>}
      <p className="pp-status"><span className={`status st-${sold ? "sold" : w.status === "Enquire" ? "enquire" : "free"}`}><i aria-hidden="true" />{sold ? "In a private collection" : statusText(w)}</span></p>
      {!sold && <p className="pp-price">Prices on request.</p>}
      <div className="pp-ctas">
        <Link className="btn btn-solid" href={enquireHref(w)}>{sold ? "Ask about her work" : "Enquire about this painting"}</Link>
      </div>
      {DELIVERY_LINE && <p className="pp-delivery meta">{DELIVERY_LINE}</p>}
      <div className="side-small">
        <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram</a>
        {place === "page"
          ? <a href={`${STUDIO_PATH}#work=${w.id}`}>See it in the studio →</a>
          : <Link href={workPath(w.id)}>See the painting →</Link>}
        <Share title={`${quoted(w.title)} · Dr Dolly Prasad`} path={workPath(w.id)} className="link share-btn" />
      </div>
    </div>
  );
}

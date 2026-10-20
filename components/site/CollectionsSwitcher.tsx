import Link from "next/link";
import { LEAD, SERIES_PAGES, seriesNeighbours } from "@/lib/site";
import { thumb } from "@/components/site/Card";
import CswCentre from "@/components/site/CswCentre";

/**
 * R4 B2-2: the compact collections switcher (text plus a small lead-painting chip), used under the /series
 * hero and at the top of each story page. Sticky under the header bar at >=761, a scroll row on phones.
 * Static: no animation, no auto-advance. On a story page `current` marks it and adds ‹ Prev / Next ›.
 */
export default function CollectionsSwitcher({ current }: { current?: string }) {
  const nb = current ? seriesNeighbours(current) : undefined;
  return (
    <nav className="csw" aria-label="Collections">
      <div className="csw-in">
        {nb && (
          <Link className="csw-pn" href={`/series/${nb.prev.slug}`} aria-label={`Previous collection: ${nb.prev.label}`}>‹ Prev</Link>
        )}
        <ol className="csw-l">
          {SERIES_PAGES.map((s) => (
            <li key={s.slug}>
              <Link className="csw-i" href={`/series/${s.slug}`} aria-current={s.slug === current ? "page" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="csw-th" src={thumb(LEAD[s.slug] ?? s.hero)} alt="" width={28} height={28} />
                <span className="csw-t">{s.label}</span>
              </Link>
            </li>
          ))}
        </ol>
        {nb && (
          <Link className="csw-pn" href={`/series/${nb.next.slug}`} aria-label={`Next collection: ${nb.next.label}`}>Next ›</Link>
        )}
      </div>
      {current && <CswCentre />}
    </nav>
  );
}

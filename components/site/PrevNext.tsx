import Link from "next/link";

type End = { href: string; kicker: string; label: string };

/**
 * R4 B2-3: the one Previous/Next pair (painting pager, story-page end pager). Left card outline, right card
 * indigo with white text at every width. On phones one column with Next first.
 */
export default function PrevNext({ prev, next, count, label = "Previous and next" }: { prev: End; next: End; count?: string; label?: string }) {
  return (
    <nav className="pnx" aria-label={label}>
      {count && <p className="pnx-n">{count}</p>}
      <div className="pnx-g">
        <Link className="pnx-c pnx-prev" href={prev.href} rel="prev">
          <span className="pnx-k">{prev.kicker}</span>
          <b className="pnx-t">{prev.label}</b>
        </Link>
        <Link className="pnx-c pnx-next" href={next.href} rel="next">
          <span className="pnx-k">{next.kicker}</span>
          <b className="pnx-t">{next.label}</b>
        </Link>
      </div>
    </nav>
  );
}

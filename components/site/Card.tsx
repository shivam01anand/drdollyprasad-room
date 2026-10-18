import Link from "next/link";
import { labelLine, statusText } from "@/lib/site";
import { quoted, workPath, type Work } from "@/lib/works";

export const thumb = (id: string) => `/site/thumbs/${id}.jpg`;

const statusClass = (w: Work) => (w.status === "Sold" ? "status is-sold" : w.status === "Enquire" ? "status is-enquire" : "status");

/** a painting in its frame on a wall-coloured mat, its title, its label and whether it is free */
export default function Card({ w, label = true, eager = false }: { w: Work; label?: boolean; eager?: boolean }) {
  return (
    <Link className="card" href={workPath(w.id)}>
      <div className="mat">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="framed thin" src={thumb(w.id)} srcSet={`${thumb(w.id)} 640w, /art/works/${w.id}.jpg 1100w`}
             sizes="(max-width: 640px) 92vw, (max-width: 1100px) 33vw, 300px" alt={`${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`}
             loading={eager ? "eager" : "lazy"} decoding="async" />
      </div>
      <span className="card-t">{w.title}</span>
      {label && <span className="meta">{labelLine(w)}</span>}
      <span className={statusClass(w)}>{statusText(w)}</span>
    </Link>
  );
}

export { quoted };

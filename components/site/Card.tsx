import Link from "next/link";
import { labelLine, statusText } from "@/lib/site";
import { quoted, workPath, type Work } from "@/lib/works";
import { dims } from "@/lib/images";

export const thumb = (id: string) => `/site/thumbs/${id}.jpg`;

const statusClass = (w: Work) => (w.status === "Sold" ? "status is-sold" : w.status === "Enquire" ? "status is-enquire" : "status");

/** a painting in its frame on a wall-coloured mat, its title, its label and whether it is free */
export default function Card({ w, label = true, eager = false }: { w: Work; label?: boolean; eager?: boolean }) {
  const d = dims(thumb(w.id));
  // the painting's shape, so a grid can reserve its exact space before it loads
  const ar = d.width && d.height ? { ["--ar" as string]: `${d.width} / ${d.height}` } : undefined;
  return (
    <Link className="card" href={workPath(w.id)}>
      <div className="mat">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="framed thin" src={thumb(w.id)} alt={`${w.title}, ${w.medium.toLowerCase()}, by Dr Dolly Prasad`}
             loading={eager ? "eager" : "lazy"} decoding="async" {...d} style={ar} />
      </div>
      <span className="card-t">{w.title}</span>
      {label && <span className="meta">{labelLine(w)}</span>}
      <span className={statusClass(w)}>{statusText(w)}</span>
    </Link>
  );
}

export { quoted };

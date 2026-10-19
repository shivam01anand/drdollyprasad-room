import { dims } from "@/lib/images";
import { BY_ID, workPath } from "@/lib/works";
import BandRow from "./BandRow";

/**
 * A page opening for Works: a low row of her paintings running slowly, then
 * the page's title and one line under it. CR-005 (Shubham): the row is sharp
 * and in full colour, as vibrant as the rest of the site, and nothing sits on
 * top of it. It can be dragged or swiped, each painting opens on a click or
 * tap, and it is still for reduced motion (BandRow, lib/drift). The row uses
 * 280 px copies (public/site/thumbs/sm), so it adds little weight.
 */
export default function TitleBand({ ids, title, children }: { ids: string[]; title: string; children?: React.ReactNode }) {
  const tiles = ids.map((id) => {
    const src = `/site/thumbs/sm/${id}.jpg`;
    return { href: workPath(id), src, title: BY_ID.get(id)?.title ?? "", ...dims(src) };
  });
  return (
    <section className="tband tband-open" aria-labelledby="tband-h">
      <BandRow tiles={tiles} />
      <div className="tband-card">
        <h1 id="tband-h" className="page-title">{title}</h1>
        {children}
      </div>
    </section>
  );
}

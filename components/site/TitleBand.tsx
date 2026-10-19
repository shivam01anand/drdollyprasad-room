import { dims } from "@/lib/images";
import { BY_ID, workPath } from "@/lib/works";
import BandRow from "./BandRow";

/**
 * A page opening for Works, Collections and Exhibitions (Shubham, round 3,
 * backlog B5): a low row of her paintings running slowly behind, softly
 * blurred, and a white card on top with the page's title and one line. It is
 * short, so the first real content still shows on the first screen. The row
 * uses 280 px copies (public/site/thumbs/sm), so it adds little weight. It can
 * be dragged or swiped, each painting opens on a click or tap, and it is still
 * for reduced motion (BandRow, lib/drift).
 */
export default function TitleBand({ ids, title, children }: { ids: string[]; title: string; children?: React.ReactNode }) {
  const tiles = ids.map((id) => {
    const src = `/site/thumbs/sm/${id}.jpg`;
    return { href: workPath(id), src, title: BY_ID.get(id)?.title ?? "", ...dims(src) };
  });
  return (
    <section className="tband" aria-labelledby="tband-h">
      <BandRow tiles={tiles} />
      <div className="tband-card">
        <h1 id="tband-h" className="page-title">{title}</h1>
        {children}
      </div>
    </section>
  );
}

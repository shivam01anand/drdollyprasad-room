import { dims } from "@/lib/images";

/**
 * A page opening for Works, Collections and Exhibitions (Shubham, round 3,
 * backlog B5): a low row of her paintings running slowly behind, softly
 * blurred, and a white card on top with the page's title and one line. It is
 * short, so the first real content still shows on the first screen. The row
 * uses 280 px copies (public/site/thumbs/sm), so it adds little weight; it is
 * decoration, hidden from screen readers, and still for reduced motion.
 */
export default function TitleBand({ ids, title, children }: { ids: string[]; title: string; children?: React.ReactNode }) {
  const row = [...ids, ...ids];
  return (
    <section className="tband" aria-labelledby="tband-h">
      <div className="tband-row" aria-hidden="true">
        <div className="tband-track">
          {row.map((id, i) => {
            const src = `/site/thumbs/sm/${id}.jpg`;
            // eslint-disable-next-line @next/next/no-img-element
            return <img key={i} className="framed thin" src={src} alt="" loading={i < ids.length ? "eager" : "lazy"} decoding="async" {...dims(src)} />;
          })}
        </div>
      </div>
      <div className="tband-card">
        <h1 id="tband-h" className="page-title">{title}</h1>
        {children}
      </div>
    </section>
  );
}

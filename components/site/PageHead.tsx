/** A plain title block on Khadi ground, for pages that open without a collage (as Enquire and Bahaar do). */
export default function PageHead({ eyebrow, title, red, line, children }: {
  eyebrow?: React.ReactNode;
  title: string;
  red?: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="ph wrap">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{red && title.includes(red) ? <>{title.split(red)[0]}<span className="red">{red}</span>{title.split(red)[1]}</> : title}</h1>
      {line && <p className="lede">{line}</p>}
      {children && <div className="ph-btns">{children}</div>}
    </header>
  );
}

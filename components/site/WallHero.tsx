import { Wall, type Item } from "./Collage";

/**
 * The home opening: the name block on plain Khadi ground, then the moving wall
 * below it, uncovered (elevate, 26 Nov 2026: nothing laid over paintings, no
 * pale card). Slots, top to bottom: eyebrow, name, tagline, sub-line, proof
 * line, buttons. Final words come in the words round.
 */
export default function WallHero({ columns, label, eyebrow, title, red, tagline, sub, proof, children, size = "home", speed }: {
  columns: Item[][];
  label: string;
  eyebrow?: React.ReactNode;
  title: string;
  /** the ONE word of the title set in blood red */
  red?: string;
  tagline?: React.ReactNode;
  sub?: React.ReactNode;
  proof?: React.ReactNode;
  children?: React.ReactNode;
  size?: "home" | "page";
  speed?: number;
}) {
  return (
    <section className={`wh wh-${size}`} aria-label={label}>
      <div className="wh-head wrap">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{red && title.includes(red) ? <>{title.split(red)[0]}<span className="red">{red}</span>{title.split(red)[1]}</> : title}</h1>
        {tagline && <p className="wh-tag">{tagline}</p>}
        {sub && <p className="wh-sub">{sub}</p>}
        {proof && <p className="wh-proof">{proof}</p>}
        {children && <div className="wh-btns">{children}</div>}
      </div>
      <div className="wh-wall collage">
        <Wall columns={columns} speed={speed} />
      </div>
    </section>
  );
}

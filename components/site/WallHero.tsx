import { Wall, type Item } from "./Collage";

/**
 * A page opening: the moving wall, and a small white card centred on it with
 * the paintings running all round it (CR-006, Shubham: on a phone and a
 * computer alike). Every landing uses this same card, same size and place.
 * `face` is kept for callers; the portrait is in the header.
 */
export default function WallHero({ columns, label, face, eyebrow, title, red, held, sub, children, size = "page", speed }: {
  columns: Item[][];
  label: string;
  face?: string;
  eyebrow?: string;
  title: string;
  /** the ONE word of the title set in blood red */
  red?: string;
  held?: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  /** "dir": a directory page (R4 B3-1, /series): the "page" hero at a shorter height on >=641 */
  size?: "home" | "page" | "dir";
  speed?: number;
  /** kept for callers; the wall is never blurred now */
  soft?: boolean;
}) {
  return (
    <section className={`wh wh-${size === "dir" ? "page wh-dir" : size}`} aria-label={label}>
      {/* CR-006: one small white card, the same on every landing: eyebrow, title, one short line, the buttons */}
      <div className="wh-card namecard">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{red && title.includes(red) ? <>{title.split(red)[0]}<span className="red">{red}</span>{title.split(red)[1]}</> : title}</h1>
        {(held || sub) && <p className="wh-line">{held ?? sub}</p>}
        {children && <div className="ctas">{children}</div>}
      </div>
      <div className="wh-wall collage">
        <Wall columns={columns} speed={speed} />
      </div>
    </section>
  );
}

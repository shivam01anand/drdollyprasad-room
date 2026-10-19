import { Wall, type Item } from "./Collage";

/**
 * A page opening: the moving wall and a small card with the page's name.
 * CR-005 (Shubham: "the hero card hides paintings"): the card no longer sits
 * on the wall. On a computer they stand side by side, the card on the left;
 * on a tablet or phone the wall comes first and the card sits below it. Her
 * portrait (`face`) is a circle inside the card, not cutting its edge.
 */
export default function WallHero({ columns, label, face, eyebrow, title, held, sub, children, size = "page", speed }: {
  columns: Item[][];
  label: string;
  face?: string;
  eyebrow?: string;
  title: string;
  held?: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  size?: "home" | "page";
  speed?: number;
  /** kept for callers; the wall is never blurred now */
  soft?: boolean;
}) {
  return (
    <section className={`wh wh-${size}`} aria-label={label}>
      <div className="wh-card namecard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {face && <img className="face" src={face} alt="Dr Dolly Prasad" width={96} height={96} />}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {held && <p className="held">{held}</p>}
        {sub && <div className="sub">{sub}</div>}
        {children && <div className="ctas">{children}</div>}
      </div>
      <div className="wh-wall collage">
        <Wall columns={columns} speed={speed} />
      </div>
    </section>
  );
}

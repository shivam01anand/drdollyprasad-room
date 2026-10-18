import { Wall, type Item } from "./Collage";

/**
 * A page opening: the moving wall behind, and a small card centred on it.
 * `face` sets her portrait in a circle cutting the card's top edge.
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
}) {
  return (
    <section className={`collage-wrap is-${size}`} aria-label={label}>
      <div className="collage">
        <Wall columns={columns} speed={speed} />
        <div className={`namecard${face ? " has-face" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {face && <img className="face" src={face} alt="Dr Dolly Prasad" width={100} height={100} />}
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {held && <p className="held">{held}</p>}
          {sub && <div className="sub">{sub}</div>}
          {children && <div className="ctas">{children}</div>}
        </div>
      </div>
    </section>
  );
}

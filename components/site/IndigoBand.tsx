import Link from "next/link";
import type { ReactNode } from "react";

/** the one deep-indigo band every page carries, styled like home's "Key collections" */
export default function IndigoBand({ title, line, href, label, children, id }: {
  title: string; line?: string; href?: string; label?: string; children?: ReactNode; id?: string;
}) {
  return (
    <div className="layer band-indigo ibnd" id={id}>
      <section className="sec wrap">
        <div className="sec-head">
          <div>
            <h2>{title}</h2>
            {line && <p className="sec-line">{line}</p>}
          </div>
          {href && <Link className="link" href={href}>{label} →</Link>}
        </div>
        {children}
      </section>
    </div>
  );
}

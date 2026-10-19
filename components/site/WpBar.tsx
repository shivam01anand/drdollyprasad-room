"use client";
import { useEffect, useRef, type ReactNode } from "react";

/* The phone Enquire bar slides away while the in-page Enquire button (or the footer) is on screen, so it never hides it. */
export default function WpBar({ children }: { children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = el.current;
    if (!bar || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((es) => {
      for (const e of es) (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      bar.classList.toggle("is-away", seen.size > 0);
    }, { threshold: 0.01 });
    document.querySelectorAll(".pp-ctas, .ftr-in").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return <div className="wp-bar" ref={el}>{children}</div>;
}

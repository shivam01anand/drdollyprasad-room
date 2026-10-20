"use client";
import { useEffect, useRef, type ReactNode } from "react";

/* The phone Enquire bar slides away while the in-page Enquire button (or the footer) is on screen, so it never hides it. */
export default function WpBar({ children }: { children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = el.current;
    if (!bar || typeof IntersectionObserver === "undefined") return;
    // shown only once the visitor has scrolled past the in-page Enquire button (it is on the first screen),
    // and hidden again over the footer: it never covers the painting's text on arrival
    const seen = new Set<Element>();
    let passed = false;
    bar.classList.add("is-away");
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target);
        if (e.target.classList.contains("pp-ctas")) passed = !e.isIntersecting && e.boundingClientRect.top < 0;
      }
      bar.classList.toggle("is-away", seen.size > 0 || !passed);
    }, { threshold: 0.01 });
    document.querySelectorAll(".pp-ctas, .ftr-in").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return <div className="wp-bar" ref={el}>{children}</div>;
}

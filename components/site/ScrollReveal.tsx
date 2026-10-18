"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sections ease up into place as they scroll into view, so the page keeps
 * moving below the opening wall. Anything already on screen when the page
 * loads is left alone, so nothing flashes; reduced motion gets no movement.
 */
const TARGETS = ".sec-head, .big-tiles, .hw-in, .ig-in, .ex-facts, .ex-show, .now-box, .chap, .story-intro, .story-quote, .ab-hero-in, .ab-split, .ab-statement, .ab-close, .themes, .srow, .next-series, .ex-screen, .ex-record, .wp-lower, .page-head";

export default function ScrollReveal() {
  const path = usePathname();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>(TARGETS)];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92) continue;
      el.classList.add("rv");
      io.observe(el);
    }
    return () => io.disconnect();
  }, [path]);
  return null;
}

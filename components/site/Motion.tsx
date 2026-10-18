"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Quiet motion for the whole website, in one place:
 *  - sections and cards rise softly into place the first time they scroll into view;
 *  - the header slims once the page has scrolled.
 * Nothing is hidden unless this script runs (the `js-motion` class), and
 * nothing moves for anyone who has asked for reduced motion.
 */
const REVEAL = [
  ".sec-head", ".grid > *", ".shows > *", ".about-row", ".ig-in .txt", ".story-head > *", ".story-quote",
  ".story-intro > p", ".chap-h", ".chap-works > *", ".chap-big", ".chap-small", ".chap-split > *", ".srow > *",
  ".next-series > *", ".ex-facts > *", ".ex-sum", ".ex-show > *", ".clip", ".timeline > li", ".ab-txt > *",
  ".ab-portrait", ".ab-statement > *", ".ab-close > *", ".roll", ".tabs", ".prevnext", ".series-sum > *",
  // round 2/3 content sections
  ".big-tiles", ".hw-in", ".ig-in", ".now-box", ".story-intro", ".ab-hero-in", ".ab-split", ".themes", ".ex-screen", ".ex-record", ".wp-lower", ".page-head",
].join(",");

export default function Motion() {
  const path = usePathname();

  // the header: full at the top, slim once the page moves
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => root.classList.toggle("is-scrolled", scrollY > 24));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);

  // reveal on scroll, re-armed on every page
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("js-motion");
    const els = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter((el) => !el.classList.contains("is-in"));
    // whatever is already on screen shows at once (no flash of hidden content above the fold)
    const vh = innerHeight;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        // siblings arriving together are staggered a little
        const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => els.includes(c as HTMLElement)) : [];
        const k = Math.max(0, sibs.indexOf(el)) % 6;
        el.style.transitionDelay = `${k * 70}ms`;
        el.classList.add("is-in");
        io.unobserve(el);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in");
      else { el.classList.add("rv"); io.observe(el); }
    }
    // a safety net: anything still waiting after a while is shown anyway
    const t = setTimeout(() => els.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); }), 2500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [path]);

  return null;
}

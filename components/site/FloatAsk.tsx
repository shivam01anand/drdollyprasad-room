"use client";
import { useEffect, useRef } from "react";
import { ChatIcon } from "./Icons";

/* The phone WhatsApp bar steps aside whenever an in-page call to action, a form or the footer is on screen,
   so it never covers or cuts off a button. */
export default function FloatAsk({ href }: { href: string }) {
  const el = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const bar = el.current;
    if (!bar || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((es) => {
      for (const e of es) (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      bar.classList.toggle("is-away", seen.size > 0);
    }, { threshold: 0.01 });
    const watch = () => document.querySelectorAll(".pp-ctas, .ftr-in, form, [data-nofloat]").forEach((n) => io.observe(n));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return <a ref={el} className="btn btn-wa float-ask" href={href}><ChatIcon />Ask on WhatsApp</a>;
}

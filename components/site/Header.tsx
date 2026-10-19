"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { INSTAGRAM, NAV, PORTRAIT, STUDIO_PATH, WHATSAPP, whatsappHref } from "@/lib/site";
import { ChatIcon, InstagramIcon } from "./Icons";

/**
 * Her portrait and name top-left, the rooms of the site, and the two ways to ask.
 * On a phone the menu opens as a full screen of its own, the pages in large
 * type, one under the other.
 */
export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // a page chosen closes the menu
  useEffect(() => { setOpen(false); }, [path]);
  // Escape or a tap outside the panel closes it; the page beneath keeps scrolling (CR-008: a small dropdown, not a takeover)
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const away = (e: PointerEvent) => { if (bar.current && !bar.current.contains(e.target as Node)) setOpen(false); };
    addEventListener("keydown", key);
    document.addEventListener("pointerdown", away);
    return () => { removeEventListener("keydown", key); document.removeEventListener("pointerdown", away); };
  }, [open]);

  const here = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)) ||
    (href === "/works" && path.startsWith("/work/"));

  const link = (n: { href: string; label: string }, i?: number) =>
    n.href === STUDIO_PATH
      // the studio is its own page with its own styles: a full load
      ? <a key={n.href} href={n.href} onClick={() => setOpen(false)} style={i !== undefined ? { ["--i" as string]: i } : undefined}>{n.label}</a>
      : <Link key={n.href} href={n.href} aria-current={here(n.href) ? "page" : undefined}
              style={i !== undefined ? { ["--i" as string]: i } : undefined}
              onClick={() => setOpen(false)}>{n.label}</Link>;

  return (
    <header ref={bar} className={`hdr${open ? " is-open" : ""}`}>
      {/* the village line sketch rides with the bar: crisp at the top of the page, frosted with it once the page moves (CR-005) */}
      <div className="band band-top" aria-hidden="true" />
      <div className="wrap hdr-in">
        <Link href="/" className="brand" aria-label="Dr Dolly Prasad, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PORTRAIT} alt="" width={52} height={52} />
          <span className="brand-t"><b>Dr Dolly Prasad</b><i>The everyday, held sacred.</i></span>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => link(n))}
          <a className="ig" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${INSTAGRAM.handle}`}>
            <InstagramIcon />
          </a>
        </nav>
        <div className="hdr-cta">
          {WHATSAPP && <a className="btn btn-wa" href={whatsappHref()}><ChatIcon />WhatsApp</a>}
          <Link className="btn btn-solid" href="/enquire">Enquire</Link>
        </div>
        <button type="button" className="burger" aria-expanded={open} aria-controls="phone-menu"
                aria-label={open ? "Close the menu" : "Menu"} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      <div id="phone-menu" className="sheet" inert={!open} aria-hidden={!open}>
        <nav className="sheet-nav" aria-label="Main">
          {link({ href: "/", label: "Home" }, 0)}
          {NAV.map((n, i) => link(n, i + 1))}
        </nav>
        <div className="sheet-foot">
          <Link className="btn btn-solid" href="/enquire" onClick={() => setOpen(false)}>Enquire about a painting</Link>
          <a className="sheet-ig" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"><InstagramIcon />{INSTAGRAM.handle}</a>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { INSTAGRAM, NAV, PORTRAIT, STUDIO_PATH, WHATSAPP, whatsappHref } from "@/lib/site";
import { ChatIcon, InstagramIcon, MenuIcon } from "./Icons";

/** her portrait and name top-left, the rooms of the site, and the two ways to ask */
export default function Header() {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  // a phone's menu closes once a page is chosen
  useEffect(() => { if (menu.current) menu.current.open = false; }, [path]);
  // a tap anywhere outside the open menu closes it
  useEffect(() => {
    const close = (e: MouseEvent) => { if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false; };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const here = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)) ||
    (href === "/works" && path.startsWith("/work/"));

  const links = NAV.map((n) =>
    n.href === STUDIO_PATH
      // the studio is its own page with its own styles: a full load
      ? <a key={n.href} href={n.href}>{n.label}</a>
      : <Link key={n.href} href={n.href} aria-current={here(n.href) ? "page" : undefined}>{n.label}</Link>);

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link href="/" className="brand" aria-label="Dr Dolly Prasad, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PORTRAIT} alt="" width={52} height={52} />
          <span className="brand-t"><b>Dr Dolly Prasad</b><i>The everyday, held sacred.</i></span>
        </Link>
        <nav className="nav" aria-label="Main">
          {links}
          <a className="ig" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${INSTAGRAM.handle}`}>
            <InstagramIcon />
          </a>
        </nav>
        <div className="hdr-cta">
          {WHATSAPP && <a className="btn btn-wa" href={whatsappHref()}><ChatIcon />WhatsApp</a>}
          <Link className="btn btn-solid" href="/enquire">Enquire</Link>
        </div>
        <details className="menu" ref={menu}>
          <summary aria-label="Menu"><MenuIcon /></summary>
          <div className="menu-panel">
            <Link href="/">Home</Link>
            {links}
            <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer">Instagram</a>
            <Link className="btn btn-solid" href="/enquire">Enquire</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

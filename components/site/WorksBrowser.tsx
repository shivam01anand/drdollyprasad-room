"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { SERIES_PAGES, SMALL_PHOTO } from "@/lib/site";
import { WORKS, type Work } from "@/lib/works";
import { track } from "@/lib/analytics";

type Status = "all" | "available" | "sold";
type Size = "all" | "small" | "medium" | "large";

const sizeOf = (w: Work): Size | null => (!w.inches ? null : w.inches < 24 ? "small" : w.inches <= 36 ? "medium" : "large");
const isFree = (w: Work) => w.status !== "Sold";

/**
 * every painting, newest series first, filtered by series, status and size (the
 * filter is kept in the address). Two to a row on a computer and a phone alike
 * (Shubham, PR #11 review), each painting whole with its title under it.
 */
export default function WorksBrowser() {
  const [series, setSeries] = useState("all");
  const [status, setStatus] = useState<Status>("all");
  const [size, setSize] = useState<Size>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get("series"); if (s && SERIES_PAGES.some((x) => x.slug === s)) setSeries(s);
    const st = q.get("status"); if (st === "available" || st === "sold") setStatus(st);
    const z = q.get("size"); if (z === "small" || z === "medium" || z === "large") setSize(z);
    const pg = Number(q.get("page")); if (pg > 1) setPage(pg);
  }, []);
  useEffect(() => {
    // Retain campaign attribution and the verification flag while updating only filters.
    const q = new URLSearchParams(location.search);
    for (const key of ["series", "status", "size", "page"]) q.delete(key);
    if (series !== "all") q.set("series", series);
    if (status !== "all") q.set("status", status);
    if (size !== "all") q.set("size", size);
    if (page > 1) q.set("page", String(page));
    const s = q.toString();
    history.replaceState(null, "", s ? `?${s}` : location.pathname);
  }, [series, status, size, page]);

  // one continuous flow, the collections mixed (Shubham, 20 Oct): a fixed shuffle, so the order is
  // the same on every visit and on the server and in the browser
  const all = useMemo(() => {
    const a = [...WORKS]; let seed = 20261020;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    // no two from the same collection side by side, where it can be avoided
    for (let i = 1; i < a.length; i++) if (a[i].series === a[i - 1].series) {
      const k = a.findIndex((x, n) => n > i && x.series !== a[i - 1].series); if (k > 0) [a[i], a[k]] = [a[k], a[i]];
    }
    // paintings whose only photograph is small come last, so the first page opens on the strongest images
    return [...a.filter((w) => !SMALL_PHOTO.has(w.id)), ...a.filter((w) => SMALL_PHOTO.has(w.id))];
  }, []);
  const label = (slug: string) => SERIES_PAGES.find((s) => s.slug === slug)?.label;
  const shown = all.filter((w) =>
    (series === "all" || w.series === label(series)) &&
    (status === "all" || (status === "available" ? isFree(w) : !isFree(w))) &&
    (size === "all" || sizeOf(w) === size));
  const n = (f: (w: Work) => boolean) => all.filter(f).length;

  // one portfolio of every painting (Shubham, 20 Oct); the collection is a filter, not a section
  const SECTION_OPEN = 8; // the first eight paintings load at once; the rest as you scroll
  const PER = 12;
  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const at = Math.min(page, pages);
  const slice = shown.slice((at - 1) * PER, at * PER);
  const go = (n: number) => { setPage(n); track("works_page_changed", { page: n }); document.querySelector(".wfilters")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const Pager = ({ where }: { where: string }) => pages < 2 ? null : (
    <nav className={`pf-pager ${where}`} aria-label="Pages of paintings">
      <button type="button" className="btn" disabled={at === 1} onClick={() => go(at - 1)}>← Previous</button>
      <span className="meta">Page {at} of {pages}</span>
      <button type="button" className="btn btn-solid" disabled={at === pages} onClick={() => go(at + 1)}>Next page →</button>
    </nav>
  );

  return (
    <>
      <div className="wrap wfilters">
      <div className="filters filters-line" role="group" aria-label="Filter the works">
        <label className="fsel">
          <span>Collection</span>
          <select value={series} onChange={(e) => { track("works_filter_changed", { filter: "collection", value: e.target.value }); setSeries(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            {SERIES_PAGES.map((s) => <option key={s.slug} value={s.slug}>{s.label} ({n((w) => w.series === s.label)})</option>)}
          </select>
        </label>
        <label className="fsel">
          <span>Status</span>
          <select value={status} onChange={(e) => { track("works_filter_changed", { filter: "status", value: e.target.value }); setStatus(e.target.value as Status); setPage(1); }}>
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="sold">In private collections</option>
          </select>
        </label>
        <label className="fsel">
          <span>Size</span>
          <select value={size} onChange={(e) => { track("works_filter_changed", { filter: "size", value: e.target.value }); setSize(e.target.value as Size); setPage(1); }}>
            <option value="all">All</option>
            <option value="small">S · under 24 in</option>
            <option value="medium">M · 24 to 36 in</option>
            <option value="large">L · over 36 in</option>
          </select>
        </label>
      </div>
      <div className="count-row">
        <p className="meta" aria-live="polite">
          {shown.length} {shown.length === 1 ? "painting" : "paintings"}
          {size !== "all" && " · only works with a confirmed size"}
        </p>
        <Pager where="pf-top" />
      </div>
      </div>
      {shown.length ? (
        <section className="wgroup band-white portfolio" aria-label="All the paintings">
          <div className="wrap">
            <div className="grid works-grid pf-grid">{slice.map((w, i) => <Card key={w.id} w={w} eager={i < SECTION_OPEN} />)}</div>
            <Pager where="pf-bottom" />
          </div>
        </section>
      ) : <div className="wrap"><p className="empty">No paintings match these filters.</p></div>}
    </>
  );
}

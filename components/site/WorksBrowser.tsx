"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "./Card";
import { SERIES_PAGES } from "@/lib/site";
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

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get("series"); if (s && SERIES_PAGES.some((x) => x.slug === s)) setSeries(s);
    const st = q.get("status"); if (st === "available" || st === "sold") setStatus(st);
    const z = q.get("size"); if (z === "small" || z === "medium" || z === "large") setSize(z);
  }, []);
  useEffect(() => {
    // Retain campaign attribution and the verification flag while updating only filters.
    const q = new URLSearchParams(location.search);
    for (const key of ["series", "status", "size"]) q.delete(key);
    if (series !== "all") q.set("series", series);
    if (status !== "all") q.set("status", status);
    if (size !== "all") q.set("size", size);
    const s = q.toString();
    history.replaceState(null, "", s ? `?${s}` : location.pathname);
  }, [series, status, size]);

  // the newest series first, as the site's series pages run
  const order = useMemo(() => [...SERIES_PAGES].reverse().map((s) => s.label), []);
  const all = useMemo(() => [...WORKS].sort((a, b) => order.indexOf(a.series) - order.indexOf(b.series)), [order]);
  const label = (slug: string) => SERIES_PAGES.find((s) => s.slug === slug)?.label;
  const shown = all.filter((w) =>
    (series === "all" || w.series === label(series)) &&
    (status === "all" || (status === "available" ? isFree(w) : !isFree(w))) &&
    (size === "all" || sizeOf(w) === size));
  const n = (f: (w: Work) => boolean) => all.filter(f).length;

  // grouped by collection, the bands alternating white and indigo as the home page does
  const groups = SERIES_PAGES.slice().reverse()
    .map((sp) => ({ sp, items: shown.filter((w) => w.series === sp.label) })).filter((g) => g.items.length);
  const SECTION_OPEN = 8; // the first eight paintings load at once; the rest as you scroll
  let seen = 0;

  return (
    <>
      <div className="wrap wfilters">
      <div className="filters filters-line" role="group" aria-label="Filter the works">
        <label className="fsel">
          <span>Collection</span>
          <select value={series} onChange={(e) => { track("works_filter_changed", { filter: "collection", value: e.target.value }); setSeries(e.target.value); }}>
            <option value="all">All</option>
            {SERIES_PAGES.map((s) => <option key={s.slug} value={s.slug}>{s.label} ({n((w) => w.series === s.label)})</option>)}
          </select>
        </label>
        <label className="fsel">
          <span>Status</span>
          <select value={status} onChange={(e) => { track("works_filter_changed", { filter: "status", value: e.target.value }); setStatus(e.target.value as Status); }}>
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="sold">In private collections</option>
          </select>
        </label>
        <label className="fsel">
          <span>Size</span>
          <select value={size} onChange={(e) => { track("works_filter_changed", { filter: "size", value: e.target.value }); setSize(e.target.value as Size); }}>
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
      </div>
      </div>
      {groups.length ? groups.map((g, k) => {
        const first = seen; seen += g.items.length;
        return (
          <section key={g.sp.slug} className={`wgroup ${k % 2 ? "band-indigo" : "band-white"}`} aria-labelledby={`wg-${g.sp.slug}`}>
            <div className="wrap">
              <div className="sec-head wg-head">
                <div>
                  <h2 id={`wg-${g.sp.slug}`}>{g.sp.label}</h2>
                  <p className="sec-line">{g.sp.line}</p>
                  <p className="meta">{g.items.length} {g.items.length === 1 ? "painting" : "paintings"} · {g.sp.period}</p>
                </div>
                <Link className="link" href={`/series/${g.sp.slug}`}>The collection →</Link>
              </div>
              <div className="grid works-grid">{g.items.map((w, i) => <Card key={w.id} w={w} eager={first + i < SECTION_OPEN} />)}</div>
            </div>
          </section>
        );
      }) : <div className="wrap"><p className="empty">No paintings match these filters.</p></div>}
    </>
  );
}

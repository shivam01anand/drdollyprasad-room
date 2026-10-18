"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { SERIES_PAGES } from "@/lib/site";
import { WORKS, type Work } from "@/lib/works";

type Status = "all" | "available" | "sold";
type Size = "all" | "small" | "medium" | "large";

const sizeOf = (w: Work): Size | null => (!w.inches ? null : w.inches < 24 ? "small" : w.inches <= 36 ? "medium" : "large");
const isFree = (w: Work) => w.status !== "Sold";

/** every painting, newest series first, filtered by series, status and size (the filter is kept in the address) */
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
    const q = new URLSearchParams();
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

  const chip = (on: boolean, text: string, click: () => void) => (
    <button key={text} type="button" className="chip" aria-pressed={on} onClick={click}>{text}</button>
  );

  return (
    <>
      <div className="filters" role="group" aria-label="Filter the works">
        <div className="frow">
          <span>Collection</span>
          {chip(series === "all", "All", () => setSeries("all"))}
          {SERIES_PAGES.map((s) => chip(series === s.slug, `${s.label} · ${n((w) => w.series === s.label)}`, () => setSeries(s.slug)))}
        </div>
        <div className="frow">
          <span>Status</span>
          {chip(status === "all", "All", () => setStatus("all"))}
          {chip(status === "available", "Available", () => setStatus("available"))}
          {chip(status === "sold", "In private collections", () => setStatus("sold"))}
        </div>
        <div className="frow">
          <span>Size</span>
          {chip(size === "all", "All", () => setSize("all"))}
          {chip(size === "small", "Small · under 24 in", () => setSize("small"))}
          {chip(size === "medium", "Medium · 24–36 in", () => setSize("medium"))}
          {chip(size === "large", "Large · over 36 in", () => setSize("large"))}
        </div>
      </div>
      <p className="meta" aria-live="polite" style={{ marginBottom: 18 }}>
        {shown.length} {shown.length === 1 ? "painting" : "paintings"}
        {size !== "all" && " · only works with a stated size"}
      </p>
      {shown.length ? (
        <div className="grid">{shown.map((w, i) => <Card key={w.id} w={w} eager={i < 8} />)}</div>
      ) : (
        <p className="empty">No paintings match these filters.</p>
      )}
    </>
  );
}

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
 * all the paintings in one scroll (elevate, 26 Nov 2026: no pager), filtered by collection,
 * status and size with quiet text chips (the filter is kept in the address). On a phone the
 * grid runs one large card, then two side by side.
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

  const SECTION_OPEN = 4; // the first row loads at once; the rest as you scroll (native lazy images)
  const pick = (filter: string, value: string, set: () => void) => { track("works_filter_changed", { filter, value }); set(); };
  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" className={`wchip${on ? " is-on" : ""}`} aria-pressed={on} onClick={onClick}>{children}</button>
  );

  return (
    <>
      <div className="wrap wfilters">
        <header className="wtitle">
          <h1 className="page-title">Works</h1>
          <p className="lede">Forty-one paintings of the India we pass every day.</p>
        </header>
        <div className="wchips" role="group" aria-label="Filter the works">
          <div className="wchip-row" role="group" aria-label="Collection">
            <Chip on={series === "all"} onClick={() => pick("collection", "all", () => setSeries("all"))}>All</Chip>
            {SERIES_PAGES.map((s) => <Chip key={s.slug} on={series === s.slug} onClick={() => pick("collection", s.slug, () => setSeries(s.slug))}>{s.label}</Chip>)}
          </div>
          <div className="wchip-row" role="group" aria-label="Status and size">
            <Chip on={status === "available"} onClick={() => pick("status", "available", () => setStatus(status === "available" ? "all" : "available"))}>Available</Chip>
            <Chip on={status === "sold"} onClick={() => pick("status", "sold", () => setStatus(status === "sold" ? "all" : "sold"))}>In private collections</Chip>
            <span className="wchip-gap" aria-hidden="true" />
            <Chip on={size === "small"} onClick={() => pick("size", "small", () => setSize(size === "small" ? "all" : "small"))}>Small</Chip>
            <Chip on={size === "medium"} onClick={() => pick("size", "medium", () => setSize(size === "medium" ? "all" : "medium"))}>Medium</Chip>
            <Chip on={size === "large"} onClick={() => pick("size", "large", () => setSize(size === "large" ? "all" : "large"))}>Large</Chip>
          </div>
        </div>
        <p className="meta wcount" aria-live="polite">
          {shown.length} {shown.length === 1 ? "painting" : "paintings"}
          {size !== "all" && " · only works with a confirmed size"}
        </p>
      </div>
      {shown.length ? (
        <section className="wgroup band-white portfolio" aria-label="All the paintings">
          <div className="wrap">
            <div className="grid works-grid pf-grid">{shown.map((w, i) => <Card key={w.id} w={w} eager={i < SECTION_OPEN} />)}</div>
          </div>
        </section>
      ) : <div className="wrap"><p className="empty">No paintings match these filters.</p></div>}
    </>
  );
}

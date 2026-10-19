"use client";
import { useEffect, useState } from "react";

type Row = Record<string, any>;
type Result = { results: any[]; columns?: string[]; loadedAt: string };
const tiles = [
  ["Visitors over time", "Unique anonymous browsers each day.", "line"],
  ["Countries", "Sessions by approximate location.", "bars"],
  ["Cities", "Approximate location; VPNs can affect this.", "bars"],
  ["Devices", "How visitors experience the gallery.", "bars"],
  ["Browsers", "Browsers used to explore the work.", "bars"],
  ["Traffic sources", "Where visitors arrive from.", "bars"],
  ["Paintings opened", "Unique visitors for each painting.", "bars"],
  ["From visit to contact", "In the same session, within one hour.", "funnel"],
  ["Enquiry form journey", "Form viewed → started → email or WhatsApp opened.", "funnel"],
  ["Inside the studio", "Studio started → ready → painting opened.", "funnel"],
  ["Pages visitors follow", "Observed page-to-page journeys, with query strings removed.", "paths"],
  ["Recent visitor sessions", "Anonymous browsers, paintings and contact handoffs.", "table"],
  ["Last observed pages", "The last page seen in each session; not proof of abandonment.", "table"],
  ["Time with paintings visible", "Foreground-tab seconds per page visit; visibility, not attention.", "table"],
];
const number = (value: unknown) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(Number(value) || 0);
function valueLabel(value: unknown): string {
  if (Array.isArray(value)) return value.map(valueLabel).join(", ") || "—";
  if (value == null || value === "") return "—";
  const text = String(value);
  if (text === "$direct") return "Direct";
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(text)) return new Date(text).toLocaleString("en-IN", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC";
  return text;
}
function Table({ result, paths = false }: { result: Result; paths?: boolean }) {
  const rows = result.results;
  const columns = result.columns || (paths ? ["source", "target", "value"] : []);
  if (!columns.length) return <p className="empty">No journeys observed in this period.</p>;
  const label = (value: unknown) => paths ? valueLabel(value).replace(/^\d+_https:\/\/drdollyprasad.com/, "").replace(/^$/, "/") : valueLabel(value);
  return <div className="table-scroll" tabIndex={0} aria-label="Scrollable analytics table"><table><thead><tr>{columns.map(c => <th key={c}>{c.replaceAll("_", " ").replace("value", "journeys")}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{columns.map((c, j) => <td key={c}>{label(Array.isArray(row) ? row[j] : row[c])}</td>)}</tr>)}</tbody></table></div>;
}
function Chart({ result, type }: { result: Result; type: string }) {
  const rows = result.results as Row[];
  if (!rows.length) return <p className="empty">No activity observed in this period.</p>;
  if (type === "table" || type === "paths") return <Table result={result} paths={type === "paths"} />;
  if (type === "line") {
    const data: number[] = rows[0]?.data || [];
    const days: string[] = rows[0]?.days || [];
    if (!data.length) return <p className="empty">No visits observed in this period.</p>;
    const max = Math.max(1, ...data);
    const points = data.map((n, i) => `${40 + i / Math.max(1, data.length - 1) * 700},${165 - n / max * 140}`).join(" ");
    return <><svg className="trend" viewBox="0 0 780 210" role="img" aria-label={`Daily visitors. Peak: ${max}.`}><line x1="40" y1="165" x2="740" y2="165" stroke="#ddd9d1" /><text x="12" y="30">{max}</text><text x="12" y="169">0</text><polyline points={points} fill="none" stroke="#6c373e" strokeWidth="3" strokeLinejoin="round" /><text x="40" y="200">{days[0]?.slice(0, 10)}</text><text x="740" y="200" textAnchor="end">{days.at(-1)?.slice(0, 10)}</text></svg><details><summary>View daily counts</summary><div className="table-scroll"><table><thead><tr><th>Date (UTC)</th><th>Visitors</th></tr></thead><tbody>{data.map((v, i) => <tr key={i}><td>{days[i]?.slice(0, 10)}</td><td>{v}</td></tr>)}</tbody></table></div></details></>;
  }
  const counts = rows.map(r => Number(type === "funnel" ? r.count : r.aggregated_value ?? r.count ?? r.data?.reduce((a: number, b: number) => a + b, 0)) || 0);
  const max = Math.max(1, ...counts);
  return <div className="bars">{rows.map((r, i) => <div className="bar-row" key={i}><div className="bar-title"><span>{type === "funnel" ? `${i + 1}. ${r.custom_name || r.name || "Step"}` : valueLabel(r.breakdown_value ?? r.label)}</span><strong>{number(counts[i])}{type === "funnel" && counts[0] > 0 && <small> · {Math.round(counts[i] / counts[0] * 100)}%</small>}</strong></div><div className="bar-track"><div style={{ width: `${counts[i] / max * 100}%` }} /></div></div>)}</div>;
}
function Tile({ index, days, refresh }: { index: number; days: number; refresh: number }) {
  const [data, setData] = useState<Result>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined); setError("");
    // Stagger the requests to keep the analytics connection responsive.
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/analytics/data?tile=${index}&days=${days}`, { signal: controller.signal, cache: "no-store" });
        const value = await response.json();
        if (!response.ok) throw new Error(value.error);
        setData(value);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load this view."); }
    }, Math.floor(index / 3) * 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [index, days, refresh, retry]);
  const [title, description, type] = tiles[index];
  return <section className={`tile tile-${index}`} aria-busy={!data && !error}><header><h2>{title}</h2><p>{description}</p></header>{error ? <div className="tile-error"><p role="alert">{error}</p><button onClick={() => setRetry(v => v + 1)}>Retry</button></div> : data ? <Chart result={data} type={type} /> : <div className="skeleton" aria-label="Loading analytics"><i /><i /><i /></div>}</section>;
}
export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [refresh, setRefresh] = useState(0);
  const [summary, setSummary] = useState<Result>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setSummary(undefined); setError("");
    fetch(`/analytics/data?tile=summary&days=${days}`, { signal: controller.signal, cache: "no-store" }).then(async response => { const value = await response.json(); if (!response.ok) throw new Error(value.error); setSummary(value); }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [days, refresh]);
  return <main className="analytics dashboard"><div className="topbar"><a href="/" className="wordmark">Dr Dolly Prasad<span>THE ARTIST’S STUDIO</span></a><span className="private-badge">WEBSITE ANALYTICS</span></div>
    <header className="page-heading"><div><p className="eyebrow">A VIEW OF THE GALLERY</p><h1>The work, <em>and its audience.</em></h1><p>How people find the gallery, spend time with the paintings, and get in touch.</p></div><div className="controls"><label htmlFor="period">Date range</label><select id="period" value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button onClick={() => setRefresh(v => v + 1)}>↻ Refresh</button></div></header>
    <div className="scope"><span><i /> Dr Dolly’s production website</span><span>Preview & test sessions excluded</span><span>All times in UTC</span></div>
    {error && <p className="notice" role="alert">{error} <button onClick={() => setRefresh(v => v + 1)}>Retry</button></p>}
    <section className="metrics" aria-label="Website overview">{["Visitors", "Sessions", "Page views", "Painting opens", "Contact handoffs"].map((title, i) => <div className="metric" key={title}><span>{title}</span><strong>{summary ? number(summary.results[0]?.[i]) : "—"}</strong><small>{["Anonymous browsers", "Visits to the gallery", "Pages explored", "Pages & studio lightboxes", "Email or WhatsApp opened"][i]}</small></div>)}</section>
    <div className="section-heading"><h2>Discovering the work</h2><span>{summary ? `Updated ${new Date(summary.loadedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Loading current figures…"}</span></div>
    <div className="tile-grid">{[0, 6, 1, 2, 3, 4, 5].map(i => <Tile key={i} index={i} days={days} refresh={refresh} />)}</div>
    <div className="section-heading"><h2>From curiosity to conversation</h2></div><div className="tile-grid">{[7, 8, 9, 10].map(i => <Tile key={i} index={i} days={days} refresh={refresh} />)}</div>
    <div className="section-heading"><h2>A closer look at each visit</h2></div><div className="tile-grid">{[11, 12, 13].map(i => <Tile key={i} index={i} days={days} refresh={refresh} />)}</div>
    <footer className="analytics-footer"><p>Visitors are anonymous browsers, not verified people. A contact handoff means email or WhatsApp was opened; it doesn’t confirm a message was sent. Locations are approximate.</p><p>Counts may be small while tracking is new. The saved dashboard uses these same production filters and query definitions.</p></footer>
  </main>;
}

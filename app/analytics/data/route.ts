import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/analytics-admin";
// Reuse the same reviewed query definitions as the saved PostHog dashboard.
import views from "@/scripts/posthog-insights.cjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const scope = "properties.app_name = 'drdollyprasad' AND properties.analytics_environment = 'production' AND properties.is_test = false";
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" };
export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers });
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key?.startsWith("phx_")) return NextResponse.json({ error: "The analytics connection needs a server-side PostHog key. Contact the site administrator." }, { status: 503, headers });
  const days = Number(request.nextUrl.searchParams.get("days") || 30);
  const tile = request.nextUrl.searchParams.get("tile") || "summary";
  if (![7, 30, 90].includes(days) || (tile !== "summary" && !/^([0-9]|1[0-3])$/.test(tile))) return NextResponse.json({ error: "Invalid view." }, { status: 400, headers });
  let query;
  if (tile === "summary") query = { kind: "HogQLQuery", query: `SELECT uniqIf(distinct_id, event = '$pageview') AS visitors, uniqIf(properties.$session_id, event = '$pageview') AS sessions, countIf(event = '$pageview') AS pageviews, countIf(event = 'painting_viewed') AS painting_opens, countIf(event = 'enquiry_handoff') AS contact_handoffs FROM events WHERE ${scope} AND timestamp >= now() - INTERVAL ${days} DAY` };
  else {
    query = structuredClone(views[Number(tile)].query.source);
    if (query.kind === "HogQLQuery") query.query = query.query.replace("INTERVAL 30 DAY", `INTERVAL ${days} DAY`);
    else query.dateRange = { date_from: `-${days}d`, date_to: null };
  }
  try {
    const response = await fetch("https://us.posthog.com/api/projects/317586/query/", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ query, refresh: "blocking", name: `Dolly private analytics: ${tile}` }), cache: "no-store", signal: AbortSignal.timeout(55000) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Analytics is busy. Please retry in a minute." : "Could not load this view. Please retry or check the analytics connection." }, { status: 502, headers });
    const result = await response.json();
    if (result.error || result.query_status?.error) throw new Error("Query failed");
    if (result.query_status?.complete === false || !Array.isArray(result.results)) return NextResponse.json({ error: "This view is still calculating. Please retry shortly." }, { status: 503, headers });
    return NextResponse.json({ results: result.results, columns: result.columns, loadedAt: new Date().toISOString() }, { headers });
  } catch { return NextResponse.json({ error: "This view took too long or is temporarily unavailable. Please retry." }, { status: 502, headers }); }
}

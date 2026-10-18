import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminConfigured, verifyAdminSession } from "@/lib/analytics-admin";
import Dashboard from "./Dashboard";
import "./analytics.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private analytics", robots: { index: false, follow: false, noarchive: true } };
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const authenticated = verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (authenticated) return <Dashboard />;
  const configured = adminConfigured();
  const { error } = await searchParams;
  return <main className="analytics login"><div className="login-card">
    <a className="wordmark" href="/">Dr Dolly Prasad<span>THE ARTIST’S STUDIO</span></a>
    <p className="eyebrow">PRIVATE · ADMIN ACCESS</p><h1>A little perspective<br /><em>on the gallery.</em></h1>
    <p className="intro">See how visitors discover the work, explore the studio, and get in touch.</p>
    {configured ? <form action="/analytics/login" method="post"><label htmlFor="password">Admin password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} />{error && <p role="alert" className="error">That password wasn’t recognised. Please try again.</p>}<button type="submit">Open analytics <span>↗</span></button></form> : <p className="notice">Admin access is awaiting setup. Ask the site administrator to configure the analytics password.</p>}
    <small>This page is private and isn’t listed in the gallery navigation.</small>
  </div></main>;
}

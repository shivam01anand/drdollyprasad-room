import type { Metadata } from "next";
import Dashboard from "./Dashboard";
import "./analytics.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Website analytics", robots: { index: false, follow: false, noarchive: true } };
export default function AnalyticsPage() {
  return <Dashboard />;
}

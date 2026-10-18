import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "dolly_analytics_admin";
export const SESSION_SECONDS = 8 * 60 * 60;
export function adminConfigured() {
  return (process.env.ANALYTICS_ADMIN_PASSWORD?.length || 0) >= 20;
}
function digest(value: string) { return createHash("sha256").update(value).digest(); }
export function passwordMatches(value: string) {
  return adminConfigured() && value.length <= 256 && timingSafeEqual(digest(value), digest(process.env.ANALYTICS_ADMIN_PASSWORD || ""));
}
function signature(value: string) {
  return createHmac("sha256", process.env.ANALYTICS_ADMIN_PASSWORD || "").update(`dolly-analytics-v1:${value}`).digest("hex");
}
export function createAdminSession(now = Date.now()) {
  if (!adminConfigured()) throw new Error("Admin access is not configured");
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expires}.${signature(expires)}`;
}
export function verifyAdminSession(token: string | undefined, now = Date.now()) {
  if (!adminConfigured() || !token || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, supplied] = token.split(".");
  const remaining = Number(expires) - Math.floor(now / 1000);
  return remaining > 0 && remaining <= SESSION_SECONDS && timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(signature(expires), "hex"));
}

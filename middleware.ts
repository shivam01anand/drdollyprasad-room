import { NextRequest, NextResponse } from "next/server";

/**
 * The analytics dashboard and its data route are private (18 Nov 2026).
 * They open only with the password in the ANALYTICS_PASSWORD environment
 * variable (set in Vercel). Without that variable set, both answer 404, so
 * visitor numbers are never public by default.
 */
const deny = () =>
  new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Website analytics", charset="UTF-8"', "Cache-Control": "private, no-store" },
  });

/** compares every byte, so the time taken does not hint at how much of a guess was right */
const same = (a: string, b: string) => {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};

export function middleware(request: NextRequest) {
  const password = process.env.ANALYTICS_PASSWORD;
  if (!password) return new NextResponse("Not found", { status: 404 });

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() !== "basic" || !encoded) return deny();
  let decoded: string;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
  } catch {
    return deny();
  }
  const colon = decoded.indexOf(":");
  if (colon < 0) return deny();
  return same(decoded.slice(colon + 1), password) ? NextResponse.next() : deny();
}

export const config = { matcher: ["/analytics", "/analytics/:path*"] };

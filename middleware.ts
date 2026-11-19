import { NextRequest, NextResponse } from "next/server";

/**
 * The analytics dashboard and its data route are private (18 Nov 2026).
 * They open only with the password in the ANALYTICS_PASSWORD environment
 * variable (set in Vercel). Without that variable set, both answer 404, so
 * visitor numbers are never public by default.
 */
export function middleware(request: NextRequest) {
  const password = process.env.ANALYTICS_PASSWORD;
  if (!password) return new NextResponse("Not found", { status: 404 });

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given === password) return NextResponse.next();
  }
  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Website analytics", charset="UTF-8"', "Cache-Control": "private, no-store" },
  });
}

export const config = { matcher: ["/analytics", "/analytics/:path*"] };

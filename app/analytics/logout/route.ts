import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/analytics-admin";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const response = NextResponse.redirect(new URL("/analytics", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict", path: "/analytics", maxAge: 0 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

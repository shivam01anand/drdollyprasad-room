import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_SECONDS, adminConfigured, createAdminSession, passwordMatches } from "@/lib/analytics-admin";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (!adminConfigured()) return new NextResponse("Admin access has not been configured.", { status: 503 });
  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return NextResponse.redirect(new URL("/analytics?error=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/analytics", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict", path: "/analytics", maxAge: SESSION_SECONDS });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

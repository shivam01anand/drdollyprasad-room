import { EMAIL } from "@/lib/works";

/**
 * Sends an enquiry from the website form to her inbox, so the visitor does not
 * need a mail app. It uses Resend (resend.com, free tier) when RESEND_API_KEY
 * is set in Vercel; without it the route answers 503 and the form falls back
 * to opening the visitor's mail app, as before.
 *
 * With a Resend account created on her own address, no domain set-up is
 * needed: Resend's shared sender may write to the account's own address.
 * ENQUIRY_TO and ENQUIRY_FROM override the inbox and sender once a domain is
 * verified.
 */
export const runtime = "nodejs";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+$/g, "").slice(0, max) : "");

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "not-configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ ok: false, reason: "bad-request" }, { status: 400 }); }

  // a field people never see: anything in it is a robot
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 120);
  const reply = clean(body.reply, 200);
  const subject = clean(body.subject, 160) || "Website enquiry";
  const text = clean(body.text, 5000);
  if (!name || !reply || !text) return Response.json({ ok: false, reason: "missing" }, { status: 400 });

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM || "Dr Dolly Prasad website <onboarding@resend.dev>",
      to: [process.env.ENQUIRY_TO || EMAIL],
      subject: `${subject} (from ${name})`,
      text: `${text}\n\n— Sent from the enquiry form on drdollyprasad.com`,
      ...(isEmail ? { reply_to: reply } : {}),
    }),
  }).catch(() => null);

  if (!res || !res.ok) return Response.json({ ok: false, reason: "send-failed" }, { status: 502 });
  return Response.json({ ok: true });
}

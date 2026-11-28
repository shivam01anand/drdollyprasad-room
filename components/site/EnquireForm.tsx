"use client";

import { useEffect, useRef, useState } from "react";
import { EMAIL, SERIES_PAGES, SITE, collectionOrder, quoted, workPath } from "@/lib/site";
import { BY_ID } from "@/lib/works";
import { paintingProperties, track } from "@/lib/analytics";
import { dims } from "@/lib/images";
import { altOf } from "@/lib/alt";
import Pic from "./Pic";

/**
 * An enquiry, written once and sent to her email only (no WhatsApp, no phone number shown). "Send" posts
 * to /api/enquire, which delivers it to her inbox; if the site's mail service is not set up (RESEND_API_KEY)
 * or fails, a "Open your mail app" link (a real mailto: link, so a phone opens it on the tap) shows, with the
 * message pre-filled to her address and the painting's title, plus Copy the message. The message names the painting and links its page. The
 * email address is always shown as text with a copy button.
 * Arriving from a painting (?work=), the form opens on that painting, framed, with its title and size;
 * the two pickers stay folded behind "Change" (elevate, 26 Nov 2026).
 */
export default function EnquireForm() {
  const [work, setWork] = useState("");
  const [name, setName] = useState("");
  const [reply, setReply] = useState("");
  const [city, setCity] = useState("");
  const [kind, setKind] = useState("A painting");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<"" | "mail" | "sending" | "sent">("");
  const [trap, setTrap] = useState("");
  const started = useRef(false);
  // the pickers are folded away while the form shows the painting it was opened for
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("work");
    if (id && BY_ID.has(id)) setWork(id);
  }, []);

  const w = work ? BY_ID.get(work) : undefined;
  const context = () => ({ ...(w ? paintingProperties(w) : {}), enquiry_type: w ? "A painting" : kind, source: "enquiry_form" });
  const start = () => {
    if (started.current) return;
    started.current = true;
    track("enquiry_started", context());
  };
  const text = () => {
    const sign = [name, city].filter(Boolean).join(", ");
    return [
      "Hello Dr Prasad,",
      "",
      w ? `I would like to know more about ${quoted(w.title)}: ${SITE}${workPath(w.id)}` : `I am writing about: ${kind.toLowerCase()}.`,
      ...(msg.trim() ? ["", msg.trim()] : []),
      "",
      ...(sign ? [sign] : []),
      ...(reply ? [`Reply to: ${reply}`] : []),
    ].join("\n");
  };

  const subject = w ? `Enquiry: ${w.title}` : `Enquiry: ${kind}`;
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`;
  // the fallback: show a real mailto link under the visitor's finger (a phone opens it on the tap; a script
  // redirect after an await is often blocked), and try the redirect too
  const mailApp = () => {
    track("enquiry_handoff", { ...context(), method: "email" });
    setSent("mail");
    location.href = mailto;
  };
  const viaMail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sent === "sending") return;
    setSent("sending");
    try {
      const r = await fetch("/api/enquire", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, reply, subject, text: text(), website: trap }),
      });
      if (r.ok) {
        track("enquiry_handoff", { ...context(), method: "form" });
        setSent("sent");
        return;
      }
    } catch { /* offline or blocked: the mail app is the fallback */ }
    mailApp();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); track("contact_copied", { source: "enquiry_page" }); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* refused */ }
  };
  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(`${subject}\n\n${text()}`); track("enquiry_message_copied", context()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* refused */ }
  };

  return (
    <div className="enq">
      <form onFocusCapture={start} onSubmit={viaMail}>
        {w && !picking && (
          <div className="enq-about">
            <Pic className="framed thin" src={`/site/thumbs/${w.id}.jpg`} alt={altOf(w)} sizes="120px" eager {...dims(`/site/thumbs/${w.id}.jpg`)} />
            <p>
              <b>{w.title}</b>
              {w.size && <span className="meta">{w.size}</span>}
              <button type="button" className="link" onClick={() => setPicking(true)}>Change</button>
            </p>
          </div>
        )}
        <div className="two" hidden={!!w && !picking}>
          <div className="field">
            <label htmlFor="q-kind">I’m asking about</label>
            <select id="q-kind" value={w ? "A painting" : kind} onChange={(e) => { setKind(e.target.value); if (e.target.value !== "A painting") setWork(""); }}>
              <option>A painting</option>
              <option>An exhibition or the press</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="q-work">Painting (optional)</label>
            <select id="q-work" value={work} onChange={(e) => setWork(e.target.value)}>
              <option value="">Choose a painting</option>
              {/* newest collection first, each in its chapter order */}
              {SERIES_PAGES.flatMap((s) => collectionOrder(s.slug)).map((id) => BY_ID.get(id)!).map((x) => <option key={x.id} value={x.id}>{x.title}{x.status === "Sold" ? " (in a private collection)" : ""}</option>)}
            </select>
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="q-name">Your name</label>
            <input id="q-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="q-city">City</label>
            <input id="q-city" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="q-reply">Your email, for the reply</label>
          <input id="q-reply" type="email" inputMode="email" autoComplete="email" value={reply} onChange={(e) => setReply(e.target.value)} required />
        </div>
        <div className="hp" aria-hidden="true">
          <label htmlFor="q-web">Leave this empty</label>
          <input id="q-web" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="q-msg">Message</label>
          <textarea id="q-msg" value={msg} onChange={(e) => setMsg(e.target.value)}
                    placeholder={w ? `What would you like to know about ${w.title}?` : "What are you looking for?"} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-solid" disabled={sent === "sending"}>
            {sent === "sending" ? "Sending…" : "Send"}
          </button>
          <button type="button" className="btn" onClick={copyMessage}>Copy the message</button>
        </div>
        {sent === "mail" && (
          <div className="done" role="status">
            <p>Sorry, the form could not send this time. Your message is ready to go from your mail app. Tap below to send it.</p>
            <p><a className="btn btn-solid" href={mailto}>Open your mail app</a></p>
            <p>If nothing opens, copy the message and send it to <b>{EMAIL}</b> from any email account.</p>
          </div>
        )}
        {sent === "sent" && (
          <p className="done" role="status">
            Thank you{name ? `, ${name.split(" ")[0]}` : ""}. Your message is on its way, and the reply will come to {reply}.
          </p>
        )}
      </form>

      <aside>
        <div className="note note-plain">
          <b>Write directly</b>
          <div className="mail"><code>{EMAIL}</code>
            <button type="button" className="chip" onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="meta">Enquiries are welcome.</p>
        </div>
      </aside>
    </div>
  );
}

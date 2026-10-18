"use client";

import { useEffect, useState } from "react";
import { EMAIL, SITE, WHATSAPP, quoted, workPath } from "@/lib/site";
import { BY_ID, WORKS } from "@/lib/works";

/**
 * An enquiry, written once and sent the way the visitor prefers: WhatsApp
 * (when her number is set) or email. The message names the painting and links
 * its page. The email address is always shown as text with a copy button, so
 * nobody depends on a mail app being set up.
 */
export default function EnquireForm() {
  const [work, setWork] = useState("");
  const [name, setName] = useState("");
  const [reply, setReply] = useState("");
  const [city, setCity] = useState("");
  const [kind, setKind] = useState("A painting");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<"" | "wa" | "mail">("");

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("work");
    if (id && BY_ID.has(id)) setWork(id);
  }, []);

  const w = work ? BY_ID.get(work) : undefined;
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
  const viaMail = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSent("mail");
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`;
  };
  const viaWa = () => {
    setSent("wa");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text())}`, "_blank", "noopener");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* refused */ }
  };
  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(`${subject}\n\n${text()}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* refused */ }
  };

  return (
    <div className="enq">
      <form onSubmit={WHATSAPP ? (e) => { e.preventDefault(); viaWa(); } : viaMail}>
        <div className="two">
          <div className="field">
            <label htmlFor="q-kind">I’m asking about</label>
            <select id="q-kind" value={w ? "A painting" : kind} onChange={(e) => { setKind(e.target.value); if (e.target.value !== "A painting") setWork(""); }}>
              <option>A painting</option>
              <option>A commission</option>
              <option>An exhibition or the press</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="q-work">Painting (optional)</label>
            <select id="q-work" value={work} onChange={(e) => setWork(e.target.value)}>
              <option value="">Choose a painting</option>
              {WORKS.map((x) => <option key={x.id} value={x.id}>{x.title}{x.status === "Sold" ? " (sold)" : ""}</option>)}
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
          <label htmlFor="q-reply">Phone or email, for the reply</label>
          <input id="q-reply" autoComplete="email" value={reply} onChange={(e) => setReply(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="q-msg">Message</label>
          <textarea id="q-msg" value={msg} onChange={(e) => setMsg(e.target.value)}
                    placeholder={w ? `What would you like to know about ${w.title}?` : "Tell us what you are looking for."} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {WHATSAPP && <button type="submit" className="btn btn-wa">Send on WhatsApp</button>}
          <button type={WHATSAPP ? "button" : "submit"} className={WHATSAPP ? "btn" : "btn btn-solid"} onClick={WHATSAPP ? () => viaMail() : undefined}>
            Send by email
          </button>
          <button type="button" className="btn" onClick={copyMessage}>Copy the message</button>
        </div>
        {sent === "mail" && (
          <p className="done" role="status">
            Your mail app should open with the message ready to send. If nothing opened, copy the message and send it to <b>{EMAIL}</b> from any email account.
          </p>
        )}
        {sent === "wa" && <p className="done" role="status">WhatsApp should open with your message ready to send.</p>}
      </form>

      <aside>
        <div className="note">
          <b>Write directly</b>
          <div className="mail"><code>{EMAIL}</code>
            <button type="button" className="chip" onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="meta">Paintings are offered with price on request. Enquiries and commissions are welcome.</p>
        </div>
      </aside>
    </div>
  );
}

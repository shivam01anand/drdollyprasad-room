import Link from "next/link";
import { EMAIL, INSTAGRAM, PORTRAIT, STUDIO_PATH, whatsappHref } from "@/lib/site";
import { ChatIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div className="ftr-id">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PORTRAIT} alt="" width={44} height={44} />
          <div>
            <b>Dr Dolly Prasad</b>
            <span className="meta">Studio · New Delhi · Enquiries and commissions</span>
          </div>
        </div>
        <nav className="ftr-links" aria-label="Contact">
          <a href={whatsappHref()}>WhatsApp</a>
          <Link href="/enquire">{EMAIL}</Link>
          <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer">Instagram {INSTAGRAM.handle}</a>
          <a href={STUDIO_PATH}>Walk through the studio</a>
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 18 }}>
        <p className="meta">© {new Date().getFullYear()} Dr Dolly Prasad · Oil on canvas · New Delhi</p>
      </div>
      <a className="btn btn-wa float-ask" href={whatsappHref()}><ChatIcon />Ask on WhatsApp</a>
    </footer>
  );
}

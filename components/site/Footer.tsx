import Link from "next/link";
import { EMAIL, INSTAGRAM, PORTRAIT, STUDIO_PATH, WHATSAPP, whatsappHref } from "@/lib/site";
import { ChatIcon, InstagramIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div className="ftr-id">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PORTRAIT} alt="" width={44} height={44} />
          <div>
            <b>Dr Dolly Prasad</b>
            <span className="meta">Paintings in oil, New Delhi</span>
          </div>
        </div>
        <nav className="ftr-links" aria-label="Contact">
          <Link className="btn btn-solid" href="/enquire">Enquire</Link>
          {WHATSAPP && <a href={whatsappHref()}>WhatsApp</a>}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a className="ftr-ig" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${INSTAGRAM.handle}`}>
            <InstagramIcon /><span>{INSTAGRAM.handle}</span>
          </a>
          <a href={STUDIO_PATH}>Walk through the studio</a>
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 18 }}>
        <p className="meta">© {new Date().getFullYear()} Dr Dolly Prasad</p>
      </div>
      {WHATSAPP && <a className="btn btn-wa float-ask" href={whatsappHref()}><ChatIcon />Ask on WhatsApp</a>}
    </footer>
  );
}

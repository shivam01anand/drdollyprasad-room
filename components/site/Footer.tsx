import Link from "next/link";
import { EMAIL, INSTAGRAM, PORTRAIT, STUDIO_PATH } from "@/lib/site";
import { InstagramIcon } from "./Icons";
import MotionToggle from "./MotionToggle";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div className="ftr-id">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PORTRAIT} alt="" width={44} height={44} loading="lazy" decoding="async" />
          <div>
            <b>Dr Dolly Prasad</b>
            <span className="meta">Paintings in oil, New Delhi</span>
          </div>
        </div>
        <nav className="ftr-links" aria-label="Contact">
          <Link href="/enquire">Enquire</Link>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a className="ftr-ig" href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${INSTAGRAM.handle}`}>
            <InstagramIcon /><span>{INSTAGRAM.handle}</span>
          </a>
          <a href={STUDIO_PATH}>Walk through the house</a>
          <MotionToggle />
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 18 }}>
        <p className="meta">© {new Date().getFullYear()} Dr Dolly Prasad</p>
      </div>
    </footer>
  );
}

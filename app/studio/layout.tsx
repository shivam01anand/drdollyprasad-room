import type { Metadata } from "next";
import { pageOg } from "@/lib/og";
import WELCOME_FONTS from "@/lib/welcome-fonts.json";
import "@fontsource/cormorant-garamond/500.css";
import "../fonts.css";
import "../globals.css";

const TITLE = "The studio";
const DESCRIPTION = "Walk through her studio, hung with Dr Dolly Prasad’s paintings at their true size, from the courtyard to the gallery.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/studio" },
  // the link preview carries this page's own title, line and address (elevate, 26 Nov 2026)
  openGraph: pageOg(TITLE, DESCRIPTION, "/studio"),
};

/** the 3D house, as it was the whole site: its own fonts and styles, loaded only here */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {WELCOME_FONTS.filter((href) => href.includes("instrument-sans") || href.includes("ibm-plex-mono"))
        .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      {children}
    </>
  );
}

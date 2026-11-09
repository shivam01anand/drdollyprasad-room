import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import WELCOME_FONTS from "@/lib/welcome-fonts.json";
import "../fonts.css";
import "../globals.css";
import "./photo.css";

export const metadata: Metadata = {
  title: "The studio",
  description: "Dr Dolly Prasad’s paintings, hung by series on the walls of her studio. Tap a painting to look closer.",
  alternates: { canonical: "/studio" },
};

/** the studio (photo walls; the 3D house is kept at /studio/house): its own fonts and styles, loaded only here */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {WELCOME_FONTS.filter((href) => href.includes("cormorant") || href.includes("devanagari"))
        .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      {children}
    </>
  );
}

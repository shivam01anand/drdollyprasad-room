import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import WELCOME_FONTS from "@/lib/welcome-fonts.json";
import "../fonts.css";
import "../globals.css";

export const metadata: Metadata = {
  title: "The studio",
  description: "Walk through Dr Dolly Prasad’s studio: a courtyard, a quiet room, a red room and a gallery, with her paintings on the walls.",
  alternates: { canonical: "/studio" },
};

/** the 3D house, as it was the whole site: its own fonts and styles, loaded only here */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {WELCOME_FONTS.filter((href) => href.includes("cormorant") || href.includes("devanagari"))
        .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      {children}
    </>
  );
}

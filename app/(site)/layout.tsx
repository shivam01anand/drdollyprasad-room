import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/700.css";
import "./site.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Band, Rails } from "@/components/site/Borders";

/** every page of the website: the line-work frame, her name and the menu, and the ways to reach her */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <Rails />
      <Band at="top" />
      <Header />
      <main id="main">{children}</main>
      <Band at="footer" />
      <Footer />
      <Band at="bottom" />
    </div>
  );
}

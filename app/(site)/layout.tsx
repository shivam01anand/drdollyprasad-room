import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/700.css";
import "./site.css";
import "./fix-pages.css";
import "./fix-about.css";
import "./fix-story.css";
import "./fix-phone.css";
import "./fix-type.css";
import "./fix-night.css";
import "./fix-tech.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Band, Rails } from "@/components/site/Borders";
import Motion from "@/components/site/Motion";
import Divider from "@/components/site/Divider";

/** every page of the website: the quiet border, her name and the menu, the painting lady signing off, and the ways to reach her */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      {/* the studio is a full page load: have it fetched before the click, so the click never lands on a blank screen */}
      <link rel="prefetch" href="/studio" as="document" />
      <Rails />
      <Header />
      <main id="main">{children}</main>
      {/* the painting lady, once, as the page's closing signature (CR-005: no dividers mid-page) */}
      <Divider figure="painter" />
      <Footer />
      <Band at="bottom" />
      <Motion />
    </div>
  );
}

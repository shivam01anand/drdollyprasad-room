import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "./(site)/site.css";

export default function NotFound() {
  return (
    <main className="wrap lost">
      <p className="eyebrow">Not here</p>
      <h1 className="page-title">This page isn’t on the walls.</h1>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a className="btn btn-solid" href="/">Home</a>
        <a className="btn" href="/works">All her work</a>
        <a className="btn" href="/studio">Walk through the studio</a>
      </div>
    </main>
  );
}

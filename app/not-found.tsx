import SiteLayout from "./(site)/layout";

/**
 * An address that is not on the site. It wears the website's own layout (the border, her name and the
 * menu, the footer and the type tokens), so a wrong link still lands inside the site, with the ways on.
 */
export default function NotFound() {
  return (
    <SiteLayout>
      <section className="wrap lost">
        <p className="eyebrow">Not here</p>
        <h1 className="page-title">This page isn’t on the walls.</h1>
        <div className="lost-ctas">
          <a className="btn btn-solid" href="/">Home</a>
          <a className="btn" href="/works">All her work</a>
          <a className="btn" href="/studio">Walk through the studio</a>
          <a className="btn" href="/enquire">Enquire</a>
        </div>
      </section>
    </SiteLayout>
  );
}

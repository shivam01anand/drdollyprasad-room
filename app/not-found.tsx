export default function NotFound() {
  return (
    <main className="wp wp-missing">
      <header className="wp-head">
        <a className="wp-brand" href="/">→ Dr Dolly Prasad</a>
      </header>
      <section className="wp-text">
        <p className="lab">Not here</p>
        <h1 className="wp-title">This page isn’t in the house.</h1>
        <div className="wp-actions">
          <a className="pill pill-solid" href="/">Step into the studio →</a>
          <a className="pill" href="/#works">All her work</a>
        </div>
      </section>
    </main>
  );
}

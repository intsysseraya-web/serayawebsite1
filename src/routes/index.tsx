import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";

const BODY_HTML = `
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/about#contact">RFQ response within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/works">View configured systems</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/about">Kuala Lumpur HQ</a>
      </div>
    </div>

    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya Systems Integration" /></a>
        <nav class="main-nav" aria-label="Primary">
          <a href="/" aria-current="page">Home</a>
          <a href="/works">Systems</a>
          <a href="/case-study">Programs</a>
          <a href="/about">Company</a>
          <a href="/about#contact">Contact</a>
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>
          <a class="icon-btn header-rfq-link" href="/about#contact" aria-label="Start an RFQ">RFQ</a>
          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">
      <div class="mobile-drawer-panel">
        <div class="overlay-head">
          <strong>Navigate</strong>
          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>
        </div>
        <nav class="mobile-nav">
          <a href="/">Home</a>
          <a href="/works">Systems</a>
          <a href="/case-study">Programs</a>
          <a href="/about">Company</a>
          <a href="/about#contact">Contact</a>
        </nav>
      </div>
    </div>

    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">
      <div class="overlay-sheet search-sheet">
        <div class="overlay-head">
          <strong>Search</strong>
          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>
        </div>
        <label class="muted" for="q">Keyword</label>
        <input class="search-input" id="q" type="search" placeholder="SKU, GPU, chassis..." autocomplete="off" />
        <p class="muted" style="margin-top: 0.75rem">Tip: browse Systems for full lists.</p>
      </div>
    </div>

    <div class="overlay-panel" id="cartPanel" hidden role="dialog" aria-modal="true" aria-label="Quote">
      <div class="overlay-sheet cart-sheet">
        <div class="overlay-head">
          <strong>Quote request</strong>
          <button type="button" class="icon-btn" id="btnCloseCart" aria-label="Close quote panel">X</button>
        </div>
        <p class="muted">No items yet. Email your RFQ and we reply with availability and lead time.</p>
        <p style="margin-top: 1rem">
          <a class="btn btn-primary" href="mailto:hello@serayasystem.com">Email RFQ</a>
        </p>
      </div>
    </div>

    <main id="main">
      <section class="hero" aria-labelledby="hero-title hero-subtitle">
        
        <div class="hero-inner">
          <p class="hero-kicker">Seraya Systems Integration</p>
          <h1 id="hero-title">KL's friendly neighborhood system integrator</h1>
          <p id="hero-subtitle" class="hero-subtitle">
            — for startups, studios, and that one friend who always asks &ldquo;can you build my PC?&rdquo;
          </p>
          <p>One workstation, one server room, doesn't matter.</p>
          <p>
            We get the good parts, put them together, burn them in, and hand you a machine
            that just works. Business or personal — same bench, same care.
          </p>
          <div class="btn-row">
            <a class="btn btn-primary" href="/works">For Business →</a>
            <a class="btn btn-ghost" href="/about#contact">For Individuals →</a>
          </div>
        </div>

        <div class="hero-marquee-wrap" aria-hidden="true">
          <div class="hero-marquee">
            <div class="hero-marquee-track">
              <ul class="hero-marquee-list">
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/intel.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/amd.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/nvidia.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/asus.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/msi.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <span class="hero-marquee-word">Gigabyte</span>
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/corsair.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/kingstontechnology.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/samsung.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/westerndigital.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/seagate.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/coolermaster.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/nzxt.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <span class="hero-marquee-word">Lian Li</span>
                </li>
              </ul>
              <ul class="hero-marquee-list">
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/intel.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/amd.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/nvidia.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/asus.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/msi.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <span class="hero-marquee-word">Gigabyte</span>
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/corsair.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/kingstontechnology.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/samsung.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/westerndigital.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/seagate.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/coolermaster.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <img
                    class="hero-marquee-logo"
                    src="/static/nzxt.svg"
                    alt=""
                    width="96"
                    height="24"
                    decoding="async"
                  />
                </li>
                <li>
                  <span class="hero-marquee-word">Lian Li</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="features-title">
        <div class="section-head">
          <h2 id="features-title">Featured lines</h2>
          <p class="muted">Three ways to work with us &mdash; new builds, BYO parts, or trade&#8209;ins. No secret handshake required.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <div class="feature-card-media">
              <img src="/static/photo-1591488320449-011701bb6704-w1200.jpg" alt="" loading="lazy" />
            </div>
            <h3>Quick&#8209;config towers</h3>
            <p>For when you just want a GPU node that works &ndash; no PhD in compatibility. Pick from our pre&#8209;tested parts lists. We match batches, flash the same BIOS, and ship ready to run.</p>
          </article>
          <article class="feature-card">
            <div class="feature-card-media">
              <img src="/static/photo-1558494949-ef010cbdcc31-w1200.jpg" alt="" loading="lazy" />
            </div>
            <h3>BYO parts? No problem.</h3>
            <p>Send us your RAM, SSDs, or that GPU you got on sale. We&apos;ll integrate them into our assembly &amp; burn&#8209;in process. You get a single warranty and a single throat to choke.</p>
          </article>
          <article class="feature-card">
            <div class="feature-card-media">
              <img src="/static/photo-1558618666-fcd25c85cd64-w1200.jpg" alt="" loading="lazy" />
            </div>
            <h3>Old gear? We&apos;ll take it.</h3>
            <p>Trade in your used PC, server, or even a box of DDR3. We wipe the data, test what&rsquo;s salvageable, and recycle the rest properly. You get cash / store credit.</p>
          </article>
        </div>
      </section>

      <section class="section product-section" aria-labelledby="built-title">
        <div class="section-head">
          <h2 id="built-title">How we turn your idea into hardware</h2>
          <p class="muted">No engineering degree required.</p>
        </div>
        <div class="tile-grid">
          <article class="tile">
            <h3>Tell us what you need</h3>
            <p>Gaming? AI training? A quiet office PC? A 50-node render farm? Just say it in plain English.</p>
          </article>
          <article class="tile">
            <h3>We recommend &amp; quote</h3>
            <p>We pick the right parts (new or refurbished), draft a manifest, and send you a clear price &mdash; no hidden fees.</p>
          </article>
          <article class="tile">
            <h3>We build, test, ship</h3>
            <p>Assembly, burn-in, photos, manifests. You get a machine that just works.</p>
          </article>
        </div>
      </section>


      <section class="section values" aria-labelledby="values-title">
        <div class="section-head">
          <h2 id="values-title">Why teams work with Seraya</h2>
          <p>Three-column value strip modeled after builder trust sections.</p>
        </div>
        <div class="value-grid">
          <div class="value-card">
            <h3>Integration-first</h3>
            <p>We assemble, test, and document before hardware leaves the bench.</p>
          </div>
          <div class="value-card">
            <h3>Authorised flow</h3>
            <p>We prioritise factory-aligned and authorised routes whenever the stack allows.</p>
          </div>
          <div class="value-card">
            <h3>Human support</h3>
            <p>Direct thread with integration leads &mdash; not a script, not a black box.</p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="cta-title">
        <div class="section-head">
          <h2 id="cta-title">Ready to start an RFQ?</h2>
          <p>Email the BOM, workload, and target lead time &mdash; we respond with sourcing assumptions and next steps.</p>
        </div>
        <p style="text-align: center; margin-top: 1.5rem">
          <a class="btn btn-primary" href="mailto:hello@serayasystem.com">Email RFQ</a>
        </p>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-bottom" style="border-top: none; margin-top: 0; padding-top: 0">
        <a class="muted" href="/works">Systems</a>
        <a class="muted" href="/case-study">Programs</a>
        <a class="muted" href="/about#contact">Contact</a>
        <span class="muted">Seraya System Integration</span>
      </div>
    </footer>
  `;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seraya Systems Integration | Kuala Lumpur system integrator" },
      { name: "description", content: "" },
      { property: "og:title", content: "Seraya Systems Integration | Kuala Lumpur system integrator" },
      { property: "og:description", content: "" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  useEffect(() => {
    // Hero style toggle: /?hero=plain disables the animated background
    // and restores the original whitespace-only hero for A/B comparison.
    try {
      const params = new URLSearchParams(window.location.search);
      const style = params.get("hero") === "plain" ? "plain" : "animated";
      const hero = document.querySelector(".hero");
      if (hero) hero.setAttribute("data-hero-style", style);
    } catch {}

    const s = document.createElement("script");
    s.src = "/legacy/script.js";
    s.async = false;
    document.body.appendChild(s);

    const bg = document.createElement("script");
    bg.src = "/legacy/hero-bg.js";
    bg.async = false;
    document.body.appendChild(bg);

    return () => { s.remove(); bg.remove(); };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

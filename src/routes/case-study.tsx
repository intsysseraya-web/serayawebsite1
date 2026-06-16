import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";

const BODY_HTML =
  '\n    <a class="skip-link" href="#main">Skip to content</a>\n\n    <div class="announcement-bar" aria-label="Promotions">\n      <div class="announcement-inner">\n        <a href="/works">Back to systems</a>\n        <span class="muted" aria-hidden="true">|</span>\n        <a href="/">Home</a>\n      </div>\n    </div>\n\n    <header class="site-header">\n      <div class="header-inner">\n        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya Systems Integration" /></a>\n        <nav class="main-nav" aria-label="Primary">\n          <a href="/">Home</a>\n          <a href="/works">Systems</a>\n          <a href="/case-study" aria-current="page">Programs</a>\n          <a href="/about">Company</a>\n          <a href="/about#contact">Contact</a>\n        </nav>\n        <div class="header-actions">\n          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>\n          <button type="button" class="icon-btn" id="btnCart" aria-label="Open quote request">Quote</button>\n          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>\n        </div>\n      </div>\n    </header>\n\n    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">\n      <div class="mobile-drawer-panel">\n        <div class="overlay-head">\n          <strong>Navigate</strong>\n          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>\n        </div>\n        <nav class="mobile-nav">\n          <a href="/">Home</a>\n          <a href="/works">Systems</a>\n          <a href="/case-study">Programs</a>\n          <a href="/about">Company</a>\n          <a href="/about#contact">Contact</a>\n        </nav>\n      </div>\n    </div>\n\n    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">\n      <div class="overlay-sheet search-sheet">\n        <div class="overlay-head">\n          <strong>Search</strong>\n          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>\n        </div>\n        <label class="muted" for="q">Keyword</label>\n        <input class="search-input" id="q" type="search" placeholder="Search..." autocomplete="off" />\n      </div>\n    </div>\n\n    <div class="overlay-panel" id="cartPanel" hidden role="dialog" aria-modal="true" aria-label="Quote">\n      <div class="overlay-sheet cart-sheet">\n        <div class="overlay-head">\n          <strong>Quote request</strong>\n          <button type="button" class="icon-btn" id="btnCloseCart" aria-label="Close quote panel">X</button>\n        </div>\n        <p class="muted">Email RFQ for pricing.</p>\n        <p style="margin-top: 1rem"><a class="btn btn-primary" href="mailto:hello@serayasystem.com">Email RFQ</a></p>\n      </div>\n    </div>\n\n    <div class="page-hero">\n      <div class="page-hero-inner">\n        <p class="muted" style="margin: 0 0 0.5rem">Case study - Supply - 2024</p>\n        <h1>Regional GPU supply program</h1>\n      </div>\n    </div>\n\n    <main id="main">\n      <article class="prose">\n        <h2>Challenge</h2>\n        <p>\n          Distributed sites needed matched accelerator batches with a single warranty narrative instead of ad hoc marketplace lots.\n        </p>\n        <h2>Approach</h2>\n        <p>\n          Consolidated demand into rolling tranches, sourced through authorised routes, standardised on two board partners for the program duration.\n        </p>\n        <figure class="split-visual" style="margin: 2rem 0">\n          <img\n            src="/static/photo-1518770660439-4636190af475-w1200.jpg"\n            alt="Hardware context"\n            loading="lazy"\n          />\n        </figure>\n        <h2>Outcome</h2>\n        <p>Reduced configuration drift; support tickets tied to mismatched batches dropped after the second wave (illustrative metrics).</p>\n        <p style="margin-top: 2rem">\n          <a class="btn btn-primary" href="/works">All systems</a>\n        </p>\n      </article>\n    </main>\n\n    <footer class="site-footer">\n      <div class="footer-bottom" style="border-top: none; margin-top: 0; padding-top: 0">\n        <a class="muted" href="/works">Systems</a>\n        <span class="muted">Seraya System Integration</span>\n      </div>\n    </footer>\n';

export const Route = createFileRoute("/case-study")({
  head: () => ({
    meta: [
      { title: "Regional GPU supply program | Seraya System Integration" },
      { name: "description", content: "Case study: regional GPU supply program." },
      { property: "og:title", content: "Regional GPU supply program | Seraya System Integration" },
      { property: "og:description", content: "Case study: regional GPU supply program." },
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
    const s = document.createElement("script");
    s.src = "/legacy/script.js";
    s.async = false;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

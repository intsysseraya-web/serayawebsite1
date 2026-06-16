import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";

const BODY_HTML =
  '\n    <a class="skip-link" href="#main">Skip to content</a>\n\n    <div class="announcement-bar" aria-label="Promotions">\n      <div class="announcement-inner">\n        <a href="mailto:hello@serayasystem.com">hello@serayasystem.com</a>\n        <span class="muted" aria-hidden="true">|</span>\n        <a href="/works">Systems</a>\n      </div>\n    </div>\n\n    <header class="site-header">\n      <div class="header-inner">\n        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya Systems Integration" /></a>\n        <nav class="main-nav" aria-label="Primary">\n          <a href="/">Home</a>\n          <a href="/works">Systems</a>\n          <a href="/case-study">Programs</a>\n          <a href="/about" aria-current="page">Company</a>\n          <a href="#contact">Contact</a>\n        </nav>\n        <div class="header-actions">\n          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>\n          <button type="button" class="icon-btn" id="btnCart" aria-label="Open quote request">Quote</button>\n          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>\n        </div>\n      </div>\n    </header>\n\n    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">\n      <div class="mobile-drawer-panel">\n        <div class="overlay-head">\n          <strong>Navigate</strong>\n          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>\n        </div>\n        <nav class="mobile-nav">\n          <a href="/">Home</a>\n          <a href="/works">Systems</a>\n          <a href="/case-study">Programs</a>\n          <a href="/about">Company</a>\n          <a href="#contact">Contact</a>\n        </nav>\n      </div>\n    </div>\n\n    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">\n      <div class="overlay-sheet search-sheet">\n        <div class="overlay-head">\n          <strong>Search</strong>\n          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>\n        </div>\n        <label class="muted" for="q">Keyword</label>\n        <input class="search-input" id="q" type="search" placeholder="Search..." autocomplete="off" />\n      </div>\n    </div>\n\n    <div class="overlay-panel" id="cartPanel" hidden role="dialog" aria-modal="true" aria-label="Quote">\n      <div class="overlay-sheet cart-sheet">\n        <div class="overlay-head">\n          <strong>Quote request</strong>\n          <button type="button" class="icon-btn" id="btnCloseCart" aria-label="Close quote panel">X</button>\n        </div>\n        <p class="muted">Email RFQ for structured quote.</p>\n        <p style="margin-top: 1rem"><a class="btn btn-primary" href="mailto:hello@serayasystem.com">Email</a></p>\n      </div>\n    </div>\n\n    <div class="page-hero">\n      <div class="page-hero-inner">\n        <h1>Company</h1>\n        <p class="muted">Seraya System Integration is based in Kuala Lumpur and serves regional demand for traceable hardware supply and integration.</p>\n      </div>\n    </div>\n\n    <main id="main">\n      <article class="prose">\n        <h2>Positioning</h2>\n        <p>\n          We operate as a trading-led technology partner: factory-aligned procurement, authorised channels where\n          possible, and disciplined assembly and validation before delivery.\n        </p>\n        <h2>How we work</h2>\n        <p>RFQ to configuration to staging: one thread for availability, lead time, and warranty path.</p>\n        <h2 id="contact">Contact</h2>\n        <p>\n          Email\n          <a href="mailto:hello@serayasystem.com">hello@serayasystem.com</a>\n          - no web form; send quantities, targets, and constraints.\n        </p>\n        <p class="muted">Kuala Lumpur, Malaysia</p>\n      </article>\n    </main>\n\n    <footer class="site-footer">\n      <div class="footer-bottom" style="border-top: none; margin-top: 0; padding-top: 0">\n        <a class="muted" href="/">Home</a>\n        <span class="muted">Seraya System Integration</span>\n      </div>\n    </footer>\n';

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Company | Seraya System Integration" },
      { name: "description", content: "About Seraya System Integration - Kuala Lumpur." },
      { property: "og:title", content: "Company | Seraya System Integration" },
      { property: "og:description", content: "About Seraya System Integration - Kuala Lumpur." },
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

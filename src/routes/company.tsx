import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

const BODY_HTML = `
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/contact">Response to complete RFQs within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/purchasing">Committed lot decisions within 12 hours</a>
      </div>
    </div>

    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya System Integration" /></a>
        <nav class="main-nav" aria-label="Primary">
          <a href="/purchasing">Purchasing</a>
          <a href="/systems">Systems</a>
          <a href="/programs">Programs</a>
          <a href="/company" aria-current="page">Company</a>
          <a href="#contact">Contact</a>
        </nav>
        <div class="header-actions">
          <a class="icon-btn header-rfq-link" href="#contact" aria-label="Jump to RFQ section">RFQ</a>
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
          <a href="/purchasing">Purchasing</a>
          <a href="/systems">Systems</a>
          <a href="/programs">Programs</a>
          <a href="/company">Company</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </div>

    <div class="page-hero">
      <div class="page-hero-inner">
        <p class="muted" style="margin: 0 0 0.5rem">Company</p>
        <h1>Enterprise sourcing support from Kuala Lumpur</h1>
        <p class="muted">Seraya coordinates sourcing, configuration alignment, validation, and delivery support for enterprise compute infrastructure procurement.</p>
      </div>
    </div>

    <main id="main">
      <section class="section company-section" aria-labelledby="company-coordinates-title">
        <div class="section-head">
          <h2 id="company-coordinates-title">What Seraya coordinates</h2>
          <p>Procurement teams rarely need another product grid. They need a clear path from requirements to sourced, validated, and supportable systems.</p>
        </div>
        <div class="company-grid">
          <article class="company-card company-card-accent">
            <h3>Compute sourcing</h3>
            <p>GPU workstations, rack servers, storage, networking, and lifecycle supply options compared against availability, lead time, and warranty path.</p>
          </article>
          <article class="company-card">
            <h3>Configuration alignment</h3>
            <p>Requirements are translated into practical BOM options with compatibility, substitutions, firmware, and deployment constraints made explicit.</p>
          </article>
          <article class="company-card">
            <h3>Procurement programs</h3>
            <p>Multi-unit and multi-site requests are managed as sourcing programs, not isolated product orders, so assumptions stay visible across the rollout.</p>
          </article>
          <article class="company-card">
            <h3>Handoff and warranty path</h3>
            <p>Seraya keeps one procurement thread for delivery assumptions, acceptance notes, warranty route, and post-delivery coordination.</p>
          </article>
        </div>
      </section>

      <section class="section company-section company-band" aria-labelledby="company-process-title">
        <div class="section-head">
          <h2 id="company-process-title">How we work</h2>
          <p>A structured RFQ workflow keeps sourcing decisions, substitutions, and delivery expectations clear before spend is committed.</p>
        </div>
        <ol class="process-list">
          <li>
            <span>01</span>
            <div>
              <h3>Intake the requirement</h3>
              <p>Quantity, workload, destination, target delivery date, preferred brands, and procurement constraints.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Source and compare</h3>
              <p>Availability, pricing, lead time, warranty path, and acceptable substitutions are reviewed as a set.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Align the configuration</h3>
              <p>Seraya checks compatibility, deployment assumptions, validation scope, and the documentation needed for handoff.</p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <h3>Coordinate delivery and support</h3>
              <p>Delivery notes, acceptance criteria, and RMA contact path stay tied to the original procurement thread.</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="section company-section" aria-labelledby="company-fit-title">
        <div class="section-head">
          <h2 id="company-fit-title">Where we fit</h2>
          <p>Seraya is not a manufacturer and not a self-service checkout marketplace. We operate as a sourcing coordination and system integration partner for enterprise compute procurement.</p>
        </div>
        <div class="tile-grid company-fit-grid">
          <article class="tile">
            <h3>For procurement</h3>
            <p>One accountable thread for BOM options, sourcing assumptions, substitutions, and lead-time visibility.</p>
          </article>
          <article class="tile">
            <h3>For IT and engineering</h3>
            <p>Configurations are reviewed for workload fit, compatibility, validation scope, and handoff documentation.</p>
          </article>
          <article class="tile">
            <h3>For operations</h3>
            <p>Regional coordination from Kuala Lumpur helps teams align delivery timing, destination needs, and support route.</p>
          </article>
        </div>
      </section>

      <section class="section values company-section" id="regional" aria-labelledby="company-principles-title">
        <div class="section-head">
          <h2 id="company-principles-title">Operating principles</h2>
          <p>Designed for teams that need fewer unknowns before committing procurement budget.</p>
        </div>
        <div class="value-grid">
          <div class="value-card">
            <h3>Channel-aware sourcing</h3>
            <p>Options are framed around available channel routes, warranty assumptions, and practical lead times.</p>
          </div>
          <div class="value-card">
            <h3>Controlled substitutions</h3>
            <p>When stock changes, substitutions are documented and reviewed against the original workload and constraints.</p>
          </div>
          <div class="value-card">
            <h3>Documented assumptions</h3>
            <p>Configuration, validation, delivery, and support assumptions are kept visible through the RFQ workflow.</p>
          </div>
        </div>
      </section>

            <section class="section contact-section" id="contact" aria-labelledby="contact-title">
        <div class="section-head">
          <h2 id="contact-title">Start an RFQ</h2>
          <p>Contact details and the RFQ intake checklist now live on their own page.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Go to Contact</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>

    ${siteFooter()}
`;

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company & RFQ | Seraya System Integration" },
      {
        name: "description",
        content:
          "Kuala Lumpur based enterprise sourcing and system integration partner for compute infrastructure procurement and RFQ coordination.",
      },
      { property: "og:title", content: "Company & RFQ | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Kuala Lumpur based enterprise sourcing and system integration partner for compute infrastructure procurement and RFQ coordination.",
      },
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

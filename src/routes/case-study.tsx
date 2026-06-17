import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";

const BODY_HTML = `
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/about#contact">Enterprise RFQ response within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/works">Reference systems</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/about">Kuala Lumpur based</a>
      </div>
    </div>

    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya Systems Integration" /></a>
        <nav class="main-nav" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/works">Systems</a>
          <a href="/case-study" aria-current="page">Programs</a>
          <a href="/about">Company</a>
          <a href="/about#contact">Contact</a>
        </nav>
        <div class="header-actions">
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

    <div class="page-hero program-hero">
      <div class="program-hero-layout">
        <div class="program-hero-copy">
          <p class="muted eyebrow" style="margin: 0 0 0.5rem">Programs</p>
          <h1>Send the BOM. Get a structured program back in one business day.</h1>
          <p class="muted">Seraya turns enterprise compute RFQs into traceable programs &mdash; sourcing options, substitution notes, lead-time risk, and a warranty path, all on one thread from intake to RMA.</p>
          <div class="btn-row">
            <a class="btn btn-primary" href="/about#contact">Request an RFQ</a>
            <a class="btn btn-ghost" href="#program-flow-title">See how a program runs &darr;</a>
          </div>
          <ul class="program-fact-strip" aria-label="Program facts">
            <li><strong>1 business day</strong><span>RFQ response</span></li>
            <li><strong>Kuala Lumpur</strong><span>SEA coverage</span></li>
            <li><strong>RFQ &rarr; RMA</strong><span>One thread</span></li>
          </ul>
        </div>
        <aside class="program-brief" aria-label="Sample program brief">
          <header class="program-brief-head">
            <span class="program-brief-tag">Program brief</span>
            <span class="program-brief-status"><span class="dot" aria-hidden="true"></span>Draft &middot; responds in 1 business day</span>
          </header>
          <div class="program-brief-id">
            <span>SRY-PRG-2026-0142</span>
            <span class="muted">Multi-site GPU rollout</span>
          </div>
          <dl class="program-brief-rows">
            <div><dt>Requirement</dt><dd>24&times; GPU workstation, matched config</dd></div>
            <div><dt>Destinations</dt><dd>KL HQ &middot; Penang &middot; Singapore</dd></div>
            <div><dt>Target lead time</dt><dd>6 weeks, staged in 3 waves</dd></div>
            <div><dt>Substitutions</dt><dd>GPU tier locked &middot; chassis flexible</dd></div>
            <div><dt>Warranty path</dt><dd>3-yr on-site, RMA via Seraya</dd></div>
            <div><dt>Acceptance</dt><dd>Burn-in report + serial manifest</dd></div>
          </dl>
          <footer class="program-brief-foot">
            <span class="muted">Drafted from your RFQ &middot; reviewed before quote</span>
          </footer>
        </aside>
      </div>
    </div>

    <main id="main">
      <section class="section program-section" aria-labelledby="program-matter-title">
        <div class="section-head">
          <h2 id="program-matter-title">When Programs matter</h2>
          <p>Some requests need more than a product quote. Seraya structures procurement work when requirements, timing, substitutions, and ownership need to stay visible.</p>
        </div>
        <div class="program-scenarios" aria-label="Program-fit situations">
          <span>Rolling out to 3+ sites?</span>
          <span>Existing BOM needs a sanity check?</span>
          <span>GPU availability uncertain?</span>
          <span>Planning a refresh or EOL replacement?</span>
          <span>Need a clear warranty + RMA path?</span>
          <span>Procurement, IT, engineering all in the thread?</span>
        </div>
      </section>

      <section class="section program-section program-band" aria-labelledby="program-types-title">
        <div class="section-head">
          <h2 id="program-types-title">Program types</h2>
          <p>Each program starts from a concrete procurement problem and ends with documented assumptions the buyer can act on.</p>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>Staged rollout</h3>
            <p class="program-card-kicker">For phased, multi-unit, or multi-site requirements.</p>
            <p>Seraya coordinates waves, destination needs, configuration consistency, and acceptance notes.</p>
          </article>
          <article class="program-type-card">
            <h3>BOM review and alignment</h3>
            <p class="program-card-kicker">For teams with an existing parts list or preferred stack.</p>
            <p>Compatibility, availability, substitutions, firmware, warranty limits, and lead-time risk are made explicit.</p>
          </article>
          <article class="program-type-card">
            <h3>Availability sourcing</h3>
            <p class="program-card-kicker">For constrained GPU, server, storage, or networking requests.</p>
            <p>Options are compared across sourcing route, lead time, warranty path, and acceptable substitutions.</p>
          </article>
          <article class="program-type-card">
            <h3>Lifecycle supply planning</h3>
            <p class="program-card-kicker">For expansion, refresh, EOL replacement, and repeat procurement.</p>
            <p>Seraya tracks continuity requirements so the next batch remains supportable and maintainable.</p>
          </article>
          <article class="program-type-card">
            <h3>Warranty and RMA coordination</h3>
            <p class="program-card-kicker">For support paths tied to a sourced program.</p>
            <p>Serials, sourcing assumptions, RMA route, and contact path stay connected to the original requirement.</p>
          </article>
          <article class="program-type-card">
            <h3>Validation and handoff support</h3>
            <p class="program-card-kicker">For IT, engineering, and procurement teams sharing ownership.</p>
            <p>Configuration assumptions, acceptance criteria, and handoff documentation are prepared before delivery.</p>
          </article>
        </div>
      </section>

      <section class="section program-section" aria-labelledby="program-flow-title">
        <div class="section-head">
          <h2 id="program-flow-title">How a program runs</h2>
          <p>The workflow is deliberately simple: make requirements clear, compare practical options, document tradeoffs, then coordinate delivery and support.</p>
        </div>
        <ol class="program-flow">
          <li>
            <span>01</span>
            <h3>Intake requirement</h3>
            <p>Quantity, workload, destination, target lead time, brands, constraints, and current BOM.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Source and compare</h3>
            <p>Availability, pricing assumptions, lead time, warranty path, and substitution options.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Align configuration</h3>
            <p>Compatibility, firmware, validation scope, and deployment assumptions are reviewed together.</p>
          </li>
          <li>
            <span>04</span>
            <h3>Coordinate delivery and support</h3>
            <p>Delivery notes, acceptance criteria, handoff documents, and RMA path remain tied to the program.</p>
          </li>
        </ol>
      </section>

      <section class="section program-section program-band" aria-labelledby="program-controls-title">
        <div class="section-head">
          <h2 id="program-controls-title">Program controls</h2>
          <p>Seraya's role is to reduce ambiguity before budget is committed and keep procurement decisions traceable after delivery.</p>
        </div>
        <div class="program-control-grid">
          <article>
            <h3>Lead-time visibility</h3>
            <p>Compare realistic availability and timing across sourcing options.</p>
          </article>
          <article>
            <h3>Controlled substitutions</h3>
            <p>Document what can change, what cannot change, and who needs to approve it.</p>
          </article>
          <article>
            <h3>Firmware and batch notes</h3>
            <p>Keep configuration continuity visible across rollout waves.</p>
          </article>
          <article>
            <h3>Destination constraints</h3>
            <p>Make delivery route, site needs, and timing assumptions part of the RFQ thread.</p>
          </article>
          <article>
            <h3>Warranty path</h3>
            <p>Tie RMA route, serials, and support contact back to the sourced program.</p>
          </article>
          <article>
            <h3>Acceptance notes</h3>
            <p>Give procurement, IT, and operations a shared record of what was agreed.</p>
          </article>
        </div>
      </section>

      <section class="section program-section" aria-labelledby="program-examples-title">
        <div class="section-head">
          <h2 id="program-examples-title">Example scenarios</h2>
          <p>Representative program shapes, written without inflated metrics or one-off case-study theater.</p>
        </div>
        <div class="program-card-grid program-example-grid">
          <article class="program-type-card">
            <h3>Multi-site GPU workstation sourcing</h3>
            <dl>
              <dt>Need</dt>
              <dd>Matched workstation configurations across rollout waves.</dd>
              <dt>Seraya role</dt>
              <dd>Compare GPU, chassis, storage, and warranty options while preserving workload constraints.</dd>
              <dt>Output</dt>
              <dd>Program BOM, substitution notes, delivery assumptions, and handoff record.</dd>
            </dl>
          </article>
          <article class="program-type-card">
            <h3>Storage expansion and replacement supply</h3>
            <dl>
              <dt>Need</dt>
              <dd>Expand capacity while managing continuity and EOL risk.</dd>
              <dt>Seraya role</dt>
              <dd>Review compatible options, lead times, and lifecycle risk before purchase.</dd>
              <dt>Output</dt>
              <dd>Comparable sourcing options and a documented refresh path.</dd>
            </dl>
          </article>
          <article class="program-type-card">
            <h3>Integration lab and handoff support</h3>
            <dl>
              <dt>Need</dt>
              <dd>Procurement, IT, and engineering need a shared acceptance record.</dd>
              <dt>Seraya role</dt>
              <dd>Document configuration assumptions, validation scope, and support handoff.</dd>
              <dt>Output</dt>
              <dd>Clear acceptance notes and an RMA path tied to the original RFQ.</dd>
            </dl>
          </article>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="program-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Start with the requirement</p>
          <h2 id="program-cta-title">Structure your next procurement program</h2>
          <p class="muted">Send the BOM, target lead time, destination, workload, and constraints. Seraya will respond with sourcing assumptions and next steps.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/about#contact">Request an RFQ</a>
          <a class="btn btn-ghost" href="/works">View reference systems</a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-bottom" style="border-top: none; margin-top: 0; padding-top: 0">
        <a class="muted" href="/">Home</a>
        <a class="muted" href="/works">Systems</a>
        <a class="muted" href="/about#contact">RFQ</a>
        <span class="muted">Seraya System Integration</span>
      </div>
    </footer>
`;

export const Route = createFileRoute("/case-study")({
  head: () => ({
    meta: [
      { title: "Enterprise procurement programs | Seraya System Integration" },
      {
        name: "description",
        content:
          "Procurement programs for enterprise compute infrastructure sourcing, BOM alignment, rollouts, lifecycle supply, and RFQ coordination.",
      },
      {
        property: "og:title",
        content: "Enterprise procurement programs | Seraya System Integration",
      },
      {
        property: "og:description",
        content:
          "Procurement programs for enterprise compute infrastructure sourcing, BOM alignment, rollouts, lifecycle supply, and RFQ coordination.",
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

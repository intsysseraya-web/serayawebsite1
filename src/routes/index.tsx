import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

const BODY_HTML = `
    ${skipLink()}
${siteChrome("home", "H100, BOM, storage...")}<main id="main">
      <section class="hero" aria-labelledby="hero-title hero-subtitle">
        
                        <div class="hero-inner">
          <p class="hero-kicker">GPU wholesale &middot; Kuala Lumpur</p>
          <h1 id="hero-title">Wholesale GPU Supply for Southeast Asian Buyers</h1>
          <p id="hero-subtitle" class="hero-subtitle">
            Malaysia-based GPU trading for resellers, system builders and business buyers. Request a bulk quote for your required model, quantity and destination.
          </p>
          <div class="btn-row">
            <a class="btn btn-primary" href="/buy">Request bulk quote</a>
            <a class="btn btn-ghost" href="/purchasing">Sell a GPU lot</a>
          </div>
        </div></section>

            <section class="section" aria-labelledby="routes-title">
        <div class="section-head">
          <h2 id="routes-title">Buy GPUs in bulk</h2>
          <p class="muted">Single-card GPU wholesale. Tell us the model, quantity and delivery destination.</p>
        </div>
        <div class="company-grid">
          <article class="company-card">
            <p class="program-card-kicker">Wholesale GPUs</p>
            <h3>Wholesale GPUs for Business Buyers</h3>
            <p class="muted">Malaysia-based GPU trading for bulk procurement.</p>
            <a class="btn btn-ghost" href="/buy">View GPU models</a>
          </article>
          <article class="company-card">
            <p class="program-card-kicker">Gaming GPUs</p>
            <h3>GeForce RTX GPUs for Bulk Procurement</h3>
            <p class="muted">Compare listed models and configurations.</p>
            <a class="btn btn-ghost" href="/buy/gaming-gpus">Gaming GPUs</a>
          </article>
          <article class="company-card">
            <p class="program-card-kicker">Professional &amp; data center</p>
            <h3>Professional &amp; Data Center GPUs for Bulk Procurement</h3>
            <p class="muted">Specify the exact model, version and quantity.</p>
            <a class="btn btn-ghost" href="/buy/ai-gpus">Professional &amp; data center</a>
          </article>
        </div>
        <p class="muted catalog-note">Selling instead? <a href="/purchasing">Sell a GPU lot</a>.</p>
      <section class="section" aria-labelledby="home-systems-title">
        <div class="section-head">
          <h2 id="home-systems-title">Systems</h2>
          <p class="muted">
            Complete systems, configured per order and quoted per enquiry. Single GPU cards are
            quoted separately.
          </p>
        </div>
        <div class="btn-row">
          <a class="btn btn-ghost" href="/systems">All systems</a>
          <a class="btn btn-ghost" href="/systems/ai-servers">AI Servers</a>
          <a class="btn btn-ghost" href="/systems/workstations">AI Workstations</a>
          <a class="btn btn-ghost" href="/systems/gaming">Gaming Systems</a>
          <a class="btn btn-ghost" href="/systems/storage-networking">Storage &amp; Networking</a>
        </div>
      </section>

      </section>

      <section class="section product-section" aria-labelledby="built-title">
        <div class="section-head">
          <h2 id="built-title">How we work</h2>
        </div>
                <ol class="flow-line">
          <li><span class="flow-dot">1</span><span class="flow-label">Intake</span></li>
          <li><span class="flow-dot">2</span><span class="flow-label">Source &amp; compare</span></li>
          <li><span class="flow-dot">3</span><span class="flow-label">Align</span></li>
          <li><span class="flow-dot">4</span><span class="flow-label">Deliver &amp; support</span></li>
        </ol>
      </section>


      <section class="section values" aria-labelledby="evidence-title">
        <div class="section-head">
          <h2 id="evidence-title">What we can evidence</h2>
        </div>
        <div class="evidence-strip">
          <ul>
            <li><strong>Entity &amp; KYC pack</strong><span>Registration, tax identification and documents, released per counterparty.</span></li>
            <li><strong>Grading &amp; test reports</strong><span>Condition and test documentation for the units we buy or supply.</span></li>
            <li><strong>Acceptance records</strong><span>What was agreed, checked and handed over, kept on record.</span></li>
            <li><strong>Export &amp; end-use</strong><span>Licence position and end-user information stated before shipment.</span></li>
          </ul>
        </div>
      </section>

      <section class="section" aria-label="Get started">
        <div class="start-grid">
          <article class="start-card">
            <h3>Local builds &amp; trade-ins</h3>
            <a class="btn btn-ghost" href="/local">Local builds &amp; trade-ins</a>
          </article>
          <article class="start-card">
            <h3>Ready to start an RFQ?</h3>
            <p>Email the BOM, workload, and target lead time &mdash; we respond with sourcing assumptions and next steps.</p>
            <a class="btn btn-primary" href="mailto:felix.mm@seraya.systems">Email RFQ</a>
          </article>
        </div>
      </section>
    </main>

    ${siteFooter()}
  `;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wholesale GPU Supply for Southeast Asian Buyers | Seraya" },
      { name: "description", content: "Malaysia-based GPU trading for resellers, system builders and business buyers. Request a bulk quote for your required model, quantity and destination." },
      {
        property: "og:title",
        content: "Seraya System Integration | Kuala Lumpur system integrator",
      },
      { property: "og:description", content: "We source, validate and deliver compute - and we buy GPUs in bulk." },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

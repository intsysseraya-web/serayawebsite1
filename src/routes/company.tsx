import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";

// Company 页（线上检查项 6）：
//   1. **删除面向改版过程的说明**（原文「Contact details and the RFQ intake checklist now
//      live on their own page.」）—— 访客不关心页面搬迁，只关心能做什么。
//   2. 把 **KYC 页已经公开的公司主体信息适度前置**：法定名称、注册号与成立信息、
//      注册办公地址、可核验文件清单入口。董事/UBO 等自然人信息仍只在 KYC 页应索提供。
//   3. 清楚说明两条业务：GPU 供应（批发采购）与系统集成。
//   4. 只使用真实团队、场景、交付资料与合作信息 —— 不写未确认的合作方或案例。

const BODY_HTML = `
    ${skipLink()}
${siteChrome("company", "KYC, company, contact...")}<div class="page-hero">
      <div class="page-hero-inner">
        <p class="muted" style="margin: 0 0 0.5rem">Company</p>
        <h1>GPU supply and system integration, from Kuala Lumpur</h1>
        <p class="muted">Seraya coordinates sourcing, configuration alignment, validation, and delivery support for enterprise compute infrastructure procurement.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </div>
    </div>

    <main id="main">
      <section class="section company-section" aria-labelledby="company-entity-title">
        <div class="section-head">
          <h2 id="company-entity-title">Who you are dealing with</h2>
          <p>The registered entity behind this site. Full documents are released per counterparty.</p>
        </div>
        <div class="page-facts">
          <div class="contact-panel">
            <dl>
              <div><dt>Legal entity</dt><dd>Seraya System Integration Sdn. Bhd.</dd></div>
              <div><dt>Registration</dt><dd>202601014957 (1677055-A) &middot; incorporated 16 April 2026, Kuala Lumpur</dd></div>
              <div><dt>Registered office</dt><dd>Lot 2-2-43, Second Floor, Wisma Rampai, Jalan 34/26, Rampai Town Centre, 53300 Kuala Lumpur, Malaysia</dd></div>
              <div><dt>Directors / UBO</dt><dd>Released with the KYC pack on request</dd></div>
              <div><dt>Tax identification</dt><dd>Released with the KYC pack on request</dd></div>
            </dl>
            <a class="btn btn-ghost" href="/purchasing/kyc">Open the entity &amp; KYC pack</a>
          </div>
        </div>
      </section>

      <section class="section company-section company-band" aria-labelledby="company-business-title">
        <div class="section-head">
          <h2 id="company-business-title">Two businesses</h2>
          <p>Both run on the same counterparty checks and the same quotation discipline.</p>
        </div>
        <div class="company-grid">
          <article class="company-card company-card-accent">
            <h3>GPU supply</h3>
            <p>
              Wholesale supply of single GPUs and SXM modules &mdash; GeForce RTX, RTX PRO 6000
              Blackwell (Workstation, Max-Q and Server Edition) and data center accelerators such as
              H100 and A100. Priced per enquiry against real availability.
            </p>
            <a class="btn btn-ghost" href="/buy">GPU wholesale</a>
          </article>
          <article class="company-card">
            <h3>System integration</h3>
            <p>
              Complete systems built around those accelerators: AI servers, workstations, gaming
              builds for resellers, storage pools and cluster switching or fabric &mdash; configured
              per order against the workload.
            </p>
            <a class="btn btn-ghost" href="/systems">Systems</a>
          </article>
        </div>
      </section>

      <section class="section company-section" aria-labelledby="company-coordinates-title">
        <div class="section-head">
          <h2 id="company-coordinates-title">What Seraya coordinates</h2>
          <p>Procurement teams rarely need another product grid. They need a clear path from requirements to sourced, validated, and supportable systems.</p>
        </div>
        <div class="company-grid">
          <article class="company-card">
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
          <h2 id="contact-title">${PRIMARY_CTA_LABEL}</h2>
          <p>Product, quantity and delivery destination are enough for the first reply.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>

    ${siteFooter()}
`;

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company | Seraya System Integration" },
      {
        name: "description",
        content:
          "Seraya System Integration Sdn. Bhd., Kuala Lumpur: GPU wholesale supply and system integration for compute infrastructure procurement. Entity details and the KYC pack.",
      },
      { property: "og:title", content: "Company | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "GPU supply and system integration from Kuala Lumpur. Registered entity details and the KYC pack on request.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/company" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
      { rel: "stylesheet", href: fixesCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

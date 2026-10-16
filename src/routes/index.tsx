import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { renderRfqForm } from "../lib/rfq-form";
import { abbreviation } from "../lib/rfq";
import { familiesWithVersions } from "../data/gpu-catalog";
import { REFERENCE_CONFIGURATION_COUNT } from "../data/systems";

/**
 * 首页（本轮只做必要精简）。
 *
 * 结构：业务定位 → GPU 分类入口 → 整机分类入口 → 可验证资料 → 采购流程 → 询价
 *   - 首屏纯文字，不放产品图（CY 2026-11 指示）
 *   - Gaming GPUs 与 Professional / Data center GPUs 同级；总目录为辅助入口
 *   - 计数由数据实时计算，区分「型号数」与「版本数」，不混用
 *   - 缩写不在这里整表罗列：术语在使用位置就近解释（见各产品页与联系页）
 */

const GAMING_FAMILY_COUNT = familiesWithVersions(["gaming"]).length;
const AIC_FAMILY_COUNT = familiesWithVersions(["professional", "datacenter"]).length;

const BODY_HTML = `
    ${skipLink()}
${siteChrome("home", "H100, RTX PRO 6000, storage...")}<main id="main">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-inner">
          <p class="hero-kicker">GPU wholesale &middot; Kuala Lumpur</p>
          <h1 id="hero-title" class="hero-title">GPU wholesale and system integration</h1>
          <p id="hero-subtitle" class="hero-subtitle">
            Seraya supplies accelerators, complete AI systems, storage and networking to business
            buyers. Tell us the model, the quantity and the delivery destination &mdash; that is
            enough to start.
          </p>
          <div class="btn-row">
            <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
            <a class="btn btn-ghost" href="/purchasing">Sell a GPU lot</a>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="gpu-entry-title">
        <div class="section-head">
          <h2 id="gpu-entry-title">Buy GPUs in bulk</h2>
          <p class="muted">
            Tell us the model, the quantity and the delivery destination. Add the version if you
            already know it.
          </p>
        </div>
        <div class="entry-grid">
          <article class="entry-card">
            <p class="program-card-kicker">Gaming GPUs</p>
            <h3>Gaming and creator cards</h3>
            <p class="muted">
              ${GAMING_FAMILY_COUNT} GeForce RTX models, including both memory versions of the
              RTX 5060 Ti.
            </p>
            <a class="btn btn-primary" href="/buy/gaming-gpus">Browse gaming GPUs</a>
          </article>
          <article class="entry-card">
            <p class="program-card-kicker">Professional &amp; data center</p>
            <h3>Professional and data center GPUs</h3>
            <p class="muted">
              ${AIC_FAMILY_COUNT} models across workstation, Max-Q, Server Edition and the SXM /
              PCIe data center forms. Each version is quoted separately.
            </p>
            <a class="btn btn-primary" href="/buy/ai-gpus">Browse professional &amp; data center</a>
          </article>
          <article class="entry-card entry-card-secondary">
            <p class="program-card-kicker">Full list</p>
            <h3>All GPU models</h3>
            <p class="muted">
              Every model we quote, with the versions available on each one.
            </p>
            <a class="btn btn-ghost" href="/buy">Open the GPU catalogue</a>
          </article>
        </div>
        <p class="muted catalog-note">
          Selling instead? <a href="/purchasing">Sell a GPU lot</a> &mdash; we buy graded
          accelerators in bulk.
        </p>
      </section>

      <section class="section" aria-labelledby="home-systems-title">
        <div class="section-head">
          <h2 id="home-systems-title">Systems</h2>
          <p class="muted">
            ${REFERENCE_CONFIGURATION_COUNT} reference configurations across servers, workstations,
            storage and networking. Complete systems are configured per order and quoted per enquiry;
            single cards are quoted separately.
          </p>
        </div>
        <div class="entry-grid">
          <article class="entry-card">
            <h3>AI servers</h3>
            <p class="muted">Rack servers for training and inference, 2 to 8 accelerators per chassis.</p>
            <a class="btn btn-ghost" href="/systems/ai-servers">AI servers</a>
          </article>
          <article class="entry-card">
            <h3>AI workstations</h3>
            <p class="muted">One or two accelerators, quiet enough for an office.</p>
            <a class="btn btn-ghost" href="/systems/workstations">AI workstations</a>
          </article>
          <article class="entry-card">
            <h3>Gaming systems</h3>
            <p class="muted">Batch builds for resellers, retailers and esports venues.</p>
            <a class="btn btn-ghost" href="/systems/gaming">Gaming systems</a>
          </article>
          <article class="entry-card">
            <h3>Storage &amp; networking</h3>
            <p class="muted">Pools, capacity tiers and cluster fabric sized to the compute.</p>
            <a class="btn btn-ghost" href="/systems/storage-networking">Storage &amp; networking</a>
          </article>
        </div>
        <p class="catalog-note"><a class="btn btn-ghost" href="/systems">All reference configurations</a></p>
      </section>

      <section class="section" aria-labelledby="built-title">
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
          <p class="muted">Documents we actually hold and release, per counterparty or per transaction.</p>
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

      <section class="section" id="request-quote" aria-labelledby="home-rfq-title">
        <div class="section-head">
          <h2 id="home-rfq-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">
            Product, quantity and delivery destination &mdash; whether you are buying a card, buying a
            system or selling a lot. Everything else is optional.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "gpu", source: "/" }, { formId: "rfq-home" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Three ways to start</h3>
              <ul class="rfq-checklist">
                <li><strong>Buy GPU cards</strong> &mdash; model, version, quantity, destination. <a href="/buy">GPU models</a></li>
                <li><strong>Buy a complete system</strong> &mdash; workload, how many systems, cards per system, destination. <a href="/systems">Systems</a></li>
                <li><strong>Sell a lot</strong> &mdash; model, quantity, condition, location, test data. <a href="/purchasing">What we buy</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section class="section values" aria-label="Related pages">
        <div class="entry-grid">
          <article class="entry-card">
            <h3>Programs</h3>
            <p class="muted">BOM review, staged rollouts and availability sourcing, with the deliverables written down.</p>
            <a class="btn btn-ghost" href="/programs">Open programs</a>
          </article>
          <article class="entry-card">
            <h3>Company &amp; entity</h3>
            <p class="muted">Who you are dealing with, what we coordinate, and the KYC pack.</p>
            <a class="btn btn-ghost" href="/company">Company</a>
          </article>
        </div>
      </section>
    </main>

    ${siteFooter()}
  `;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wholesale GPU Supply and System Integration | Seraya" },
      {
        name: "description",
        content:
          "Malaysia-based GPU wholesale and system integration: accelerators, AI servers, workstations, storage and networking for business buyers. Get a quote with the model, quantity and destination.",
      },
      { property: "og:title", content: "Wholesale GPU Supply and System Integration | Seraya" },
      {
        property: "og:description",
        content:
          "Accelerators, complete AI systems, storage and networking. GPU wholesale and system integration from Kuala Lumpur.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/" },
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

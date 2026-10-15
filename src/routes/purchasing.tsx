import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

// 文案逐字取自《SERAYA 网站改版方案 v1.0》§4.3。未自造句子。
// 合规闸门（方案 §4.3 注）：deck 中的 CIF 香港/新加坡 与转运安排**不上公开页**；
// 公开面只说「按笔书面约定交割方式」。本页遵守该约束。
// 复用既有类名：.rfq-checklist / .program-flow / .program-control-grid / .btn-row。

const BODY_HTML = `
${skipLink()}
${siteChrome("purchasing", "H100, H200, RTX PRO 6000...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Purchasing</span>
        <h1>We buy graded GPUs in bulk &mdash; for confirmed downstream demand.</h1>
        <p class="muted">Buy only what we can fund and place. No speculative positions, no renegotiation after commitment.</p>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-label="What we buy">
        <div class="buy-grid">
          <article class="buy-col">
            <h2>What we buy</h2>
            <ul class="rfq-checklist">
              <li>A-grade, fully tested units &mdash; test or grading documentation required</li>
              <li>Bulk lots: 20+ units per lot, no maximum</li>
              <li>NVIDIA H100 / H200 &middot; A100 (80GB) &middot; RTX PRO 6000 (Blackwell 96GB)</li>
              <li>RTX 5060 / 5070 / 5080 series (incl. Ti)</li>
              <li>Comparable graded accelerators (L40S, RTX 6000 Ada or equivalent)</li>
            </ul>
          </article>
          <article class="buy-col">
            <h2>What we do not buy</h2>
            <ul class="rfq-checklist">
              <li>Lots without test reports or grading documentation</li>
              <li>Non-functional or for-parts-only units</li>
              <li>Untraceable or non-compliant sources</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section" aria-labelledby="how-a-lot-runs-title">
        <div class="section-head">
          <h2 id="how-a-lot-runs-title">How a lot runs</h2>
        </div>
        <ol class="flow-line flow-line--5">
          <li><span class="flow-dot">1</span><span class="flow-label">Spot</span></li>
          <li><span class="flow-dot">2</span><span class="flow-label">Confirm downstream demand</span></li>
          <li><span class="flow-dot">3</span><span class="flow-label">Bid</span></li>
          <li><span class="flow-dot">4</span><span class="flow-label">Fund (back-to-back)</span></li>
          <li><span class="flow-dot">5</span><span class="flow-label">Ship</span></li>
        </ol>
      </section>

      <section class="section company-band" aria-labelledby="terms-title">
        <div class="section-head">
          <h2 id="terms-title">Terms</h2>
        </div>
        <div class="program-control-grid">
          <article>
            <h3>Response</h3>
            <p>Committed decision within 12 hours of receiving the lot list</p>
          </article>
          <article>
            <h3>Payment and delivery</h3>
            <p>T/T in full, or deposit plus balance &mdash; payment route agreed in writing per deal</p>
          </article>
          <article>
            <h3>Documents we release</h3>
            <p>Entity and KYC pack, end-user information, licence position &mdash; see <a href="/purchasing/kyc">Entity &amp; KYC pack</a></p>
          </article>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="purchasing-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Send a lot list</p>
          <h2 id="purchasing-cta-title">Start with the lot</h2>
          <p class="muted">Unit models, quantity, condition, and any test or grading documentation you already have.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Contact us</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "GPU purchasing | Seraya System Integration" },
      {
        name: "description",
        content:
          "We buy graded GPUs in bulk for confirmed downstream demand: A-grade tested units, 20+ per lot, no maximum. Committed decision within 12 hours of the lot list.",
      },
      { property: "og:title", content: "GPU purchasing | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "We buy graded GPUs in bulk — for confirmed downstream demand. No speculative positions, no renegotiation after commitment.",
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
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

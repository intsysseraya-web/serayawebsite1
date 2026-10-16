import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { escapeHtml, renderRfqForm } from "../lib/rfq-form";
import { SELL_RFQ_SUBJECT_TAG, abbreviation } from "../lib/rfq";
import { CONTACT_EMAIL } from "../lib/rfq";

// 文案逐字取自《SERAYA 网站改版方案 v1.0》§4.3，并按 2026-11 线上检查项 5/6 补充：
//   - 「12 小时决定」写明适用条件：**收到完整批次清单后的工作时段内**，
//     不擅自扩大为「随时 12 小时」。
//   - 补齐出售批次所需资料清单，并给出可直接提交的站内表单入口。
// 合规闸门（方案 §4.3 注）：CIF 香港/新加坡 与转运安排**不上公开页**；
// 公开面只说「按笔书面约定交割方式」。本页遵守该约束。

const BODY_HTML = `
${skipLink()}
${siteChrome("purchasing", "H100, H200, RTX PRO 6000...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Sell GPU lots</span>
        <h1>We buy graded GPUs in bulk &mdash; for confirmed downstream demand.</h1>
        <p class="muted">Buy only what we can fund and place. No speculative positions, no renegotiation after commitment.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#sell-form">Submit a lot</a>
          <a class="btn btn-ghost" href="#what-we-buy">What we buy</a>
        </div>
      </div>
    </div>

    <main id="main">
      <section class="section" id="what-we-buy" aria-label="What we buy">
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

      <section class="section" aria-labelledby="lot-package-title">
        <div class="section-head">
          <h2 id="lot-package-title">What to send with a lot</h2>
          <p class="muted">A complete lot list is what the decision is made on. Missing items slow it down rather than disqualify it.</p>
        </div>
        <div class="program-control-grid">
          <article>
            <h3>Unit detail</h3>
            <p>Exact model and version per unit type &mdash; for example H100 SXM or H100 PCIe, RTX PRO 6000 Server Edition or Workstation Edition. Form factor matters: an SXM module and a PCIe card are not interchangeable.</p>
          </article>
          <article>
            <h3>Quantity and condition</h3>
            <p>Unit count per model, and the grade or condition you are claiming &mdash; new, used, refurbished, or <abbr title="${escapeHtml(abbreviation("ITAD") ?? "")}">ITAD</abbr>.</p>
          </article>
          <article>
            <h3>Test and grading data</h3>
            <p>Whatever you already hold: burn-in or stress results, error logs, GPU-Z or nvidia-smi captures, serial list, photos of labels.</p>
          </article>
          <article>
            <h3>Location and title</h3>
            <p>Where the goods physically are, who holds title, and whether they are export-controlled in that jurisdiction.</p>
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
            <p>
              Committed decision within 12 hours of receiving the <strong>complete</strong> lot list.
              The 12 hours run inside our business hours (Kuala Lumpur, UTC+8, Monday to Friday).
              A list that arrives outside business hours, or that is missing the model, quantity,
              condition, location or test data, starts the clock when it is complete.
            </p>
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

      <section class="section" id="sell-form" aria-labelledby="sell-form-title">
        <div class="section-head">
          <h2 id="sell-form-title">Submit a lot</h2>
          <p class="muted">
            Required fields are marked. If you have a lot list file, submit the form and reply to the
            confirmation with the attachment &mdash; this form does not accept uploads.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "sell", source: "/purchasing" }, { formId: "rfq-sell" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with the subject tag
                <code>${SELL_RFQ_SUBJECT_TAG}</code> and the lot list attached.
              </p>
            </div>
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="purchasing-cta-title">
        <div>
          <p class="muted">Start with the lot</p>
          <h2 id="purchasing-cta-title">Send the lot list</h2>
          <p class="muted">Unit models, quantity, condition, location, and any test or grading documentation you already have.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="#sell-form">Submit a lot</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Sell GPU lots | Seraya System Integration" },
      {
        name: "description",
        content:
          "We buy graded GPUs in bulk for confirmed downstream demand: A-grade tested units, 20+ per lot, no maximum. Committed decision within 12 hours of a complete lot list, in business hours.",
      },
      { property: "og:title", content: "Sell GPU lots | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "We buy graded GPUs in bulk — for confirmed downstream demand. No speculative positions, no renegotiation after commitment.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/purchasing" },
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

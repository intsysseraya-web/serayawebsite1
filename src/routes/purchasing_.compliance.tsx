import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";
import { CONTACT_EMAIL } from "../lib/rfq";

// 文案逐字取自《SERAYA 网站改版方案 v1.0》§4.5。未自造句子。
// 方案 §4.5 措辞纪律：说**做什么**，不堆「合规」这类形容词；
// **不引用任何未核实的具体法规条款号**（法规结论以人工/律师复核为准）。本页遵守。
//
// 2026-11 线上检查项 G：本页提到 privacy policy，但站内没有可点击入口。
// 处理方式：**不编造政策正文**。把该句改为指向本页的数据处理说明锚点，
// 并在页面内明确列出「隐私政策正文尚未发布、由业务方提供」。
// 2026-11 线上检查项 6：补 after-sales（保修 / DOA / RMA）区块，供 Contact 页跳转。

const BODY_HTML = `
${skipLink()}
${siteChrome("purchasing", "Export control, end-use, sanctions...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Compliance &amp; end-use</span>
        <h1>Compliance and end-use</h1>
        <p class="muted">We state the licence position in writing before shipment &mdash; not after.</p>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-labelledby="compliance-items-title">
        <div class="section-head">
          <h2 id="compliance-items-title">What we do</h2>
        </div>
        <ul class="rfq-checklist">
          <li><strong>Export control:</strong> where a licence or notification is required for the goods and route, it is identified and applied for before shipment.</li>
          <li><strong>End user:</strong> end-user information is provided and counterparties are screened against applicable sanctions lists.</li>
          <li><strong>No diversion:</strong> goods are not offered or resold into destinations or uses that applicable controls prohibit.</li>
          <li><strong>Data handling:</strong> used storage media received through trade-ins is wiped to a documented standard before reuse or recycling &mdash; see <a href="#privacy">Privacy and data handling</a> below.</li>
          <li><strong>Records:</strong> lot documentation, test reports and acceptance records are retained and available for audit.</li>
        </ul>
      </section>

      <section class="section company-band" id="privacy" aria-labelledby="privacy-title">
        <div class="section-head">
          <h2 id="privacy-title">Privacy and data handling</h2>
          <p class="muted">What we actually do, and what is still missing.</p>
        </div>
        <ul class="rfq-checklist">
          <li><strong>Enquiry data:</strong> the details you submit through the RFQ form are used to answer that enquiry and are kept as an enquiry record. They are delivered to our mailbox and are not sold or shared for marketing.</li>
          <li><strong>Trade-in media:</strong> storage media received through trade-ins is wiped to a documented standard before the hardware is reused or recycled.</li>
          <li><strong>Retention:</strong> enquiry and transaction records are kept for as long as the commercial relationship and applicable record-keeping require. A specific retention schedule is confirmed in writing on request.</li>
          <li><strong>Your requests:</strong> to ask what we hold about you, or to have it corrected or deleted, write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</li>
        </ul>
        <p class="pending-doc">
          <strong>Not yet published:</strong> a standalone privacy policy document with the full
          controller details, legal basis and retention schedule. This page describes our current
          practice only &mdash; it is not a substitute for that policy, and we are not publishing
          wording we cannot stand behind. Ask us for the current position in writing.
        </p>
      </section>

      <section class="section" id="after-sales" aria-labelledby="after-sales-title">
        <div class="section-head">
          <h2 id="after-sales-title">Warranty, DOA and RMA</h2>
          <p class="muted">
            Support paths are tied to the order that was sourced, not applied as one site-wide term.
          </p>
        </div>
        <ul class="rfq-checklist">
          <li><strong>Warranty:</strong> agreed per product, condition and lot, and written into the quotation. There is no single published warranty period.</li>
          <li><strong>DOA:</strong> a unit that fails on arrival is handled under the terms stated for that order. Report it with the order reference and the failure evidence.</li>
          <li><strong>RMA:</strong> the contact, the materials required, the steps and who pays freight are stated per order before shipment.</li>
          <li><strong>What to include in a support request:</strong> order reference, SKU, serial number, a description of the failure, and any logs or photographs you hold.</li>
        </ul>
      </section>

      <section class="section program-cta" aria-labelledby="compliance-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Before you quote us</p>
          <h2 id="compliance-cta-title">Ask for the licence position</h2>
          <p class="muted">Tell us the goods, the route and the end use. We come back in writing with what applies.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Get a quote</a>
          <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/purchasing_/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance and end-use | Seraya System Integration" },
      {
        name: "description",
        content:
          "How Seraya handles export control, end-user screening, no-diversion, used-media data wiping and audit records. Licence position stated in writing before shipment.",
      },
      { property: "og:title", content: "Compliance and end-use | Seraya System Integration" },
      {
        property: "og:description",
        content: "We state the licence position in writing before shipment — not after.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/purchasing/compliance" },
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

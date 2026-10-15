import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

// 文案逐字取自《SERAYA 网站改版方案 v1.0》§4.5。未自造句子。
// 方案 §4.5 措辞纪律：说**做什么**，不堆「合规」这类形容词；
// **不引用任何未核实的具体法规条款号**（法规结论以人工/律师复核为准）。本页遵守。

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
          <li><strong>Data handling:</strong> used storage media received through trade-ins is wiped to a documented standard under our privacy policy.</li>
          <li><strong>Records:</strong> lot documentation, test reports and acceptance records are retained and available for audit.</li>
        </ul>
      </section>

      <section class="section program-cta" aria-labelledby="compliance-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Before you quote us</p>
          <h2 id="compliance-cta-title">Ask for the licence position</h2>
          <p class="muted">Tell us the goods, the route and the end use. We come back in writing with what applies.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Contact us</a>
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
        content:
          "We state the licence position in writing before shipment — not after.",
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

import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

// 文案取自《SERAYA 网站改版方案 v1.0》§4.4，并执行两项已裁决的决定：
//   决定 3：注册号与税号**只在本页**出现；页脚/JSON-LD/OG 均不含。
//   CY 2026-10-12 裁决：**不放自然人姓名**（董事/UBO、公司秘书）——改为「随 KYC 包应索提供」。
// 邮箱：`kyc@seraya.systems` 尚未开通（CY 确认），故一律用已确认的 felix.mm@seraya.systems。

const BODY_HTML = `
${skipLink()}
${siteChrome("purchasing", "KYC, registration, entity...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Entity &amp; KYC pack</span>
        <h1>Entity and KYC pack</h1>
        <p class="muted">Released per counterparty on request &mdash; before we ask you to quote.</p>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-labelledby="entity-title">
        <div class="section-head">
          <h2 id="entity-title">Registered entity</h2>
        </div>
        <div class="page-facts">
          <div class="contact-panel">
            <dl>
              <div><dt>Legal entity</dt><dd>Seraya System Integration Sdn. Bhd.</dd></div>
              <div><dt>Registration</dt><dd>202601014957 (1677055-A) &middot; incorporated 16 April 2026, Kuala Lumpur</dd></div>
              <div><dt>Tax identification</dt><dd>C 60646460030 (employer TIN E 9629769602)</dd></div>
              <div><dt>Registered office</dt><dd>Lot 2-2-43, Second Floor, Wisma Rampai, Jalan 34/26, Rampai Town Centre, 53300 Kuala Lumpur, Malaysia</dd></div>
              <div><dt>Director / UBO</dt><dd>Released with the KYC pack on request</dd></div>
              <div><dt>Company secretary</dt><dd>Released with the KYC pack on request</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section class="section company-band" aria-labelledby="kyc-documents-title">
        <div class="section-head">
          <h2 id="kyc-documents-title">Documents we provide</h2>
        </div>
        <ul class="rfq-checklist">
          <li>Certificate of incorporation and notice of registration</li>
          <li>Company particulars (directors, members, business scope)</li>
          <li>Tax registration confirmation</li>
          <li>Ownership and authorised-signatory declaration</li>
          <li>Bank reference / funding evidence for the specific order</li>
          <li>End-user information and export-licence position</li>
          <li>Signed undertaking: no re-export or diversion contrary to applicable controls</li>
        </ul>
      </section>

      <section class="section program-cta" aria-labelledby="kyc-request-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Request the pack</p>
          <h2 id="kyc-request-title">Ask for the KYC pack</h2>
          <p class="muted">Send the entity name you are buying through, and who will countersign. We respond within one business day.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="mailto:felix.mm@seraya.systems?subject=KYC%20pack%20request">Email KYC request</a>
          <a class="btn btn-ghost" href="/purchasing/compliance">Compliance &amp; end-use</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/purchasing_/kyc")({
  head: () => ({
    meta: [
      { title: "Entity and KYC pack | Seraya System Integration" },
      {
        name: "description",
        content:
          "Seraya System Integration Sdn. Bhd. — registration, tax identification and registered office, plus the KYC documents we release per counterparty on request.",
      },
      { property: "og:title", content: "Entity and KYC pack | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Entity and KYC pack, released per counterparty on request — before we ask you to quote.",
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

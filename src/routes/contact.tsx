import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

// 依据《SERAYA 网站改版方案 v1.0》§4.10：独立联系页。
// CY 2026-10-12 裁决：
//   - 地址**只放城市国别**（不公开注册/营业地址）
//   - 职能邮箱 sales@ / kyc@ / purchasing@ **均未开通**，故一律用已确认的 felix.mm@seraya.systems
// 地图与营业时间**无来源，未编造**（留待 CY 提供）。
// RFQ 清单与咨询分类为 `/about` 原有已批准文案，原样迁入。

const BODY_HTML = `
${skipLink()}
${siteChrome("contact", "BOM, GPU, storage, networking...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Contact</span>
        <h1>Start an RFQ</h1>
        <p class="muted">Send the requirement and we come back with sourcing assumptions and next steps.</p>
      </div>
    </div>

    <main id="main">
      <section class="section" id="contact" aria-labelledby="contact-title">
        <div class="section-head">
          <h2 id="contact-title">How to reach us</h2>
        </div>
        <div class="contact-grid">
          <aside class="contact-panel">
            <h3>Contact</h3>
            <dl>
              <div>
                <dt>Email</dt>
                <dd><a href="mailto:felix.mm@seraya.systems?subject=RFQ%20request">felix.mm@seraya.systems</a></dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>Kuala Lumpur, Malaysia</dd>
              </div>
              <div>
                <dt>Response</dt>
                <dd>We respond to complete RFQs within one business day.</dd>
              </div>
              <div>
                <dt>Entity &amp; KYC</dt>
                <dd><a href="/purchasing/kyc">Entity and KYC pack</a></dd>
              </div>
            </dl>
            <a class="btn btn-primary" href="mailto:felix.mm@seraya.systems?subject=RFQ%20request">Email RFQ</a>
          </aside>

          <div class="contact-panel">
            <h3>RFQ checklist</h3>
            <p class="muted">Include these details so the first response can focus on options, not back-and-forth clarification.</p>
            <ul class="rfq-checklist">
              <li>Company name and contact person</li>
              <li>Category: workstation, server, storage, networking, or lifecycle supply</li>
              <li>Quantity and target delivery date</li>
              <li>Workload, software, or deployment context</li>
              <li>Preferred brands, constraints, or existing BOM</li>
              <li>Destination city or country</li>
              <li>Warranty, compliance, or support requirements</li>
            </ul>
          </div>
        </div>

        <div class="route-list" aria-label="Inquiry routes">
          <article>
            <h3>General RFQ</h3>
            <p>New sourcing request, reference configuration, or availability check.</p>
          </article>
          <article>
            <h3>Existing BOM review</h3>
            <p>Send a current parts list and the constraints Seraya should preserve.</p>
          </article>
          <article>
            <h3>Procurement program</h3>
            <p>Multi-unit, multi-site, or staged delivery requirement.</p>
          </article>
          <article>
            <h3>Support path</h3>
            <p>Warranty or RMA coordination tied to a Seraya-sourced program.</p>
          </article>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Seraya System Integration" },
      {
        name: "description",
        content:
          "Start an RFQ with Seraya System Integration, Kuala Lumpur. Send the BOM, workload, target date and constraints — we respond to complete RFQs within one business day.",
      },
      { property: "og:title", content: "Contact | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Send the requirement and we come back with sourcing assumptions and next steps.",
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

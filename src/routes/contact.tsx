import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { escapeHtml, renderRfqForm } from "../lib/rfq-form";
import { CONTACT_EMAIL, RFQ_PATHS, abbreviation } from "../lib/rfq";

/**
 * 联系页（线上检查项 F 与 5）。
 *
 * 本轮改动：
 *   1. **补齐需求类别。** 之前类别里有工作站 / 服务器 / 存储 / 网络，却漏掉主营的
 *      GPU 单卡。现在按「购买 GPU、购买整机、出售 GPU 批次、BOM 需求、售后」
 *      给出对应入口，每条入口都落到可操作的表单或页面。
 *   2. 站内询价表单成为主入口，邮件为备用入口，回复口径保留。
 *   3. 装饰性卡片改为明确入口（每条都有真实目标）。
 *   4. 表单在客户端读取 URL 参数，还原用户在产品页所选的型号 / 版本 / 形态，
 *      使询价带着上下文到达（线检项 E）。
 */

const CATEGORY_ROUTES: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    kicker: "Buy GPUs",
    title: "Single cards and SXM modules",
    body: "Tell us the model, the version (for example RTX 5060 Ti 8 GB or 16 GB) and the quantity.",
    href: "/buy#request-quote",
    cta: "GPU quote form",
  },
  {
    kicker: "Buy a complete system",
    title: "Servers, workstations, storage and networking",
    body: "Tell us the workload, the number of systems, and the cards per system if that applies.",
    href: "/systems#request-quote",
    cta: "Systems quote form",
  },
  {
    kicker: "Sell a GPU lot",
    title: "Submit a lot for a committed decision",
    body: "Model, quantity, condition, current location and any test or grading documentation.",
    href: "/purchasing#sell-form",
    cta: "Lot submission form",
  },
  {
    kicker: "BOM review",
    title: "Send a parts list for review",
    body: "We compare options, flag substitutions and lead-time risk, and return a written comparison.",
    href: "/programs#request-quote",
    cta: "Programs page",
  },
  {
    kicker: "After-sales",
    title: "Warranty, DOA and RMA",
    body: "Support paths tied to a Seraya-sourced order. Quote the order reference so we can trace it.",
    href: "/purchasing/compliance#after-sales",
    cta: "Compliance & after-sales",
  },
  {
    kicker: "Entity & KYC",
    title: "Counterparty verification",
    body: "Buyers and suppliers can both request the entity pack and confirm who they are dealing with.",
    href: "/purchasing/kyc",
    cta: "Entity & KYC pack",
  },
];

/** 从表单页带过来的参数，用它在客户端还原所选产品（线检项 E）。 */
const PREFILL_SCRIPT = `
(function () {
  function run() {
    var params = new URLSearchParams(window.location.search);
    var form = document.getElementById("rfq-contact");
    if (!form) return;
    var map = {
      sku: params.get("sku") || "",
      requirement: params.get("model") || params.get("requirement") || "",
      config: params.get("config") || "",
      quantity: params.get("quantity") || "",
      destination: params.get("destination") || "",
      cardsPerSystem: params.get("cardsPerSystem") || ""
    };
    Object.keys(map).forEach(function (name) {
      if (!map[name]) return;
      var el = form.querySelector('[name="' + name + '"]');
      if (el && !el.value) el.value = map[name];
    });
    var kind = (params.get("kind") || "").toLowerCase();
    var pathEl = form.querySelector('[name="path"]');
    if (pathEl) {
      var wanted = "Buy GPUs";
      if (kind === "system") wanted = "Buy a complete system";
      else if (kind === "storage" || kind === "networking" || kind === "component") wanted = "Buy storage or networking";
      else if (kind === "sell") wanted = "Sell a GPU lot";
      for (var i = 0; i < pathEl.options.length; i++) {
        if (pathEl.options[i].value === wanted) {
          pathEl.selectedIndex = i;
          break;
        }
      }
    }
    var sourceEl = form.querySelector('[name="source"]');
    if (sourceEl) {
      // 保留 SSR 渲染进来的来源页（例如 /buy/ai-gpus），只在有 from 时补充跳转入口
      var from = params.get("from");
      var base = sourceEl.value || window.location.pathname;
      sourceEl.value = from ? base.split(" (from ")[0] + " (from " + from + ")" : base;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
`;

const BODY_HTML = `
${skipLink()}
${siteChrome("contact", "H100, RTX PRO 6000, storage...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Contact</span>
        <h1>${PRIMARY_CTA_LABEL}</h1>
        <p class="muted">
          Product, quantity and delivery destination are enough for the first reply. We answer
          complete RFQs within one business day.
        </p>
      </div>
    </div>

    <main id="main">
      <section class="section" id="request-quote" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">Send an RFQ</h2>
          <p class="muted">
            Required fields are marked. Everything else is optional and only shortens the
            back-and-forth. Your entries are kept if the server rejects the submission.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "gpu", source: "/contact" }, { formId: "rfq-contact" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Direct email</h3>
              <dl>
                <div><dt>Email</dt><dd><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></dd></div>
                <div><dt>Location</dt><dd>Kuala Lumpur, Malaysia</dd></div>
                <div><dt>Response</dt><dd>We respond to complete RFQs within one business day.</dd></div>
                <div><dt>Entity &amp; KYC</dt><dd><a href="/purchasing/kyc">Entity and KYC pack</a></dd></div>
                <div><dt>Attachments</dt><dd>Send them by reply. This form does not accept file uploads.</dd></div>
              </dl>
            </div>
            <div class="rfq-alt-email">
              <h3>What to include per requirement type</h3>
              <ul class="rfq-checklist">
                <li><strong>Buy GPUs</strong> &mdash; ${escapeHtml(RFQ_PATHS.gpu.quantityHint.toLowerCase())} Model and version.</li>
                <li><strong>Buy a system</strong> &mdash; ${escapeHtml(RFQ_PATHS.system.quantityHint.toLowerCase())} Cards per system if known.</li>
                <li><strong>Buy storage or networking</strong> &mdash; ${escapeHtml(RFQ_PATHS.component.quantityHint.toLowerCase())} Redundancy requirement.</li>
                <li><strong>Sell a lot</strong> &mdash; ${escapeHtml(RFQ_PATHS.sell.quantityHint.toLowerCase())} Condition, location, test data.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section class="section" id="routes" aria-labelledby="routes-title">
        <div class="section-head">
          <h2 id="routes-title">Choose the right entry</h2>
          <p class="muted">Each route opens a form or a page that asks for exactly what that route needs.</p>
        </div>
        <ul class="contact-routes">
${CATEGORY_ROUTES.map(
  (r) => `          <li>
            <p class="program-card-kicker">${escapeHtml(r.kicker)}</p>
            <h3>${escapeHtml(r.title)}</h3>
            <p>${escapeHtml(r.body)}</p>
            <a href="${r.href}">${escapeHtml(r.cta)} &rarr;</a>
          </li>`,
).join("\n")}
        </ul>
      </section>

      <section class="section" aria-labelledby="glossary-title">
        <div class="section-head">
          <h2 id="glossary-title">Abbreviations we use</h2>
        </div>
        <div class="glossary">
          <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
          <div class="glossary-item"><dt>BOM</dt><dd>${escapeHtml(abbreviation("BOM") ?? "")}</dd></div>
          <div class="glossary-item"><dt>MOQ</dt><dd>${escapeHtml(abbreviation("MOQ") ?? "")}</dd></div>
          <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
          <div class="glossary-item"><dt>DOA</dt><dd>${escapeHtml(abbreviation("DOA") ?? "")}</dd></div>
          <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
          <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Get a quote | Seraya System Integration" },
      {
        name: "description",
        content:
          "Send an RFQ to Seraya System Integration: buy GPU cards and modules, buy complete systems, or sell a GPU lot. Product, quantity and delivery destination are enough to start.",
      },
      { property: "og:title", content: "Get a quote | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Product, quantity and delivery destination. We respond to complete RFQs within one business day.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/contact" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
      { rel: "stylesheet", href: fixesCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
      <script dangerouslySetInnerHTML={{ __html: PREFILL_SCRIPT }} />
    </>
  );
}

/**
 * 三个采购入口页的共享渲染器（`/buy`、`/buy/gaming-gpus`、`/buy/ai-gpus`）。
 *
 * 本轮（2026-11）改版要点：
 *   1. **目录按型号家族展示**，不再把每个 SKU 平铺成一张卡。家族卡片保持简洁：
 *      一张参考图、型号名、一句话用途、版本摘要、一个明确动作。
 *      详细规格、交易条款与完整表单移到版本展开区与询价区块，卡片里不再重复。
 *   2. 计数文案区分**型号家族数**与**可选版本数**，两者都由数据实时计算。
 *   3. 卡片动作指向真实存在的地方：有详情页的家族进详情页，其余家族就地展开版本
 *      规格并给询价入口。不链接尚未实现的页面。
 *   4. 交易条款集中在询价区块附近一处说明，卡片里不再重复。
 *
 * 单一来源：
 *   - 型号家族与版本 → `src/data/gpu-catalog.ts`
 *   - 家族卡片 / 规格渲染 → `src/lib/catalog-family.ts`
 *   - 交易口径与 FAQ → `src/lib/rfq.ts`；表单 → `src/lib/rfq-form.ts`
 *   - 页面骨架 → `src/lib/site-chrome.ts`
 */

import {
  CATEGORY_LABEL,
  type GpuCategory,
  familiesWithVersions,
  type FamilyWithVersions,
} from "../data/gpu-catalog";
import { renderSpecSource, renderUnverifiedNotice, renderVersionSpecs } from "./catalog-family";
import {
  BUYER_FAQ,
  BUYER_FLOW,
  BUYER_TERMS,
  CONTACT_EMAIL,
  RFQ_FULFILMENT_TERMS,
  RFQ_PRICING_TERMS,
  rfqMailto,
} from "./rfq";
import { escapeHtml, renderRfqForm } from "./rfq-form";
import { PRIMARY_CTA_LABEL, siteChrome, siteFooter, skipLink } from "./site-chrome";

export type BuyPageKey = "overview" | "gaming" | "ai";

export type BuyPageConfig = {
  key: BuyPageKey;
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  support: string;
  cta: string;
  categories: GpuCategory[];
  searchPlaceholder: string;
};

export const BUY_PAGES: Record<BuyPageKey, BuyPageConfig> = {
  overview: {
    key: "overview",
    path: "/buy",
    title: "Wholesale GPU Supplier for Business Buyers | Seraya",
    description:
      "Malaysia-based GPU trading for bulk procurement. Browse the models we quote, compare versions, and send the model, quantity and delivery destination.",
    eyebrow: "GPU wholesale &middot; Kuala Lumpur",
    h1: "Wholesale GPUs for Business Buyers",
    support:
      "Browse the models we quote, pick the version you need, and tell us the quantity and delivery destination. Those are enough to start.",
    cta: PRIMARY_CTA_LABEL,
    categories: ["gaming", "professional", "datacenter"],
    searchPlaceholder: "RTX 5090, H100, A100...",
  },
  gaming: {
    key: "gaming",
    path: "/buy/gaming-gpus",
    title: "GeForce RTX GPU Wholesale & Bulk Quotes | Seraya",
    description:
      "Compare listed GeForce RTX models and their memory versions, then request availability and pricing for your quantity and destination.",
    eyebrow: "Gaming GPUs &middot; bulk",
    h1: "GeForce RTX GPUs for Bulk Procurement",
    support:
      "Five GeForce RTX models, including the two memory versions of the RTX 5060 Ti. Pick a model, then tell us the quantity and destination.",
    cta: PRIMARY_CTA_LABEL,
    categories: ["gaming"],
    searchPlaceholder: "RTX 5090, RTX 5080, RTX 5070...",
  },
  ai: {
    key: "ai",
    path: "/buy/ai-gpus",
    title: "Professional & Data Center GPU Supply | Seraya",
    description:
      "Specify the exact professional or data center GPU model and version — workstation, Max-Q, Server Edition, SXM or PCIe — and we will confirm the supply route and quotation terms.",
    eyebrow: "Professional &amp; data center &middot; bulk",
    h1: "Professional &amp; Data Center GPUs for Bulk Procurement",
    support:
      "Edition and form factor decide what the card physically fits. Compare the versions on each model, then send the quantity and destination.",
    cta: PRIMARY_CTA_LABEL,
    categories: ["professional", "datacenter"],
    searchPlaceholder: "RTX PRO 6000, H100, A100...",
  },
};

/**
 * 目录里的家族卡片。
 * 有详情页 → 一个「Compare editions」动作，版本链接指向详情页对应版本。
 * 无详情页 → 就地用 `<details>` 展开每个版本的规格与平台要求，并给版本级询价入口，
 *            这样客户不必点进一个不存在的页面才能看到版本差异。
 */
function familyCard(entry: FamilyWithVersions): string {
  const { family, versions } = entry;
  const detail = typeof family.slug === "string" && family.slug.length > 0;

  const media = family.image
    ? `              <div class="family-card-media">
                <img src="${family.image}" alt="" loading="lazy" decoding="async" width="960" height="540" />
                <span class="gpu-media-note">Reference image</span>
              </div>`
    : "";

  const chips = versions
    .map((v) => {
      const label = escapeHtml(v.versionLabel);
      const href = detail
        ? `${family.slug}?version=${encodeURIComponent(v.sku)}`
        : `#version-${escapeHtml(v.sku)}`;
      return `                  <li><a href="${href}">${label}</a></li>`;
    })
    .join("\n");

  const action = detail
    ? `                <a class="btn btn-primary family-card-cta" href="${
        family.slug
      }" aria-label="Compare the three editions of ${escapeHtml(family.name)}">Compare editions</a>`
    : `                <a class="btn btn-primary family-card-cta" href="#request-quote" data-rfq-model="${escapeHtml(
        family.name,
      )}" aria-label="${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(family.name)}, ${
        versions.length
      } versions">${PRIMARY_CTA_LABEL}</a>`;

  const inlineVersions = detail
    ? ""
    : `
              <div class="family-versions-inline">
${versions
  .map(
    (v) => `                <details class="version-detail" id="version-${escapeHtml(v.sku)}">
                  <summary>
                    <span class="version-detail-label">${escapeHtml(v.versionLabel)}</span>
                    <span class="version-detail-form">${escapeHtml(v.formSummary)}</span>
                  </summary>
                  <dl class="gpu-specs">
${renderVersionSpecs(v)}
                  </dl>
${renderSpecSource(v)}
${renderUnverifiedNotice(v)}
                  <p class="version-detail-note"><strong>Fits</strong> ${escapeHtml(v.platform)}</p>
                  <p class="version-detail-note"><strong>Best for</strong> ${escapeHtml(v.bestFor)}</p>
                  <a class="btn btn-ghost version-detail-cta" href="#request-quote" data-rfq-model="${escapeHtml(
                    v.modelName,
                  )}" data-rfq-sku="${escapeHtml(v.sku)}" data-rfq-config="${escapeHtml(
                    v.versionLabel,
                  )}" aria-label="${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(
                    v.modelName,
                  )}, SKU ${escapeHtml(v.sku)}">${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(
                    v.versionLabel,
                  )}</a>
                </details>`,
  )
  .join("\n")}
              </div>`;

  return `
            <article class="family-card" id="family-${family.id}" data-family="${family.id}">
${media}              <div class="family-card-head">
                <h3>${escapeHtml(family.name)}</h3>
                <span class="version-count">${versions.length} ${
                  versions.length === 1 ? "version" : "versions"
                }</span>
              </div>
              <p class="family-card-tagline">${escapeHtml(family.tagline)}</p>
              <div class="family-card-versions">
                <p class="muted family-card-versions-label">Available to quote</p>
                <ul class="version-chips">
${chips}
                </ul>
              </div>
${inlineVersions}              <div class="family-card-foot">
${action}
              </div>
            </article>`;
}

function categoryBlock(category: GpuCategory): string {
  const entries = familiesWithVersions([category]);
  if (entries.length === 0) return "";
  const versionTotal = entries.reduce((n, e) => n + e.versions.length, 0);
  return `
          <div class="catalog-section" id="${category}">
            <div class="catalog-section-head">
              <h3>${CATEGORY_LABEL[category]}</h3>
              <p class="muted">
                ${entries.length} ${entries.length === 1 ? "model" : "models"} &middot; ${versionTotal} ${
                  versionTotal === 1 ? "version" : "versions"
                } to quote
              </p>
            </div>
            <div class="family-grid">
${entries.map(familyCard).join("\n")}
            </div>
          </div>`;
}

function termsList(terms: { label: string; value: string }[]): string {
  return `
            <dl class="terms-list">
${terms
  .map(
    (t) =>
      `              <div class="terms-row"><dt>${escapeHtml(t.label)}</dt><dd>${escapeHtml(t.value)}</dd></div>`,
  )
  .join("\n")}
            </dl>`;
}

/** 供其他页面复用：只输出分类区块与家族卡，不含整页骨架。 */
export function renderGpuCatalog(categories: GpuCategory[]): string {
  return categories.map(categoryBlock).join("\n");
}

export function renderBuyPage(config: BuyPageConfig): string {
  const entries = familiesWithVersions(config.categories);
  const familyCount = entries.length;
  const versionCount = entries.reduce((n, e) => n + e.versions.length, 0);
  const pathLabels = config.categories.map((c) => CATEGORY_LABEL[c]).join(" · ");

  return `
${skipLink()}
${siteChrome("buy", config.searchPlaceholder)}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">${config.eyebrow}</span>
        <h1>${config.h1}</h1>
        <p class="muted catalog-lede">${config.support}</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${config.cta}</a>
          <a class="btn btn-ghost" href="#models">Browse models</a>
        </div>
      </div>
    </div>

    <main id="main" class="buy-main">
      <section class="section" id="models" aria-labelledby="models-title">
        <div class="section-head">
          <h2 id="models-title">Models</h2>
          <p class="muted">
            ${familyCount} ${familyCount === 1 ? "model" : "models"} &middot; ${versionCount} versions to quote
            (${pathLabels}). Availability is held per version, not as one site-wide stock label.
          </p>
        </div>
${config.categories.map(categoryBlock).join("\n")}
        <p class="muted catalog-note">
          This is the range we accept enquiries for, not a stock list. Add-in cards and SXM modules
          are quoted as separate versions and are not interchangeable.
        </p>
      </section>

      <section class="section" id="request-quote" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">${config.cta}</h2>
          <p class="muted">
            Pick the product and the version if you know it. Quantity and delivery destination are
            enough for us to start.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "gpu", source: config.path }, { formId: `rfq-${config.key}` })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="${rfqMailto(null)}">${CONTACT_EMAIL}</a> with the subject tag
                <code>[Buyer RFQ]</code> and the same details.
              </p>
              <p class="muted">${escapeHtml(BUYER_FLOW[0].body)}</p>
            </div>
          </aside>
        </div>
      </section>

      <section class="section" id="terms" aria-labelledby="terms-title">
        <div class="section-head">
          <h2 id="terms-title">Pricing and purchasing conditions</h2>
          <p class="muted">
            How quantity, condition and destination affect a quotation &mdash; and what is agreed
            per order rather than published site-wide.
          </p>
        </div>
${termsList(RFQ_PRICING_TERMS)}
      </section>

      <section class="section" id="evidence" aria-labelledby="evidence-title">
        <div class="section-head">
          <h2 id="evidence-title">What you can verify</h2>
        </div>
        <div class="company-grid">
          <article class="company-card">
            <h3>Entity and registration</h3>
            <p class="muted">
              Company registration, tax identification and corporate documents, released per
              counterparty.
            </p>
            <a class="btn btn-ghost" href="/purchasing/kyc">Entity &amp; KYC pack</a>
          </article>
          <article class="company-card">
            <h3>Test and grading documentation</h3>
            <p class="muted">
              Condition and test documentation for the units we supply, confirmed per model and lot.
            </p>
            <a class="btn btn-ghost" href="/purchasing/compliance">Compliance &amp; end-use</a>
          </article>
        </div>
      </section>

      <section class="section" aria-labelledby="fulfilment-title">
        <div class="section-head">
          <h2 id="fulfilment-title">Delivery, payment and after-sales</h2>
          <p class="muted">Each item below is confirmed in the written quotation for your order.</p>
        </div>
${termsList(RFQ_FULFILMENT_TERMS)}
      </section>

      <section class="section" aria-labelledby="flow-title">
        <div class="section-head">
          <h2 id="flow-title">How a bulk purchase runs</h2>
        </div>
        <ol class="program-flow">
${BUYER_FLOW.map((s, i) => `          <li><span>0${i + 1}</span><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.body)}</p></li>`).join("\n")}
        </ol>
      </section>

      <section class="section" aria-labelledby="faq-title">
        <div class="section-head">
          <h2 id="faq-title">Buyer questions</h2>
        </div>
        <div class="faq-list">
${BUYER_FAQ.map((f) => `          <details class="faq-item"><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join("\n")}
        </div>
      </section>

      <section class="section" aria-labelledby="systems-lines-title">
        <div class="section-head">
          <h2 id="systems-lines-title">Need a complete system?</h2>
          <p class="muted">
            Cards are quoted here. Complete systems are configured and quoted on the Systems line.
          </p>
        </div>
        <div class="btn-row">
          <a class="btn btn-ghost" href="/systems/ai-servers">AI Servers</a>
          <a class="btn btn-ghost" href="/systems/workstations">AI Workstations</a>
          <a class="btn btn-ghost" href="/systems/gaming">Gaming Systems</a>
          <a class="btn btn-ghost" href="/systems/storage-networking">Storage &amp; Networking</a>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="buy-cta-title">
        <div>
          <p class="muted">${CONTACT_EMAIL}</p>
          <h2 id="buy-cta-title">${config.cta}</h2>
          <p class="muted">
            Model, version, quantity and delivery destination are enough to start. ${escapeHtml(
              BUYER_TERMS[3].value,
            )}
          </p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${config.cta}</a>
          <a class="btn btn-ghost" href="/systems">Reference systems</a>
        </div>
      </section>
    </main>

    <div class="mobile-cta-bar">
      <a class="btn btn-primary" href="#request-quote">${config.cta}</a>
    </div>

${siteFooter()}
  `;
}

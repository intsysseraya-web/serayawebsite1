/**
 * 三个采购入口页的共享渲染器（《Seraya 网站方案 v3.0》§3.1 / §4.2 / §4.3 / §4.4）
 *
 * §13.1.4 要求「页面内容、结构化产品数据和交易口径保持单一来源，避免三页各自维护同一型号」，
 * 因此三页共用本文件：型号来自 `src/data/gpu-catalog.ts`，交易口径与 FAQ 来自
 * `src/lib/buy-flow.ts`，页面差异只在 BUY_PAGES 里声明。
 *
 * §4.3 的区块顺序按原文执行：
 *   1 首屏定位与 CTA / 2 型号与供货信息 / 3 RFQ 入口 / 4 价格与采购条件 /
 *   5 可验证的交易依据 / 6 交付、付款与售后 / 7 买家四步流程 / 8 核心 FAQ / 9 最后 CTA 与联系
 */

import {
  CATEGORY_LABEL,
  GPU_PRODUCTS,
  type GpuCategory,
  type GpuProduct,
  availabilityText,
  moqText,
  priceText,
  productsByCategory,
} from "../data/gpu-catalog";
import {
  BUYER_FAQ,
  BUYER_FLOW,
  BUYER_TERMS,
  CONTACT_EMAIL,
  rfqMailto,
} from "./buy-flow";
import { siteChrome, siteFooter, skipLink } from "./site-chrome";

export type BuyPageKey = "overview" | "gaming" | "ai";

export type BuyPageConfig = {
  key: BuyPageKey;
  path: string;
  /** <head> 用；§12.1 SEO 基础 */
  title: string;
  description: string;
  eyebrow: string;
  /** §4.2 首屏文案，逐字使用 */
  h1: string;
  support: string;
  cta: string;
  /** §4.4 页面差异：本页负责的分类 */
  categories: GpuCategory[];
  searchPlaceholder: string;
};

/** §4.3 第 4 项与第 6 项各自对应的口径条目 */
const PRICING_LABELS = [
  "Pricing",
  "Quantity and price",
  "Minimum order",
  "First response",
  "Formal quotation",
  "Quote validity",
  "Stock hold",
];
const PRICING_TERMS = BUYER_TERMS.filter((t) => PRICING_LABELS.includes(t.label));
const FULFILMENT_TERMS = BUYER_TERMS.filter((t) => !PRICING_LABELS.includes(t.label));

export const BUY_PAGES: Record<BuyPageKey, BuyPageConfig> = {
  overview: {
    key: "overview",
    path: "/buy",
    title: "Wholesale GPU Supplier for Business Buyers | Seraya",
    description:
      "Malaysia-based GPU trading for bulk procurement. Send the model, quantity and delivery destination to request a bulk quote.",
    eyebrow: "GPU wholesale &middot; Kuala Lumpur",
    h1: "Wholesale GPUs for Business Buyers",
    support:
      "Malaysia-based GPU trading for bulk procurement. Tell us the model, quantity and delivery destination to request a quote.",
    cta: "Request bulk quote",
    categories: ["gaming", "professional", "datacenter"],
    searchPlaceholder: "RTX 5090, H100, A100...",
  },
  gaming: {
    key: "gaming",
    path: "/buy/gaming-gpus",
    title: "GeForce RTX GPU Wholesale & Bulk Quotes | Seraya",
    description:
      "Compare listed GeForce RTX models and configurations, and request availability and pricing for your quantity and destination.",
    eyebrow: "Gaming GPUs &middot; bulk",
    h1: "GeForce RTX GPUs for Bulk Procurement",
    support:
      "Compare the listed models and configurations. Request availability and pricing for your required quantity and destination.",
    cta: "Request bulk quote",
    categories: ["gaming"],
    searchPlaceholder: "RTX 5090, RTX 5080, RTX 5070...",
  },
  ai: {
    key: "ai",
    path: "/buy/ai-gpus",
    title: "Professional & Data Center GPU Supply | Seraya",
    description:
      "Specify the exact professional or data center GPU model, version and quantity, and we will confirm the available supply route and quotation terms.",
    eyebrow: "Professional &amp; data center &middot; bulk",
    h1: "Professional &amp; Data Center GPUs for Bulk Procurement",
    support:
      "Specify the exact model, version and quantity. We will confirm the available supply route and quotation terms for your request.",
    cta: "Request GPU quote",
    categories: ["professional", "datacenter"],
    searchPlaceholder: "RTX PRO 6000, H100, A100...",
  },
};

function esc(value: string): string {
  return value
    .replace(/&(?!(amp|mdash|middot|lt|gt|quot|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gpuCard(p: GpuProduct, ctaLabel: string): string {
  const media = p.image
    ? `            <div class="gpu-card-media">
              <img src="${p.image}" alt="" loading="lazy" decoding="async" width="960" height="540" />
              ${
                // §6.4：参考图不得标成当前 lot 的实拍
                p.imageType === "reference"
                  ? '<span class="gpu-media-note">Reference image</span>'
                  : ""
              }
            </div>
`
    : "";

  return `
          <article class="gpu-card">
${media}            <h3>${esc(p.modelName)}</h3>
            <dl class="gpu-meta">
              <div class="gpu-meta-row"><dt>Availability</dt><dd>${availabilityText(p)}</dd></div>
              <div class="gpu-meta-row"><dt>Minimum order</dt><dd>${moqText(p)}</dd></div>
              <div class="gpu-meta-row"><dt>Price</dt><dd>${priceText(p)}</dd></div>
            </dl>
            <a class="btn btn-ghost gpu-card-cta" href="${rfqMailto(p.modelName)}">${esc(ctaLabel)}</a>
          </article>`;
}

function categoryBlock(category: GpuCategory, ctaLabel: string, expanded: boolean): string {
  const items = productsByCategory(category);
  if (items.length === 0) return "";
  return `
        <div class="catalog-section" id="${category}">
          <div class="catalog-section-head">
            <h3>${CATEGORY_LABEL[category]}</h3>
          </div>
          <div class="gpu-grid">
${items.map((p) => gpuCard(p, ctaLabel)).join("\n")}
          </div>
        </div>`;
}

function termsList(terms: { label: string; value: string }[]): string {
  return `
          <dl class="terms-list">
${terms
  .map(
    (t) =>
      `            <div class="terms-row"><dt>${esc(t.label)}</dt><dd>${esc(t.value)}</dd></div>`,
  )
  .join("\n")}
          </dl>`;
}

export function renderBuyPage(config: BuyPageConfig): string {
  const multiCategory = config.categories.length > 1;
  const modelCount = config.categories.reduce(
    (n, c) => n + productsByCategory(c).length,
    0,
  );
  const hasProfessionalOrDatacenter =
    config.categories.includes("professional") || config.categories.includes("datacenter");

  return `
${skipLink()}
${siteChrome("buy", config.searchPlaceholder)}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">${config.eyebrow}</span>
        <h1>${config.h1}</h1>
        <p class="muted catalog-lede">${config.support}</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#rfq">${config.cta}</a>
          <a class="btn btn-ghost" href="#models">View GPU models</a>
        </div>
      </div>
    </div>

    <main id="main" class="buy-main">
      <section class="section" id="models" aria-labelledby="models-title">
        <div class="section-head">
          <h2 id="models-title">GPU models</h2>
          <p class="muted">
            Supply status is held per model, not as one site-wide stock label. Where a lot is
            confirmed we show the check date; otherwise availability is confirmed on enquiry.
          </p>
        </div>
${config.categories.map((c) => categoryBlock(c, config.cta, multiCategory)).join("\n")}
        <p class="muted catalog-note">
          ${modelCount} listed models. This is the range we accept enquiries for, not a stock list.
          ${hasProfessionalOrDatacenter ? "Single cards, modules and complete systems are quoted as separate products." : ""}
        </p>
      </section>

      <section class="section" id="rfq" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">${config.cta}</h2>
          <p class="muted">
            Send the model, the quantity you need and the delivery destination. Those three are
            enough for us to start.
          </p>
        </div>
        <div class="rfq-entry">
          <a class="btn btn-primary" href="${rfqMailto()}">${config.cta}</a>
          <div class="rfq-alternative">
            <p class="muted">Prefer email? Write to
              <a href="${rfqMailto()}">${CONTACT_EMAIL}</a>
              with the subject tag <code>[Buyer RFQ]</code>.
            </p>
            <p class="muted">${BUYER_FLOW[0].body}</p>
          </div>
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
${termsList(PRICING_TERMS)}
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
          <article class="company-card">
            <h3>Documents per transaction</h3>
            <p class="muted">
              Invoice, test, end-user or other documents are confirmed per product, use and
              destination.
            </p>
          </article>
        </div>
      </section>

      <section class="section" aria-labelledby="fulfilment-title">
        <div class="section-head">
          <h2 id="fulfilment-title">Delivery, payment and after-sales</h2>
          <p class="muted">Each item below is confirmed in the written quotation for your order.</p>
        </div>
${termsList(FULFILMENT_TERMS)}
      </section>

      <section class="section" aria-labelledby="flow-title">
        <div class="section-head">
          <h2 id="flow-title">How a bulk purchase runs</h2>
        </div>
        <ol class="program-flow">
${BUYER_FLOW.map(
  (s, i) =>
    `          <li><span>0${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`,
).join("\n")}
        </ol>
      </section>

      <section class="section" aria-labelledby="faq-title">
        <div class="section-head">
          <h2 id="faq-title">Buyer questions</h2>
        </div>
        <div class="faq-list">
${BUYER_FAQ.map(
  (f) =>
    `          <details class="faq-item"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`,
).join("\n")}
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="buy-cta-title">
        <div>
          <p class="muted">${CONTACT_EMAIL}</p>
          <h2 id="buy-cta-title">${config.cta}</h2>
          <p class="muted">
            Model, quantity and delivery destination are enough to start. ${BUYER_TERMS[3].value}
          </p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="${rfqMailto()}">${config.cta}</a>
          <a class="btn btn-ghost" href="/systems">Reference systems</a>
        </div>
      </section>
    </main>

<div class="mobile-cta-bar">
      <a class="btn btn-primary" href="#rfq">${config.cta}</a>
    </div>

${siteFooter()}
  `;
}

/** §6.1 第 3 类信息（收购需求）不属于采购页，故此处只做存在性断言，避免被误用 */
export const CATALOG_PRODUCT_COUNT = GPU_PRODUCTS.length;

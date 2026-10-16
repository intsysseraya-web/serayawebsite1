import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { GPU_PRODUCTS } from "../data/gpu-catalog";
import { renderSystemsHub } from "../lib/systems-lines";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";
import {
  ALL_PRODUCTS,
  CATEGORIES,
  CONDITION_LABEL,
  QUOTE_DRIVERS,
  QUOTE_NOTE,
  SUPPLY_ROUTES,
  type Category,
  type Product,
} from "../data/systems";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCard(p: Product) {
  const rows = p.specs
    .map(
      ([label, value]) =>
        `<div class="spec-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");

  // 规格未提供的条目（50 系游戏卡）不渲染空表 —— 避免留下一条空的虚线分隔。
  // 代价：该卡高度低于 2 行基准，DOCX §7 的尺寸验收对它不成立（已在数据层注明）。
  const specBlock = p.specs.length ? `<dl class="spec-table">${rows}</dl>` : "";

  return `
          <article class="product-card sku-card">
            <div class="product-card-media">
              <img
                src="${p.img}"
                alt="${escapeHtml(p.code)} — ${escapeHtml(p.name)}"
                loading="lazy"
                decoding="async"
              />
              <div class="media-tint" aria-hidden="true"></div>
            </div>
            <div class="product-card-body">
              <div class="sku-head">
                <span class="sku-code">${escapeHtml(p.code)}</span>
                <span class="sku-tagline">${escapeHtml(p.name)}</span>
              </div>
              ${specBlock}
              <div class="sku-foot">
                <span class="sku-quote">
                  <span class="cond-tag">${escapeHtml(CONDITION_LABEL)}</span>
                  <span class="quote-note">${escapeHtml(QUOTE_NOTE)}</span>
                </span>
                <a class="rfq-link" href="/contact">RFQ &rarr;</a>
              </div>
            </div>
          </article>`;
}

function renderCategory(c: Category) {
  return `
        <section id="${c.id}" class="catalog-section">
          <header class="catalog-section-head">
            <h2>${escapeHtml(c.title)}</h2>
            <p class="muted">${escapeHtml(c.blurb)}</p>
          </header>
          <div class="product-grid">${(c.id === "gpu" ? [...c.products, ...GPU_AS_CARDS] : c.products).map(renderCard).join("")}</div>
        </section>`;
}

// 50 系与数据中心 GPU 并入「GPU / AI」分类，使用与整机相同的卡片模板。
// 型号数据来自 src/data/gpu-catalog.ts 单一来源（§13.1.4），本页不另维护一份。
const GPU_AS_CARDS = GPU_PRODUCTS.map((g) => ({
  code: g.code,
  name: g.modelName,
  // systems.ts 的 specs 是 [label, value] 元组；gpu-catalog 用的是 {label,value} 对象，须转换
  specs: (g.specs ?? []).map((s) => [s.label, s.value]),
  img: g.image ?? "",
}));

const CATALOG_HTML = CATEGORIES.map(renderCategory).join("\n");

const CAT_NAV = CATEGORIES.map(
  (c) => `<a class="cat-chip" href="#${c.id}">${escapeHtml(c.title)}</a>`,
).join("");

const ROUTE_TABLE = `
            <table class="route-table">
              <thead>
                <tr>
                  <th scope="col"><span class="visually-hidden">Comparison point</span></th>
                  <th scope="col">${escapeHtml(SUPPLY_ROUTES.columns[0])}</th>
                  <th scope="col">${escapeHtml(SUPPLY_ROUTES.columns[1])}</th>
                </tr>
              </thead>
              <tbody>
${SUPPLY_ROUTES.rows
  .map(
    ([label, a, b]) => `                <tr>
                  <th scope="row">${escapeHtml(label)}</th>
                  <td>${escapeHtml(a)}</td>
                  <td>${escapeHtml(b)}</td>
                </tr>`,
  )
  .join("\n")}
              </tbody>
            </table>`;

const DRIVERS = QUOTE_DRIVERS.items
  .map(
    ([title, body]) => `            <li>
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(body)}</p>
            </li>`,
  )
  .join("\n");


const BODY_HTML = `
    ${skipLink()}
${siteChrome("systems", "H100, B100, storage...")}<div class="page-hero catalog-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Reference systems &middot; Kuala Lumpur</span>
        <h1>New or ITAD. Same workload &mdash; different price, performance and terms.</h1>
        <p class="muted catalog-lede">Every configuration here is an example. Condition and system shape decide the price, the lead time and the payment terms &mdash; so each item is quoted on its own basis.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Request a quote</a>
          <a class="btn btn-ghost" href="#how-we-quote">How we quote</a>
        </div>
        <nav class="cat-nav" aria-label="Categories">${CAT_NAV}</nav>
        <div class="toolbar">
          <span class="muted">${ALL_PRODUCTS.length} reference configurations</span>
        </div>
      </div>
    </div>

    <main id="main" class="section product-section catalog-main">
      <section class="catalog-section gpu-entry" aria-labelledby="gpu-entry-title">
        <div class="gpu-entry-inner">
          <div>
            <h2 id="gpu-entry-title">Buying single GPUs in bulk?</h2>
            <p class="muted">
              Single-card GPU wholesale is quoted separately from the reference configurations on
              this page.
            </p>
          </div>
          <div class="btn-row">
            <a class="btn btn-primary" href="/buy">Wholesale GPU overview</a>
            <a class="btn btn-ghost" href="/buy/gaming-gpus">Gaming GPUs</a>
            <a class="btn btn-ghost" href="/buy/ai-gpus">Professional &amp; data center</a>
          </div>
        </div>
      </section>

${renderSystemsHub()}
${CATALOG_HTML}

      <section id="how-we-quote" class="catalog-section quote-section">
        <div class="quote-block">
          <h2>${escapeHtml(SUPPLY_ROUTES.heading)}</h2>
${ROUTE_TABLE}
        </div>
      </section>

      <section class="catalog-section quote-section">
        <div class="quote-block">
          <h2>${escapeHtml(QUOTE_DRIVERS.heading)}</h2>
          <ul class="quote-drivers">
${DRIVERS}
          </ul>
          <p class="quote-note-end">${escapeHtml(QUOTE_DRIVERS.note)}</p>
        </div>
      </section>
    </main>

    ${siteFooter()}
  `;

export const Route = createFileRoute("/systems")({
  head: () => ({
    meta: [
      { title: "Reference systems | Seraya System Integration" },
      {
        name: "description",
        content:
          "Reference compute configurations, new or ITAD certified pre-owned. Condition and system shape decide the price, lead time and payment terms, so each item is quoted on its own basis.",
      },
      { property: "og:title", content: "Reference systems | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "New or ITAD. Same workload — different price, performance and terms. Every configuration is quoted on its own basis.",
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

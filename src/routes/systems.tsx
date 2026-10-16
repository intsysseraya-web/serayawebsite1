import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { renderSystemsHub } from "../lib/systems-lines";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { escapeHtml, renderRfqForm } from "../lib/rfq-form";
import { abbreviation, rfqHref } from "../lib/rfq";
import {
  ALL_PRODUCTS,
  CAPACITY_BASIS_NOTE,
  CATEGORIES,
  CONDITION_LABEL,
  QUOTE_DRIVERS,
  QUOTE_NOTE,
  REFERENCE_CONFIGURATION_COUNT,
  REFERENCE_DISCLAIMER,
  SUPPLY_ROUTES,
  type Category,
  type Product,
} from "../data/systems";
import { GPU_MODEL_FAMILY_COUNT, GPU_VERSION_COUNT } from "../data/gpu-catalog";

/**
 * `/systems` —— 完整系统与参考配置目录。
 *
 * 线上检查项 3（数量与分类）：
 *   之前这一页把 `gpu-catalog.ts` 里的 8 条 GPU 记录并进「GPU / AI」分类，
 *   用整机卡片模板一起渲染，于是「15 reference configurations」旁边出现了 23 张卡，
 *   其中 8 张是单卡。现在：
 *     - 单卡 / 加速卡 / SXM 模块全部归 `gpu-catalog.ts`，由 `/buy` 承载
 *     - 本页只展示完整系统或明确标注的参考配置
 *     - 数量由 `REFERENCE_CONFIGURATION_COUNT` 实时计算，不写死
 */

function renderCard(p: Product) {
  const rows = p.specs
    .map(
      ([label, value]) =>
        `<div class="spec-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");

  const specBlock = p.specs.length ? `<dl class="spec-table">${rows}</dl>` : "";

  const categoryTag = p.code.startsWith("SR-S")
    ? "storage"
    : p.code.startsWith("SR-N")
      ? "networking"
      : "system";

  return `
          <article class="product-card sku-card">
            <div class="product-card-media">
              <img
                src="${p.img}"
                alt="${escapeHtml(p.sku)} — ${escapeHtml(p.name)}"
                loading="lazy"
                decoding="async"
                width="1536"
                height="1024"
              />
              <div class="media-tint" aria-hidden="true"></div>
              <span class="gpu-media-note">Reference image</span>
            </div>
            <div class="product-card-body">
              <div class="sku-head">
                <span class="sku-code">${escapeHtml(p.sku)}</span>
                <span class="sku-tagline">${escapeHtml(p.name)}</span>
              </div>
              <p class="muted gpu-form-summary">${escapeHtml(p.kind)} &middot; <span class="reference-flag">Reference</span></p>
              ${specBlock}
              <div class="sku-foot">
                <span class="sku-quote">
                  <span class="cond-tag">${escapeHtml(CONDITION_LABEL)}</span>
                  <span class="quote-note">${escapeHtml(QUOTE_NOTE)}</span>
                </span>
                <a class="rfq-link" href="${rfqHref(
                  { sku: p.sku, name: p.name, formSummary: p.kind, category: categoryTag as never },
                  { source: "systems" },
                )}" aria-label="${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(p.name)}, SKU ${escapeHtml(p.sku)}">${PRIMARY_CTA_LABEL} &rarr;</a>
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
          <div class="product-grid">${c.products.map(renderCard).join("")}</div>
        </section>`;
}

const CATALOG_HTML = CATEGORIES.map(renderCategory).join("\n");

const CAT_NAV = CATEGORIES.map(
  (c) => `<a class="cat-chip" href="#${c.id}">${escapeHtml(c.title)}</a>`,
).join("");

const ROUTE_TABLE = `
            <div class="route-table-wrap">
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
    ([label, a, b]) => `                  <tr>
                    <th scope="row">${escapeHtml(label)}</th>
                    <td>${escapeHtml(a)}</td>
                    <td>${escapeHtml(b)}</td>
                  </tr>`,
  )
  .join("\n")}
                </tbody>
              </table>
            </div>`;

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
        <h1>Complete systems, configured per order.</h1>
        <p class="muted catalog-lede">
          Seraya supplies servers, workstations, storage and networking as complete systems.
          Single GPU cards and SXM modules are quoted separately on the GPU line, because they are
          not interchangeable with a finished system.
        </p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="#how-we-quote">How we quote</a>
        </div>
        <nav class="cat-nav" aria-label="Categories">${CAT_NAV}</nav>
        <div class="toolbar count-line">
          <span>${REFERENCE_CONFIGURATION_COUNT} reference configurations &middot; ${CATEGORIES.length} categories</span>
          <span aria-hidden="true">&middot;</span>
          <span><a href="/buy">${GPU_MODEL_FAMILY_COUNT} GPU models &middot; ${GPU_VERSION_COUNT} versions</a> are listed on the GPU line</span>
        </div>
      </div>
    </div>

    <main id="main" class="section product-section catalog-main">
      <section class="catalog-section gpu-entry" aria-labelledby="gpu-entry-title">
        <div class="gpu-entry-inner">
          <div>
            <h2 id="gpu-entry-title">Buying single GPUs in bulk?</h2>
            <p class="muted">
              Single cards and SXM modules are quoted on the GPU line, separately from the complete
              systems on this page. A module needs an HGX baseboard; a card needs a free PCIe slot.
            </p>
          </div>
          <div class="btn-row">
            <a class="btn btn-primary" href="/buy">Wholesale GPUs</a>
            <a class="btn btn-ghost" href="/buy/gaming-gpus">Gaming GPUs</a>
            <a class="btn btn-ghost" href="/buy/ai-gpus">Professional &amp; data center</a>
          </div>
        </div>
      </section>

${renderSystemsHub()}

      <section class="catalog-section" aria-labelledby="reference-title">
        <div class="catalog-section-head">
          <h2 id="reference-title">Reference configurations</h2>
          <p class="muted">${escapeHtml(REFERENCE_DISCLAIMER)}</p>
        </div>
      </section>

${CATALOG_HTML}

      <p class="muted catalog-note">${escapeHtml(CAPACITY_BASIS_NOTE)}</p>

      <section id="request-quote" class="catalog-section">
        <div class="catalog-section-head">
          <h2 id="systems-rfq-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">
            Give us the system type, how many systems, and the cards per system if that applies.
            The two counts are quoted separately.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "system", source: "/systems" }, { formId: "rfq-systems" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>BOM</dt><dd>${escapeHtml(abbreviation("BOM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
                <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>DOA</dt><dd>${escapeHtml(abbreviation("DOA") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

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
          "Complete compute, storage and networking systems, quoted per order. Reference configurations are examples; compatibility and availability are confirmed per order.",
      },
      { property: "og:title", content: "Reference systems | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Complete systems configured per order. Reference configurations are examples, not validated builds.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/systems" },
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

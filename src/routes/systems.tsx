import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
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
          <div class="product-grid">${c.products.map(renderCard).join("")}</div>
        </section>`;
}

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
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/contact">Response to complete RFQs within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/purchasing">Committed lot decisions within 12 hours</a>
      </div>
    </div>

    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya System Integration" /></a>
        <nav class="main-nav" aria-label="Primary">
          <a href="/purchasing">Purchasing</a>
          <a href="/systems" aria-current="page">Systems</a>
          <a href="/programs">Programs</a>
          <a href="/company">Company</a>
          <a href="/contact">Contact</a>
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>
          <a class="icon-btn header-rfq-link" href="/contact" aria-label="Start an RFQ">RFQ</a>
          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">
      <div class="mobile-drawer-panel">
        <div class="overlay-head">
          <strong>Navigate</strong>
          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>
        </div>
        <nav class="mobile-nav">
          <a href="/purchasing">Purchasing</a>
          <a href="/systems">Systems</a>
          <a href="/programs">Programs</a>
          <a href="/company">Company</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </div>

    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">
      <div class="overlay-sheet search-sheet">
        <div class="overlay-head">
          <strong>Search</strong>
          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>
        </div>
        <label class="muted" for="q">Keyword</label>
        <input class="search-input" id="q" type="search" placeholder="SR-G780, H100, 400 GbE..." autocomplete="off" />
      </div>
    </div>

    <div class="page-hero catalog-hero">
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

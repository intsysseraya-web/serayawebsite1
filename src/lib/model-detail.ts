/**
 * 产品详情页渲染器（数据驱动，本轮先完成 RTX PRO 6000 Blackwell）。
 *
 * 页面结构固定为七段，任何型号家族都能套用：
 *   1. 型号名称 + 一句话定位 + 准确参考图
 *   2. 版本选择（链接式，`?version=<sku>`；未指定时展示差异概览与选择提示）
 *   3. 随版本变化的关键规格
 *   4. 简洁的版本差异说明
 *   5. 适用场景与平台要求
 *   6. 携带所选版本的询价入口
 *   7. 相关 AI Servers / AI Workstations 入口
 *
 * 两条硬边界：
 *   - **未指定版本时不得把数组第一项当成客户的采购需求。** 未选版本时只展示
 *     差异概览 + 选择提示，表单里不带 SKU。
 *   - **「需要协助选型」是一个明确状态。** 这时提交的是型号家族 + 未定版本，
 *     显示为未决定，绝不伪装成已选具体 SKU。
 */

import {
  type FamilyWithVersions,
  type GpuProduct,
  type ModelFamily,
  availabilityText,
  hasUnverifiedSpecs,
  moqText,
  priceText,
  versionDifferences,
} from "../data/gpu-catalog";
import { SYSTEMS_LINES } from "./systems-lines";
import { CONTACT_EMAIL, abbreviation, rfqMailto } from "./rfq";
import { escapeHtml, renderRfqForm } from "./rfq-form";
import { PRIMARY_CTA_LABEL, siteChrome, siteFooter, skipLink } from "./site-chrome";
import { renderSpecSource, renderUnverifiedNotice, renderVersionSpecs } from "./catalog-family";

export type DetailSelection =
  | { kind: "none" }
  | { kind: "version"; sku: string }
  | { kind: "assist" };

export type DetailState = {
  family: ModelFamily;
  versions: GpuProduct[];
  selection: DetailSelection;
};

/**
 * 解析版本选择状态。无效或缺失一律视为「未选择」，不猜测。
 *
 * 为什么「协助选型」用 `?version=none` 而不是单独一个 `?assist=1`：
 * 实测 TanStack Start 的 SSR 搜索参数归一化会丢掉**只有 flag、没有值形态**的
 * 布尔样式参数（`?assist=1` 到达组件时 `useSearch()` 是空对象），
 * 而 `?version=none` 这类显式键值对能完整保留。因此把「未定版本」表达成
 * version 的一个保留值，既避开这个坑，又让状态仍然是一个真实可链接的 URL。
 */
export const NO_VERSION_TOKEN = "none";

export function resolveDetailState(
  entry: FamilyWithVersions,
  search: { version?: string; assist?: string },
): DetailState {
  const version = typeof search.version === "string" ? search.version.trim() : "";
  const assistFlag =
    typeof search.assist === "string" &&
    (search.assist === "1" || search.assist.toLowerCase() === "true");

  if (version && version.toLowerCase() !== NO_VERSION_TOKEN) {
    const match = entry.versions.find((v) => v.sku.toLowerCase() === version.toLowerCase());
    if (match)
      return {
        family: entry.family,
        versions: entry.versions,
        selection: { kind: "version", sku: match.sku },
      };
  }
  if (version.toLowerCase() === NO_VERSION_TOKEN || assistFlag) {
    return { family: entry.family, versions: entry.versions, selection: { kind: "assist" } };
  }
  return { family: entry.family, versions: entry.versions, selection: { kind: "none" } };
}

/** 「协助选型」状态的规范 URL，链接与表单来源都从这里生成。 */
export function assistHref(basePath: string): string {
  return `${basePath}?version=${NO_VERSION_TOKEN}`;
}

function specTable(rows: { label: string; value: string }[]): string {
  return `
            <dl class="detail-specs">
${rows
  .map(
    (r) =>
      `              <div class="detail-specs-row"><dt>${escapeHtml(r.label)}</dt><dd>${escapeHtml(
        r.value,
      )}</dd></div>`,
  )
  .join("\n")}
            </dl>`;
}

function versionPicker(state: DetailState): string {
  const { family, versions, selection } = state;
  const currentSku = selection.kind === "version" ? selection.sku : null;

  const items = versions
    .map((v) => {
      const isCurrent = currentSku === v.sku;
      return `            <li>
              <a class="version-option${isCurrent ? " is-current" : ""}" href="${family.slug}?version=${encodeURIComponent(
                v.sku,
              )}" data-version-sku="${escapeHtml(v.sku)}" data-version-label="${escapeHtml(
                v.versionLabel,
              )}"${isCurrent ? ' aria-current="page"' : ""}>
                <span class="version-option-label">${escapeHtml(v.versionLabel)}</span>
                <span class="version-option-meta">${escapeHtml(v.memory ?? "")}${
                  v.memory ? " &middot; " : ""
                }${escapeHtml(v.formSummary)}</span>
              </a>
            </li>`;
    })
    .join("\n");

  const assistCurrent = selection.kind === "assist";
  return `
        <div class="version-picker" data-version-picker data-family="${escapeHtml(
          family.id,
        )}" data-family-name="${escapeHtml(family.name)}" data-detail-base="${family.slug}">
          <h2 class="version-picker-title" id="version-picker-title">Choose an edition</h2>
          <p class="muted version-picker-hint">
            The three editions differ in memory bandwidth, power, cooling and the platform they fit.
            They are not interchangeable.
          </p>
          <ul class="version-options" aria-labelledby="version-picker-title">
${items}
            <li>
              <a class="version-option version-option-assist${
                assistCurrent ? " is-current" : ""
              }" href="${assistHref(family.slug ?? "")}" data-version-assist="1"${
                assistCurrent ? ' aria-current="page"' : ""
              }>
                <span class="version-option-label">Not sure which edition</span>
                <span class="version-option-meta">Send the workload and we will recommend one.</span>
              </a>
            </li>
          </ul>
        </div>`;
}

function versionOverviewSection(state: DetailState): string {
  const rows = versionDifferences(state.versions);
  if (!rows.length) return "";
  const header = state.versions
    .map((v) => `                <th scope="col">${escapeHtml(v.versionLabel)}</th>`)
    .join("\n");
  const body = rows
    .map(
      (row) => `              <tr>
                <th scope="row">${escapeHtml(row.label)}</th>
${row.values.map((v) => `                <td>${escapeHtml(v)}</td>`).join("\n")}
              </tr>`,
    )
    .join("\n");

  return `
      <section class="section" id="differences" aria-labelledby="differences-title">
        <div class="section-head">
          <h2 id="differences-title">How the editions differ</h2>
          <p class="muted">
            Everything below changes with the edition. Confirm the edition before you order
            &mdash; the same model name covers hardware that fits different machines.
          </p>
        </div>
        <div class="route-table-wrap">
          <table class="route-table version-table">
            <caption class="visually-hidden">Key differences between editions</caption>
            <thead>
              <tr>
                <th scope="col"><span class="visually-hidden">Comparison point</span></th>
${header}
              </tr>
            </thead>
            <tbody>
${body}
            </tbody>
          </table>
        </div>
      </section>`;
}

function selectedVersionSections(product: GpuProduct): string {
  const specRows = product.specs.map((s) => ({
    label: s.label,
    value: s.verified === false ? `${s.value} — unverified` : s.value,
  }));

  return `
      <section class="section" id="specifications" aria-labelledby="specifications-title">
        <div class="section-head">
          <h2 id="specifications-title">${escapeHtml(product.versionLabel)} specifications</h2>
          <p class="muted">
            SKU <code>${escapeHtml(product.sku)}</code> &middot; ${escapeHtml(product.formSummary)}
          </p>
        </div>
${specTable(specRows)}
${renderSpecSource(product)}
${renderUnverifiedNotice(product)}
        <p class="muted catalog-note">
          Availability: ${escapeHtml(availabilityText(product))} &middot; Minimum order:
          ${escapeHtml(moqText(product))} &middot; Price: ${escapeHtml(priceText(product))}
        </p>
      </section>

      <section class="section" id="fit" aria-labelledby="fit-title">
        <div class="section-head">
          <h2 id="fit-title">Where this edition fits</h2>
        </div>
        <div class="fit-grid">
          <article class="fit-card">
            <h3>Best for</h3>
            <p class="muted">${escapeHtml(product.bestFor)}</p>
          </article>
          <article class="fit-card">
            <h3>Platform requirements</h3>
            <p class="muted">${escapeHtml(product.platform)}</p>
          </article>
        </div>
      </section>

      <section class="section" id="request-quote" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">
            The edition and SKU above are already attached to this enquiry. Add the quantity and the
            delivery destination.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm(
  {
    path: "gpu",
    sku: product.sku,
    config: product.versionLabel,
    requirement: product.modelName,
    familyName: product.modelName,
    source: "/buy/rtx-pro-6000-blackwell",
  },
  { formId: "rfq-detail" },
)}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="${rfqMailto({
                  sku: product.sku,
                  name: product.modelName,
                  formSummary: product.formSummary,
                  category: "gpu",
                })}">${CONTACT_EMAIL}</a> with the subject tag <code>[Buyer RFQ]</code>.
              </p>
            </div>
            <div class="rfq-alt-email">
              <h3>Terms to check</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>MOQ</dt><dd>${escapeHtml(abbreviation("MOQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>ECC</dt><dd>Error-correcting code memory &mdash; corrects single-bit errors in GPU memory.</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>`;
}

function noVersionSections(state: DetailState): string {
  return `
      <section class="section" id="choose" aria-labelledby="choose-title">
        <div class="section-head">
          <h2 id="choose-title">Pick an edition to see its specifications</h2>
          <p class="muted">
            Nothing is selected yet, so no SKU is attached to your enquiry. Choose an edition above,
            or choose &ldquo;Not sure which edition&rdquo; and describe the workload instead.
          </p>
        </div>
        <ul class="rfq-checklist">
${state.versions
  .map(
    (v) =>
      `          <li><strong>${escapeHtml(v.versionLabel)}</strong> &mdash; ${escapeHtml(v.bestFor)}</li>`,
  )
  .join("\n")}
        </ul>
      </section>`;
}

function assistSections(state: DetailState): string {
  return `
      <section class="section" id="request-quote" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">
            No edition selected &mdash; that is fine. The model is attached and the version is marked
            as undecided, so we will come back with a recommendation rather than a quote for the
            wrong card.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm(
  {
    path: "gpu",
    sku: "",
    config: "",
    requirement: state.family.name,
    familyName: state.family.name,
    assist: true,
    source: "/buy/rtx-pro-6000-blackwell (assist)",
  },
  { formId: "rfq-detail" },
)}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>What helps us recommend</h3>
              <ul class="rfq-checklist">
                <li>The workload: training, fine-tuning, inference or rendering</li>
                <li>The model or dataset size you need to fit</li>
                <li>Whether it goes into a tower or a rack server</li>
                <li>Available power and cooling per unit</li>
                <li>How many units you need, and where they go</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>`;
}

function relatedLinesSection(): string {
  const cards = SYSTEMS_LINES.filter((l) => l.key === "ai-servers" || l.key === "workstations")
    .map(
      (l) => `            <article class="company-card">
              <h3>${escapeHtml(l.navLabel)}</h3>
              <p class="muted">${escapeHtml(l.lede)}</p>
              <a class="btn btn-ghost" href="${l.path}">Open line</a>
            </article>`,
    )
    .join("\n");

  return `
      <section class="section" id="related" aria-labelledby="related-title">
        <div class="section-head">
          <h2 id="related-title">Buying this in a complete system</h2>
          <p class="muted">
            The same GPU is quoted inside a configured server or workstation. Those lines cover the
            chassis, power, cooling and platform validation.
          </p>
        </div>
        <div class="company-grid company-grid--pair">
${cards}
        </div>
      </section>`;
}

export function renderModelDetail(state: DetailState): string {
  const { family, selection } = state;
  const current =
    selection.kind === "version"
      ? (state.versions.find((v) => v.sku === selection.sku) ?? null)
      : null;

  const heroImage = family.image
    ? `          <figure class="detail-media">
            <img src="${family.image}" alt="" width="960" height="540" loading="eager" decoding="async" />
            <figcaption class="muted">Reference image. Not a photograph of a current lot and not an indication of stock.</figcaption>
          </figure>`
    : "";

  const middle =
    selection.kind === "version" && current
      ? selectedVersionSections(current)
      : selection.kind === "assist"
        ? assistSections(state)
        : noVersionSections(state);

  return `
${skipLink()}
${siteChrome("buy", "RTX PRO 6000, H100, A100...")}

    <main id="main" class="buy-main detail-main">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/buy">GPU wholesale</a>
        <span aria-hidden="true">/</span>
        <a href="/buy/ai-gpus">Professional &amp; data center</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(family.name)}</span>
      </nav>

      <section class="section detail-hero" aria-labelledby="detail-title">
        <div class="detail-hero-layout">
          <div class="detail-hero-copy">
            <span class="eyebrow">${escapeHtml(family.name)}</span>
            <h1 id="detail-title">Three editions. One model name. Different machines.</h1>
            <p class="muted catalog-lede">
              96 GB of GPU memory in every edition, but memory bandwidth, power draw, cooling and the
              host platform change. Pick the edition before ordering.
            </p>
            <div class="btn-row">
              <a class="btn btn-primary" href="#version-picker-title">Choose an edition</a>
              <a class="btn btn-ghost" href="#differences">Compare editions</a>
            </div>
          </div>
${heroImage}
        </div>
      </section>

      <section class="section" aria-labelledby="version-picker-title">
${versionPicker(state)}
      </section>

${middle}
${versionOverviewSection(state)}
${relatedLinesSection()}
    </main>

${siteFooter()}
  `;
}

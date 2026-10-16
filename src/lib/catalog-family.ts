/**
 * GPU 目录的家族卡片与版本选择器（目录页与详情页共用）。
 *
 * 分层职责（本轮的页面任务划分）：
 *   - **目录页**：帮客户选型号。一张家族卡 = 一张参考图 + 型号名 + 一句话用途 +
 *     版本摘要 + 一个明确动作。不放详细规格，不放交易条款，不放完整表单。
 *   - **详情页**：解释版本差异。版本选择器 + 随版本变化的规格 + 平台要求。
 *   - **询价入口**：收集需求。见 `src/lib/rfq-form.ts`。
 *
 * 版本选择的实现方式：**用链接而不是 JS 状态**。
 *   `?version=<sku>` 是真实 URL，因此直接链接、刷新、返回、新标签页全部有效，
 *   且 JS 未执行时也能工作。选择器旁边另有一个隐藏的 `<select>` 供表单在提交时
 *   同步「型号 + 版本 + SKU」上下文（见 `public/legacy/script.js` 的 initVersionPickers）。
 *
 * 未选版本时的行为：显示版本差异概览与选择提示，**绝不把数组第一项当作客户的采购需求**。
 * 客户也可以明确选择「需要协助选型」，此时提交的是型号家族 + 未定版本。
 */

import {
  type FamilyWithVersions,
  type GpuProduct,
  type ModelFamily,
  hasUnverifiedSpecs,
  versionDifferences,
} from "../data/gpu-catalog";
import { escapeHtml } from "./rfq-form";
import { PRIMARY_CTA_LABEL } from "./site-chrome";

/** 详情页已实现的家族 */
export function hasDetailPage(family: ModelFamily): boolean {
  return typeof family.slug === "string" && family.slug.length > 0;
}

/** 版本链接：有详情页 → 详情页带版本；没有 → 目录内的版本摘要锚点 */
export function versionHref(family: ModelFamily, product: GpuProduct): string {
  if (hasDetailPage(family)) {
    return `${family.slug}?version=${encodeURIComponent(product.sku)}`;
  }
  return `#family-${family.id}`;
}

export function familyAnchor(family: ModelFamily): string {
  return `family-${family.id}`;
}

/**
 * 目录卡片。刻意保持简洁：图片、型号名、一句话、版本摘要、一个动作。
 */
export function renderFamilyCard(entry: FamilyWithVersions, index: number): string {
  const { family, versions } = entry;
  const detail = hasDetailPage(family);
  const media = family.image
    ? `              <div class="family-card-media">
                <img src="${family.image}" alt="" loading="lazy" decoding="async" width="960" height="540" />
                <span class="gpu-media-note">Reference image</span>
              </div>`
    : "";

  const versionChips = versions
    .map((v) => {
      const label = escapeHtml(v.versionLabel);
      if (!detail) return `                <li>${label}</li>`;
      return `                <li><a href="${versionHref(family, v)}">${label}</a></li>`;
    })
    .join("\n");

  const primaryAction = detail
    ? `<a class="btn btn-primary family-card-cta" href="${family.slug}">Compare the three editions</a>`
    : `<a class="btn btn-primary family-card-cta" href="#request-quote" data-rfq-model="${escapeHtml(
        family.name,
      )}" data-rfq-sku="" data-rfq-config="">${PRIMARY_CTA_LABEL}</a>`;

  return `
            <article class="family-card" id="${familyAnchor(family)}" data-family="${family.id}">
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
${versionChips}
                </ul>
              </div>
              <div class="family-card-foot">
${primaryAction}
              </div>
            </article>`;
}

/**
 * 版本选择器：整页导航式链接，因此直接链接 / 刷新 / 返回都有效。
 * `current` 为 null 表示尚未选择版本 —— 这时显示提示，不预设任何一个版本。
 */
export function renderVersionPicker(
  family: ModelFamily,
  versions: GpuProduct[],
  current: GpuProduct | null,
  path: string,
): string {
  const items = versions
    .map((v) => {
      const isCurrent = current?.sku === v.sku;
      return `            <li>
              <a class="version-option${isCurrent ? " is-current" : ""}" href="${path}?version=${encodeURIComponent(
                v.sku,
              )}" data-version-sku="${escapeHtml(v.sku)}" data-version-label="${escapeHtml(
                v.versionLabel,
              )}"${isCurrent ? ' aria-current="true"' : ""}>
                <span class="version-option-label">${escapeHtml(v.versionLabel)}</span>
                <span class="version-option-meta">${escapeHtml(v.memory ?? "")}${
                  v.memory ? " &middot; " : ""
                }${escapeHtml(v.formSummary)}</span>
              </a>
            </li>`;
    })
    .join("\n");

  const assistCurrent = current === null ? "" : "";
  return `
        <div class="version-picker" data-version-picker data-family="${escapeHtml(family.id)}" data-family-name="${escapeHtml(
          family.name,
        )}">
          <p class="version-picker-label" id="version-picker-label">
            Choose the edition you need. They are not interchangeable &mdash; power, cooling and host platform differ.
          </p>
          <ul class="version-options" aria-labelledby="version-picker-label">
${items}
            <li>
              <a class="version-option version-option-assist${assistCurrent}" href="${path}?assist=1" data-version-assist="1">
                <span class="version-option-label">Not sure yet</span>
                <span class="version-option-meta">Tell us the workload and we will recommend an edition.</span>
              </a>
            </li>
          </ul>
        </div>`;
}

/**
 * 版本差异概览：尚未选版本时显示。只列出真实存在的差异行（见 versionDifferences），
 * 不为凑满表格而编造对比项。
 */
export function renderVersionOverview(versions: GpuProduct[]): string {
  const rows = versionDifferences(versions);
  if (!rows.length) return "";
  const header = versions
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
        </div>`;
}

/** 某个版本的规格表（详情页与目录锚点共用） */
export function renderVersionSpecs(product: GpuProduct): string {
  return product.specs
    .map((s) => {
      const unverified = s.verified === false;
      return `              <div class="gpu-specs-row${unverified ? " gpu-spec-unverified" : ""}"><dt>${escapeHtml(
        s.label,
      )}</dt><dd>${escapeHtml(s.value)}${unverified ? " (unverified)" : ""}</dd></div>`;
    })
    .join("\n");
}

/** 未核实字段的显式提示 —— 不得静默展示 */
export function renderUnverifiedNotice(product: GpuProduct): string {
  if (!hasUnverifiedSpecs(product)) return "";
  return `              <p class="gpu-unverified">Not verified yet: ${escapeHtml(
    product.unverifiedNotes.join("; "),
  )}. Ask us to confirm before you rely on it.</p>`;
}

/**
 * 规格来源。已核实的规格必须给出来源，让客户能自己复核 ——
 * 这里只在整条记录都核实过时输出，含未核实字段的记录由上面的提示接手。
 */
export function renderSpecSource(product: GpuProduct): string {
  if (!product.specSource || hasUnverifiedSpecs(product)) return "";
  return `              <p class="muted gpu-source">Specifications verified against
                <a href="${product.specSource.url}" rel="nofollow noopener" target="_blank">${escapeHtml(
                  product.specSource.label,
                )}</a>.</p>`;
}

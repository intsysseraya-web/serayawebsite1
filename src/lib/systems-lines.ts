/**
 * Systems 线：hub 区块 + 四条线页（AI Servers / AI Workstations / Gaming / Storage & Networking）
 *
 * 口径与红线：
 *   - 只讲 Seraya，不提关联公司
 *   - 不标公开价格，一律询价制
 *   - 承诺只写能兑现的：交期与保修不写死全站统一数字
 *   - 询价走统一的站内表单（`src/lib/rfq-form.ts`），邮件是备用入口
 *
 * 本轮（2026-11，线上检查项 3 / 4 / 6）改动：
 *   1. **整机页不再重复显卡参数。** 线页主体改为完整系统方案（CPU / GPU 数量 /
 *      内存 / 存储 / 机箱 / 电源 / 散热 / 网络），逐项来自 `src/data/systems.ts`。
 *      单卡与 SXM 模块作为「可放入该线的加速器」单列，并说明它们不能与整机互换。
 *   2. **Storage & Networking 补齐内容。** 之前该页 models 为空、简介后直接进条款；
 *      现在复用整机目录里已有的存储与网络条目（`CAPACITY_BASIS_NOTE` 说明容量口径）。
 *   3. 参考配置一律带示例标识，不暗示已完成兼容性验证或随时可交付。
 *   4. 整机数量与每台显卡数量分开表述。
 */

import { GPU_PRODUCTS, type GpuProduct, availabilityText } from "../data/gpu-catalog";
import {
  CAPACITY_BASIS_NOTE,
  REFERENCE_CONFIGURATION_COUNT,
  REFERENCE_DISCLAIMER,
  productsInCategory,
  type Product,
} from "../data/systems";
import { BUYER_FLOW, RFQ_PATHS, abbreviation, rfqHref } from "./rfq";
import { escapeHtml, renderRfqForm } from "./rfq-form";
import { PRIMARY_CTA_LABEL, siteChrome, siteFooter, skipLink } from "./site-chrome";

export const SYSTEMS_RFQ_EMAIL = "felix.mm@seraya.systems";
export const SYSTEMS_RFQ_SUBJECT_TAG = "[Systems RFQ]";

/** 方案 §三 第 1 项：条款区块，沿用 /buy 的既有口径 */
const LINE_TERMS: { label: string; value: string }[] = [
  { label: "Pricing", value: "Quotation based. No prices are published on this site." },
  {
    label: "Configuration",
    value: "Confirmed per order. Card count, chassis and power are agreed in the quotation.",
  },
  { label: "Minimum order", value: "Confirmed per line, model and lot." },
  { label: "Lead time", value: "Stated in the quotation, with the point it runs from." },
  {
    label: "Payment",
    value: "T/T or another confirmed method. Deposit and balance are agreed per order.",
  },
  {
    label: "Warranty and DOA",
    value: "Agreed per system, condition and lot. Not a site-wide fixed term.",
  },
  {
    label: "Trade documents",
    value:
      "Invoice, test, end-user or other documents are confirmed per product, use and destination.",
  },
];

const LINE_FAQ: { question: string; answer: string }[] = [
  {
    question: "What is the minimum order for a system?",
    answer:
      "MOQ is confirmed per line, model and lot. Submit the system count — and the card count per system if you know it — and we will confirm.",
  },
  {
    question: "Can I specify the configuration?",
    answer:
      "Yes. Card count, chassis, power and cooling are agreed per order and stated in the quotation.",
  },
  {
    question: "Are the reference configurations on this site ready to ship?",
    answer:
      "No. They are examples used to describe the shape of a build. Compatibility, firmware and availability are confirmed per order before anything is committed.",
  },
  {
    question: "Do you deliver to my country?",
    answer:
      "We confirm the destinations we can serve. Other destinations are assessed per request.",
  },
  {
    question: "What payment arrangements are available?",
    answer:
      "The payment method, and the deposit and balance split, are confirmed in the quotation for that order.",
  },
  {
    question: "What warranty and DOA terms apply?",
    answer:
      "Warranty and DOA responsibility are agreed per system and lot, and stated in the quotation. They are not applied as one site-wide term.",
  },
  {
    question: "How do I start?",
    answer:
      "Use the RFQ form on the line page, or email the model or line, the quantity and the delivery destination to " +
      SYSTEMS_RFQ_EMAIL +
      ". We respond to complete RFQs within one business day.",
  },
];

type LineSystem = {
  /** 指向 `src/data/systems.ts` 的 SKU；规格从那一份数据取，不在此重复维护 */
  sku: string;
  /** 该线内的用途说明 */
  workload: string;
  /** 交付口径：整机数量 / 每台卡数 */
  delivery: string;
};

export type SystemsLine = {
  key: string;
  path: string;
  /** 导航与 hub 卡片用的名称 */
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  /** 该线的完整系统方案（复用整机目录的 SKU） */
  systems: LineSystem[];
  /** 该线可选的单卡 / 模块（只在有依据时列出，并说明不可互换） */
  acceleratorSkus: string[];
  /**
   * 该线没有可发布的固定配置时的说明。有值时页面不渲染「参考配置」区块，
   * 改为展示用途、可配范围与询价入口 —— 不编造 BOM。
   */
  noReferenceNotice?: string;
  /** 额外的完整系统 RFQ 入口说明 */
  rfqNote: string;
};

export const SYSTEMS_LINES: SystemsLine[] = [
  {
    key: "ai-servers",
    path: "/systems/ai-servers",
    navLabel: "AI Servers",
    title: "AI Servers | Seraya System Integration",
    description:
      "AI server supply for multi-GPU training and inference, configured per order and quoted per enquiry.",
    eyebrow: "Systems &middot; AI servers",
    h1: "AI Servers for Training and Inference",
    lede: "Seraya supplies AI servers configured to your workload. Card count, chassis, power and cooling are agreed per order and stated in the quotation.",
    systems: [
      {
        sku: "SR-G410",
        workload: "Inference and light fine-tuning where two accelerators are enough.",
        delivery: "Quoted per server. Card count stated per system.",
      },
      {
        sku: "SR-G780",
        workload: "Multi-GPU fine-tuning and training inside one chassis.",
        delivery: "Quoted per server. Card count stated per system; 4 cards in this example.",
      },
      {
        sku: "SR-G990",
        workload: "Large-model training across nodes, with InfiniBand fabric.",
        delivery: "Quoted per server. Card count stated per system; 8 modules in this example.",
      },
    ],
    acceleratorSkus: ["SR-H100-SXM", "SR-H100-NVL", "SR-H100-PCIE", "SR-A100", "SR-PRO6000-SE"],
    rfqNote:
      "Tell us the workload, the number of servers and the cards per server. The two counts are quoted separately.",
  },
  {
    key: "workstations",
    path: "/systems/workstations",
    navLabel: "AI Workstations",
    title: "AI Workstations | Seraya System Integration",
    description:
      "AI workstation supply for local development, inference, rendering and simulation, configured per order.",
    eyebrow: "Systems &middot; AI workstations",
    h1: "AI Workstations for Local Development",
    lede: "Workstations built around one or two accelerators, for teams that need the work off shared infrastructure and quiet enough for an office.",
    systems: [
      {
        sku: "SR-W310",
        workload: "Engineering and content work with a single professional card.",
        delivery: "Quoted per workstation. One card in this example.",
      },
      {
        sku: "SR-W620",
        workload: "Simulation, rendering and local model work needing two cards and large memory.",
        delivery: "Quoted per workstation. Two cards in this example.",
      },
      {
        sku: "SR-W180-EDGE",
        workload: "Small, quiet node for an office or lab corner.",
        delivery: "Quoted per workstation. One small-form-factor card in this example.",
      },
    ],
    acceleratorSkus: ["SR-PRO6000-WS", "SR-PRO6000-MQ", "SR-5090"],
    rfqNote:
      "Tell us what you will run on it, the number of workstations and the accelerators per workstation.",
  },
  {
    key: "gaming",
    path: "/systems/gaming",
    navLabel: "Gaming Systems",
    title: "Gaming Systems for Resellers | Seraya System Integration",
    description:
      "Bulk gaming system supply for resellers, retailers and esports venues. Quoted per enquiry, not retail single-unit sales.",
    eyebrow: "Systems &middot; gaming, B2B",
    h1: "Gaming Systems for Bulk Buyers",
    lede: "Built for resellers, retailers and esports venues buying in volume. This is a B2B supply line, not retail single-unit sales.",
    /*
     * 2026-11 修正：Gaming 线原先引用 `SR-G410`，但那是**双 L40S 推理服务器**
     * （本文件 ai-servers 线的条目）。把共享的 SR-G410 改写成游戏主机是错的 ——
     * 会同时污染 AI Servers 线的参数。
     *
     * 处理方式（按本轮要求）：
     *   - 保留 AI Servers 线的 SR-G410 原样不动；
     *   - 删除 Gaming 对它的引用；
     *   - 当前没有可靠的游戏整机配置数据来源，**不编造完整配置**，
     *     改为展示用途、可配范围与询价入口（见 `noReferenceNotice`）。
     */
    systems: [],
    acceleratorSkus: ["SR-5090", "SR-5080", "SR-5070", "SR-5060TI-16G", "SR-5060TI-8G", "SR-5060"],
    noReferenceNotice:
      "We do not publish a fixed gaming configuration here, because the build is driven by the card tier you choose and the component pricing available at the time. Tell us the card tier, the batch size and the destination, and we will come back with the configuration we can actually source — not an example spec that may not be buildable.",
    rfqNote:
      "Tell us the batch size (systems), the card tier you want in each system, and the destination.",
  },
  {
    key: "storage-networking",
    path: "/systems/storage-networking",
    navLabel: "Storage & Networking",
    title: "Storage and Networking | Seraya System Integration",
    description:
      "Storage pools, capacity tiers, backup targets and cluster switching or fabric, configured to match the compute they serve.",
    eyebrow: "Systems &middot; storage &amp; networking",
    h1: "Storage and Networking",
    lede: "Storage and network infrastructure sized to match the compute it serves — pools and capacity tiers for the data, leaf/spine switching or InfiniBand for the fabric.",
    systems: [],
    acceleratorSkus: [],
    rfqNote:
      "Tell us the workload, the capacity or port count you need, and how much redundancy you want. Redundancy decides the usable capacity, so we confirm it before quoting.",
  },
];

export { REFERENCE_CONFIGURATION_COUNT, REFERENCE_DISCLAIMER, CAPACITY_BASIS_NOTE };

function findSystem(sku: string): Product | undefined {
  return ["compute", "gpu", "storage", "networking", "workstation"]
    .flatMap((id) => productsInCategory(id as never))
    .find((p) => p.sku === sku);
}

function findGpu(sku: string): GpuProduct | undefined {
  return GPU_PRODUCTS.find((g) => g.sku === sku);
}

function systemBlock(line: SystemsLine, entry: LineSystem): string {
  const product = findSystem(entry.sku);
  if (!product) return "";
  const specRows = product.specs
    .map(
      ([label, value]) =>
        `                <div class="spec-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
  return `
            <article class="line-model product-card sku-card">
              <div class="line-model-head">
                <span class="sku-code">${escapeHtml(product.sku)}</span>
                <h3>${escapeHtml(product.name)}</h3>
                <span class="reference-flag">Reference configuration</span>
              </div>
              <p class="muted gpu-form-summary">${escapeHtml(product.kind)}</p>
              <dl class="spec-table">${specRows}</dl>
              <div class="line-model-body">
                <p><strong>Fits</strong> ${escapeHtml(entry.workload)}</p>
                <p><strong>Delivery</strong> ${escapeHtml(entry.delivery)}</p>
              </div>
              <a class="btn btn-primary" href="${rfqHref(
                {
                  sku: product.sku,
                  name: product.name,
                  formSummary: product.kind,
                  category: product.code.startsWith("SR-S")
                    ? "storage"
                    : product.code.startsWith("SR-N")
                      ? "networking"
                      : "system",
                },
                { source: line.key },
              )}" aria-label="Get a quote for ${escapeHtml(product.name)}, complete system, SKU ${escapeHtml(product.sku)}">${PRIMARY_CTA_LABEL}</a>
            </article>`;
}

function acceleratorBlock(sku: string): string {
  const gpu = findGpu(sku);
  if (!gpu) return "";
  return `
            <li class="accelerator-item">
              <span class="gpu-sku-code">${escapeHtml(gpu.sku)}</span>
              <strong>${escapeHtml(gpu.modelName)}</strong>
              <span class="muted">${escapeHtml(gpu.formSummary)} &middot; ${escapeHtml(availabilityText(gpu))}</span>
              <a href="${rfqHref(
                {
                  sku: gpu.sku,
                  name: gpu.modelName,
                  formSummary: gpu.formSummary,
                  category: "gpu",
                },
                { source: "line" },
              )}" aria-label="${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(gpu.modelName)}, ${escapeHtml(gpu.formSummary)}, SKU ${escapeHtml(gpu.sku)}">${PRIMARY_CTA_LABEL}</a>
            </li>`;
}

/** 存储与网络条目的完整展示（线检项 4） */
function componentBlock(product: Product, category: "storage" | "networking"): string {
  const specRows = product.specs
    .map(
      ([label, value]) =>
        `                  <div class="spec-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
  return `
            <article class="line-model product-card sku-card cat-${category}">
              <div class="product-card-media">
                <img src="${product.img}" alt="${escapeHtml(product.sku)} — ${escapeHtml(product.name)}" loading="lazy" decoding="async" width="1536" height="1024" />
                <div class="media-tint" aria-hidden="true"></div>
                <span class="gpu-media-note">Reference image</span>
              </div>
              <div class="line-model-head">
                <span class="sku-code">${escapeHtml(product.sku)}</span>
                <h3>${escapeHtml(product.name)}</h3>
              </div>
              <p class="muted gpu-form-summary">${escapeHtml(product.kind)}</p>
              <dl class="spec-table">${specRows}</dl>
              <a class="btn btn-primary" href="${rfqHref(
                {
                  sku: product.sku,
                  name: product.name,
                  formSummary: product.kind,
                  category,
                },
                { source: category },
              )}" aria-label="${escapeHtml(PRIMARY_CTA_LABEL)} for ${escapeHtml(product.name)}, ${category === "storage" ? "storage" : "networking"} unit, SKU ${escapeHtml(product.sku)}">${PRIMARY_CTA_LABEL}</a>
            </article>`;
}

function termsList(terms: { label: string; value: string }[]): string {
  return `
            <dl class="terms-list">
${terms.map((t) => `              <div class="terms-row"><dt>${escapeHtml(t.label)}</dt><dd>${escapeHtml(t.value)}</dd></div>`).join("\n")}
            </dl>`;
}

export function renderSystemsLine(line: SystemsLine): string {
  const isStorageNetworking = line.key === "storage-networking";

  const storageNetworkingBlocks = isStorageNetworking
    ? `
      <section class="section" id="storage" aria-labelledby="storage-title">
        <div class="section-head">
          <h2 id="storage-title">Storage</h2>
          <p class="muted">Pools, capacity tiers and backup targets, matched to the compute they serve.</p>
        </div>
        <div class="line-model-grid">
${productsInCategory("storage")
  .map((p) => componentBlock(p, "storage"))
  .join("\n")}
        </div>
        <p class="muted catalog-note">${escapeHtml(CAPACITY_BASIS_NOTE)}</p>
      </section>

      <section class="section" id="networking" aria-labelledby="networking-title">
        <div class="section-head">
          <h2 id="networking-title">Networking</h2>
          <p class="muted">Leaf and spine Ethernet switching, plus InfiniBand fabric options.</p>
        </div>
        <div class="line-model-grid">
${productsInCategory("networking")
  .map((p) => componentBlock(p, "networking"))
  .join("\n")}
        </div>
      </section>`
    : "";

  const systemsSection = line.systems.length
    ? `
      <section class="section" id="systems" aria-labelledby="systems-title">
        <div class="section-head">
          <h2 id="systems-title">System configurations on this line</h2>
          <p class="muted">${escapeHtml(REFERENCE_DISCLAIMER)}</p>
        </div>
        <div class="line-model-grid">
${line.systems.map((s) => systemBlock(line, s)).join("\n")}
        </div>
      </section>`
    : line.noReferenceNotice
      ? `
      <section class="section" id="systems" aria-labelledby="systems-title">
        <div class="section-head">
          <h2 id="systems-title">What we configure</h2>
        </div>
        <p class="muted catalog-lede">${escapeHtml(line.noReferenceNotice)}</p>
        <div class="program-control-grid">
          <article>
            <h3>Card tier decides the build</h3>
            <p>Pick the tier from the accelerators listed below. The rest of the configuration follows from that choice.</p>
          </article>
          <article>
            <h3>Batch size and repeatability</h3>
            <p>Matched components, the same firmware baseline and the same BIOS across the batch, so units behave the same.</p>
          </article>
          <article>
            <h3>Destination and lead time</h3>
            <p>We state the destination we can serve and the timing we can hold, per batch, in the quotation.</p>
          </article>
        </div>
      </section>`
      : "";

  const acceleratorsSection = line.acceleratorSkus.length
    ? `
      <section class="section" id="accelerators" aria-labelledby="accelerators-title">
        <div class="section-head">
          <h2 id="accelerators-title">Accelerators quoted with this line</h2>
          <p class="muted">
            These are supplied as cards or SXM modules inside a system &mdash; they are not
            interchangeable with a complete system, and they need a compatible host platform.
          </p>
        </div>
        <ul class="accelerator-list">
${line.acceleratorSkus.map(acceleratorBlock).join("\n")}
        </ul>
      </section>`
    : "";

  return `
${skipLink()}
${siteChrome("systems", "H100, RTX PRO 6000, storage...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">${line.eyebrow}</span>
        <h1>${line.h1}</h1>
        <p class="muted catalog-lede">${escapeHtml(line.lede)}</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/systems">All systems</a>
          <a class="btn btn-ghost" href="/buy">Wholesale GPU cards</a>
        </div>
      </div>
    </div>

    <main id="main" class="buy-main">
${systemsSection}
${storageNetworkingBlocks}
${acceleratorsSection}

      <section class="section" id="request-quote" aria-labelledby="rfq-title">
        <div class="section-head">
          <h2 id="rfq-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">${escapeHtml(line.rfqNote)}</p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm(
  {
    path: line.key === "storage-networking" ? "component" : "system",
    source: line.path,
  },
  { formId: `rfq-${line.key}` },
)}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="mailto:${SYSTEMS_RFQ_EMAIL}">${SYSTEMS_RFQ_EMAIL}</a> with the subject tag
                <code>${SYSTEMS_RFQ_SUBJECT_TAG}</code>.
              </p>
              <p class="muted">${escapeHtml(RFQ_PATHS.system.quantityHint)} ${escapeHtml(
                RFQ_PATHS.system.cardCount?.hint ?? "",
              )}</p>
            </div>
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>BOM</dt><dd>${escapeHtml(abbreviation("BOM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
                <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section" aria-labelledby="terms-title">
        <div class="section-head">
          <h2 id="terms-title">Terms</h2>
          <p class="muted">Confirmed in the written quotation for your order.</p>
        </div>
${termsList(LINE_TERMS)}
      </section>

      <section class="section" aria-labelledby="faq-title">
        <div class="section-head">
          <h2 id="faq-title">Buyer questions</h2>
        </div>
        <div class="faq-list">
${LINE_FAQ.map((f) => `          <details class="faq-item"><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join("\n")}
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="line-cta-title">
        <div>
          <p class="muted">${SYSTEMS_RFQ_EMAIL}</p>
          <h2 id="line-cta-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">Model or line, quantity and delivery destination are enough to start.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/buy">Wholesale GPU cards</a>
        </div>
      </section>
    </main>

${siteFooter()}
  `;
}

/** `/systems` hub 区块，插在参考配置目录上方。 */
export function renderSystemsHub(): string {
  const cards = SYSTEMS_LINES.map(
    (l) => `            <article class="company-card">
              <h3>${escapeHtml(l.navLabel)}</h3>
              <p class="muted">${escapeHtml(l.lede)}</p>
              <a class="btn btn-ghost" href="${l.path}">Open line</a>
            </article>`,
  ).join("\n");

  return `
      <section class="catalog-section" aria-labelledby="systems-hub-title">
        <div class="catalog-section-head">
          <h2 id="systems-hub-title">Systems supply</h2>
          <p class="muted">
            Seraya supplies complete systems &mdash; workstations, servers, storage and networking &mdash;
            on a B2B quotation basis. Configuration is confirmed per order. Prices are not published.
          </p>
        </div>
        <div class="company-grid company-grid--pair">
${cards}
        </div>
      </section>

      <section class="catalog-section" aria-labelledby="systems-flow-title">
        <div class="catalog-section-head">
          <h2 id="systems-flow-title">How a systems order runs</h2>
        </div>
        <ol class="flow-line">
${BUYER_FLOW.map((s, i) => `          <li><span class="flow-dot">${i + 1}</span><span class="flow-label">${escapeHtml(s.title)}</span></li>`).join("\n")}
        </ol>
        <p class="muted catalog-note">
          Use the <a href="/systems#request-quote">systems RFQ form</a>, or email
          <a href="mailto:${SYSTEMS_RFQ_EMAIL}">${SYSTEMS_RFQ_EMAIL}</a> with the subject tag
          <code>${SYSTEMS_RFQ_SUBJECT_TAG}</code>.
        </p>
      </section>
`;
}

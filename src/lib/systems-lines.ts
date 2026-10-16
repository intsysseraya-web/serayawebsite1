/**
 * Systems 线：hub 区块 + 四条线页（《Seraya 网站改版补充方案 2026-10-16》）
 *
 * 口径与红线（方案 §三、§四）：
 *   - 只讲 Seraya，不提关联公司
 *   - 不标公开价格，一律询价制
 *   - 不上 WhatsApp 入口
 *   - 承诺只写能兑现的：交期与保修不写死全站统一数字
 *   - CTA 用 [Systems RFQ] 主题标签，与 /buy 的 [Buyer RFQ] 分流
 *
 * 规格数据边界：
 *   型号「Memory」取自已核实的厂商公开规格（与 /buy 同一份 gpu-catalog 数据源）。
 *   带宽 / 功耗 / CUDA 核心等字段**本期留空不显示** —— 这些需要逐型号对照 NVIDIA
 *   官方规格表核实，未经核实不写入公开页面。
 */

import { GPU_PRODUCTS } from "../data/gpu-catalog";
import { CATEGORIES } from "../data/systems";
import { BUYER_FLOW } from "./buy-flow";
import { siteChrome, siteFooter, skipLink } from "./site-chrome";

export const SYSTEMS_RFQ_EMAIL = "felix.mm@seraya.systems";
export const SYSTEMS_RFQ_SUBJECT_TAG = "[Systems RFQ]";

export function systemsRfqMailto(modelName?: string): string {
  const subject = modelName
    ? `${SYSTEMS_RFQ_SUBJECT_TAG} ${modelName}`
    : `${SYSTEMS_RFQ_SUBJECT_TAG} systems enquiry`;
  const body = [
    "Company:",
    "Contact name (optional):",
    "Email:",
    "Delivery country:",
    `Model / configuration: ${modelName ?? ""}`,
    "Quantity / card count:",
    "Condition preference (New / Pre-owned / Refurbished / Open to options):",
    "Target delivery date (optional):",
    "Notes:",
  ].join("\n");
  return (
    "mailto:" +
    SYSTEMS_RFQ_EMAIL +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body)
  );
}

/** 方案 §三 第 1 项：条款区块，沿用 /buy 的既有口径 */
const LINE_TERMS: { label: string; value: string }[] = [
  { label: "Pricing", value: "Quotation based. No prices are published on this site." },
  { label: "Configuration", value: "Confirmed per order. Card count, chassis and power are agreed in the quotation." },
  { label: "Minimum order", value: "Confirmed per line, model and lot." },
  { label: "Lead time", value: "Stated in the quotation, with the point it runs from." },
  { label: "Payment", value: "T/T or another confirmed method. Deposit and balance are agreed per order." },
  { label: "Warranty and DOA", value: "Agreed per system, condition and lot. Not a site-wide fixed term." },
  { label: "Trade documents", value: "Invoice, test, end-user or other documents are confirmed per product, use and destination." },
];

/** 方案 §三 第 2 项：线级 FAQ，B2B 问法 */
const LINE_FAQ: { question: string; answer: string }[] = [
  {
    question: "What is the minimum order for a system?",
    answer:
      "MOQ is confirmed per line, model and lot. Submit the card count or unit count you need and we will confirm.",
  },
  {
    question: "Can I specify the configuration?",
    answer:
      "Yes. Card count, chassis, power and cooling are agreed per order and stated in the quotation.",
  },
  {
    question: "Do you deliver to my country?",
    answer: "We confirm the destinations we can serve. Other destinations are assessed per request.",
  },
  {
    question: "What payment arrangements are available?",
    answer: "The payment method, and the deposit and balance split, are confirmed in the quotation for that order.",
  },
  {
    question: "What warranty and DOA terms apply?",
    answer:
      "Warranty and DOA responsibility are agreed per system and lot, and stated in the quotation. They are not applied as one site-wide term.",
  },
  {
    question: "How do I start?",
    answer:
      "Email the model or line, the quantity and the delivery destination to " +
      SYSTEMS_RFQ_EMAIL +
      ". We respond to complete RFQs within one business day.",
  },
];

type LineModel = { code: string; name: string; workload: string; config: string };

export type SystemsLine = {
  key: string;
  path: string;
  /** 导航下拉里的名称 */
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  models: LineModel[];
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
    lede:
      "Seraya supplies AI servers configured to your workload. Card count, chassis, power and cooling are agreed per order and stated in the quotation.",
    models: [
      {
        code: "SR-H100",
        name: "NVIDIA H100",
        workload: "Model training, fine-tuning and high-throughput inference, single server to multi-node clusters.",
        config: "1 / 2 / 4 / 8 cards. SXM and PCIe forms are quoted separately.",
      },
      {
        code: "SR-A100",
        name: "NVIDIA A100",
        workload: "Training, fine-tuning and inference for established model families.",
        config: "1 / 2 / 4 / 8 cards. SXM and PCIe forms are quoted separately.",
      },
      {
        code: "SR-PRO6000",
        name: "NVIDIA RTX PRO 6000 Blackwell Server Edition",
        workload: "Enterprise AI and graphics workloads in a rack server form.",
        config: "1 / 2 / 4 / 8 cards, quoted per order.",
      },
    ],
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
    lede:
      "Workstations built around a single or dual accelerator, for teams that need the work off shared infrastructure.",
    models: [
      {
        code: "SR-PRO6000",
        name: "NVIDIA RTX PRO 6000 Blackwell Workstation Edition",
        workload: "Local AI development and inference, rendering, simulation and content creation.",
        config: "1 to 2 cards. Higher card counts are discussed per order.",
      },
      {
        code: "SR-5090",
        name: "NVIDIA GeForce RTX 5090",
        workload: "Local development, inference and GPU-accelerated creative work where a consumer accelerator fits the requirement.",
        config: "1 to 2 cards, quoted per order.",
      },
    ],
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
    lede:
      "Built for resellers, retailers and esports venues buying in volume. This is a B2B supply line, not retail single-unit sales.",
    models: [
      { code: "SR-5090", name: "NVIDIA GeForce RTX 5090", workload: "Top-tier gaming and GPU-accelerated creative work.", config: "Quoted per order." },
      { code: "SR-5080", name: "NVIDIA GeForce RTX 5080", workload: "High-refresh gaming and creative workloads.", config: "Quoted per order." },
      { code: "SR-5070", name: "NVIDIA GeForce RTX 5070", workload: "Mainstream gaming and content work.", config: "Quoted per order." },
      { code: "SR-5060TI", name: "NVIDIA GeForce RTX 5060 Ti", workload: "Volume builds for esports and entry gaming.", config: "Quoted per order." },
      { code: "SR-5060", name: "NVIDIA GeForce RTX 5060", workload: "Entry builds and volume deployment.", config: "Quoted per order." },
    ],
  },
  {
    key: "storage-networking",
    path: "/systems/storage-networking",
    navLabel: "Storage & Networking",
    title: "Storage and Networking | Seraya System Integration",
    description:
      "Storage and network infrastructure supply for compute deployments, configured and quoted per order.",
    eyebrow: "Systems &middot; storage &amp; networking",
    h1: "Storage and Networking",
    lede:
      "Storage and network infrastructure for the deployments we supply, configured to match the compute it serves.",
    models: [],
  },
];

function esc(value: string): string {
  return value
    .replace(/&(?!(amp|mdash|middot|lt|gt|quot|&#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function modelBlock(line: SystemsLine, m: LineModel): string {
  // 取该型号在 gpu-catalog 里的全部已核实规格（显存、带宽、功耗、形态、CUDA 核心）
  const product = GPU_PRODUCTS.find((g) => g.code === m.code);
  const specRows = (product?.specs ?? [])
    .map((s) => `<div class="gpu-specs-row"><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`)
    .join("");
  return `
          <article class="line-model">
            <div class="line-model-head">
              <span class="sku-code">${esc(m.code)}</span>
              <h3>${esc(m.name)}</h3>
            </div>
            <dl class="gpu-specs">${specRows}</dl>
            <div class="line-model-body">
              <p><strong>Workloads</strong> ${esc(m.workload)}</p>
              <p><strong>Configuration</strong> ${esc(m.config)}</p>
            </div>
            <a class="btn btn-ghost gpu-card-cta" href="${systemsRfqMailto(m.name)}">Email RFQ</a>
          </article>`;
}

function termsList(terms: { label: string; value: string }[]): string {
  return `
          <dl class="terms-list">
${terms.map((t) => `            <div class="terms-row"><dt>${esc(t.label)}</dt><dd>${esc(t.value)}</dd></div>`).join("\n")}
          </dl>`;
}

export function renderSystemsLine(line: SystemsLine): string {
  const models = line.models.length
    ? `
      <section class="section" aria-labelledby="models-title">
        <div class="section-head">
          <h2 id="models-title">Models on this line</h2>
        </div>
        <div class="line-model-grid">
${line.models.map((m) => modelBlock(line, m)).join("\n")}
        </div>
      </section>`
    : "";

  return `
${skipLink()}
${siteChrome("systems", "H100, RTX PRO 6000, storage...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">${line.eyebrow}</span>
        <h1>${line.h1}</h1>
        <p class="muted catalog-lede">${esc(line.lede)}</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="${systemsRfqMailto()}">Email RFQ</a>
          <a class="btn btn-ghost" href="/systems">All systems</a>
        </div>
      </div>
    </div>

    <main id="main" class="buy-main">
${models}

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
${LINE_FAQ.map((f) => `          <details class="faq-item"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("\n")}
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="line-cta-title">
        <div>
          <p class="muted">${SYSTEMS_RFQ_EMAIL}</p>
          <h2 id="line-cta-title">Email RFQ</h2>
          <p class="muted">Model or line, quantity and delivery destination are enough to start.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="${systemsRfqMailto()}">Email RFQ</a>
          <a class="btn btn-ghost" href="/buy">Wholesale GPU cards</a>
        </div>
      </section>
    </main>

${siteFooter()}
  `;
}

/** 方案执行顺序第 2 项：/systems hub 区块，插在现有目录上方 */
export function renderSystemsHub(): string {
  const cards = SYSTEMS_LINES.map(
    (l) => `          <article class="company-card">
            <h3>${esc(l.navLabel)}</h3>
            <p class="muted">${esc(l.lede)}</p>
            <a class="btn btn-ghost" href="${l.path}">Open line</a>
          </article>`,
  ).join("\n");

  return `
      <section class="catalog-section" aria-labelledby="systems-hub-title">
        <div class="catalog-section-head">
          <h2 id="systems-hub-title">Systems supply</h2>
          <p class="muted">
            Seraya supplies complete systems &mdash; workstations, servers and gaming builds &mdash;
            on a B2B quotation basis. Configuration is confirmed per order. Prices are not published.
          </p>
        </div>
        <div class="company-grid">
${cards}
        </div>
      </section>

      <section class="catalog-section" aria-labelledby="systems-flow-title">
        <div class="catalog-section-head">
          <h2 id="systems-flow-title">How a systems order runs</h2>
        </div>
        <ol class="flow-line">
${BUYER_FLOW.map((s, i) => `          <li><span class="flow-dot">${i + 1}</span><span class="flow-label">${esc(s.title)}</span></li>`).join("\n")}
        </ol>
        <p class="muted catalog-note">
          Email <a href="${systemsRfqMailto()}">${SYSTEMS_RFQ_EMAIL}</a> with the subject tag
          <code>[Systems RFQ]</code>.
        </p>
      </section>
`;
}

/** 现有整机目录里，存储与网络两条线的商品编号 */
export const STORAGE_NETWORK_CODES = ["storage", "networking"].flatMap(
  (id) => (CATEGORIES.find((c) => c.id === id)?.products ?? []).map((p) => p.code),
);

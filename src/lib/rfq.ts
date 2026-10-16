/**
 * 询价（RFQ）单一数据源 —— 三条主路径、表单字段口径、校验规则、邮件模板。
 *
 * 三条主路径（线上检查项 5）：
 *   1. 购买 GPU（单卡 / 模块）      → 型号、版本、数量、目的地
 *   2. 购买整机 / 系统              → 用途、整机数量、配置或 BOM、目的地
 *   3. 出售 GPU 批次                → 型号、数量、成色、所在地、测试资料
 *
 * 硬边界（沿用既有已确认口径，实施时不得改写为更强的承诺）：
 *   1. 「完整 RFQ 一个工作日内回复」只承诺回复，不等于人工报价。
 *   2. 收购线的 12 小时 committed lot decision **只属于收购业务**，不得出现在买家路径上。
 *   3. FAQ 答案以业务确认的信息为准；无依据时不承诺统一期限、保修年限或固定折扣率。
 *   4. 站内询价表单只是**投递通道**；服务端未确认接收前，前端不得显示成功。
 */

/** 已确认的对外邮箱（方案 §8.4） */
export const CONTACT_EMAIL = "felix.mm@seraya.systems";

/** 邮件主题类型标记，便于分流 */
export const RFQ_SUBJECT_TAG = "[Buyer RFQ]";
export const SYSTEMS_RFQ_SUBJECT_TAG = "[Systems RFQ]";
export const SELL_RFQ_SUBJECT_TAG = "[Sell GPU lot]";

/** 买家首次回复口径（原文） */
export const BUYER_RESPONSE_COMMITMENT = "We respond to complete RFQs within one business day.";

/** 站内询价表单的服务端入口 */
export const RFQ_ENDPOINT = "/api/rfq";

// ---------------------------------------------------------------------------
// 缩写表 —— 首次出现必须能查到解释（线上检查项 5）
// ---------------------------------------------------------------------------

export const ABBREVIATIONS: { term: string; meaning: string }[] = [
  { term: "RFQ", meaning: "Request for quotation — your requirement, sent to us for pricing." },
  { term: "BOM", meaning: "Bill of materials — the parts list for a system." },
  {
    term: "ITAD",
    meaning: "IT asset disposition — professionally decommissioned and graded equipment.",
  },
  { term: "DOA", meaning: "Dead on arrival — a unit that fails as soon as it is received." },
  { term: "RMA", meaning: "Return merchandise authorisation — the return and repair process." },
  {
    term: "SXM",
    meaning:
      "NVIDIA's board-to-board GPU module format, mounted on an HGX baseboard — not a PCIe add-in card.",
  },
  { term: "MOQ", meaning: "Minimum order quantity." },
];

export function abbreviation(term: string): string | null {
  return ABBREVIATIONS.find((a) => a.term === term)?.meaning ?? null;
}

// ---------------------------------------------------------------------------
// SKU 引用 —— 询价必须携带的上下文（线上检查项 E）
// ---------------------------------------------------------------------------

export type SkuCategory = "gpu" | "system" | "storage" | "networking" | "component";

export type SkuRef = {
  sku: string;
  name: string;
  /** 交付形态描述，避免单卡/模块/整机混为一谈 */
  formSummary: string;
  category: SkuCategory;
};

const CATEGORY_TAG: Record<SkuCategory, string> = {
  gpu: "GPU",
  system: "Complete system",
  storage: "Storage",
  networking: "Networking",
  component: "Component",
};

/**
 * 构造站内询价链接。
 * 保留旧的 `?model=` 行为（GPU 卡片原有邮件模板已预填型号），同时新增
 * sku / config / kind，使联系人页表单能完整还原所选对象。
 */
export function rfqHref(
  ref: SkuRef | null,
  options: { config?: string; source?: string } = {},
): string {
  const params = new URLSearchParams();
  if (ref) {
    params.set("sku", ref.sku);
    params.set("model", ref.name);
    params.set("kind", ref.category);
  }
  if (options.config) params.set("config", options.config);
  if (options.source) params.set("from", options.source);
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

/** 邮件备用入口：主题带类型标记，正文预填所选型号与交付形态。 */
export function rfqMailto(
  ref: SkuRef | null,
  options: { config?: string; path?: RfqPathKey } = {},
): string {
  const pathKey = options.path ?? (ref?.category === "system" ? "system" : "gpu");
  const pathDef = RFQ_PATHS[pathKey];
  const subject = ref
    ? `${pathDef.subjectTag} ${ref.name}`
    : `${pathDef.subjectTag} ${pathDef.defaultSubject}`;

  const bodyLines = [
    "Company:",
    "Contact name (optional):",
    "Email:",
    "Delivery country / city:",
    `Product: ${ref ? `${ref.name} (${ref.sku})` : ""}`,
    `Item type: ${ref ? CATEGORY_TAG[ref.category] : ""}`,
    `Form: ${ref?.formSummary ?? ""}`,
    `Configuration / version: ${options.config ?? ""}`,
    pathDef.quantityLabel + ":",
    ...pathDef.extraMailLines,
    "Target date (optional):",
    "Condition preference (New / Pre-owned / Refurbished / Open to options):",
    "Notes:",
  ];

  return (
    "mailto:" +
    CONTACT_EMAIL +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(bodyLines.join("\n"))
  );
}

export function skuCategoryTag(category: SkuCategory): string {
  return CATEGORY_TAG[category];
}

// ---------------------------------------------------------------------------
// 三条主路径
// ---------------------------------------------------------------------------

export type RfqPathKey = "gpu" | "system" | "sell" | "component";

export type RfqPath = {
  key: RfqPathKey;
  label: string;
  description: string;
  subjectTag: string;
  defaultSubject: string;
  /** 进入该路径的站内页面 */
  href: string;
  quantityLabel: string;
  quantityHint: string;
  /** 邮件正文里在该路径下追加的行 */
  extraMailLines: string[];
  /** 整机路径才有：区分整机数量与每台显卡数量 */
  cardCount?: { label: string; hint: string };
};

export const RFQ_PATHS: Record<RfqPathKey, RfqPath> = {
  gpu: {
    key: "gpu",
    label: "Buy GPUs",
    description: "Single cards and SXM modules, in volume.",
    subjectTag: RFQ_SUBJECT_TAG,
    defaultSubject: "bulk quote request",
    href: "/buy",
    quantityLabel: "Quantity (units)",
    quantityHint: "How many accelerators you need.",
    extraMailLines: [],
  },
  system: {
    key: "system",
    label: "Buy a complete system",
    description: "Servers, workstations and gaming builds, configured per order.",
    subjectTag: SYSTEMS_RFQ_SUBJECT_TAG,
    defaultSubject: "systems enquiry",
    href: "/systems",
    quantityLabel: "Quantity (systems)",
    quantityHint: "How many complete systems you need.",
    extraMailLines: [
      "Workload / use case:",
      "Existing BOM or parts list (paste, or attach when we reply):",
    ],
    cardCount: {
      label: "Cards per system (if known)",
      hint: "Separate from the number of systems.",
    },
  },
  component: {
    key: "component",
    label: "Buy storage or networking",
    description: "Storage tiers and switching/fabric, matched to the compute.",
    subjectTag: SYSTEMS_RFQ_SUBJECT_TAG,
    defaultSubject: "storage and networking enquiry",
    href: "/systems/storage-networking",
    quantityLabel: "Quantity (units)",
    quantityHint: "How many units you need.",
    extraMailLines: ["Redundancy or availability requirement:"],
  },
  sell: {
    key: "sell",
    label: "Sell a GPU lot",
    description: "Graded accelerators, 20+ units per lot.",
    subjectTag: SELL_RFQ_SUBJECT_TAG,
    defaultSubject: "lot submission",
    href: "/purchasing",
    quantityLabel: "Lot size (units)",
    quantityHint: "How many units are in the lot.",
    extraMailLines: [
      "Condition / grade:",
      "Current location of the goods:",
      "Test or grading documentation available:",
    ],
  },
};

export const RFQ_PATH_ORDER: RfqPathKey[] = ["gpu", "system", "component", "sell"];

// ---------------------------------------------------------------------------
// 表单字段口径 —— 必填 vs 选填
// ---------------------------------------------------------------------------

export type RfqFieldKey =
  | "requirement"
  | "sku"
  | "config"
  | "quantity"
  | "cardsPerSystem"
  | "destination"
  | "email"
  | "company"
  | "targetDate"
  | "condition"
  | "notes"
  | "path";

export type RfqField = {
  key: RfqFieldKey;
  label: string;
  required: boolean;
  type: "text" | "email" | "number" | "select" | "textarea";
  hint?: string;
  placeholder?: string;
  options?: string[];
  maxLength: number;
};

/**
 * 表单字段分两组（2026-11 改版）：
 *
 *   `RFQ_CORE_FIELDS` —— **默认就显示**的五项。第一次询价只需要这些。
 *   `RFQ_EXTRA_FIELDS` —— 收在「补充信息（选填）」折叠区里。展开才有，
 *     避免第一屏吓退客户，同时保留采购方真正需要的字段。
 *
 * `sku` 不在这两组里：它是**隐藏上下文**，由产品页或详情页带入，
 * 不作为可填写字段暴露给客户（客户不认识内部编号，填错反而污染记录）。
 */
export const RFQ_CORE_FIELDS: RfqField[] = [
  {
    key: "path",
    label: "What do you need?",
    required: true,
    type: "select",
    options: RFQ_PATH_ORDER.map((k) => RFQ_PATHS[k].label),
    maxLength: 60,
  },
  {
    key: "requirement",
    label: "Product or requirement",
    required: true,
    type: "text",
    placeholder: "e.g. H100 SXM, or 8-card training server",
    hint: "Model, configuration, or the requirement itself if you are still scoping it.",
    maxLength: 300,
  },
  {
    key: "quantity",
    label: "Quantity",
    required: true,
    type: "number",
    maxLength: 9,
  },
  {
    key: "destination",
    label: "Delivery country / city",
    required: true,
    type: "text",
    placeholder: "e.g. Malaysia, Kuala Lumpur",
    maxLength: 120,
  },
  {
    key: "email",
    label: "Your email",
    required: true,
    type: "email",
    placeholder: "you@company.com",
    maxLength: 160,
  },
];

export const RFQ_EXTRA_FIELDS: RfqField[] = [
  { key: "company", label: "Company", required: false, type: "text", maxLength: 160 },
  {
    key: "targetDate",
    label: "Target date",
    required: false,
    type: "text",
    placeholder: "e.g. Q1 2027 or 6 weeks",
    maxLength: 60,
  },
  {
    key: "condition",
    label: "Condition preference",
    required: false,
    type: "select",
    options: ["Open to options", "New", "Pre-owned", "Refurbished", "ITAD / certified pre-owned"],
    maxLength: 40,
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    type: "textarea",
    placeholder: "Existing BOM, constraints, warranty or compliance requirements",
    maxLength: 2000,
  },
];

/**
 * 整机专用字段：只在「购买整机」路径下出现。
 * 单卡和出售批次问「每系统卡数」没有意义，问了只会让客户犹豫。
 */
export const RFQ_SYSTEM_ONLY_FIELDS: RfqField[] = [
  {
    key: "cardsPerSystem",
    label: "Cards per system",
    required: false,
    type: "text",
    placeholder: "e.g. 4",
    hint: "Optional, and separate from the number of systems.",
    maxLength: 60,
  },
];

/** 全部字段（校验、服务端引用、回吐渲染都用这一份）。 */
export const RFQ_FIELDS: RfqField[] = [
  ...RFQ_CORE_FIELDS,
  ...RFQ_SYSTEM_ONLY_FIELDS,
  ...RFQ_EXTRA_FIELDS,
];

export const REQUIRED_RFQ_FIELDS = RFQ_FIELDS.filter((f) => f.required).map((f) => f.key);

export const CONDITION_OPTIONS = RFQ_EXTRA_FIELDS.find((f) => f.key === "condition")!.options!;

/**
 * 按需求类型决定哪些字段出现。返回的 key 集合之外的字段不渲染。
 */
export function fieldsForPath(pathLabel: string): Set<RfqFieldKey> {
  const keys = new Set<RfqFieldKey>([
    ...RFQ_CORE_FIELDS.map((f) => f.key),
    ...RFQ_EXTRA_FIELDS.map((f) => f.key),
  ]);
  if (pathLabel === RFQ_PATHS.system.label) {
    for (const f of RFQ_SYSTEM_ONLY_FIELDS) keys.add(f.key);
  }
  return keys;
}

/** 数量字段的提示语随需求类型变化，用词要贴合客户在买什么。 */
export function quantityLabelForPath(pathLabel: string): string {
  if (pathLabel === RFQ_PATHS.system.label) return RFQ_PATHS.system.quantityLabel;
  if (pathLabel === RFQ_PATHS.component.label) return RFQ_PATHS.component.quantityLabel;
  if (pathLabel === RFQ_PATHS.sell.label) return RFQ_PATHS.sell.quantityLabel;
  return RFQ_PATHS.gpu.quantityLabel;
}

/** GPU / 整机 / 存储网络的公开交易口径（方案 §7.1 改写为面向买家的陈述）。 */
export type Term = { label: string; value: string };

export const BUYER_TERMS: Term[] = [
  {
    label: "Pricing",
    value: "Quotation based. Prices are quoted for your quantity and condition.",
  },
  {
    label: "Quantity and price",
    value: "Priced by quantity. No site-wide discount tiers are published.",
  },
  { label: "Minimum order", value: "Confirmed per model and lot." },
  { label: "First response", value: BUYER_RESPONSE_COMMITMENT },
  {
    label: "Formal quotation",
    value: "Issued after supply, version, destination and trade terms are verified.",
  },
  { label: "Quote validity", value: "Stated in the quotation. Not a fixed site-wide period." },
  {
    label: "Stock hold",
    value: "Holding stock requires written confirmation. Submitting an RFQ does not reserve it.",
  },
  {
    label: "Payment",
    value: "T/T or another confirmed method. Deposit and balance are agreed per order.",
  },
  {
    label: "Delivery terms",
    value:
      "Confirmed in the quotation. DAP or DDP is used only when it matches the actual arrangement.",
  },
  {
    label: "Lead time",
    value: "We state whether it is stock, dispatch or an estimated arrival, and what it runs from.",
  },
  { label: "Warranty and DOA", value: "Agreed per condition, product and lot." },
  {
    label: "RMA",
    value:
      "The contact, the required materials, the steps and the freight responsibility are stated per order.",
  },
  {
    label: "Trade documents",
    value:
      "Invoice, test, end-user or other documents are confirmed per product, use and destination.",
  },
];

export const RFQ_PRICING_TERMS = BUYER_TERMS.slice(0, 7);
export const RFQ_FULFILMENT_TERMS = BUYER_TERMS.slice(7);

/** 买家四步流程 */
export type FlowStep = { title: string; body: string };

export const BUYER_FLOW: FlowStep[] = [
  {
    title: "Submit RFQ",
    body: "Send the model, the quantity you need and the delivery destination.",
  },
  {
    title: "Confirm supply and quote",
    body: "We confirm the available supply route, the exact version and the quotation terms.",
  },
  {
    title: "Agree terms and payment",
    body: "Delivery terms, payment method and the deposit and balance split are agreed per order.",
  },
  {
    title: "Dispatch and delivery",
    body: "Dispatch and delivery follow the terms confirmed in writing for that order.",
  },
];

export type FaqItem = { question: string; answer: string };

export const BUYER_FAQ: FaqItem[] = [
  {
    question: "What is the minimum order quantity?",
    answer:
      "MOQ is confirmed per model and lot. If you are not sure of your quantity yet, submit the quantity you need and we will confirm.",
  },
  {
    question: "Are these units in stock or sourced on request?",
    answer:
      "Supply status is held per model, not as one site-wide stock label. Where a lot is confirmed we say so and show the check date; otherwise a model is sourced on request or its availability is confirmed on enquiry.",
  },
  {
    question: "How do I get a bulk quote?",
    answer:
      "Send the model, the quantity and the delivery destination. Use the RFQ form on this site, or email the same three details to " +
      CONTACT_EMAIL +
      ".",
  },
  {
    question: "Can you deliver to my country?",
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
      "Warranty and DOA responsibility are agreed per product, condition and lot, and stated in the quotation. They are not applied as one site-wide term.",
  },
  {
    question: "Can I place a trial order or request staged delivery?",
    answer:
      "You can ask. Whether we accept, and on what terms, is confirmed against actual supply and purchasing conditions.",
  },
  {
    question: "How long is a quote valid, and can stock be reserved?",
    answer:
      "Validity is written into each quotation rather than a fixed period. Submitting an RFQ does not reserve stock; holding stock requires written confirmation.",
  },
];

// ---------------------------------------------------------------------------
// 服务端 / 客户端共用校验
// ---------------------------------------------------------------------------

export type RfqSubmission = {
  path: string;
  requirement: string;
  sku: string;
  config: string;
  quantity: string;
  cardsPerSystem: string;
  destination: string;
  email: string;
  company: string;
  targetDate: string;
  condition: string;
  notes: string;
  /** 反垃圾：真实用户看不到这个字段 */
  website: string;
};

export type RfqFieldError = { field: RfqFieldKey; message: string };
export type RfqErrors = { field: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * 校验一条询价提交。**服务端与客户端共用同一份规则**，避免两边判定不一致。
 * 任一字段出错时返回全部错误，页面据此提示并保留已填内容。
 */
export function validateRfq(input: Partial<Record<string, string>>): RfqErrors[] {
  const errors: RfqErrors[] = [];
  const value = (k: string) => (input[k] ?? "").trim();

  if (!value("path")) errors.push({ field: "path", message: "Choose what you need." });
  else if (!RFQ_PATH_ORDER.some((k) => RFQ_PATHS[k].label === value("path")))
    errors.push({ field: "path", message: "Choose one of the listed requirement types." });

  if (!value("requirement"))
    errors.push({ field: "requirement", message: "Tell us the product or the requirement." });
  else if (value("requirement").length > 300)
    errors.push({ field: "requirement", message: "Keep this under 300 characters." });

  const qty = value("quantity");
  if (!qty) errors.push({ field: "quantity", message: "Enter a quantity." });
  else if (!/^\d{1,9}$/.test(qty) || Number(qty) < 1)
    errors.push({ field: "quantity", message: "Enter a whole number of 1 or more." });

  if (!value("destination"))
    errors.push({ field: "destination", message: "Enter the delivery country or city." });

  const email = value("email");
  if (!email) errors.push({ field: "email", message: "Enter your email so we can reply." });
  else if (!EMAIL_RE.test(email) || email.length > 160)
    errors.push({ field: "email", message: "That email address does not look complete." });

  if (value("notes").length > 2000)
    errors.push({ field: "notes", message: "Keep notes under 2,000 characters." });

  // 反垃圾蜜罐：填了就直接判定为机器人（返回一个通用错误，不暴露蜜罐）
  if (value("website"))
    errors.push({
      field: "website",
      message: "Submission rejected. Please use the email address below.",
    });

  return errors;
}

/** 把提交内容整理成可发送的邮件正文。 */
export function rfqEmailBody(
  input: Partial<Record<string, string>>,
  meta: { receivedAt: string; source?: string },
): string {
  const rows: [string, string][] = [
    ["Requirement type", input.path ?? ""],
    ["Product or requirement", input.requirement ?? ""],
    ["SKU", input.sku ?? ""],
    ["Version / configuration", input.config ?? ""],
    ["Quantity", input.quantity ?? ""],
    ["Cards per system", input.cardsPerSystem ?? ""],
    ["Delivery country / city", input.destination ?? ""],
    ["Reply to", input.email ?? ""],
    ["Company", input.company ?? ""],
    ["Target date", input.targetDate ?? ""],
    ["Condition preference", input.condition ?? ""],
    ["Submitted from", meta.source ?? ""],
    ["Received", meta.receivedAt],
    ["Notes", input.notes ?? ""],
  ];
  return rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function rfqEmailSubject(input: Partial<Record<string, string>>): string {
  const label = input.path ?? "Enquiry";
  const sku = (input.sku ?? "").trim();
  const short = (input.requirement ?? "").trim().slice(0, 60);
  return `${RFQ_SUBJECT_TAG} ${label}${sku ? ` · ${sku}` : ""}${short ? ` · ${short}` : ""}`;
}

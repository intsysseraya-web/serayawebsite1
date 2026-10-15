/**
 * 买家采购流程与公开口径（《Seraya 网站方案 v3.0》§4.3/§4.5/§7.1）
 *
 * 全部文案来自方案已确认口径，实施时不得改写为更强的承诺。三条硬边界：
 *
 * 1. §7.1「买家首次回复」：沿用现有「完整 RFQ 一个工作日内回复」口径。
 *    自动收件确认不等于人工报价。
 * 2. §7.2：**卖家的 12 小时 committed lot decision 属于收购业务口径，
 *    不得扩展到买家报价，也不得出现在采购页。** 本文件刻意不含该项。
 * 3. §4.5：FAQ 答案以业务确认的信息为准；无依据时不承诺统一期限、
 *    统一保修年限或固定折扣率。
 */

/** §8.4 已确认的对外邮箱 */
export const CONTACT_EMAIL = "felix.mm@seraya.systems";

/** §8.1 邮件主题需带类型标记，便于分流 */
export const BUYER_RFQ_SUBJECT_TAG = "[Buyer RFQ]";

/** §7.1 买家首次回复口径（原文） */
export const BUYER_RESPONSE_COMMITMENT = "We respond to complete RFQs within one business day.";

export type FlowStep = { title: string; body: string };

/** §4.3 第 7 项：买家四步流程（英文原文照抄，不另行改写） */
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

export type Term = { label: string; value: string };

/**
 * §7.1 统一口径，改写为面向买家的陈述。
 * 每一条都能追溯到方案原文；未列出的条款不补。
 */
export const BUYER_TERMS: Term[] = [
  { label: "Pricing", value: "Quotation based. Prices are quoted for your quantity and condition." },
  { label: "Quantity and price", value: "Priced by quantity. No site-wide discount tiers are published." },
  { label: "Minimum order", value: "Confirmed per model and lot." },
  { label: "First response", value: "We respond to complete RFQs within one business day." },
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
    value: "Confirmed in the quotation. DAP or DDP is used only when it matches the actual arrangement.",
  },
  {
    label: "Lead time",
    value: "We state whether it is stock, dispatch or an estimated arrival, and what it runs from.",
  },
  { label: "Warranty and DOA", value: "Agreed per condition, product and lot." },
  {
    label: "RMA",
    value: "The contact, the required materials, the steps and the freight responsibility are stated per order.",
  },
  {
    label: "Trade documents",
    value: "Invoice, test, end-user or other documents are confirmed per product, use and destination.",
  },
];

export type FaqItem = { question: string; answer: string };

/** §4.5 第一期必须具备的八项买家 FAQ，逐条对应原文答案要点 */
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
      "Send the model, the quantity and the delivery destination. You can use the RFQ link on this page or email the same three details to " +
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

/**
 * §8.1：表单旁必须提供邮箱替代入口，主题带 [Buyer RFQ]，并带入用户主动选择的型号。
 * 第一期为纯邮件入口 —— 方案 §4.3 第 3 项允许「RFQ 入口或短表单」，
 * 而带服务端校验、持久化与通知重试的表单属 §8.3 工作包 W3，需要已确认的收件服务。
 */
export function rfqMailto(modelName?: string): string {
  const subject = modelName
    ? `${BUYER_RFQ_SUBJECT_TAG} ${modelName}`
    : `${BUYER_RFQ_SUBJECT_TAG} bulk quote request`;

  const bodyLines = [
    "Company:",
    "Contact name (optional):",
    "Email:",
    "Delivery country:",
    `Model / configuration: ${modelName ?? ""}`,
    "Quantity:",
    "Condition preference (New / Pre-owned / Refurbished / Open to options):",
    "Target delivery date (optional):",
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

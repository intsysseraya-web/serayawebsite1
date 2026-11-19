import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, CONTACT_EMAIL } from "../lib/site-chrome";

/**
 * Thank You 页（2026-11-19 新增）。
 *
 * 两条提交路径都落到这里，URL 不同、可刷新、可分享：
 *   - JS 分支：`script.js` 收到 `ok:true` 后 `location.assign()` 到这里
 *   - no-JS 分支：`/api/rfq` 返回 **303**，浏览器以 GET 打开本页（刷新不会重复提交）
 *
 * 参数：
 *   - `ref`  服务端生成的引用号（`SRY-RFQ-YYYYMMDD-XXXX`），用于双方对齐同一笔询价
 *   - `path` 需求类型（gpu / system / component / sell / other），决定文案
 *
 * 安全：两个参数都来自 URL，必须白名单校验后才进 HTML。`ref` 只接受大写字母、
 * 数字和连字符，长度 6–40；`path` 只接受固定枚举。这样不依赖转义也不会被注入。
 *
 * 索引：`noindex, nofollow` —— 这是交易完成后的确认页，不该进搜索结果。
 */

const REF_PATTERN = /^[A-Z0-9-]{6,40}$/;

const THANK_YOU_PATHS = ["gpu", "system", "sovereignty", "component", "sell", "other"] as const;
type ThankYouPath = (typeof THANK_YOU_PATHS)[number];

type Copy = { eyebrow: string; title: string; lead: string; next: { title: string; body: string }[] };

const COPY: Record<ThankYouPath, Copy> = {
  gpu: {
    eyebrow: "Enquiry received",
    title: "We have your GPU enquiry.",
    lead: "Your requirement is with our desk. A person reads it and replies from a named address — not an automated acknowledgement.",
    next: [
      {
        title: "We check it",
        body: "The model, the version and the quantity go against supply we can actually commit to.",
      },
      {
        title: "You get a reply",
        body: "One written reply with availability and quotation terms.",
      },
      {
        title: "Add attachments",
        body: "Reply to that email — this form does not accept uploads.",
      },
    ],
  },
  system: {
    eyebrow: "Enquiry received",
    title: "We have your system enquiry.",
    lead: "Your configuration is with our desk. A person reads it and replies from a named address.",
    next: [
      {
        title: "We read the spec",
        body: "Accelerator count, chassis and power envelope are checked against what can actually be built.",
      },
      {
        title: "You get a reply",
        body: "One written reply with the configuration and quotation terms.",
      },
      {
        title: "Send the BOM",
        body: "Reply to that email with a parts list or drawings.",
      },
    ],
  },
  sovereignty: {
    eyebrow: "Enquiry received",
    title: "We have your AI sovereignty enquiry.",
    lead: "Your boundary requirements are with our desk. A person reads them and replies from a named address.",
    next: [
      {
        title: "We scope the boundary",
        body: "Placement, data location and who needs access — written down before anything is built.",
      },
      {
        title: "You get a reply",
        body: "One written reply with the proposed deployment and terms.",
      },
      {
        title: "Send the constraints",
        body: "Reply with any policy, residency or security requirements you already have.",
      },
    ],
  },
  component: {
    eyebrow: "Enquiry received",
    title: "We have your storage and networking enquiry.",
    lead: "Your requirement is with our desk. A person reads it and replies from a named address.",
    next: [
      {
        title: "We check the fit",
        body: "Capacity, tier and fabric are matched to the compute they have to serve.",
      },
      {
        title: "You get a reply",
        body: "One written reply with the matched configuration and quotation terms.",
      },
      {
        title: "Send inventory notes",
        body: "Reply to that email with existing inventory or design notes.",
      },
    ],
  },
  sell: {
    eyebrow: "Lot submitted",
    title: "We have your lot list.",
    lead: "Committed decision within 12 business hours of a complete lot list, inside our business hours (Kuala Lumpur, UTC+8, Monday to Friday).",
    next: [
      {
        title: "We check the lot",
        body: "The lot goes against demand we can fund and place.",
      },
      {
        title: "One written price",
        body: "Per lot, with the payment route stated — no renegotiation after commitment.",
      },
      {
        title: "Add documents",
        body: "Reply to the confirmation email with test reports, serial lists or photos.",
      },
    ],
  },
  other: {
    eyebrow: "Message received",
    title: "We have your message.",
    lead: "Your enquiry is with our desk. A person reads it and replies from a named address.",
    next: [
      {
        title: "We route it",
        body: "To the right line — GPU supply, systems, purchasing or after-sales.",
      },
      {
        title: "You get a reply",
        body: "One written reply with the next step.",
      },
      {
        title: "Add attachments",
        body: "Reply to that email — the form does not accept uploads.",
      },
    ],
  },
};

function normalizeRef(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  return REF_PATTERN.test(raw) ? raw : "";
}

function normalizePath(value: unknown): ThankYouPath {
  return typeof value === "string" && (THANK_YOU_PATHS as readonly string[]).includes(value)
    ? (value as ThankYouPath)
    : "other";
}

function bodyHtml(ref: string, path: ThankYouPath): string {
  const copy = COPY[path];
  const refLine = ref
    ? `        <p class="muted thank-you-ref">Reference <code>${ref}</code> &mdash; quote it in any follow-up.</p>`
    : "";

  return `
${skipLink()}
${siteChrome("home", "H100, RTX PRO 6000, storage...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">${copy.eyebrow}</span>
        <h1>${copy.title}</h1>
        <p class="muted catalog-lede">${copy.lead}</p>
${refLine}
        <div class="btn-row">
          <button type="button" class="btn btn-primary" data-history-back>Back</button>
          <a class="btn btn-ghost" href="/">Home</a>
        </div>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-labelledby="thank-you-next-title">
        <div class="section-head">
          <h2 id="thank-you-next-title">What happens next</h2>
          <p class="muted">Three steps, no queue ticket and no chatbot.</p>
        </div>
        <ol class="program-flow program-flow--3">
${copy.next
  .map((step, i) => `          <li><span>0${i + 1}</span><h3>${step.title}</h3><p>${step.body}</p></li>`)
  .join("\n")}
        </ol>
      </section>

      <section class="section" aria-labelledby="thank-you-contact-title">
        <div class="section-head">
          <h2 id="thank-you-contact-title">Need to add something now?</h2>
          <p class="muted">
            Reply to the confirmation email${ref ? " quoting the reference above" : ""}, or write to
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.
          </p>
        </div>
        <p class="muted catalog-note">
          Nothing was charged and no order was created by submitting the form &mdash; this is an
          enquiry, and the written reply is what carries the terms.
        </p>
      </section>
    </main>

${siteFooter()}
  `;
}

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>): { ref: string; path: ThankYouPath } => ({
    ref: normalizeRef(search.ref),
    path: normalizePath(search.path),
  }),
  head: () => ({
    meta: [
      { title: "Thank you | Seraya System Integration" },
      {
        name: "description",
        content: "Your enquiry has been received. We reply to complete enquiries within one business day.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
      { rel: "stylesheet", href: fixesCss },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { ref, path } = Route.useSearch();
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml(ref, path) }} />;
}

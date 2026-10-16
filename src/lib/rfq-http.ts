/**
 * `/api/rfq` 的 HTTP 处理 —— 挂在 SSR 入口（`src/server.ts`）最前面。
 *
 * 为什么放在入口而不是 createServerFn：
 *   1. 普通 HTML form POST 就能提交，**JS 未执行也能用**（渐进增强的真实通路）。
 *   2. 前端 fetch 的路径与 no-JS 路径完全一致，不存在「只在好天气下成立」的分支。
 *
 * 返回两条形态，内容与判定完全同源：
 *   - `Accept: application/json`  → JSON（前端 fetch 分支用）
 *   - 其他                        → 完整 HTML 页面（no-JS 分支用；失败时回吐已填字段）
 */

import { renderRfqForm, renderRfqSuccess, renderRfqUnavailable, escapeHtml } from "./rfq-form";
import { submitRfq, type RfqSubmissionResult } from "./rfq.server";
import { CONTACT_EMAIL } from "./rfq";

const NO_JS_STYLES = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #050508; color: #e4e4e7;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 16px; line-height: 1.55; }
    a { color: #e4e4e7; }
    .wrap { max-width: 44rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
    .wrap > h1 { font-size: 1.6rem; margin: 0 0 0.5rem; }
    .muted { color: #a1a1aa; }
    .rfq-form { margin-top: 1.5rem; }
    .rfq-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .rfq-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .rfq-field > label { font-size: 0.86rem; font-weight: 600; }
    .rfq-input { width: 100%; padding: 0.6rem 0.7rem; border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.18); background: #12121c; color: inherit;
      font: inherit; min-height: 44px; }
    .rfq-textarea { min-height: 7rem; }
    .rfq-hint { margin: 0; font-size: 0.78rem; color: #a1a1aa; }
    .rfq-optional { font-weight: 400; font-size: 0.72rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.06em; }
    .rfq-required { color: #f87171; }
    .has-error .rfq-input { border-color: #f87171; }
    .rfq-error { margin: 0; font-size: 0.8rem; color: #fca5a5; }
    .rfq-errors { margin: 1rem 0; padding: 0.9rem 1rem; border: 1px solid #f87171; border-radius: 6px; background: rgba(248,113,113,0.08); }
    .rfq-errors h3 { margin: 0 0 0.4rem; font-size: 1rem; }
    .rfq-errors ul { margin: 0; padding-left: 1.1rem; }
    .rfq-honeypot { position: absolute; left: -9999px; }
    .btn { display: inline-flex; align-items: center; justify-content: center;
      min-height: 44px; padding: 0 1.1rem; border-radius: 6px; border: 1px solid #e4e4e7;
      background: #e4e4e7; color: #050508; font-weight: 600; cursor: pointer; font: inherit; }
    .rfq-submit-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 1.25rem; }
    .rfq-submit-note, .rfq-alt { font-size: 0.82rem; }
    .rfq-success, .rfq-error-panel { margin-top: 1.5rem; padding: 1rem 1.1rem; border-radius: 6px; }
    .rfq-success { border: 1px solid rgba(92,200,255,0.5); background: rgba(92,200,255,0.08); }
    .rfq-error-panel { border: 1px solid #f87171; background: rgba(248,113,113,0.08); }
    .rfq-success h3, .rfq-error-panel h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
    code { background: rgba(255,255,255,0.08); padding: 0.1rem 0.3rem; border-radius: 4px; }
`;

function htmlDocument(title: string, inner: string, status: number): Response {
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(title)} | Seraya System Integration</title>
    <style>${NO_JS_STYLES}</style>
  </head>
  <body>
    <div class="wrap">
      <p><a href="/">&larr; Seraya System Integration</a></p>
${inner}
    </div>
  </body>
</html>`;
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  const requestedWith = request.headers.get("x-requested-with") ?? "";
  return accept.includes("application/json") || requestedWith.toLowerCase() === "fetch";
}

async function readSubmission(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return (await request.json()) as Record<string, string>;
    }
    const form = await request.formData();
    const out: Record<string, string> = {};
    for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
    return out;
  } catch {
    return {};
  }
}

const FORM_FIELD_KEYS = [
  "path",
  "requirement",
  "sku",
  "config",
  "quantity",
  "cardsPerSystem",
  "destination",
  "email",
  "company",
  "targetDate",
  "condition",
  "notes",
  "source",
] as const;

function prefillFrom(input: Record<string, string>) {
  const prefill: Record<string, string> = {};
  for (const k of FORM_FIELD_KEYS) if (input[k]) prefill[k] = input[k];
  return prefill;
}

export async function handleRfqRequest(request: Request, url: URL): Promise<Response> {
  if (request.method !== "POST") {
    return wantsJson(request)
      ? Response.json({ ok: false, message: "Use POST to submit an RFQ." }, { status: 405 })
      : htmlDocument(
          "RFQ",
          `<h1>Submit an RFQ</h1>
      <p class="muted">This endpoint accepts a form POST. Open the form on the
      <a href="/contact">Contact page</a>, or email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`,
          405,
        );
  }

  const input = await readSubmission(request);
  const clientKey =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const result: RfqSubmissionResult = await submitRfq(input, {
    source: input.source || url.searchParams.get("from") || "",
    clientKey,
  });

  if (wantsJson(request)) {
    return Response.json(
      {
        ok: result.ok,
        reference: result.reference,
        errors: result.errors,
        message: result.message,
      },
      { status: result.httpStatus, headers: { "cache-control": "no-store" } },
    );
  }

  // no-JS HTML 分支
  if (result.ok) {
    return htmlDocument(
      `RFQ received — ${result.reference}`,
      `<h1>RFQ received</h1>
${renderRfqSuccess(result.reference, false)}
      <p class="muted">Need to add attachments? Reply to
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> quoting the reference.</p>`,
      200,
    );
  }

  const heading =
    result.httpStatus === 503 ? "Online submission unavailable" : "We could not send that yet";

  return htmlDocument(
    heading,
    `<h1>${heading}</h1>
      <p class="muted">${escapeHtml(result.message)}</p>
${result.httpStatus === 503 ? renderRfqUnavailable() : ""}
      <p class="muted">Your entries are kept below &mdash; nothing was lost.</p>
${renderRfqForm(prefillFrom(input) as never, { errors: result.errors, formId: "rfq-form" })}`,
    result.httpStatus,
  );
}

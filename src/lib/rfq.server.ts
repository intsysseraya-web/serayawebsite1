/**
 * 询价提交的服务端处理（站内询价的唯一成功/失败判定点）。
 *
 * 投递通道（按顺序取第一个已配置的）：
 *   1. `RFQ_WEBHOOK_URL`  —— POST JSON 到外部收件服务（表单服务、自动化平台、Slack/Teams 入站等）
 *   2. `RESEND_API_KEY`   —— 通过 Resend 发邮件到 `RFQ_MAIL_TO`（默认 CONTACT_EMAIL）
 *
 * 若两者都没有配置，本模块**不会假装成功**：返回 503 与真实原因，
 * 页面显示「在线提交暂不可用，请改用邮箱」，并给出邮箱地址。
 *
 * 这是刻意选择的失败模式：宁可明确报告未接通，也不做前端模拟成功。
 */

import { CONTACT_EMAIL, rfqEmailBody, rfqEmailSubject, validateRfq } from "./rfq";

export type RfqDeliveryResult =
  | { status: "delivered"; reference: string; channel: string }
  | { status: "not-configured"; reference: string; message: string }
  | { status: "failed"; reference: string; message: string };

/** 环境变量读取一律放在函数内：Cloudflare Workers 的 env 只在请求期绑定。 */
function readEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  const value = env?.[name];
  return value && value.trim() ? value.trim() : undefined;
}

export function rfqDeliveryChannel(): "webhook" | "resend" | "none" {
  if (readEnv("RFQ_WEBHOOK_URL")) return "webhook";
  if (readEnv("RESEND_API_KEY")) return "resend";
  return "none";
}

/**
 * 简易的按来源限流。这只是抑制重复点击与最粗糙的滥用，
 * 不替代边缘层的 WAF/rate limiting —— 这一点在交付说明里明确写出。
 */
const recentSubmissions = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 6;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recentSubmissions.set(key, hits);
  if (recentSubmissions.size > 500) {
    for (const [k, v] of recentSubmissions) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) recentSubmissions.delete(k);
    }
  }
  return hits.length > RATE_MAX;
}

/** 稳定的短引用号，便于双方在邮件里对齐同一笔询价。 */
function makeReference(): string {
  const now = new Date();
  const stamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SRY-RFQ-${stamp}-${rand}`;
}

export type RfqSubmissionResult = {
  ok: boolean;
  httpStatus: number;
  reference: string;
  /** 字段级错误，页面据此回吐并保留已填内容 */
  errors: { field: string; message: string }[];
  message: string;
};

export function parseRfqBody(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
      else if (typeof v === "number") out[k] = String(v);
    }
  }
  return out;
}

async function deliverByWebhook(
  url: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, detail: `webhook ${res.status}` };
    return { ok: false, detail: `webhook returned ${res.status}` };
  } catch (error) {
    return { ok: false, detail: `webhook error: ${(error as Error).message}` };
  }
}

async function deliverByResend(
  apiKey: string,
  to: string,
  subject: string,
  body: string,
  replyTo: string,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: readEnv("RFQ_MAIL_FROM") ?? "Seraya website <onboarding@resend.dev>",
        to: [to],
        reply_to: replyTo,
        subject,
        text: body,
      }),
    });
    if (res.ok) return { ok: true, detail: `resend ${res.status}` };
    const detail = await res.text().catch(() => "");
    return { ok: false, detail: `resend returned ${res.status} ${detail.slice(0, 200)}` };
  } catch (error) {
    return { ok: false, detail: `resend error: ${(error as Error).message}` };
  }
}

export async function submitRfq(
  input: Record<string, string>,
  meta: { source?: string; clientKey?: string },
): Promise<RfqSubmissionResult> {
  const reference = makeReference();
  const errors = validateRfq(input).map((e) => ({ field: String(e.field), message: e.message }));

  if (errors.length) {
    return {
      ok: false,
      httpStatus: 422,
      reference,
      errors,
      message: "Some required details are missing or invalid. Nothing was sent yet.",
    };
  }

  if (meta.clientKey && rateLimited(meta.clientKey)) {
    return {
      ok: false,
      httpStatus: 429,
      reference,
      errors: [
        {
          field: "form",
          message: `Too many submissions from this connection. Please wait a few minutes, or email ${CONTACT_EMAIL}.`,
        },
      ],
      message: "Too many submissions from this connection.",
    };
  }

  const receivedAt = new Date().toISOString();
  const subject = rfqEmailSubject(input);
  const body = rfqEmailBody(input, { receivedAt, source: meta.source });
  const channel = rfqDeliveryChannel();

  if (channel === "none") {
    // 关键：未配置凭据时绝不返回成功。
    console.warn(`[rfq] no delivery channel configured; submission ${reference} was NOT sent`);
    return {
      ok: false,
      httpStatus: 503,
      reference,
      errors: [],
      message:
        "Online submission is not configured on the server, so nothing was sent. Please email the same details instead.",
    };
  }

  const payload = {
    reference,
    receivedAt,
    source: meta.source ?? "",
    subject,
    body,
    fields: input,
  };

  const result =
    channel === "webhook"
      ? await deliverByWebhook(readEnv("RFQ_WEBHOOK_URL")!, payload)
      : await deliverByResend(
          readEnv("RESEND_API_KEY")!,
          readEnv("RFQ_MAIL_TO") ?? CONTACT_EMAIL,
          subject,
          body,
          input.email || CONTACT_EMAIL,
        );

  if (!result.ok) {
    console.error(`[rfq] delivery failed for ${reference}: ${result.detail}`);
    return {
      ok: false,
      httpStatus: 502,
      reference,
      errors: [],
      message: `Delivery failed (${result.detail}). Please email ${CONTACT_EMAIL} instead.`,
    };
  }

  console.log(`[rfq] delivered ${reference} via ${result.detail}`);
  return { ok: true, httpStatus: 200, reference, errors: [], message: "RFQ received." };
}

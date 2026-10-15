import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// ---------------------------------------------------------------------------
// 旧 URL -> 新 URL 的 301 迁移（《SERAYA 网站改版方案 v1.0》§2 URL 迁移表）
//
// 为什么写在应用里，而不是只靠 public/_redirects：
//   构建产物 _routes.json 的 include 是 ["/*"]，意味着**所有请求先进 Worker**。
//   而 _redirects / _headers 是 Cloudflare 静态资源层的特性，只对未进入 Worker 的
//   路径生效。2026-10-12 线上实测：/works、/case-study、/about 全部返回 404 而非 301，
//   即 _redirects 从未被求值。
//   放在 SSR 入口里则与托管方式无关，且在本地 dev server 上可实测。
//
// 注意：HTTP 301 看不到 URL fragment。`/about#contact` 由浏览器保留 fragment 变为
//   `/company#contact`，因此 /company 上保留了 id="contact" 作为承接锚点。
// ---------------------------------------------------------------------------
const LEGACY_REDIRECTS: Record<string, string> = {
  "/works": "/systems",
  "/case-study": "/programs",
  "/about": "/company",
};

// ---------------------------------------------------------------------------
// 安全头（方案 §6 P2-17）
//
// public/_headers 已对**静态资源**生效（线上实测 /legacy/styles.css 与 /robots.txt
// 均带 HSTS / nosniff / Referrer-Policy / X-Frame-Options）。
// 但 HTML 是 Worker 渲染的响应，不经过静态资源层，因此拿不到 _headers 里的头 ——
// 这里补上这一段缺口。已存在同名头的响应不覆盖。
// ---------------------------------------------------------------------------
const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "geolocation=(), microphone=(), camera=()",
};

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function withHtmlSecurityHeaders(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const headers = new Headers(response.headers);
  let added = false;
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value);
      added = true;
    }
  }
  if (!added) return response;

  // 重新包装响应体时必须丢弃 content-length，否则可能与实际字节数不符。
  headers.delete("content-length");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    // 去掉末尾斜杠后再比对，使 /works/ 与 /works 行为一致。
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    const redirectTo = LEGACY_REDIRECTS[pathname];
    if (redirectTo) {
      return new Response(null, {
        status: 301,
        headers: { location: redirectTo + url.search, ...SECURITY_HEADERS },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await withHtmlSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8", ...SECURITY_HEADERS },
      });
    }
  },
};

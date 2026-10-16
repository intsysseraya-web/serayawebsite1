import { createFileRoute, notFound } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { familiesWithVersions } from "../data/gpu-catalog";
import { renderModelDetail, resolveDetailState } from "../lib/model-detail";

/**
 * RTX PRO 6000 Blackwell 产品详情页 —— 数据驱动的详情页模板的第一例。
 *
 * 路由与状态：
 *   - 路径 `/buy/rtx-pro-6000-blackwell`
 *   - 版本用**真实查询参数** `?version=<sku>`；「需要协助选型」用 `?assist=1`
 *   - 用 TanStack Router 的 `validateSearch` 声明参数类型（项目既有路由方式），
 *     而不是自建客户端状态：因此直接链接、刷新、返回、新标签页全部有效
 *   - 未指定版本时**不预设任何版本**（`resolveDetailState` 返回 kind: "none"），
 *     也不把数组第一项当成客户的采购需求
 *
 * 页面由 `src/lib/model-detail.ts` 渲染，七段结构固定，其他型号家族可直接复用。
 */

const ENTRY = familiesWithVersions(["professional"]).find(
  (e) => e.family.slug === "/buy/rtx-pro-6000-blackwell",
)!;

export const Route = createFileRoute("/buy_/rtx-pro-6000-blackwell")({
  validateSearch: (search: Record<string, unknown>): { version?: string; assist?: string } => ({
    version: typeof search.version === "string" ? search.version : undefined,
    assist: typeof search.assist === "string" ? search.assist : undefined,
  }),
  loader: () => {
    if (!ENTRY) throw notFound();
    return null;
  },
  head: () => ({
    meta: [
      { title: "NVIDIA RTX PRO 6000 Blackwell — Server, Workstation and Max-Q | Seraya" },
      {
        name: "description",
        content:
          "Compare the NVIDIA RTX PRO 6000 Blackwell Server Edition, Workstation Edition and Max-Q Workstation Edition: 96 GB memory, different bandwidth, power, cooling and host platform. Quoted per enquiry.",
      },
      {
        property: "og:title",
        content: "NVIDIA RTX PRO 6000 Blackwell — three editions compared | Seraya",
      },
      {
        property: "og:description",
        content:
          "Server Edition, Workstation Edition and Max-Q Workstation Edition: what changes between them, what each one fits, and how to request a quote.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/buy/rtx-pro-6000-blackwell" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
      { rel: "stylesheet", href: fixesCss },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const search = Route.useSearch();
  const state = resolveDetailState(ENTRY, search);
  /*
   * data-* 只用于验证脚本读取服务端解析出的状态（例如确认 ?version=none 真的
   * 解析成 assist，而不是又退回了默认值）。不影响视觉，也不参与样式。
   */
  return (
    <div
      data-detail-selection={JSON.stringify(state.selection)}
      dangerouslySetInnerHTML={{ __html: renderModelDetail(state) }}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { BUY_PAGES, renderBuyPage } from "../lib/buy-page";

// 采购入口：游戏卡批发（方案 v3.0 §3.1 `/buy/gaming-gpus`，承接 A2）
// 文件名中的 `buy_` 下划线是 TanStack Router 的「不嵌套」约定，
// 生成路径为 `/buy/gaming-gpus`。改成 `buy.gaming-gpus.tsx` 会变成嵌套路由而渲染不出来。
const PAGE = BUY_PAGES.gaming;
const BODY_HTML = renderBuyPage(PAGE);

export const Route = createFileRoute("/buy_/gaming-gpus")({
  head: () => ({
    meta: [
      { title: PAGE.title },
      { name: "description", content: PAGE.description },
      { property: "og:title", content: PAGE.title },
      { property: "og:description", content: PAGE.description },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/buy/gaming-gpus" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

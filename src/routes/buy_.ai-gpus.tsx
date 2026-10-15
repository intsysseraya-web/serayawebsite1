import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { BUY_PAGES, renderBuyPage } from "../lib/buy-page";

// 采购入口：专业与数据中心 GPU（方案 v3.0 §3.1 `/buy/ai-gpus`，承接 A3）
// 文件名中的 `buy_` 下划线是 TanStack Router 的「不嵌套」约定，生成路径为 `/buy/ai-gpus`。
const PAGE = BUY_PAGES.ai;
const BODY_HTML = renderBuyPage(PAGE);

export const Route = createFileRoute("/buy_/ai-gpus")({
  head: () => ({
    meta: [
      { title: PAGE.title },
      { name: "description", content: PAGE.description },
      { property: "og:title", content: PAGE.title },
      { property: "og:description", content: PAGE.description },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/buy/ai-gpus" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "/legacy/script.js";
    s.async = false;
    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

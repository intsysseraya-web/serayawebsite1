import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { BUY_PAGES, renderBuyPage } from "../lib/buy-page";
import { routeLinks } from "../lib/site-chrome";

// 采购入口：GPU 批发总览（方案 v3.0 §3.1 `/buy`，承接 A1 与部分 A4）
const PAGE = BUY_PAGES.overview;
const BODY_HTML = renderBuyPage(PAGE);

export const Route = createFileRoute("/buy")({
  head: () => ({
    meta: [
      { title: PAGE.title },
      { name: "description", content: PAGE.description },
      { property: "og:title", content: PAGE.title },
      { property: "og:description", content: PAGE.description },
    ],
    links: routeLinks("/buy", legacyCss, fixesCss),
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { BUY_PAGES, renderBuyPage } from "../lib/buy-page";

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
    links: [
      { rel: "canonical", href: "https://seraya.systems/buy" },
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

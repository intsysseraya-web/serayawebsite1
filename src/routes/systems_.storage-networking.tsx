import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import { SYSTEMS_LINES, renderSystemsLine } from "../lib/systems-lines";

// Systems 线页（补充方案 2026-10-16 §二）。
// 文件名中的 `systems_` 下划线是 TanStack Router 的「不嵌套」约定，生成 /systems/<key>。
const LINE = SYSTEMS_LINES.find((l) => l.key === "storage-networking")!;
const BODY_HTML = renderSystemsLine(LINE);

export const Route = createFileRoute("/systems_/storage-networking")({
  head: () => ({
    meta: [
      { title: LINE.title },
      { name: "description", content: LINE.description },
      { property: "og:title", content: LINE.title },
      { property: "og:description", content: LINE.description },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/systems/storage-networking" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

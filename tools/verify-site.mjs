/**
 * 线上检查修复项的自动化验证（内容与接口层，不含像素级布局）。
 *
 * 用法：
 *   node tools/verify-site.mjs http://localhost:8081
 *
 * 设计原则：断言针对**实际行为与可达性**，不做「复制实现逻辑」式的同义反复。
 * 例如：
 *   - 数量不是抄一遍硬编码数字，而是从渲染出的卡片元素统计后与文本里声明的数字比对
 *   - 询价按钮断言的是它携带的 URL 参数里真的有 sku/model/config
 *   - 表单断言的是服务端在未配置通道时**不返回成功**（而不是断言页面不显示成功）
 */

const BASE = process.argv[2] ?? "http://localhost:8081";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

console.log(`\n=== Seraya site verification against ${BASE} ===\n`);

// ---------------------------------------------------------------------------
console.log("[1] 路由可达性");
{
  const routes = [
    "/",
    "/buy",
    "/buy/gaming-gpus",
    "/buy/ai-gpus",
    "/systems",
    "/systems/ai-servers",
    "/systems/workstations",
    "/systems/gaming",
    "/systems/storage-networking",
    "/purchasing",
    "/company",
    "/contact",
    "/programs",
    "/local",
    "/purchasing/kyc",
    "/purchasing/compliance",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ];
  for (const route of routes) {
    const { status } = await get(route);
    check(`GET ${route} → 200`, status === 200, `got ${status}`);
  }
}

// ---------------------------------------------------------------------------
console.log("\n[2] 旧 URL 301 迁移");
{
  for (const [from, to] of [
    ["/works", "/systems"],
    ["/case-study", "/programs"],
    ["/about", "/company"],
  ]) {
    const res = await fetch(BASE + from, { redirect: "manual" });
    const location = res.headers.get("location");
    check(
      `${from} → 301 ${to}`,
      res.status === 301 && location === to,
      `got ${res.status} ${location}`,
    );
  }
}

// ---------------------------------------------------------------------------
console.log("\n[3] 固定导航：无下拉浮层、主按钮文案统一");
{
  const pages = ["/", "/buy", "/systems", "/contact", "/company", "/programs", "/purchasing"];
  for (const path of pages) {
    const { body } = await get(path);
    check(`${path} 无 nav-dropdown 浮层`, !body.includes("nav-dropdown"));
    check(`${path} 主导航含 GPU Wholesale`, body.includes(">GPU Wholesale<"));
    check(`${path} 主按钮为 Get a quote`, body.includes("Get a quote"));
    check(`${path} 页头不含旧 RFQ 按钮`, !body.includes('aria-label="Request a bulk quote"'));
  }
}

// ---------------------------------------------------------------------------
console.log("\n[4] 锚点目标存在（防跳转后落空）");
{
  const expectations = [
    ["/buy", ["request-quote", "models", "terms", "evidence"]],
    [
      "/systems",
      ["request-quote", "how-we-quote", "gpu", "storage", "networking", "workstation", "compute"],
    ],
    ["/buy/gaming-gpus", ["request-quote", "models", "gaming"]],
    ["/buy/ai-gpus", ["request-quote", "professional", "datacenter"]],
    ["/purchasing", ["sell-form", "what-we-buy"]],
    ["/systems/storage-networking", ["request-quote", "storage", "networking"]],
    ["/purchasing/compliance", ["privacy", "after-sales"]],
    ["/programs", ["request-quote"]],
    ["/local", ["book", "scope"]],
    ["/contact", ["request-quote", "routes"]],
    ["/", ["request-quote"]],
  ];
  for (const [path, ids] of expectations) {
    const { body } = await get(path);
    for (const id of ids) {
      check(`${path} 有 #${id}`, body.includes(`id="${id}"`));
    }
    // 每个页内链接的 fragment 都必须能在同一页找到目标
    const hrefs = [...body.matchAll(/href="#([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
    const missing = [...new Set(hrefs)].filter((frag) => !body.includes(`id="${frag}"`));
    check(`${path} 页内链接 fragment 全部有目标`, missing.length === 0, missing.join(", "));
  }
}

// ---------------------------------------------------------------------------
console.log("\n[5] Systems 数量与分类（线检项 C，本轮保持）");
{
  const { body } = await get("/systems");
  const cardCount = countOf(body, 'class="product-card sku-card"');
  const declared = body.match(/(\d+)\s*reference configurations/);
  const declaredNum = declared ? Number(declared[1]) : NaN;

  check("声明的 reference configurations 数字存在", Number.isFinite(declaredNum));
  check(
    `声明的数量 (${declaredNum}) 等于实际渲染的卡片数 (${cardCount})`,
    declaredNum === cardCount,
  );

  // 单卡不得再出现在整机目录卡片里
  const gpuSkus = [
    "SR-5090",
    "SR-5080",
    "SR-5070",
    "SR-5060TI-16G",
    "SR-PRO6000-SE",
    "SR-H100-SXM",
  ];
  for (const sku of gpuSkus) {
    const inCatalogCard = body.includes(`<span class="sku-code">${sku}</span>`);
    check(`/systems 不把单卡 ${sku} 当整机卡片渲染`, !inCatalogCard);
  }

  // 本轮：整机页指向 GPU 线时，必须同时给出「型号数」和「版本数」，不混用
  const gpuLink = body.match(/(\d+)\s*GPU models &middot; (\d+) versions/);
  check("页面区分 GPU 型号数与版本数", Boolean(gpuLink), gpuLink?.[0] ?? "not found");
}

// ---------------------------------------------------------------------------
console.log("\n[5b] GPU 目录：型号家族与版本关联（本轮新增）");
{
  // 期望值从数据源实时计算，不硬编码 —— 加一条产品这条断言就跟着变
  const { MODEL_FAMILIES, GPU_PRODUCTS } = await import("../src/data/gpu-catalog.ts");
  const expectedFamilies = MODEL_FAMILIES.length;
  const expectedVersions = GPU_PRODUCTS.length;

  const buy = await get("/buy");
  const familyCards = countOf(buy.body, 'class="family-card"');
  const declared = buy.body.match(/(\d+) models &middot; (\d+) versions to quote/);

  check("目录声明「N models · M versions」", Boolean(declared), declared?.[0] ?? "not found");
  check(
    `目录声明的型号家族数 (${declared?.[1]}) 等于实际家族卡数 (${familyCards})`,
    Number(declared?.[1]) === familyCards,
  );
  check(
    `型号家族数 (${familyCards}) 等于数据源 MODEL_FAMILIES.length (${expectedFamilies})`,
    familyCards === expectedFamilies,
  );
  check(`数据源版本总数 = ${expectedVersions}（本轮由 variants 拆分新增）`, expectedVersions >= 12);

  // 每个家族卡片的版本数与它的版本 chip 数一致，且 chip 指向真实目标
  const cards = buy.body.split('<article class="family-card"');
  let mismatch = 0;
  let badChip = 0;
  for (const card of cards.slice(1)) {
    const idMatch = card.match(/data-family="([^"]+)"/);
    const countMatch = card.match(/>(\d+) versions?<\/span>/);
    if (!idMatch || !countMatch) {
      mismatch++;
      continue;
    }
    const chips = [...card.matchAll(/class="version-chips"[\s\S]*?<\/ul>/g)]
      .map((m) => m[0])
      .join("");
    const chipCount = countOf(chips, "<li>");
    if (Number(countMatch[1]) !== chipCount) {
      mismatch++;
      console.log(`      (${idMatch[1]}: 声明 ${countMatch[1]} 个版本，实际 ${chipCount} 个 chip)`);
    }
    // chip 必须是站内链接或页内锚点，不能是空 href
    if (/<a href=""/.test(chips)) badChip++;
  }
  check(`每个家族声明的版本数与版本 chip 数一致（${cards.length - 1} 个家族）`, mismatch === 0);
  check("版本 chip 没有空链接", badChip === 0);

  /*
   * 版本差异有两条展示路径，都必须完整可用：
   *   - 有详情页的家族（本轮：RTX PRO 6000）→ 卡片给「Compare editions」，版本 chip 指向详情页；
   *     规格核对交给详情页断言（[5c]），不在目录里重复。
   *   - 其余家族 → 卡片就地展开版本规格，避免链接到不存在的页面。
   */
  check(
    "RTX PRO 6000 家族卡给出 Compare editions 动作",
    /id="family-rtx-pro-6000-blackwell"[\s\S]*?Compare editions/.test(buy.body),
  );
  check(
    "RTX PRO 6000 版本 chip 指向详情页带版本参数",
    /id="family-rtx-pro-6000-blackwell"[\s\S]*?\/buy\/rtx-pro-6000-blackwell\?version=SR-PRO6000-SE/.test(
      buy.body,
    ),
  );
  for (const [familyId, skus] of [
    ["family-h100", ["SR-H100-SXM", "SR-H100-NVL", "SR-H100-PCIE"]],
    ["family-a100", ["SR-A100-PCIE", "SR-A100-SXM4"]],
    ["family-rtx-5060-ti", ["SR-5060TI-16G", "SR-5060TI-8G"]],
  ]) {
    const start = buy.body.indexOf(`id="${familyId}"`);
    const next = buy.body.indexOf('<article class="family-card"', start + 10);
    const block = start < 0 ? "" : buy.body.slice(start, next > 0 ? next : undefined);
    check(
      `${familyId} 就地提供每个版本的规格展开`,
      skus.every((s) => block.includes(`id="version-${s}"`)),
      skus.filter((s) => !block.includes(`id="version-${s}"`)).join(", "),
    );
  }
  check(
    "无详情页家族的规格展开位于本页内（锚点不指向外部路由）",
    /<a href="#version-SR-H100-SXM">/.test(buy.body),
  );

  // 本轮验收预期的 8 个家族，名称都要出现
  const expectedNames = [
    "NVIDIA GeForce RTX 5090",
    "NVIDIA GeForce RTX 5080",
    "NVIDIA GeForce RTX 5070",
    "NVIDIA GeForce RTX 5060 Ti",
    "NVIDIA GeForce RTX 5060",
    "NVIDIA RTX PRO 6000 Blackwell",
    "NVIDIA H100",
    "NVIDIA A100 80 GB",
  ];
  for (const name of expectedNames) {
    check(`目录包含型号家族「${name}」`, buy.body.includes(name));
  }

  // 分组必须靠 familyId，而不是名字截断：验证家族内每个版本确实属于它
  const { familiesWithVersions } = await import("../src/data/gpu-catalog.ts");
  const entries = familiesWithVersions();
  const orphan = GPU_PRODUCTS.filter((p) => !entries.some((e) => e.family.id === p.familyId));
  check("没有归属不到家族的版本", orphan.length === 0, orphan.map((o) => o.sku).join(", "));
  const empty = entries.filter((e) => e.versions.length === 0);
  check("没有零版本的家族", empty.length === 0, empty.map((e) => e.family.id).join(", "));

  // 分类页各自只展示自己的家族
  const gaming = await get("/buy/gaming-gpus");
  const gamingFamilies = countOf(gaming.body, 'class="family-card"');
  check("gaming 页展示 5 个家族", gamingFamilies === 5, `got ${gamingFamilies}`);
  check("gaming 页不出现专业卡家族", !gaming.body.includes("NVIDIA RTX PRO 6000 Blackwell"));
  const ai = await get("/buy/ai-gpus");
  const aiFamilies = countOf(ai.body, 'class="family-card"');
  check("ai 页展示 3 个家族", aiFamilies === 3, `got ${aiFamilies}`);
  check("ai 页不出现游戏卡家族", !ai.body.includes("NVIDIA GeForce RTX 5090"));

  // 未实现的详情页不得被链接
  check(
    "不存在指向未实现详情页的链接",
    !/href="\/buy\/(?!rtx-pro-6000-blackwell)[a-z0-9-]+"/.test(buy.body),
  );
  check("没有 Auxiliary 这类内部分类术语", !buy.body.includes("Auxiliary"));
}

// ---------------------------------------------------------------------------
console.log("\n[5c] RTX PRO 6000 Blackwell 详情页（本轮新增）");
{
  const base = "/buy/rtx-pro-6000-blackwell";
  const none = (await get(base)).body;
  const server = (await get(`${base}?version=SR-PRO6000-SE`)).body;
  const workstation = (await get(`${base}?version=SR-PRO6000-WS`)).body;
  const maxq = (await get(`${base}?version=SR-PRO6000-MQ`)).body;
  const assist = (await get(`${base}?version=none`)).body;

  // —— 七段结构 ——（未选版本时也要有 1/2/4/6/7）
  check(
    "① 型号名与定位",
    /Three editions/.test(none) && none.includes("NVIDIA RTX PRO 6000 Blackwell"),
  );
  check("① 参考图带非现货标注", /Not a photograph of a current lot/.test(none));
  check("② 版本选择器存在", none.includes("data-version-picker"));
  check(
    "② 三个版本选项齐全",
    ["SR-PRO6000-SE", "SR-PRO6000-WS", "SR-PRO6000-MQ"].every((s) => none.includes(s)),
  );
  check("④ 版本差异表存在", none.includes("How the editions differ"));
  check(
    "⑦ 相关系统入口存在（AI Servers + Workstations）",
    none.includes("/systems/ai-servers") && none.includes("/systems/workstations"),
  );

  // —— 未选版本：不得预设第一项 ——
  check(
    "未选版本时给出选择提示（不显示某个版本的规格）",
    /Nothing is selected yet/.test(none) && !none.includes('id="specifications"'),
  );
  check(
    "未选版本时页面上没有 attached 的 SKU 隐藏字段",
    !/<input type="hidden" name="sku" value="SR-/.test(none),
    "found an attached SKU",
  );
  check(
    "未选版本时不展示询价摘要（没有可带入的上下文）",
    !none.includes("What this enquiry covers"),
  );
  check(
    "未选版本时仍给出两条路（选一个版本 / 协助选型）",
    none.includes("?version=SR-PRO6000-SE") && none.includes("?version=none"),
  );

  // —— 选版本：规格随版本变化，互不串味 ——
  const specSection = (html) => {
    const start = html.indexOf('id="specifications"');
    return start < 0 ? "" : html.slice(start, html.indexOf("</section>", start));
  };
  const serverSpecs = specSection(server);
  const workstationSpecs = specSection(workstation);
  const maxqSpecs = specSection(maxq);

  check("Server Edition 规格区间存在", serverSpecs.length > 0);
  check("Server Edition 带宽 1,597 GB/s", serverSpecs.includes("1,597 GB/s"));
  check("Server Edition 规格内不出现 1,792 GB/s", !serverSpecs.includes("1,792 GB/s"));
  check("Server Edition 功耗 400-600 W", serverSpecs.includes("400-600 W"));
  check("Server Edition 冷却为被动", /Passive/.test(serverSpecs));
  check("Server Edition 平台要求写明不是桌面卡", /not a desktop card/.test(server));

  check("Workstation Edition 带宽 1,792 GB/s", workstationSpecs.includes("1,792 GB/s"));
  check("Workstation Edition 规格内不出现 1,597 GB/s", !workstationSpecs.includes("1,597 GB/s"));
  check("Workstation Edition 功耗 600 W", workstationSpecs.includes("600 W"));

  check("Max-Q 功耗 300 W", maxqSpecs.includes("300 W"));
  check(
    "Max-Q 与 Workstation 是不同 SKU",
    maxq.includes("SR-PRO6000-MQ") && !maxqSpecs.includes("SR-PRO6000-WS"),
  );

  // 切换后表单携带正确的型号 + 版本 + SKU
  for (const [sku, label, html] of [
    ["SR-PRO6000-SE", "Server Edition", server],
    ["SR-PRO6000-WS", "Workstation Edition", workstation],
    ["SR-PRO6000-MQ", "Max-Q Workstation Edition", maxq],
  ]) {
    check(
      `${label}：表单隐藏字段带入 SKU`,
      new RegExp(`<input type="hidden" name="sku" value="${sku}"`).test(html),
    );
    check(
      `${label}：表单隐藏字段带入版本名`,
      new RegExp(
        `<input type="hidden" name="config" value="${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      ).test(html),
    );
    check(`${label}：询价摘要显示型号与版本`, html.includes("What this enquiry covers"));
  }

  // —— 协助选型：明确状态，不伪装成已选 ——
  check("协助选型状态可解析", assist.includes("&quot;kind&quot;:&quot;assist&quot;"));
  check("协助选型时表单存在", assist.includes("data-rfq-form"));
  check("协助选型时 sku 为空", /<input type="hidden" name="sku" value="" \/>/.test(assist));
  check("协助选型摘要写明版本未定", /Not decided/.test(assist));
  check("协助选型提示不假装已选", !/value="SR-PRO6000-/.test(assist));

  // —— 无效参数不得静默变成某个版本 ——
  const bogus = (await get(`${base}?version=SR-NOT-A-REAL-SKU`)).body;
  check("无效 version 参数退回未选择状态", /Nothing is selected yet/.test(bogus));
  check("无效 version 参数不链到某个具体 SKU", !/name="sku" value="SR-PRO6000/.test(bogus));
}

// ---------------------------------------------------------------------------
console.log("\n[6] Storage & Networking 内容完整（线检项 D）");
{
  const { body } = await get("/systems/storage-networking");
  for (const sku of ["SR-S240", "SR-S560", "SR-S980", "SR-N100", "SR-N400", "SR-N-IB"]) {
    check(`包含 ${sku}`, body.includes(sku));
  }
  for (const field of ["Role", "Media", "Drives", "Raw capacity", "Interface", "Redundancy"]) {
    check(`存储条目含字段 ${field}`, body.includes(`<dt>${field}</dt>`));
  }
  for (const field of ["Ports", "Speeds", "Protocols", "Switching capacity"]) {
    check(`网络条目含字段 ${field}`, body.includes(`<dt>${field}</dt>`));
  }
  check("容量口径说明存在（原始 vs 可用）", /not usable host capacity/i.test(body));
  check("每个存储/网络条目都有询价入口", countOf(body, "Get a quote") >= 6);
}

// ---------------------------------------------------------------------------
console.log("\n[7] 产品参数纠错（线检项 4）");
{
  const ai = await get("/buy/ai-gpus");
  check(
    "H100 SXM 独立版本",
    ai.body.includes("SR-H100-SXM") && ai.body.includes("NVIDIA H100 SXM"),
  );
  check(
    "H100 NVL 独立版本",
    ai.body.includes("SR-H100-NVL") && ai.body.includes("NVIDIA H100 NVL"),
  );
  check(
    "H100 PCIe 独立版本",
    ai.body.includes("SR-H100-PCIE") && ai.body.includes("NVIDIA H100 PCIe"),
  );
  check("H100 NVL 功耗按单卡计（350-400 W per GPU）", /350-400 W per GPU/.test(ai.body));
  check("不存在把 NVL 与 SXM 合并成 700W 的旧写法", !/SXM, NVL 最高|SXM.*NVL.*700/.test(ai.body));
  check("NVL 显存带宽 3.9 TB/s", ai.body.includes("3.9 TB/s"));
  check("SXM 显存带宽 3.35 TB/s", ai.body.includes("3.35 TB/s"));

  check("RTX PRO 6000 Server Edition 独立版本记录", ai.body.includes("SR-PRO6000-SE"));
  {
    // Server Edition 的规格在详情页，不在目录卡片里（目录只给 Compare editions）。
    // 目录侧断言：版本 chip 指向详情页对应参数，不把工作站版参数混进家族卡。
    const start = ai.body.indexOf('id="family-rtx-pro-6000-blackwell"');
    const next = ai.body.indexOf('<article class="family-card"', start + 10);
    const block = start < 0 ? "" : ai.body.slice(start, next > 0 ? next : undefined);
    check("Server Edition 版本 chip 指向详情页", block.includes("?version=SR-PRO6000-SE"));
    check(
      "家族卡片不承载任何版本的具体带宽参数（避免版本参数混放）",
      !block.includes("1,597 GB/s") && !block.includes("1,792 GB/s"),
    );
  }
  check("A100 PCIe 功耗为 300 W（原稿 250-300 W 错误）", !ai.body.includes("250-300 W"));
  check(
    "A100 拆成 PCIe 与 SXM4 两条独立记录",
    ai.body.includes("SR-A100-PCIE") &&
      ai.body.includes("SR-A100-SXM4") &&
      ai.body.includes("80 GB PCIe") &&
      ai.body.includes("80 GB SXM4"),
  );
  check(
    "A100 两条记录各自持有自己的带宽",
    ai.body.includes("1,935 GB/s") && ai.body.includes("2,039 GB/s"),
  );
  check("A100 不再用「(PCIe / SXM4)」这种混放一行的写法", !/\(PCIe \/ SXM4\)/.test(ai.body));
  check("A100 家族级锚点 #family-a100 仍有效", ai.body.includes('id="family-a100"'));

  const gaming = await get("/buy/gaming-gpus");
  check("RTX 5060 Ti 16 GB 独立版本", gaming.body.includes("SR-5060TI-16G"));
  check("RTX 5060 Ti 8 GB 独立版本", gaming.body.includes("SR-5060TI-8G"));
  check(
    "RTX 5060 Ti 两个版本归入同一家族",
    /id="family-rtx-5060-ti"[\s\S]*?SR-5060TI-16G[\s\S]*?SR-5060TI-8G/.test(gaming.body),
  );
  check(
    "5060 Ti 不再用 variants 交叉引用",
    !gaming.body.includes("16 GB, 8 GB") && !/Variants/.test(gaming.body),
  );

  check("未核实字段被显式标注", /unverified/i.test(ai.body));
  check("已核实规格给出官方来源链接", ai.body.includes("nvidia.com"));

  // Gaming / AI Servers 的 SR-G410 引用必须解耦
  const gamingLine = (await get("/systems/gaming")).body;
  const aiServers = (await get("/systems/ai-servers")).body;
  check("AI Servers 保留 SR-G410 记录", aiServers.includes("SR-G410"));
  check("Gaming 线不再引用 SR-G410", !gamingLine.includes("SR-G410"));
  check(
    "Gaming 线改为说明用途 + 可选范围 + 询价入口",
    /we do not publish a fixed gaming configuration/i.test(gamingLine),
  );
  check("Gaming 线未编造完整配置（不出现伪造规格表）", !/SR-G4\d\d/.test(gamingLine));
}

// ---------------------------------------------------------------------------
console.log("\n[8] 产品询价携带上下文（线检项 E，本轮改为家族/版本模型）");
{
  /*
   * 目录不再逐 SKU 出卡片，所以询价上下文有两条通路，两条都要验证：
   *   (a) 目录的版本级按钮用 data-rfq-* 携带型号 / 版本 / SKU，由脚本写进表单隐藏字段；
   *   (b) 详情页在服务端渲染时就把所选版本写进隐藏字段（已在 [5c] 覆盖，这里抽验）。
   */
  for (const path of ["/buy", "/buy/gaming-gpus", "/buy/ai-gpus"]) {
    const { body } = await get(path);
    const triggers = [...body.matchAll(/data-rfq-model="([^"]*)"([^>]*)>/g)];
    check(`${path} 存在携带上下文的询价按钮`, triggers.length > 0, `found ${triggers.length}`);
    const missingModel = triggers.filter((m) => m[1].trim() === "");
    check(`${path} 每个询价按钮都带型号名`, missingModel.length === 0);
    const withSku = triggers.filter((m) => /data-rfq-sku="[^"]+"/.test(m[2]));
    check(`${path} 版本级按钮带 SKU（家族级按钮留空，由客户在表单里说明）`, withSku.length > 0);
  }

  const gaming = await get("/buy/gaming-gpus");
  check(
    "版本级询价按钮的 data-rfq-sku 是真实 SKU",
    /data-rfq-sku="SR-5060TI-16G"/.test(gaming.body) && /data-rfq-sku="SR-5090"/.test(gaming.body),
  );
  check(
    "版本级询价按钮的 aria-label 可区分型号与 SKU",
    /aria-label="Get a quote for NVIDIA GeForce RTX 5090, SKU SR-5090"/.test(gaming.body),
  );

  const buy = await get("/buy");
  check(
    "邮件备用入口仍带类型标记",
    /mailto:felix\.mm(%40|@)seraya\.systems\?subject=%5BBuyer%20RFQ%5D/.test(buy.body),
  );
  check(
    "SKU 是隐藏上下文，不要求客户填写",
    /<input type="hidden" name="sku"/.test(buy.body) && !/<label for="[^"]*sku"/.test(buy.body),
  );
  check(
    "版本也是隐藏上下文",
    /<input type="hidden" name="config"/.test(buy.body) &&
      !/<label for="[^"]*config"/.test(buy.body),
  );

  const systems = await get("/systems");
  check(
    "整机目录的 RFQ 链接指向带上下文的 /contact?sku=…",
    /href="\/contact\?[^"]*sku=/.test(systems.body),
  );
  check(
    "整机目录不再有指向 /contact 的无参数 RFQ 链接",
    !/class="rfq-link" href="\/contact"/.test(systems.body),
  );
}

// ---------------------------------------------------------------------------
console.log("\n[8b] 询价表单渐进展开（本轮新增）");
{
  for (const [path, formId] of [
    ["/", "rfq-home"],
    ["/buy", "rfq-overview"],
    ["/contact", "rfq-contact"],
  ]) {
    const { body } = await get(path);
    const form = body.slice(body.indexOf(`id="${formId}"`));
    const formEnd = form.indexOf("</form>");
    const html = formEnd > 0 ? form.slice(0, formEnd) : form;

    // 默认可见（非 details 内）的字段
    const detailsStart = html.indexOf("<details");
    const visiblePart = detailsStart > 0 ? html.slice(0, detailsStart) : html;
    const visibleNames = [
      ...visiblePart.matchAll(/<(?:input|select|textarea)[^>]*\bname="([^"]+)"/g),
    ]
      .map((m) => m[1])
      .filter((n) => n !== "website" && n !== "source" && n !== "sku" && n !== "config");

    check(`${path} 默认可见字段为 5 项`, visibleNames.length === 5, visibleNames.join(", "));
    check(
      `${path} 默认字段包含 需求类型/产品或需求/数量/目的地/邮箱`,
      ["path", "requirement", "quantity", "destination", "email"].every((k) =>
        visibleNames.includes(k),
      ),
      visibleNames.join(", "),
    );

    // 补充信息在折叠区里
    const detailsPart = detailsStart > 0 ? html.slice(detailsStart) : "";
    check(
      `${path} 补充信息收在折叠区（Company / Target date / Condition / Notes）`,
      ["company", "targetDate", "condition", "notes"].every((k) =>
        new RegExp(`name="${k}"`).test(detailsPart),
      ),
    );
    check(`${path} 折叠区默认收起（无错误时不带 open）`, !/<details[^>]*\sopen/.test(detailsPart));
    check(`${path} 提交按钮文案为 Send enquiry`, /Send enquiry/.test(html));
    check(`${path} 提供邮箱备用入口`, /mailto:felix\.mm/.test(html));
    check(`${path} 询价摘要显示已确定的上下文`, html.includes("What this enquiry covers"));
  }

  // 每系统卡数只在整机需求下出现
  const buyForm = (await get("/buy")).body;
  const detailsStart = buyForm.indexOf("<details");
  const visibleBuy = detailsStart > 0 ? buyForm.slice(0, detailsStart) : buyForm;
  check(
    "GPU 页面默认不显示「每系统卡数」",
    !/name="cardsPerSystem"/.test(visibleBuy.split("</form>")[0]),
  );
  const systemsForm = (await get("/systems")).body;
  check(
    "整机页面存在「每系统卡数」字段（由需求类型切换显示）",
    /data-rfq-system-row/.test(systemsForm) && /name="cardsPerSystem"/.test(systemsForm),
  );

  // 字段提示随需求类型区分
  check("数量字段标签随需求类型变化（整机为 systems）", /Quantity \(systems\)/.test(systemsForm));
  check("出售批次使用 Lot size 提示", /Lot size \(units\)/.test((await get("/purchasing")).body));
}

// ---------------------------------------------------------------------------
console.log("\n[9] Contact 分类与表单（线检项 F 与 5）");
{
  const { body } = await get("/contact");
  check("需求类别含购买 GPU 单卡", /Single cards and SXM modules/.test(body));
  check("需求类别含购买整机", /Servers, workstations, storage and networking/.test(body));
  check("需求类别含出售批次", /Submit a lot for a committed decision/.test(body));
  check("需求类别含 BOM 需求", /Send a parts list for review/.test(body));
  check("需求类别含售后", /Warranty, DOA and RMA/.test(body));
  check("表单含 path 选择器", body.includes('name="path"'));
  check(
    "表单必填四项存在",
    ["requirement", "quantity", "destination", "email"].every((n) => body.includes(`name="${n}"`)),
  );
  check("表单 POST 到 /api/rfq", body.includes(`action="/api/rfq"`));
  check("表单含蜜罐反垃圾字段", body.includes('name="website"'));
  check("明示不接受附件上传", /does not accept file uploads/i.test(body));
  check("提供直接邮箱", body.includes("felix.mm@seraya.systems"));
  check("说明回复时限", /within one business day/i.test(body));
}

// ---------------------------------------------------------------------------
console.log("\n[10] 隐私政策入口（线检项 G）");
{
  const compliance = await get("/purchasing/compliance");
  check("compliance 有 #privacy 区块", compliance.body.includes('id="privacy"'));
  check("提及 privacy policy 处已改为站内可点锚点", compliance.body.includes('href="#privacy"'));
  check("明确标注隐私政策正文尚未发布", /Not yet published/i.test(compliance.body));
  check(
    "没有编造政策正文（无法律条款式承诺）",
    !/this privacy policy (constitutes|governs)|PDPA 2010 section/i.test(compliance.body),
  );
  const footer = (await get("/")).body;
  check("页脚有 Privacy & data handling 入口", footer.includes("/purchasing/compliance#privacy"));
  const company = (await get("/company")).body;
  check("Company 页附近有 KYC 入口", company.includes("/purchasing/kyc"));
  check(
    "Company 页删除「资料已移至另一页」类改版说明",
    !/now live on their own page/i.test(company),
  );
}

// ---------------------------------------------------------------------------
console.log("\n[11] 缩写解释（线检项 5）");
{
  const contact = (await get("/contact")).body;
  for (const term of ["RFQ", "BOM", "MOQ", "ITAD", "DOA", "RMA", "SXM"]) {
    check(`/contact 解释 ${term}`, contact.includes(`<dt>${term}</dt>`));
  }
  const purchasing = (await get("/purchasing")).body;
  check("/purchasing 解释 ITAD", purchasing.includes("<dt>ITAD</dt>"));
  check("12 小时决定写明适用条件", /business hours/i.test(purchasing));
}

// ---------------------------------------------------------------------------
console.log("\n[12] 首页结构（线检项 6）");
{
  const { body } = await get("/");
  check(
    "首屏标题缩短",
    /<h1 id="hero-title" class="hero-title">GPU wholesale and system integration<\/h1>/.test(body),
  );
  // 首屏按 CY 指示改为纯文字（2026-11）：hero 内不得出现任何图片或 figure
  check(
    "首屏不含产品图片",
    (() => {
      const hero = body.slice(body.indexOf('class="hero"'), body.indexOf("</section>"));
      return !/<img|<figure/.test(hero);
    })(),
  );
  // 首屏改为纯文字后，首页不再有可标注的参考图；
  // 「参考图必须标注」的断言挪到真正有产品图的页面（见下）。
  check("产品卡片标注参考图（/buy）", /Reference image/.test((await get("/buy")).body));
  check(
    "Gaming GPUs 与 Professional 同级入口",
    body.includes("/buy/gaming-gpus") && body.includes("/buy/ai-gpus"),
  );
  check("总目录为辅助入口", /entry-card-secondary[\s\S]*?\/buy"/.test(body));
  check(
    "底部询价不再只问 BOM 与 workload",
    !/Email the BOM, workload, and target lead time/.test(body),
  );
  check("首页含询价表单", body.includes("data-rfq-form"));
  check(
    "首页区块顺序：定位→GPU→整机→资料→流程→询价",
    (() => {
      const order = [
        "gpu-entry-title",
        "home-systems-title",
        "built-title",
        "evidence-title",
        "home-rfq-title",
      ];
      let cursor = -1;
      for (const id of order) {
        const idx = body.indexOf(`id="${id}"`);
        if (idx === -1 || idx < cursor) return false;
        cursor = idx;
      }
      return true;
    })(),
  );
}

// ---------------------------------------------------------------------------
console.log("\n[13] 询价接口行为（成功只在服务端确认后出现）");
{
  // 13a: 缺字段 → 422 且回吐字段错误
  const invalid = await fetch(BASE + "/api/rfq", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      path: "Buy GPUs",
      requirement: "",
      quantity: "0",
      destination: "",
      email: "bad",
    }),
  });
  const invalidJson = await invalid.json();
  check("缺字段返回 422", invalid.status === 422, `got ${invalid.status}`);
  check("返回字段级错误数组", Array.isArray(invalidJson.errors) && invalidJson.errors.length >= 3);
  check("缺字段时不返回 ok", invalidJson.ok !== true);

  // 13b: 完整提交 → 未配置投递通道时必须报错而非成功
  const valid = await fetch(BASE + "/api/rfq", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      path: "Buy GPUs",
      requirement: "NVIDIA H100 SXM",
      sku: "SR-H100-SXM",
      quantity: "8",
      destination: "Malaysia, Kuala Lumpur",
      email: "buyer@example.com",
      website: "",
    }),
  });
  const validJson = await valid.json();
  const channel = process.env.RFQ_WEBHOOK_URL || process.env.RESEND_API_KEY;
  if (!channel) {
    check(
      "未配置投递通道时返回 503 且不声称成功",
      valid.status === 503 && validJson.ok !== true,
      `got ${valid.status} ok=${validJson.ok}`,
    );
    check("失败信息给出替代联系方式", /email/i.test(validJson.message ?? ""));
  } else {
    check(
      "已配置通道时返回 200",
      valid.status === 200 && validJson.ok === true,
      `got ${valid.status}`,
    );
  }

  // 13c: 蜜罐命中 → 拒绝
  const honeypot = await fetch(BASE + "/api/rfq", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      path: "Buy GPUs",
      requirement: "spam",
      quantity: "1",
      destination: "nowhere",
      email: "spam@example.com",
      website: "http://spam.example",
    }),
  });
  check("蜜罐字段命中时拒绝提交", honeypot.status === 422, `got ${honeypot.status}`);

  // 13d: 非 JSON 客户端（no-JS）拿到 HTML 且失败时回吐已填内容
  const form = new URLSearchParams({
    path: "Buy GPUs",
    requirement: "NVIDIA H100 SXM",
    sku: "SR-H100-SXM",
    quantity: "8",
    destination: "Malaysia, Kuala Lumpur",
    email: "buyer@example.com",
  });
  const noJs = await fetch(BASE + "/api/rfq", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const noJsBody = await noJs.text();
  check("no-JS 提交返回 HTML", (noJs.headers.get("content-type") ?? "").includes("text/html"));
  if (!channel) {
    check("no-JS 未配置时返回 503", noJs.status === 503, `got ${noJs.status}`);
    check(
      "no-JS 失败页保留已填内容",
      noJsBody.includes("SR-H100-SXM") && noJsBody.includes("Kuala Lumpur"),
    );
    check("no-JS 失败页不出现成功文案", !/RFQ received/.test(noJsBody));
    check("no-JS 失败页给出邮箱替代", noJsBody.includes("felix.mm@seraya.systems"));
  }

  // 13e: GET 不允许
  const getRes = await fetch(BASE + "/api/rfq", { headers: { accept: "application/json" } });
  check("GET /api/rfq 返回 405", getRes.status === 405, `got ${getRes.status}`);
}

// ---------------------------------------------------------------------------
console.log("\n[14] 图片引用可加载");
{
  const pages = [
    "/",
    "/buy",
    "/buy/gaming-gpus",
    "/buy/ai-gpus",
    "/systems",
    "/systems/storage-networking",
    "/systems/ai-servers",
    "/systems/workstations",
    "/systems/gaming",
  ];
  const seen = new Set();
  let broken = 0;
  for (const path of pages) {
    const { body } = await get(path);
    for (const m of body.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) {
      const src = m[1];
      if (seen.has(src)) continue;
      seen.add(src);
      const res = await fetch(BASE + src, { method: "GET" });
      if (res.status !== 200) {
        broken++;
        check(`图片 ${src} 可加载`, false, `got ${res.status} (from ${path})`);
      }
      await res.arrayBuffer();
    }
  }
  check(`全部 ${seen.size} 张站内图片可加载`, broken === 0, `${broken} broken`);
}

// ---------------------------------------------------------------------------
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(fail === 0 ? 0 : 1);

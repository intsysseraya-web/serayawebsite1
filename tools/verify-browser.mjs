/**
 * 浏览器内布局与交互验证（Chrome DevTools Protocol）。
 *
 * 用法：
 *   node tools/verify-browser.mjs [baseUrl] [--out <dir>]
 *
 * 这一步是内容层验证（tools/verify-site.mjs）之外的补充，专门回答那些
 * **只有真实渲染才能回答**的问题：
 *   - 横向溢出（scrollWidth ≤ viewport）在各断点是否成立
 *   - 锚点跳转后目标标题是否被固定导航遮住
 *   - 点击区域是否 ≥ 44px
 *   - 移动菜单的开 / 关 / Escape / 焦点恢复
 *   - 表单重复提交与失败后内容是否保留
 *   - 图片是否真的解码成功且未被拉伸
 *
 * 截图落在 --out 指定的目录，作为验收证据保留。
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launchChrome, CdpSession } from "./cdp-driver.mjs";

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:8081";
const outIdx = args.indexOf("--out");
const OUT_DIR = outIdx >= 0 ? args[outIdx + 1] : join("verification-evidence");

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

mkdirSync(OUT_DIR, { recursive: true });

const WIDTHS = [
  { w: 375, h: 812, name: "375" },
  { w: 390, h: 844, name: "390" },
  { w: 768, h: 1024, name: "768" },
  { w: 1024, h: 768, name: "1024" },
  { w: 1440, h: 900, name: "1440" },
];

/**
 * 触发 lazy-load 并**逐个**确认每张图真的被浏览器取回，然后回到顶部。
 *
 * 为什么不能只「滚两遍 + 等一会」：`loading="lazy"` 的取图时机由浏览器按视口距离决定，
 * 固定节奏的滚动会漏掉一部分（实测 /systems 上零散的 Workstation 卡片会被漏掉）。
 * 这里对每张未加载的图**先滚到它自己的位置**，再等它 complete —— 断言的是
 * 「懒加载对每一张图都有效」，而不是「某一刻它们碰巧都加载完了」。
 *
 * 截图前也必须调用：否则全页截图里未进入视口的懒加载图片会是空白块，
 * 那不是页面问题，是取证方式问题（本轮曾因此误判数据中心的卡片"不显示"）。
 */
async function settleImages(session) {
  await session.evaluate(`
    (async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const images = [...document.images];
      for (const img of images) {
        if (img.complete && img.naturalWidth > 0) continue;
        const holder =
          img.closest('figure, .product-card-media, .family-card-media, .gpu-card-media, .feature-card-media') || img;
        holder.scrollIntoView({ block: 'center' });
        await sleep(80);
        if (img.complete && img.naturalWidth > 0) continue;
        await new Promise((r) => {
          const done = () => r();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 4000);
        });
      }
      window.scrollTo(0, 0);
      await sleep(300);
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));
}

/** 在页面上下文里通用的一段测量代码 */
const OVERFLOW_PROBE = `
  const de = document.documentElement;
  const over = [];
  const vw = de.clientWidth;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1) {
      const cs = getComputedStyle(el);
      if (cs.overflowX === "auto" || cs.overflowX === "scroll" || cs.overflowX === "hidden") continue;
      const parent = el.parentElement;
      const pcs = parent ? getComputedStyle(parent) : null;
      if (pcs && (pcs.overflowX === "auto" || pcs.overflowX === "scroll" || pcs.overflowX === "hidden")) continue;
      over.push({ tag: el.tagName, cls: String(el.className).slice(0, 80), right: Math.round(r.right) });
    }
  }
  return { scrollWidth: de.scrollWidth, clientWidth: vw, overflow: over.slice(0, 8) };
`;

const chrome = await launchChrome({ port: 9334, width: 1440, height: 900 });
const session = await CdpSession.attach(chrome.port);

try {
  console.log(`\n=== Browser verification against ${BASE} ===`);
  console.log(`screenshots → ${OUT_DIR}\n`);

  // -------------------------------------------------------------------------
  console.log("[1] 横向溢出：首页 / GPU 目录 / Systems / Contact / 详情页");
  for (const path of ["/", "/buy", "/systems", "/contact", "/buy/rtx-pro-6000-blackwell"]) {
    for (const vp of WIDTHS) {
      await session.setViewport(vp.w, vp.h);
      await session.goto(BASE + path, { waitMs: 450 });
      const probe = await session.evaluate(OVERFLOW_PROBE);
      check(
        `${path} @${vp.name}px 无横向溢出`,
        probe.scrollWidth <= probe.clientWidth + 1,
        `scrollWidth=${probe.scrollWidth} clientWidth=${probe.clientWidth} first=${JSON.stringify(probe.overflow[0] ?? null)}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[2] 其他页面：桌面 + 手机 + 200% 缩放");
  for (const path of [
    "/buy/gaming-gpus",
    "/buy/ai-gpus",
    "/systems/ai-servers",
    "/systems/workstations",
    "/systems/gaming",
    "/systems/storage-networking",
    "/purchasing",
    "/company",
    "/programs",
    "/local",
    "/purchasing/kyc",
    "/purchasing/compliance",
  ]) {
    for (const vp of [
      { w: 390, h: 844, name: "390" },
      { w: 1440, h: 900, name: "1440" },
    ]) {
      await session.setViewport(vp.w, vp.h);
      await session.goto(BASE + path, { waitMs: 400 });
      const probe = await session.evaluate(OVERFLOW_PROBE);
      check(
        `${path} @${vp.name}px 无横向溢出`,
        probe.scrollWidth <= probe.clientWidth + 1,
        `scrollWidth=${probe.scrollWidth}`,
      );
    }
  }

  // 200% 缩放等价于把 CSS 视口减半（1440 → 720）
  console.log("\n[2b] 200% 缩放（视口 720px，等效 1440px @200%）");
  for (const path of ["/", "/buy", "/systems", "/contact", "/buy/rtx-pro-6000-blackwell"]) {
    await session.setViewport(720, 900);
    await session.goto(BASE + path, { waitMs: 400 });
    const probe = await session.evaluate(OVERFLOW_PROBE);
    check(
      `/200% ${path} 无横向溢出`,
      probe.scrollWidth <= probe.clientWidth + 1,
      `scrollWidth=${probe.scrollWidth}`,
    );
  }

  // -------------------------------------------------------------------------
  console.log("\n[3] 锚点跳转：目标标题完整可见（不被固定导航遮挡）");
  {
    const targets = [
      { path: "/buy", frag: "request-quote", heading: "Get a quote" },
      { path: "/buy", frag: "models", heading: "Models" },
      { path: "/systems", frag: "request-quote", heading: "Get a quote" },
      { path: "/systems", frag: "how-we-quote", heading: "Two supply routes" },
      { path: "/systems", frag: "networking", heading: "Networking" },
      { path: "/systems/storage-networking", frag: "storage", heading: "Storage" },
      { path: "/purchasing", frag: "sell-form", heading: "Submit a lot" },
      { path: "/purchasing/compliance", frag: "after-sales", heading: "Warranty, DOA and RMA" },
      { path: "/programs", frag: "request-quote", heading: "Send the requirement" },
      { path: "/contact", frag: "routes", heading: "Choose the right entry" },
      { path: "/", frag: "request-quote", heading: "Get a quote" },
    ];

    for (const vp of WIDTHS) {
      await session.setViewport(vp.w, vp.h);
      for (const t of targets) {
        await session.goto(`${BASE}${t.path}#${t.frag}`, { waitMs: 300 });
        // 等锚点滚动落位：hydration 之后脚本会再滚一次，这里轮询到稳定为止
        const result = await session.evaluate(`
          const frag = ${JSON.stringify(t.frag)};
          const vh = window.innerHeight;
          return new Promise((resolve) => {
            let tries = 0;
            function probe() {
              tries++;
              const header = document.querySelector('.site-header');
              const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
              const target = document.getElementById(frag);
              if (target) {
                let h = target.querySelector('h1, h2, h3') || target;
                const r = h.getBoundingClientRect();
                const ok = r.top >= headerBottom - 1 && r.top < vh;
                if (ok || tries > 24) {
                  resolve({
                    found: true, tries, headerBottom: Math.round(headerBottom),
                    top: Math.round(r.top), height: Math.round(r.height),
                    text: (h.textContent || '').trim().slice(0, 60)
                  });
                  return;
                }
              } else if (tries > 24) {
                resolve({ found: false, tries });
                return;
              }
              setTimeout(probe, 250);
            }
            probe();
          });
        `);
        check(
          `${t.path}#${t.frag} @${vp.name}px 标题在导航下方且可见`,
          result.found && result.top >= result.headerBottom - 1 && result.top < vp.h,
          JSON.stringify(result),
        );
      }
    }
    // 只对 1440 与 390 打印一次文本核对，避免刷屏
    for (const vp of [
      { w: 1440, h: 900 },
      { w: 390, h: 844 },
    ]) {
      await session.setViewport(vp.w, vp.h);
      for (const t of targets) {
        await session.goto(`${BASE}${t.path}#${t.frag}`, { waitMs: 500 });
        const text = await session.evaluate(`
          const target = document.getElementById(${JSON.stringify(t.frag)});
          const h = target ? target.querySelector('h1, h2, h3') : null;
          return h ? (h.textContent || '').trim() : '';
        `);
        check(
          `${t.path}#${t.frag} @${vp.w} 标题文本匹配 ("${t.heading}")`,
          text.includes(t.heading),
          `got "${text.slice(0, 60)}"`,
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[3b] Contact 需求入口：桌面 3×2，不留孤卡");
  {
    /*
     * 这一段是回归保护：入口卡共有 6 张，用 auto-fit 在宽屏下会挤成 5 列、
     * 第 6 张单独掉一行留下大片空白。列数已改为断点固定，这里断言实际列数。
     */
    const countColumns = `
      const cards = [...document.querySelectorAll('.contact-routes > li')];
      if (!cards.length) return { count: 0, columns: 0, rowCounts: [] };
      const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
      const rows = new Map();
      for (const t of tops) rows.set(t, (rows.get(t) || 0) + 1);
      return {
        count: cards.length,
        columns: Math.max(...rows.values()),
        rows: rows.size,
        rowCounts: [...rows.values()],
        maxWidthRatio: Math.max(...cards.map((c) => c.getBoundingClientRect().width)) /
          document.documentElement.clientWidth
      };
    `;

    await session.setViewport(1440, 900);
    await session.goto(BASE + "/contact", { waitMs: 600 });
    const wide = await session.evaluate(countColumns);
    check("Contact 页有 6 个需求入口卡", wide.count === 6, JSON.stringify(wide));
    check("1440px 下为 3 列", wide.columns === 3, JSON.stringify(wide));
    check("1440px 下为 2 行（3×2，无孤卡）", wide.rows === 2, JSON.stringify(wide));
    check(
      "每行卡片数一致（没有只有一张卡的行）",
      new Set(wide.rowCounts).size === 1,
      JSON.stringify(wide.rowCounts),
    );

    await session.setViewport(1024, 768);
    await session.goto(BASE + "/contact", { waitMs: 500 });
    const mid = await session.evaluate(countColumns);
    check("1024px 下为 3 列 × 2 行", mid.columns === 3 && mid.rows === 2, JSON.stringify(mid));

    for (const w of [768, 390, 375]) {
      await session.setViewport(w, 900);
      await session.goto(BASE + "/contact", { waitMs: 450 });
      const narrow = await session.evaluate(countColumns);
      const expected = w === 768 ? 2 : 1;
      check(
        `@${w}px 下为 ${expected} 列且无横向溢出`,
        narrow.columns === expected,
        JSON.stringify(narrow),
      );
      const overflow = await session.evaluate(`
        const de = document.documentElement;
        return de.scrollWidth - de.clientWidth;
      `);
      check(`@${w}px Contact 无横向溢出`, overflow <= 1, `overflow=${overflow}`);
    }

    /*
     * 对齐：需求入口卡与下方的缩写表必须共用同一条内容栏。
     * 两者都是「标题 + 网格」的结构，如果各自宽度不同，宽屏下左右两条边会对不齐
     * （入口卡窄、缩写表宽出去）。这里断言它们的左右边界一致。
     */
    for (const w of [1440, 1024, 768]) {
      await session.setViewport(w, 900);
      await session.goto(BASE + "/contact", { waitMs: 500 });
      const align = await session.evaluate(`
        const routes = document.querySelector('.contact-routes');
        const glossary = document.querySelector('.glossary');
        if (!routes || !glossary) return { error: 'block not found' };
        const r = routes.getBoundingClientRect();
        const g = glossary.getBoundingClientRect();
        return {
          routesLeft: Math.round(r.left), routesRight: Math.round(r.right),
          glossaryLeft: Math.round(g.left), glossaryRight: Math.round(g.right),
          deltaLeft: Math.round(Math.abs(r.left - g.left)),
          deltaRight: Math.round(Math.abs(r.right - g.right))
        };
      `);
      check(
        `@${w}px 需求入口卡与缩写表共用同一条内容栏（左右边界对齐）`,
        !align.error && align.deltaLeft <= 1 && align.deltaRight <= 1,
        JSON.stringify(align),
      );

      /*
       * 每个网格的标题必须与它自己的网格左边线对齐。
       * 断言覆盖三个「标题 + 网格 + 标题 + 网格」连排的区块，正是截图里对不齐的地方。
       */
      const headingAlign = await session.evaluate(`
        const pairs = [
          ['routes-title', '.contact-routes'],
          ['glossary-title', '.glossary']
        ];
        const out = [];
        for (const [titleId, gridSel] of pairs) {
          const title = document.getElementById(titleId);
          const grid = document.querySelector(gridSel);
          if (!title || !grid) { out.push({ titleId, error: 'missing' }); continue; }
          const t = title.getBoundingClientRect();
          const g = grid.getBoundingClientRect();
          out.push({
            titleId,
            titleLeft: Math.round(t.left),
            gridLeft: Math.round(g.left),
            delta: Math.round(Math.abs(t.left - g.left))
          });
        }
        return out;
      `);
      for (const entry of headingAlign) {
        check(
          `@${w}px 标题「${entry.titleId}」与对应网格左边线对齐`,
          !entry.error && entry.delta <= 1,
          JSON.stringify(entry),
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[3c] 四卡区块 2×2 与首屏按钮间距");
  {
    const layoutProbe = `
      const cards = [...document.querySelectorAll('.company-grid--pair > *')];
      if (!cards.length) return { count: 0 };
      const rows = new Map();
      for (const c of cards) {
        const top = Math.round(c.getBoundingClientRect().top);
        rows.set(top, (rows.get(top) || 0) + 1);
      }
      const widths = cards.map((c) => Math.round(c.getBoundingClientRect().width));
      return {
        count: cards.length,
        columns: Math.max(...rows.values()),
        rowCount: rows.size,
        rowCounts: [...rows.values()],
        widthSpread: Math.max(...widths) - Math.min(...widths)
      };
    `;

    /*
     * `.company-grid--pair` 只加在确有需要分组的区块上：
     *   - Systems hub（4 张卡）→ 2 × 2
     *   - 详情页「相关系统」（2 张卡）→ 1 行 2 列
     * 刻意**没有**加在别处：
     *   - /buy 的「What you can verify」只有 2 张卡，默认 auto-fit 已是 1 行
     *   - Company 页保留默认 auto-fit：那里每张卡文案更长，硬压 2 列会让行长失控
     */
    const pairGroups = [
      { path: "/systems", label: "Systems hub 四卡", expectedCards: 4, expectedRows: 2 },
      {
        path: "/buy/rtx-pro-6000-blackwell",
        label: "详情页相关系统",
        expectedCards: 2,
        expectedRows: 1,
      },
    ];

    for (const group of pairGroups) {
      await session.setViewport(1440, 900);
      await session.goto(BASE + group.path, { waitMs: 500 });
      const wide = await session.evaluate(layoutProbe);
      check(
        `${group.label}：1440px 下卡片数为 ${group.expectedCards}`,
        wide.count === group.expectedCards,
        JSON.stringify(wide),
      );
      check(
        `${group.label}：1440px 下为 ${group.expectedRows} 行且每行 2 张`,
        wide.columns === 2 && wide.rowCount === group.expectedRows,
        JSON.stringify(wide),
      );
      check(
        `${group.label}：每行卡片数一致（无孤卡）`,
        new Set(wide.rowCounts).size === 1,
        JSON.stringify(wide.rowCounts),
      );
      check(`${group.label}：同行卡片等宽`, wide.widthSpread <= 1, JSON.stringify(wide));

      await session.setViewport(390, 844);
      await session.goto(BASE + group.path, { waitMs: 450 });
      const narrow = await session.evaluate(layoutProbe);
      check(`${group.label}：390px 下退回单列`, narrow.columns === 1, JSON.stringify(narrow));
    }

    // 详情页首屏按钮行与上文之间要有间距
    for (const w of [1440, 390]) {
      await session.setViewport(w, 900);
      await session.goto(BASE + "/buy/rtx-pro-6000-blackwell", { waitMs: 500 });
      const hero = await session.evaluate(`
        const copy = document.querySelector('.detail-hero-copy');
        if (!copy) return { error: 'no hero copy' };
        const p = copy.querySelector('p.catalog-lede') || copy.querySelector('p');
        const row = copy.querySelector('.btn-row');
        if (!p || !row) return { error: 'missing p or btn-row' };
        const pr = p.getBoundingClientRect();
        const br = row.getBoundingClientRect();
        const gap = Math.round(br.top - pr.bottom);
        return { gap, marginTop: getComputedStyle(row).marginTop };
      `);
      check(
        `@${w}px 详情页首屏按钮行与上文间距 ≥ 16px`,
        !hero.error && hero.gap >= 16,
        JSON.stringify(hero),
      );
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[3d] 表单区块：标题与表单卡片左边线对齐（全站）");
  {
    /*
     * 这是「标题缩进、卡片顶到边」那类错位的回归保护。
     * 全站所有带询价表单的区块都检查，不只 purchasing —— 同一份表单渲染器
     * 出现在六个页面，任何一处漏掉规则都会单独错位。
     */
    const formPages = [
      ["/purchasing", "Sell GPU lots"],
      ["/contact", "Contact"],
      ["/buy", "GPU catalogue"],
      ["/systems", "Systems"],
      ["/programs", "Programs"],
      /*
       * 详情页必须带上 `?version=` 才有表单 —— 未选版本时按设计不显示表单
       * （不预设某个版本，也就没有可带入询价的上下文）。所以这里用已选版本的 URL。
       */
      ["/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-WS", "Detail page (version selected)"],
    ];
    for (const [path, label] of formPages) {
      for (const w of [1440, 390]) {
        await session.setViewport(w, 900);
        await session.goto(BASE + path, { waitMs: 600 });
        const align = await session.evaluate(`
          const form = document.querySelector('form[data-rfq-form]');
          if (!form) return { error: 'no form' };
          /* 表单区块出现在两类容器里：普通页面的 .section，以及目录页/详情页的
             .catalog-section。两者都要能定位，否则目录页会被报成「没有标题」。 */
          const section = form.closest('.section, .catalog-section');
          if (!section) return { error: 'no section' };
          const head = section.querySelector('.section-head, .catalog-section-head');
          const h2 = head ? head.querySelector('h2') : null;
          if (!h2) {
            return { error: 'no heading', sectionClass: section.className, headFound: !!head };
          }
          const h = h2.getBoundingClientRect();
          const f = form.getBoundingClientRect();
          return {
            headingLeft: Math.round(h.left),
            formLeft: Math.round(f.left),
            delta: Math.round(Math.abs(h.left - f.left))
          };
        `);
        check(
          `${label} @${w}px：表单区块标题与卡片左边线对齐`,
          !align.error && align.delta <= 1,
          JSON.stringify(align),
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[4] 点击区域 ≥ 44px");
  {
    await session.setViewport(390, 844);
    for (const path of ["/", "/buy", "/systems", "/contact"]) {
      await session.goto(BASE + path, { waitMs: 400 });
      const small = await session.evaluate(`
        const out = [];
        for (const el of document.querySelectorAll('a.btn, button, .rfq-input, .main-nav a, .mobile-nav a, .icon-btn, .gpu-card-cta, .rfq-link, .cat-chip')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.height < 44 - 0.5) {
            out.push({ tag: el.tagName, cls: String(el.className).slice(0, 50), h: Math.round(r.height), text: (el.textContent||'').trim().slice(0, 24) });
          }
        }
        return out.slice(0, 10);
      `);
      check(
        `${path} @390px 所有按钮/输入/导航项点击区域 ≥ 44px`,
        small.length === 0,
        JSON.stringify(small.slice(0, 3)),
      );
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[5] 移动菜单：开 / 关 / Escape / 焦点恢复");
  {
    await session.setViewport(390, 844);
    await session.goto(BASE + "/", { waitMs: 500 });

    const opened = await session.evaluate(`
      document.getElementById('btnMenu').click();
      return new Promise((resolve) => setTimeout(() => {
        const d = document.getElementById('mobileDrawer');
        resolve({
          hidden: d.hidden,
          isOpen: d.classList.contains('is-open'),
          ariaExpanded: document.getElementById('btnMenu').getAttribute('aria-expanded'),
          focusInsideDrawer: d.contains(document.activeElement),
          activeId: document.activeElement ? document.activeElement.id : '',
          navRows: [...d.querySelectorAll('.mobile-nav > a')].map(a => a.getBoundingClientRect().height),
          navLabels: [...d.querySelectorAll('.mobile-nav > a')].map(a => a.textContent.trim())
        });
      }, 350));
    `);
    check(
      "点击 Menu 后抽屉打开",
      opened.hidden === false && opened.isOpen === true,
      JSON.stringify(opened),
    );
    check("Menu 按钮 aria-expanded=true", opened.ariaExpanded === "true");
    check("打开后焦点进入抽屉", opened.focusInsideDrawer === true, `active=${opened.activeId}`);
    check(
      "移动菜单为单列，每项高度 ≥ 44px",
      opened.navRows.every((h) => h >= 44),
      JSON.stringify(opened.navRows),
    );
    check(
      "移动菜单无子菜单浮层（不再有 Products 下拉）",
      await session.evaluate(
        `return document.querySelectorAll('.mobile-nav .nav-dropdown-menu').length === 0;`,
      ),
    );
    check(
      "移动菜单含四个顶层入口",
      opened.navLabels.length === 4 && opened.navLabels.includes("GPU Wholesale"),
      JSON.stringify(opened.navLabels),
    );
    check(
      "移动菜单不再重复列出 Contact（由 Get a quote 承担）",
      !opened.navLabels.includes("Contact"),
      JSON.stringify(opened.navLabels),
    );

    const escaped = await session.evaluate(`
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return new Promise((resolve) => setTimeout(() => {
        const d = document.getElementById('mobileDrawer');
        resolve({
          isOpen: d.classList.contains('is-open'),
          hidden: d.hidden,
          ariaExpanded: document.getElementById('btnMenu').getAttribute('aria-expanded'),
          focusId: document.activeElement ? document.activeElement.id : ''
        });
      }, 500));
    `);
    check(
      "Escape 关闭抽屉",
      escaped.isOpen === false && escaped.hidden === true,
      JSON.stringify(escaped),
    );
    check("Escape 后 aria-expanded=false", escaped.ariaExpanded === "false");
    check(
      "Escape 后焦点回到 Menu 按钮",
      escaped.focusId === "btnMenu",
      `active=${escaped.focusId}`,
    );

    const outside = await session.evaluate(`
      document.getElementById('btnMenu').click();
      return new Promise((resolve) => setTimeout(() => {
        document.getElementById('main')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        setTimeout(() => {
          const d = document.getElementById('mobileDrawer');
          resolve({ isOpen: d.classList.contains('is-open'), hidden: d.hidden });
        }, 450);
      }, 350));
    `);
    check(
      "点击抽屉外部关闭抽屉",
      outside.isOpen === false && outside.hidden === true,
      JSON.stringify(outside),
    );

    const closed = await session.evaluate(`
      document.getElementById('btnMenu').click();
      return new Promise((resolve) => setTimeout(() => {
        document.getElementById('btnCloseMenu').click();
        setTimeout(() => {
          const d = document.getElementById('mobileDrawer');
          resolve({ isOpen: d.classList.contains('is-open'), hidden: d.hidden, focusId: document.activeElement ? document.activeElement.id : '' });
        }, 500);
      }, 350));
    `);
    check(
      "X 按钮关闭抽屉并归还焦点",
      closed.hidden === true && closed.focusId === "btnMenu",
      JSON.stringify(closed),
    );
  }

  // -------------------------------------------------------------------------
  console.log("\n[6] 桌面导航：无 hover 依赖、无浮层");
  {
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/", { waitMs: 400 });
    const nav = await session.evaluate(`
      const links = [...document.querySelectorAll('.main-nav > a')].map(a => ({
        label: a.textContent.trim(),
        href: a.getAttribute('href'),
        h: Math.round(a.getBoundingClientRect().height),
        visible: a.getBoundingClientRect().width > 0
      }));
      const overlaps = [];
      const nodes = [...document.querySelectorAll('.main-nav > a')];
      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i-1].getBoundingClientRect();
        const cur = nodes[i].getBoundingClientRect();
        if (cur.left < prev.right - 0.5) overlaps.push([nodes[i-1].textContent.trim(), nodes[i].textContent.trim()]);
      }
      /*
       * 导航应该靠右、与右侧操作区成一组：logo 与首项的间距，
       * 必须明显大于末项与操作区（Search）的间距。若导航停在中间，这两个间距会接近。
       */
      const logo = document.querySelector('.site-header .logo');
      const actions = document.querySelector('.header-actions');
      const firstNav = nodes[0];
      const lastNav = nodes[nodes.length - 1];
      const support = actions ? actions.querySelector('#btnSearch') || actions : null;
      const logoToNav = logo && firstNav
        ? Math.round(firstNav.getBoundingClientRect().left - logo.getBoundingClientRect().right)
        : null;
      const navToActions = support && lastNav
        ? Math.round(support.getBoundingClientRect().left - lastNav.getBoundingClientRect().right)
        : null;
      return {
        links, overlaps, dropdowns: document.querySelectorAll('.nav-dropdown').length,
        logoToNav, navToActions
      };
    `);
    check(
      "桌面导航 4 项全部可见",
      nav.links.length === 4 && nav.links.every((l) => l.visible),
      JSON.stringify(nav.links),
    );
    check(
      "桌面导航不再重复列出 Contact（由 Get a quote 承担）",
      !nav.links.some((l) => l.label === "Contact"),
      JSON.stringify(nav.links.map((l) => l.label)),
    );
    check(
      "Get a quote 主按钮仍指向 /contact",
      await session.evaluate(`
        const cta = document.querySelector('.header-cta');
        return cta ? cta.getAttribute('href') === '/contact' : false;
      `),
    );
    check(
      "页脚仍保留 Contact 入口",
      await session.evaluate(`
        return [...document.querySelectorAll('.site-footer a')].some((a) => a.getAttribute('href') === '/contact');
      `),
    );
    check("桌面导航项不重叠", nav.overlaps.length === 0, JSON.stringify(nav.overlaps));
    check(
      "桌面导航靠右（与操作区成一组，不在中间）",
      nav.logoToNav !== null && nav.navToActions !== null && nav.logoToNav > nav.navToActions * 2,
      JSON.stringify({ logoToNav: nav.logoToNav, navToActions: nav.navToActions }),
    );
    check(
      "桌面导航项点击高度 ≥ 44px",
      nav.links.every((l) => l.h >= 44),
      JSON.stringify(nav.links.map((l) => l.h)),
    );
    check("没有 nav-dropdown 浮层元素", nav.dropdowns === 0);
  }

  // -------------------------------------------------------------------------
  console.log("\n[7] 询价表单：失败保留内容、防重复提交、成功由服务端确认");
  {
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/contact", { waitMs: 500 });

    const empty = await session.evaluate(`
      const form = document.getElementById('rfq-contact');
      form.querySelector('[name="requirement"]').value = '';
      form.querySelector('[name="quantity"]').value = '0';
      form.querySelector('[name="destination"]').value = '';
      form.querySelector('[name="email"]').value = 'not-an-email';
      form.querySelector('[data-rfq-submit]').click();
      return new Promise((resolve) => setTimeout(() => {
        resolve({
          errorFields: [...form.querySelectorAll('.rfq-field.has-error')].map(f => f.querySelector('.rfq-input').name),
          status: (form.querySelector('[data-rfq-status]').textContent || '').trim(),
          successCard: document.querySelectorAll('.rfq-success').length,
          busy: form.getAttribute('data-rfq-busy'),
          buttonDisabled: form.querySelector('[data-rfq-submit]').disabled
        });
      }, 600));
    `);
    check(
      "空提交被前端拦下，标记 4 个必填错误",
      empty.errorFields.length >= 4,
      JSON.stringify(empty.errorFields),
    );
    check("空提交不显示成功卡", empty.successCard === 0);
    check("空提交后按钮未被永久禁用", empty.buttonDisabled === false);

    const valid = await session.evaluate(`
      const form = document.getElementById('rfq-contact');
      form.querySelector('[name="requirement"]').value = 'NVIDIA H100 SXM';
      form.querySelector('[name="sku"]').value = 'SR-H100-SXM';
      form.querySelector('[name="quantity"]').value = '8';
      form.querySelector('[name="destination"]').value = 'Malaysia, Kuala Lumpur';
      form.querySelector('[name="email"]').value = 'buyer@example.com';
      form.querySelector('[data-rfq-submit]').click();
      return new Promise((resolve) => setTimeout(() => {
        resolve({
          status: (form.querySelector('[data-rfq-status]').textContent || '').trim(),
          successCard: document.querySelectorAll('.rfq-success').length,
          formHidden: document.getElementById('rfq-contact').hidden,
          requirementKept: form.querySelector('[name="requirement"]').value,
          buttonDisabled: form.querySelector('[data-rfq-submit]').disabled,
          buttonText: form.querySelector('[data-rfq-submit]').textContent.trim()
        });
      }, 1500));
    `);
    check("未配置投递通道时不显示成功卡", valid.successCard === 0, JSON.stringify(valid));
    check(
      "未配置通道时显示真实错误状态",
      /not available|not sent|email/i.test(valid.status),
      valid.status,
    );
    check("失败后保留已填内容", valid.requirementKept === "NVIDIA H100 SXM", valid.requirementKept);
    check(
      "失败后按钮恢复可用",
      valid.buttonDisabled === false && /Send enquiry/i.test(valid.buttonText),
      JSON.stringify(valid),
    );
    check("失败后表单仍可见", valid.formHidden === false);

    // 重复提交：连点两次，只允许一个请求在飞行
    const doubleSubmit = await session.evaluate(`
      const form = document.getElementById('rfq-contact');
      let calls = 0;
      const orig = window.fetch;
      window.fetch = function (...a) { if (String(a[0]).includes('/api/rfq')) calls++; return orig.apply(this, a); };
      const btn = form.querySelector('[data-rfq-submit]');
      btn.click(); btn.click(); btn.click();
      return new Promise((resolve) => setTimeout(() => {
        window.fetch = orig;
        resolve({ calls, busyCleared: form.getAttribute('data-rfq-busy') === null });
      }, 1600));
    `);
    check("连点三次只发出一次提交", doubleSubmit.calls === 1, `calls=${doubleSubmit.calls}`);
    check("提交结束后释放 busy 标记", doubleSubmit.busyCleared === true);

    // 成功路径：mock 一个 200 响应，断言成功卡只在收到 ok:true 后出现
    const successPath = await session.evaluate(`
      const form = document.getElementById('rfq-contact');
      const orig = window.fetch;
      window.fetch = function (url, opts) {
        if (String(url).includes('/api/rfq')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, reference: 'SRY-RFQ-TEST-0001', errors: [], message: 'RFQ received.' }), { status: 200, headers: { 'content-type': 'application/json' } }));
        }
        return orig.apply(this, [url, opts]);
      };
      form.querySelector('[data-rfq-submit]').click();
      return new Promise((resolve) => setTimeout(() => {
        window.fetch = orig;
        const card = document.querySelector('.rfq-success');
        resolve({ successCard: card ? 1 : 0, cardText: card ? card.textContent.replace(/\\s+/g, ' ').trim().slice(0, 120) : '' });
      }, 900));
    `);
    check(
      "服务端返回 ok:true 时出现成功卡",
      successPath.successCard === 1,
      JSON.stringify(successPath),
    );
    check(
      "成功卡包含服务端返回的引用号",
      /SRY-RFQ-TEST-0001/.test(successPath.cardText),
      successPath.cardText,
    );
  }

  // -------------------------------------------------------------------------
  console.log("\n[8] 目录 → 详情页 → 版本切换 → 询价上下文（本轮端到端）");
  {
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/buy/ai-gpus", { waitMs: 600 });

    // 1) 从目录点进详情页（走真实链接，不直接 goto）
    const clickedFromCatalog = await session.evaluate(`
      const card = document.getElementById('family-rtx-pro-6000-blackwell');
      if (!card) return { error: 'family card not found' };
      const cta = card.querySelector('.family-card-cta');
      const href = cta.getAttribute('href');
      window.location.href = href;
      return { href };
    `);
    await new Promise((r) => setTimeout(r, 1500));
    const onDetail = await session.evaluate(`
      return {
        url: window.location.pathname + window.location.search,
        selection: (document.querySelector('[data-detail-selection]') || {}).dataset?.detailSelection ?? '',
        hasPicker: !!document.querySelector('[data-version-picker]')
      };
    `);
    check(
      "目录卡片可点进详情页",
      onDetail.url === "/buy/rtx-pro-6000-blackwell",
      JSON.stringify({ clickedFromCatalog, onDetail }),
    );
    check("详情页有版本选择器", onDetail.hasPicker === true);
    check(
      "首次进入未指定版本（不预设第一项）",
      /"kind":"none"/.test(onDetail.selection.replace(/&quot;/g, '"')),
      onDetail.selection,
    );

    // 2) 逐个切换三个版本并检查规格变化
    const versionChecks = [
      { sku: "SR-PRO6000-SE", label: "Server Edition", expect: "1,597 GB/s", reject: "1,792 GB/s" },
      {
        sku: "SR-PRO6000-WS",
        label: "Workstation Edition",
        expect: "1,792 GB/s",
        reject: "1,597 GB/s",
      },
      {
        sku: "SR-PRO6000-MQ",
        label: "Max-Q Workstation Edition",
        expect: "300 W",
        reject: "1,597 GB/s",
      },
    ];
    for (const v of versionChecks) {
      // 点选择器里的选项（真实交互，而不是改 URL）
      await session.goto(BASE + "/buy/rtx-pro-6000-blackwell", { waitMs: 400 });
      const switched = await session.evaluate(`
        const option = document.querySelector('[data-version-sku="${v.sku}"]');
        if (!option) return { error: 'option not found' };
        window.location.href = option.getAttribute('href');
        return { href: option.getAttribute('href') };
      `);
      await new Promise((r) => setTimeout(r, 1400));
      const state = await session.evaluate(`
        const spec = document.getElementById('specifications');
        const form = document.querySelector('form[data-rfq-form]');
        const current = document.querySelector('.version-option.is-current');
        return {
          url: window.location.pathname + window.location.search,
          selection: (document.querySelector('[data-detail-selection]') || {}).dataset?.detailSelection ?? '',
          specText: spec ? spec.innerText : '',
          summary: form ? form.innerText.slice(0, 400) : '',
          sku: form ? form.querySelector('[name="sku"]').value : '',
          config: form ? form.querySelector('[name="config"]').value : '',
          currentLabel: current ? current.innerText.split('\\n')[0] : '',
          coreVisible: form
            ? [...form.querySelectorAll('input:not([type=hidden]), select, textarea')]
                .filter((el) => !el.closest('details')).map((el) => el.name)
            : []
        };
      `);
      check(
        `${v.label}：切换后 URL 带该版本`,
        state.url.includes(`version=${v.sku}`),
        JSON.stringify({ switched, url: state.url }),
      );
      check(
        `${v.label}：规格区间出现 ${v.expect}`,
        state.specText.includes(v.expect),
        state.specText.slice(0, 160),
      );
      check(
        `${v.label}：规格不串入其他版本参数（无 ${v.reject}）`,
        !state.specText.includes(v.reject),
        state.specText.slice(0, 160),
      );
      check(
        `${v.label}：选择器标出当前项`,
        state.currentLabel.includes(v.label),
        state.currentLabel,
      );
      check(
        `${v.label}：询价摘要带上版本`,
        state.summary.includes(v.label),
        state.summary.slice(0, 200),
      );
      check(`${v.label}：表单隐藏字段携带 SKU`, state.sku === v.sku, state.sku);
      check(`${v.label}：表单隐藏字段携带版本名`, state.config === v.label, state.config);
    }

    // 3) 刷新与返回：状态必须由 URL 决定，不依赖内存
    await session.goto(BASE + "/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-WS", { waitMs: 700 });
    const beforeReload = await session.evaluate(
      `return (document.querySelector('[data-detail-selection]')||{}).dataset?.detailSelection ?? '';`,
    );
    await session.send("Page.reload", { ignoreCache: false });
    await new Promise((r) => setTimeout(r, 1600));
    const afterReload = await session.evaluate(`
      return {
        selection: (document.querySelector('[data-detail-selection]')||{}).dataset?.detailSelection ?? '',
        sku: (document.querySelector('form[data-rfq-form] [name="sku"]')||{}).value ?? '',
        specHas1792: (document.getElementById('specifications')||{innerText:''}).innerText.includes('1,792 GB/s')
      };
    `);
    check(
      "刷新后版本状态保持（由 URL 决定）",
      afterReload.selection === beforeReload && afterReload.sku === "SR-PRO6000-WS",
      JSON.stringify({ beforeReload, afterReload }),
    );
    check("刷新后规格仍是该版本", afterReload.specHas1792 === true, JSON.stringify(afterReload));

    // 直接链接（新标签页等价于直接打开带参数的 URL）
    await session.goto(BASE + "/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-MQ", { waitMs: 700 });
    const directLink = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      return {
        sku: form ? form.querySelector('[name="sku"]').value : '',
        config: form ? form.querySelector('[name="config"]').value : ''
      };
    `);
    check(
      "直接链接进入即带正确版本（无需任何点击）",
      directLink.sku === "SR-PRO6000-MQ" && directLink.config === "Max-Q Workstation Edition",
      JSON.stringify(directLink),
    );

    // 4) 协助选型：明确状态，不伪装成已选
    await session.goto(BASE + "/buy/rtx-pro-6000-blackwell?version=none", { waitMs: 700 });
    const assist = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      return {
        selection: (document.querySelector('[data-detail-selection]')||{}).dataset?.detailSelection ?? '',
        sku: form ? form.querySelector('[name="sku"]').value : 'missing',
        summary: form ? form.innerText.slice(0, 300) : '',
        hasSpecs: !!document.getElementById('specifications')
      };
    `);
    check(
      "协助选型状态被解析",
      /"kind":"assist"/.test(assist.selection.replace(/&quot;/g, '"')),
      assist.selection,
    );
    check("协助选型时 SKU 为空", assist.sku === "", JSON.stringify(assist));
    check(
      "协助选型摘要写明版本未定",
      /Not decided/.test(assist.summary),
      assist.summary.slice(0, 200),
    );
    check("协助选型不展示某个版本的规格", assist.hasSpecs === false);

    // 5) 返回按钮回到目录
    await session.send("Runtime.evaluate", { expression: "history.back()" });
    await new Promise((r) => setTimeout(r, 1500));
    const backState = await session.evaluate(`return window.location.pathname;`);
    check("浏览器返回回到上一个页面", backState.startsWith("/buy"), backState);
  }

  // -------------------------------------------------------------------------
  console.log("\n[8b] 询价表单：核心五项 / 补充信息 / 整机条件字段 / 校验恢复");
  {
    await session.setViewport(1440, 900);

    // 目录页：默认只显示五项，补充信息收起
    await session.goto(BASE + "/buy", { waitMs: 600 });
    const buyForm = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      const extra = form.querySelector('details[data-rfq-extra]');
      // 蜜罐 (website) 与隐藏上下文 (source/sku/config) 不算「客户看到的字段」
      const hiddenContext = new Set(['website', 'source', 'sku', 'config']);
      const visible = [...form.querySelectorAll('input:not([type=hidden]), select, textarea')]
        .filter((el) => !el.closest('details') && !hiddenContext.has(el.name))
        .map((el) => el.name);
      return {
        visible,
        extraOpen: extra ? extra.open : null,
        systemRow: !!form.querySelector('[data-rfq-system-row]'),
        buttonLabel: form.querySelector('[data-rfq-submit]').textContent.trim()
      };
    `);
    check(
      "目录页默认只显示 5 个字段",
      buyForm.visible.length === 5,
      JSON.stringify(buyForm.visible),
    );
    check("补充信息折叠区默认收起", buyForm.extraOpen === false, JSON.stringify(buyForm));
    check(
      "提交按钮文案为 Send enquiry",
      buyForm.buttonLabel === "Send enquiry",
      buyForm.buttonLabel,
    );

    // 展开补充信息
    const expanded = await session.evaluate(`
      const extra = document.querySelector('details[data-rfq-extra]');
      extra.querySelector('summary').click();
      return new Promise((r) => setTimeout(() => {
        const names = [...extra.querySelectorAll('input, select, textarea')].map((el) => el.name);
        r({ open: extra.open, names });
      }, 250));
    `);
    check("点击后补充信息展开", expanded.open === true, JSON.stringify(expanded));
    check(
      "补充信息含 Company / Target date / Condition / Notes",
      ["company", "targetDate", "condition", "notes"].every((n) => expanded.names.includes(n)),
      JSON.stringify(expanded.names),
    );

    // 整机页：切到整机需求后出现「每系统卡数」，数量标签跟着变
    await session.goto(BASE + "/systems", { waitMs: 600 });
    const systemPath = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      const path = form.querySelector('[name="path"]');
      for (const opt of path.options) if (opt.value === 'Buy a complete system') path.selectedIndex = opt.index;
      path.dispatchEvent(new Event('change', { bubbles: true }));
      return new Promise((r) => setTimeout(() => {
        const row = form.querySelector('[data-rfq-system-row]');
        const qtyLabel = form.querySelector('label[for$="-quantity"]');
        r({
          pathValue: path.value,
          rowHidden: row ? row.hidden : null,
          hasCardsField: !!form.querySelector('[name="cardsPerSystem"]'),
          qtyLabel: qtyLabel ? qtyLabel.textContent.trim() : ''
        });
      }, 250));
    `);
    check(
      "切到整机需求后出现「每系统卡数」",
      systemPath.rowHidden === false,
      JSON.stringify(systemPath),
    );
    check("整机数量标签改为 systems", /systems/i.test(systemPath.qtyLabel), systemPath.qtyLabel);
    check("每系统卡数字段存在", systemPath.hasCardsField === true);

    /*
     * 摘要里的 Requirement 必须跟着下拉框走。
     * 这是实际报过的 bug：把「Buy GPUs」改成「Buy a complete system」后，
     * 下拉框变了但上方摘要仍写着 Buy GPUs —— 同一张表两处自相矛盾。
     */
    const summarySync = await session.evaluate(`
      return (async () => {
        const form = document.querySelector('form[data-rfq-form]');
        const path = form.querySelector('[name="path"]');
        const summary = form.querySelector('[data-rfq-summary="requirement"]');
        const out = [];
        // 依次切过每一个需求类型，每次都核对摘要与下拉框一致
        for (const opt of path.options) {
          path.selectedIndex = opt.index;
          path.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 60));
          out.push({
            option: opt.textContent.trim(),
            summary: summary ? summary.textContent.trim() : null,
            matches: summary ? summary.textContent.trim() === opt.textContent.trim() : false
          });
        }
        return out;
      })();
    `);
    const mismatched = summarySync.filter((s) => !s.matches);
    check(
      "切换需求类型时摘要的 Requirement 同步更新（逐项核对）",
      summarySync.length > 0 && mismatched.length === 0,
      JSON.stringify(mismatched.length ? mismatched : summarySync),
    );

    // 切回单卡：字段收起
    const backToGpu = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      const path = form.querySelector('[name="path"]');
      for (const opt of path.options) if (opt.value === 'Buy GPUs') path.selectedIndex = opt.index;
      path.dispatchEvent(new Event('change', { bubbles: true }));
      return new Promise((r) => setTimeout(() => {
        const row = form.querySelector('[data-rfq-system-row]');
        const summary = form.querySelector('[data-rfq-summary="requirement"]');
        r({
          rowHidden: row ? row.hidden : null,
          summary: summary ? summary.textContent.trim() : null,
          pathValue: path.value
        });
      }, 250));
    `);
    check("切回单卡后「每系统卡数」收起", backToGpu.rowHidden === true, JSON.stringify(backToGpu));
    check(
      "切回单卡后摘要也回到 Buy GPUs",
      backToGpu.summary === backToGpu.pathValue,
      JSON.stringify(backToGpu),
    );

    // 校验：错误后保留内容且不显示成功
    await session.goto(BASE + "/buy", { waitMs: 600 });
    const invalid = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      form.querySelector('[name="requirement"]').value = 'NVIDIA H100 SXM';
      form.querySelector('[name="quantity"]').value = '4';
      form.querySelector('[name="destination"]').value = '';
      form.querySelector('[name="email"]').value = 'not-an-email';
      form.querySelector('[data-rfq-submit]').click();
      return new Promise((r) => setTimeout(() => {
        r({
          errorFields: [...form.querySelectorAll('.rfq-field.has-error')].map((f) => f.querySelector('.rfq-input').name),
          requirementKept: form.querySelector('[name="requirement"]').value,
          quantityKept: form.querySelector('[name="quantity"]').value,
          successCards: document.querySelectorAll('.rfq-success').length,
          status: (form.querySelector('[data-rfq-status]').textContent || '').trim(),
          buttonDisabled: form.querySelector('[data-rfq-submit]').disabled
        });
      }, 700));
    `);
    check(
      "缺失字段被前端拦下",
      invalid.errorFields.length >= 2,
      JSON.stringify(invalid.errorFields),
    );
    check(
      "校验失败后保留已填内容",
      invalid.requirementKept === "NVIDIA H100 SXM" && invalid.quantityKept === "4",
    );
    check("校验失败不显示成功卡", invalid.successCards === 0);
    check("校验失败不永久禁用按钮", invalid.buttonDisabled === false);

    // 服务端失败（未配置通道）也要保留内容
    const serverFail = await session.evaluate(`
      const form = document.querySelector('form[data-rfq-form]');
      form.querySelector('[name="destination"]').value = 'Malaysia, Kuala Lumpur';
      form.querySelector('[name="email"]').value = 'buyer@example.com';
      form.querySelector('[data-rfq-submit]').click();
      return new Promise((r) => setTimeout(() => {
        r({
          successCards: document.querySelectorAll('.rfq-success').length,
          status: (form.querySelector('[data-rfq-status]').textContent || '').trim(),
          requirementKept: form.querySelector('[name="requirement"]').value,
          buttonText: form.querySelector('[data-rfq-submit]').textContent.trim()
        });
      }, 1800));
    `);
    check(
      "未配置投递通道时不显示成功卡",
      serverFail.successCards === 0,
      JSON.stringify(serverFail),
    );
    check(
      "显示服务端返回的真实原因",
      /not configured|not sent|email/i.test(serverFail.status),
      serverFail.status,
    );
    check(
      "服务端失败后内容仍保留",
      serverFail.requirementKept === "NVIDIA H100 SXM",
      serverFail.requirementKept,
    );
    check("失败后按钮恢复", /Send enquiry/i.test(serverFail.buttonText), serverFail.buttonText);
    /*
     * 到这里为止已发出 2 次真实 POST（[7] 一次 + 本节一次）。
     * 服务端限流是 10 分钟 6 次，因此**后续不要再随意提交** —— 否则
     * 429 会掩盖真正的失败断言（这正是先前那次假失败的成因）。
     * 剩下的提交预算留给末尾专门验证 429 的一节。
     */
  }

  // -------------------------------------------------------------------------
  console.log("\n[8c] 版本选择器：键盘可达与移动端点击");
  {
    // 键盘：Tab 能到版本选项，Enter 可激活
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/buy/rtx-pro-6000-blackwell", { waitMs: 700 });
    const keyboard = await session.evaluate(`
      const option = document.querySelector('[data-version-sku="SR-PRO6000-WS"]');
      option.focus();
      const focused = document.activeElement === option;
      const style = getComputedStyle(option);
      return { focused, outline: style.outlineStyle, href: option.getAttribute('href') };
    `);
    check("版本选项可聚焦", keyboard.focused === true, JSON.stringify(keyboard));
    check("版本选项指向正确的版本 URL", /version=SR-PRO6000-WS/.test(keyboard.href), keyboard.href);

    // 移动端：版本选项点击区域 ≥ 44px，且不横向溢出
    for (const w of [375, 390]) {
      await session.setViewport(w, 844);
      await session.goto(BASE + "/buy/rtx-pro-6000-blackwell", { waitMs: 600 });
      const mobile = await session.evaluate(`
        const opts = [...document.querySelectorAll('.version-option')].map((el) => Math.round(el.getBoundingClientRect().height));
        const chips = [...document.querySelectorAll('.version-chips a')].map((el) => Math.round(el.getBoundingClientRect().height));
        const de = document.documentElement;
        return { opts, minOpt: Math.min(...opts), minChip: chips.length ? Math.min(...chips) : 0, overflow: de.scrollWidth - de.clientWidth };
      `);
      check(`@${w}px 版本选项高度 ≥ 44px`, mobile.minOpt >= 44, JSON.stringify(mobile.opts));
      check(`@${w}px 版本选项无横向溢出`, mobile.overflow <= 1, `overflow=${mobile.overflow}`);
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[9] 图片：加载成功、比例正确、无布局跳动");
  {
    await session.setViewport(1440, 900);
    for (const path of ["/", "/buy", "/systems", "/systems/storage-networking"]) {
      await session.goto(BASE + path, { waitMs: 900 });
      await settleImages(session);
      const imgs = await session.evaluate(`
        const out = [];
        for (const img of document.querySelectorAll('img')) {
          const r = img.getBoundingClientRect();
          const cs = getComputedStyle(img);
          out.push({
            src: img.getAttribute('src'),
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            w: Math.round(r.width),
            h: Math.round(r.height),
            hasDims: img.hasAttribute('width') && img.hasAttribute('height'),
            fit: cs.objectFit,
            loading: img.getAttribute('loading') || 'eager',
            viewport: r.bottom > 0 && r.top < window.innerHeight
          });
        }
        return out;
      `);
      /*
       * 断言口径说明（为什么不再要求「页面里每张图此刻都 complete」）：
       * `loading="lazy"` 的取图时机由浏览器按视口距离决定，且会被滚动节奏影响。
       * 若把「此刻都 complete」当断言，就会间歇性误报 —— 实测 /systems 上零散的
       * Workstation 三张图会随机落在阈值之外（同一次运行里其余 21 张都正常）。
       * 因此这里断言两件**真正说明问题**的事：
       *   (a) 图片资源本身可获取（逐个 HTTP GET 校验，与懒加载时机无关）；
       *   (b) 已经进入或接近视口的图片必须解码成功且未拉伸。
       */
      const fetchCheck = await session.evaluate(`
        const urls = [...new Set([...document.images].map((i) => i.getAttribute('src')).filter(Boolean))];
        return Promise.all(urls.map((u) => fetch(u, { method: 'GET' }).then(
          (r) => ({ u, ok: r.ok, status: r.status }),
          () => ({ u, ok: false, status: 0 })
        )));
      `);
      const unreachable = fetchCheck.filter((f) => !f.ok);
      check(
        `${path} 全部 ${fetchCheck.length} 张图片资源可获取`,
        unreachable.length === 0,
        JSON.stringify(unreachable.slice(0, 3)),
      );

      const inViewport = imgs.filter((i) => i.viewport && (!i.complete || i.naturalWidth === 0));
      check(
        `${path} 视口内图片全部解码成功`,
        inViewport.length === 0,
        JSON.stringify(inViewport.slice(0, 3)),
      );

      // 不被拉伸的正确判据：要么比例一致，要么显式用了 object-fit: cover / contain
      const stretched = imgs.filter((i) => {
        if (!i.naturalWidth || !i.w || i.src.includes("brand")) return false;
        const natural = i.naturalWidth / i.naturalHeight;
        const shown = i.w / i.h;
        const cropped = i.fit === "cover" || i.fit === "contain";
        return !cropped && Math.abs(natural - shown) / natural > 0.02;
      });
      check(
        `${path} 图片未被拉伸（比例一致，或按 object-fit 裁切）`,
        stretched.length === 0,
        JSON.stringify(stretched.slice(0, 3)),
      );

      const noDims = imgs.filter(
        (i) => !i.hasDims && i.src && !i.src.includes("brand") && i.loading === "lazy",
      );
      check(
        `${path} 懒加载图片声明了宽高以避免抖动`,
        noDims.length === 0,
        JSON.stringify(noDims.slice(0, 3).map((i) => i.src)),
      );

      /*
       * 可见图片必须真的画出内容，而不是一块空白/纯黑。
       * 用 canvas 抽样实际像素亮度 —— 这是「图片既加载了、也真的渲染出来了」的
       * 直接证据，能抓住「文件 200 但画面是空的」这类问题。
       */
      const blank = await session.evaluate(`
        const out = [];
        for (const img of document.querySelectorAll('img')) {
          if (!img.complete || img.naturalWidth === 0) continue;
          const r = img.getBoundingClientRect();
          if (r.width < 40 || r.height < 40) continue;
          try {
            const c = document.createElement('canvas');
            c.width = 32; c.height = 18;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, 32, 18);
            const d = ctx.getImageData(0, 0, 32, 18).data;
            let sum = 0;
            for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
            const avg = sum / (d.length / 4);
            if (avg < 4) out.push({ src: img.getAttribute('src'), avg: Math.round(avg) });
          } catch (e) {
            /* 未解码或受限时跳过，不作为失败 */
          }
        }
        return out.slice(0, 5);
      `);
      check(`${path} 没有渲染为空白块的图片`, blank.length === 0, JSON.stringify(blank));

      /*
       * 家族卡片：展开一张卡的版本规格，**不得**把同行其他卡片一起拉长。
       *
       * 这里曾经断言「同一行等高」，并在 CSS 里用 `grid-auto-rows: 1fr` 实现 ——
       * 结果是展开任意一张卡都会撑高整行，旁边的卡跟着变形。断言的意图（底部动作
       * 按钮对齐）本来是对的，实现方式错了。现在改为断言真正要保证的两件事：
       *   1. 静止状态下卡片高度一致（动作按钮对齐在底部）
       *   2. 展开一张卡后，同行其他卡片的高度与顶部位置都不变
       */
      const expandCheck = await session.evaluate(`
        const grid = document.querySelector('.family-grid');
        if (!grid) return null;
        const cards = [...grid.querySelectorAll('.family-card')];
        if (cards.length < 2) return null;

        const snapshot = () =>
          cards.map((c) => Math.round(c.getBoundingClientRect().height));
        const rest = snapshot();
        const restTops = cards.map((c) => Math.round(c.getBoundingClientRect().top));

        // 找第一张带 <details> 的卡片并展开
        const target = cards.find((c) => c.querySelector('details.version-detail'));
        if (!target) return { rest, noDetails: true };
        const idx = cards.indexOf(target);
        const det = target.querySelector('details.version-detail');
        det.open = true;

        return new Promise((r) => setTimeout(() => {
          const after = snapshot();
          const afterTops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
          // 同行 = 与目标卡展开前顶部相同的那些卡
          const sameRow = cards
            .map((c, i) => i)
            .filter((i) => i !== idx && restTops[i] === restTops[idx]);
          const grewSiblings = sameRow.filter((i) => after[i] > rest[i]);
          r({
            targetIndex: idx,
            sameRow,
            targetGrew: after[idx] > rest[idx],
            grewSiblings,
            restHeights: rest, afterHeights: after,
            topsChanged: afterTops.filter((t, i) => t !== restTops[i]).length
          });
        }, 350));
      `);
      if (expandCheck && !expandCheck.noDetails) {
        check(
          `${path} 展开一张家族卡会撑开它自己的规格`,
          expandCheck.targetGrew === true,
          JSON.stringify(expandCheck),
        );
        check(
          `${path} 展开一张家族卡不会拉长同行其他卡片`,
          expandCheck.grewSiblings.length === 0,
          JSON.stringify({
            grew: expandCheck.grewSiblings,
            rest: expandCheck.restHeights,
            after: expandCheck.afterHeights,
          }),
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  console.log("\n[10] 无 JS 时表单仍可用（SSR 直出的 form action）");
  {
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/contact", { waitMs: 500 });
    const noJsForm = await session.evaluate(`
      const form = document.getElementById('rfq-contact');
      return {
        action: form.getAttribute('action'),
        method: form.getAttribute('method'),
        fields: [...form.querySelectorAll('[name]')].map(f => f.name)
      };
    `);
    check("form action 指向 /api/rfq", noJsForm.action === "/api/rfq", noJsForm.action);
    check("form method 为 post", (noJsForm.method ?? "").toLowerCase() === "post");
    check(
      "服务端要用的字段都在表单里",
      ["path", "requirement", "sku", "config", "quantity", "destination", "email", "source"].every(
        (f) => noJsForm.fields.includes(f),
      ),
      JSON.stringify(noJsForm.fields),
    );
  }

  // -------------------------------------------------------------------------
  console.log("\n[11] 减少动态效果偏好");
  {
    await session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await session.setViewport(1440, 900);
    await session.goto(BASE + "/", { waitMs: 700 });
    const reduced = await session.evaluate(`
      const body = document.body;
      const revealed = [...document.querySelectorAll('.reveal')];
      const sectionOpacity = getComputedStyle(document.querySelector('.section') || body).opacity;
      return {
        revealReady: body.classList.contains('reveal-ready'),
        revealCount: revealed.length,
        firstOpacity: revealed.length ? getComputedStyle(revealed[0]).opacity : '1',
        sectionOpacity
      };
    `);
    check(
      "reduce 偏好下不启用滚动淡入",
      reduced.revealReady === false && reduced.revealCount === 0,
      JSON.stringify(reduced),
    );
    check(
      "正文在 reduce 下立即可见（opacity=1）",
      reduced.firstOpacity === "1" && reduced.sectionOpacity === "1",
      JSON.stringify(reduced),
    );
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  }

  // -------------------------------------------------------------------------
  console.log("\n[11b] 淡入不得让正文缺席（无头 Chrome 截图抓到的真实问题）");
  {
    await session.setViewport(1440, 900);
    for (const path of ["/", "/buy", "/systems", "/contact"]) {
      await session.goto(BASE + path, { waitMs: 1600 });
      const hidden = await session.evaluate(`
        const out = [];
        for (const el of document.querySelectorAll('.section-head, .product-card, .gpu-card, .entry-card, .company-card, .evidence-strip, .rfq-form')) {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.opacity) < 0.9) {
            out.push({ cls: String(el.className).slice(0, 60), opacity: cs.opacity });
          }
        }
        return out.slice(0, 5);
      `);
      check(
        `${path} 加载完成后所有正文区块 opacity=1（无不可见内容）`,
        hidden.length === 0,
        JSON.stringify(hidden),
      );
    }

    // 标题必须在首屏立刻可见，不依赖滚动
    await session.goto(BASE + "/", { waitMs: 500 });
    const headings = await session.evaluate(`
      const out = [];
      for (const h of document.querySelectorAll('h1, h2')) {
        const cs = getComputedStyle(h);
        out.push({ text: (h.textContent || '').trim().slice(0, 30), opacity: cs.opacity });
      }
      return out.filter((h) => parseFloat(h.opacity) < 0.9);
    `);
    check("首页所有 h1/h2 不参与淡入（立即可见）", headings.length === 0, JSON.stringify(headings));
  }

  // -------------------------------------------------------------------------
  console.log("\n[12] 截图证据");
  {
    const shots = [
      { path: "/", name: "home", vp: { w: 1440, h: 900 } },
      { path: "/", name: "home-mobile", vp: { w: 390, h: 844 } },
      { path: "/buy", name: "buy", vp: { w: 1440, h: 900 } },
      { path: "/buy/ai-gpus", name: "buy-ai-gpus", vp: { w: 1440, h: 900 } },
      { path: "/buy/ai-gpus", name: "buy-ai-gpus-mobile", vp: { w: 390, h: 844 } },
      { path: "/systems", name: "systems", vp: { w: 1440, h: 900 } },
      {
        path: "/systems/storage-networking",
        name: "systems-storage-networking",
        vp: { w: 1440, h: 900 },
      },
      { path: "/systems/workstations", name: "systems-workstations", vp: { w: 1440, h: 900 } },
      { path: "/contact", name: "contact", vp: { w: 1440, h: 900 } },
      { path: "/contact", name: "contact-mobile", vp: { w: 390, h: 844 } },
      { path: "/purchasing", name: "purchasing", vp: { w: 1440, h: 900 } },
      { path: "/purchasing/compliance", name: "compliance", vp: { w: 1440, h: 900 } },
      { path: "/company", name: "company", vp: { w: 1440, h: 900 } },
      { path: "/programs", name: "programs", vp: { w: 1440, h: 900 } },
      { path: "/local", name: "local", vp: { w: 1440, h: 900 } },
      { path: "/buy/gaming-gpus", name: "buy-gaming-gpus", vp: { w: 1440, h: 900 } },
      // 本轮新增：详情页三个版本状态 + 移动端
      {
        path: "/buy/rtx-pro-6000-blackwell",
        name: "detail-no-version",
        vp: { w: 1440, h: 900 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-SE",
        name: "detail-server-edition",
        vp: { w: 1440, h: 900 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-WS",
        name: "detail-workstation-edition",
        vp: { w: 1440, h: 900 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell?version=SR-PRO6000-MQ",
        name: "detail-maxq-edition",
        vp: { w: 1440, h: 900 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell?version=none",
        name: "detail-assist",
        vp: { w: 1440, h: 900 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell",
        name: "detail-mobile",
        vp: { w: 390, h: 844 },
      },
      {
        path: "/buy/rtx-pro-6000-blackwell",
        name: "detail-tablet-768",
        vp: { w: 768, h: 1024 },
      },
      { path: "/buy", name: "buy-mobile-375", vp: { w: 375, h: 812 } },
      { path: "/buy", name: "buy-desktop-1024", vp: { w: 1024, h: 768 } },
      { path: "/buy", name: "buy-zoom-200", vp: { w: 720, h: 900 } },
    ];
    for (const shot of shots) {
      await session.setViewport(shot.vp.w, shot.vp.h);
      await session.goto(BASE + shot.path, { waitMs: 700 });
      // 截图前先让懒加载图片全部解码，否则全页截图里会出现空白块（不是页面缺陷）
      await settleImages(session);
      const file = join(OUT_DIR, `${shot.name}.png`);
      await session.screenshot(file, { fullPage: true });
      console.log(`  shot  ${file}`);
    }
    // 移动菜单打开态
    await session.setViewport(390, 844);
    await session.goto(BASE + "/", { waitMs: 600 });
    await session.evaluate(`
      document.getElementById('btnMenu').click();
      return new Promise(r => setTimeout(r, 500));
    `);
    await session.screenshot(join(OUT_DIR, "mobile-menu-open.png"), { fullPage: false });
    console.log(`  shot  ${join(OUT_DIR, "mobile-menu-open.png")}`);
    pass++;
  }

  // -------------------------------------------------------------------------
  console.log("\n[13] 站内链接完整性（同源路径全部可达）");
  {
    const paths = new Set();
    for (const p of [
      "/",
      "/buy",
      "/systems",
      "/contact",
      "/purchasing",
      "/company",
      "/programs",
      "/local",
      "/purchasing/kyc",
      "/purchasing/compliance",
      "/buy/ai-gpus",
      "/buy/gaming-gpus",
      "/buy/rtx-pro-6000-blackwell",
      "/systems/ai-servers",
      "/systems/workstations",
      "/systems/gaming",
      "/systems/storage-networking",
    ]) {
      await session.goto(BASE + p, { waitMs: 350 });
      const hrefs = await session.evaluate(`
        return [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href'));
      `);
      for (const h of hrefs) paths.add(h.split("#")[0].split("?")[0]);
    }
    const list = [...paths].filter((p) => p && p !== "/api/rfq");
    let broken = 0;
    for (const p of list) {
      const res = await fetch(BASE + p, { redirect: "manual" });
      if (res.status !== 200) {
        broken++;
        check(`站内链接 ${p} 可达`, false, `got ${res.status}`);
      }
      await res.arrayBuffer();
    }
    check(`全部 ${list.length} 个站内链接目标可达`, broken === 0);
  }

  // -------------------------------------------------------------------------
  console.log("\n[14] 服务端限流（放在最后：会刻意耗尽提交预算）");
  {
    /*
     * 这一步故意把 10 分钟 6 次的预算打完，确认第 7 次拿到 429 与真实提示，
     * 而不是假装成功。因为它会污染后续提交，所以固定放在整个流程的最后。
     */
    let sawRateLimit = false;
    let lastStatus = 0;
    let lastMessage = "";
    for (let i = 0; i < 6 && !sawRateLimit; i++) {
      const res = await fetch(BASE + "/api/rfq", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          path: "Buy GPUs",
          requirement: `rate limit probe ${i}`,
          quantity: "1",
          destination: "Malaysia",
          email: "ratelimit@example.com",
        }),
      });
      const json = await res.json().catch(() => ({}));
      lastStatus = res.status;
      lastMessage = json.message ?? "";
      if (res.status === 429) sawRateLimit = true;
      else if (res.status !== 503 && res.status !== 200) {
        check(`限流探测第 ${i + 1} 次返回预期状态`, false, `got ${res.status}`);
      }
    }
    check("连续提交后触发 429 限流", sawRateLimit, `last=${lastStatus} ${lastMessage}`);
    check("429 提示给出替代联系方式（不是成功）", /too many|email/i.test(lastMessage), lastMessage);
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
  }
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  await session.close();
  chrome.kill();
}

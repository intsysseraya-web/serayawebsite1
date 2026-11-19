/**
 * 全站共享页面骨架（header / 导航 / 抽屉 / 搜索面板 / 页脚）。
 *
 * 导航（2026-11-13 改版：标签与 URL 见下）：
 *   GPU’s · Systems · We are buying · Company   ＋ 主按钮 Get a quote
 *
 * 为什么**取消 Products 下拉**：下拉把主营的 GPU 业务藏在二级菜单里，且是
 * 「子项挤在同一行 / 需要 hover 才能进入」这类问题的唯一来源。改成顶层四项后：
 *   - 主营 GPU 业务直接可见，一次点击可达 `/gpu`
 *   - 没有浮层，就没有浮层在手机 / 平板 / 桌面上表现不一致的可能
 *   - 移动端不再需要手风琴，每个分类天然独立成行，点击区域 ≥ 44px
 * 采购线与收购线分别落在 `/gpu` 与 `/we-are-buying`；旧 `/gpu`、`/we-are-buying`
 * 由 `src/server.ts` 的 LEGACY_REDIRECTS 做 301，不在这里保留第二条路径。
 *
 * 约束：script.js 依赖下列 id/class 与 data 属性，改动会静默破坏交互 ——
 *   #btnMenu #mobileDrawer #btnCloseMenu #btnSearch #searchPanel #btnCloseSearch #q
 *   .mobile-drawer .overlay-panel .overlay-head .mobile-nav .search-input .icon-btn
 *   [data-drawer-panel] [data-overlay-sheet]（焦点圈定与恢复用）
 *
 * `#cartPanel` 已随商品层重做移除（原为死 UI：没有任何按钮能打开它）。
 */

export const BRAND = "Seraya System Integration";

/** 已确认的对外邮箱（方案 §8.4）。放在这里以便 chrome / 页脚 / 各页引用同一常量。 */
export const CONTACT_EMAIL = "felix.mm@seraya.systems";

export type NavKey =
  | "home"
  | "buy"
  | "purchasing"
  | "systems"
  | "programs"
  | "company"
  | "contact"
  | "local"
  | "legal";

/**
 * 主导航：GPU’s → 整机（含二级）→ 我们收购 → 公司。
 *
 * 标签由 CY 指定（2026-11-13）：`GPU’s`、`We are buying`。视觉大写由
 * `legacy/styles.css` 的 `.main-nav { text-transform: uppercase }` 统一实现，
 * 源码保持词首大写，避免出现「大小写写死在 HTML、改样式也改不动」的情况。
 *
 * 2026-11-19 恢复**一级下拉**（SYSTEMS ▾ → Complete Systems / AI Sovereignty）：
 * 上一轮曾整体取消下拉，原因是 hover 浮层在触屏上不可用。这次按 CY 要求加回，
 * 但不依赖 hover：桌面 hover/focus 打开，触屏与键盘用单独的 caret 按钮开合，
 * Esc 关闭，焦点移出自动收起。移动端不加浮层，直接在抽屉里展开两个子项。
 *
 * 为什么没有 Contact：右侧主按钮 `Get a quote` 指向的就是 `/contact`，
 * 再放一个 Contact 文字项等于同一目的地的第二个入口，反而让导航显得重复。
 */
type NavChild = { label: string; href: string; description: string };
type NavItem = { key: NavKey; label: string; href: string; children?: NavChild[] };

const NAV: NavItem[] = [
  { key: "buy", label: "GPU’s", href: "/gpu" },
  {
    key: "systems",
    label: "Systems",
    href: "/systems",
    children: [
      {
        label: "Complete Systems",
        href: "/systems",
        description: "Servers, workstations, storage and networking",
      },
      {
        label: "AI Sovereignty",
        href: "/ai-sovereignty",
        description: "AI deployed inside your own boundary",
      },
    ],
  },
  { key: "purchasing", label: "We are buying", href: "/we-are-buying" },
  { key: "company", label: "Company", href: "/company" },
];

/** 主按钮文案：全站统一，避免 RFQ / Get a quote / Request bulk quote 三种说法混用。 */
export const PRIMARY_CTA_LABEL = "Get a quote";

/** 公告条：两条线的响应承诺 */
export function announcementBar(): string {
  return `
    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/contact">${PRIMARY_CTA_LABEL} &mdash; we answer complete RFQs within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/we-are-buying">Selling a GPU lot? Committed decision within 12 hours, business days</a>
      </div>
    </div>`;
}

function navLinks(current: NavKey, ariaCurrent = true): string {
  return NAV.map((item) => {
    const isCurrent = ariaCurrent && item.key === current;
    const currentAttr = isCurrent ? ' aria-current="page"' : "";

    if (!item.children) {
      return `          <a href="${item.href}" data-nav="${item.key}"${currentAttr}>${item.label}</a>`;
    }

    const menuId = `nav-menu-${item.key}`;
    return `          <div class="nav-item--menu" data-nav-group="${item.key}"${isCurrent ? ' data-current="true"' : ""}>
            <a href="${item.href}" data-nav="${item.key}"${currentAttr}>${item.label}</a>
            <button type="button" class="nav-caret-btn" aria-label="Open ${item.label} menu" aria-haspopup="true" aria-expanded="false" aria-controls="${menuId}">
              <span class="nav-caret" aria-hidden="true"></span>
            </button>
            <div class="nav-menu" id="${menuId}" role="menu" aria-label="${item.label}" hidden>
${item.children
  .map(
    (c) =>
      `              <a role="menuitem" class="nav-menu-item" href="${c.href}"><strong>${c.label}</strong><span>${c.description}</span></a>`,
  )
  .join("\n")}
            </div>
          </div>`;
  }).join("\n");
}

/** 移动抽屉：不放浮层，子项直接展开在父项下面（触屏上一律可达） */
function mobileNavLinks(): string {
  return NAV.map((item) => {
    const rows = [
      `          <a href="${item.href}" data-nav="${item.key}">${item.label}</a>`,
    ];
    if (item.children) {
      for (const c of item.children) {
        rows.push(`          <a class="mobile-subnav" href="${c.href}">${c.label}</a>`);
      }
    }
    return rows.join("\n");
  }).join("\n");
}

export function siteHeader(current: NavKey): string {
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="${BRAND}" /></a>
        <nav class="main-nav" aria-label="Primary">
${navLinks(current)}
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>
          <a class="btn btn-primary header-cta" href="/contact">${PRIMARY_CTA_LABEL}</a>
          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">
      <div class="mobile-drawer-panel" data-drawer-panel>
        <div class="overlay-head">
          <strong>Navigate</strong>
          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>
        </div>
        <nav class="mobile-nav" aria-label="Mobile primary">
${mobileNavLinks()}
        </nav>
        <div class="mobile-nav-extra">
          <a class="btn btn-primary" href="/contact">${PRIMARY_CTA_LABEL}</a>
          <ul class="mobile-nav-secondary">
            <li><a href="/programs">Programs</a></li>
            <li><a href="/local">Local builds &amp; trade-ins</a></li>
            <li><a href="/we-are-buying/kyc">Entity &amp; KYC pack</a></li>
            <li><a href="/we-are-buying/compliance">Compliance &amp; end-use</a></li>
          </ul>
        </div>
      </div>
    </div>`;
}

export function searchPanel(placeholder: string): string {
  return `
    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">
      <div class="overlay-sheet search-sheet" data-overlay-sheet>
        <div class="overlay-head">
          <strong>Search</strong>
          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>
        </div>
        <label class="muted" for="q">Keyword</label>
        <input class="search-input" id="q" type="search" placeholder="${placeholder}" autocomplete="off" />
      </div>
    </div>`;
}

export function siteFooter(): string {
  return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>${BRAND}</h4>
          <ul class="footer-links">
            <li><a href="/company">Kuala Lumpur, Malaysia</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/local">Local builds &amp; trade-in</a></li>
            <li><a href="/gpu">Buy GPUs</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Purchasing</h4>
          <ul class="footer-links">
            <li><a href="/we-are-buying">What we buy</a></li>
            <li><a href="/we-are-buying/kyc">Entity &amp; KYC pack</a></li>
            <li><a href="/we-are-buying/compliance">Compliance &amp; end-use</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Enterprise</h4>
          <ul class="footer-links">
            <li><a href="/systems">Reference systems</a></li>
            <li><a href="/ai-sovereignty">AI sovereignty</a></li>
            <li><a href="/programs">Programs</a></li>
            <li><a href="/we-are-buying/compliance#privacy">Privacy &amp; data handling</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="muted">&copy; 2026 ${BRAND}</span>
        <a class="muted" href="/">Home</a>
      </div>
    </footer>`;
}

/** 一次拼出公告条 ＋ 页头 ＋ 抽屉 ＋ 搜索面板 ＋ WhatsApp 浮动按钮。页面把它们放在 BODY_HTML 顶部。 */
export function siteChrome(current: NavKey, searchPlaceholder: string): string {
  return `${announcementBar()}
${siteHeader(current)}
${searchPanel(searchPlaceholder)}
${whatsappFab()}`;
}

/**
 * WhatsApp 浮动入口（2026-11-19 新增，全站常驻）。
 *
 * 号码目前是**占位**：CY 之后给真实号码，只改这一行常量即可，链接与文案会自动跟随。
 * 用 wa.me 深链而不是自建聊天窗口：不需要后端、不会在页面里暴露第三方脚本。
 */
export const WHATSAPP_NUMBER = "60123456789";

const WHATSAPP_PREFILL = "Hi Seraya, I would like to ask about GPU supply.";

export function whatsappFab(): string {
  return `
    <a class="wa-fab" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}"
       target="_blank" rel="noopener noreferrer" aria-label="Chat with Seraya on WhatsApp" title="Chat on WhatsApp">
      <svg class="wa-fab-icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.708.306 1.261.489 1.692.626.71.226 1.357.194 1.868.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>`;
}

/** 跳转到正文的无障碍链接，全站统一放最前 */
export function skipLink(): string {
  return `    <a class="skip-link" href="#main">Skip to content</a>`;
}

/**
 * 缩写说明表。首次出现 RFQ / BOM / ITAD / DOA / RMA 等缩写的地方，
 * 页面必须能就近查到解释（线检项 5）。
 */
export function abbreviationGlossary(items: { term: string; meaning: string }[]): string {
  return `
        <div class="glossary" aria-label="Abbreviations used on this page">
${items
  .map((i) => `          <div class="glossary-item"><dt>${i.term}</dt><dd>${i.meaning}</dd></div>`)
  .join("\n")}
        </div>`;
}

/** 每页都要带上的 canonical 与三张样式表（修复层必须最后加载）。
 *
 *  页头展示字体的预载不走 head：TanStack Start 会把 `rel="preload"` 的 link 丢掉
 *  （实测 head 里只剩 canonical 与样式表）。改由 `src/server.ts` 在 HTML 响应上
 *  发 `Link: …; rel=preload; as=font` 头，与托管方式无关，且可实测。
 */
type HeadLink = { rel: string; href: string };

export function routeLinks(
  canonicalPath: string,
  legacyCss: string,
  fixesCss: string,
): HeadLink[] {
  return [
    { rel: "canonical", href: `https://seraya.systems${canonicalPath}` },
    { rel: "stylesheet", href: "/legacy/styles.css" },
    { rel: "stylesheet", href: legacyCss },
    { rel: "stylesheet", href: fixesCss },
  ];
}

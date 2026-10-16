/**
 * 全站共享页面骨架（header / 导航 / 抽屉 / 搜索面板 / 页脚）。
 *
 * 导航（2026-11 线检项 A 与 5 重做）：
 *   GPU Wholesale · Systems · Sell GPUs · Company · Contact   ＋ 主按钮 Get a quote
 *
 * 为什么**取消 Products 下拉**：下拉把主营的 GPU 业务藏在二级菜单里，且是
 * 「子项挤在同一行 / 需要 hover 才能进入」这类问题的唯一来源。改成顶层五项后：
 *   - 主营 GPU 业务直接可见，一次点击可达 `/buy`
 *   - 没有浮层，就没有浮层在手机 / 平板 / 桌面上表现不一致的可能
 *   - 移动端不再需要手风琴，每个分类天然独立成行，点击区域 ≥ 44px
 * 旧的 `/systems` 等 URL 全部保留，只是入口层级变浅（`/buy` 下有二级分类导航）。
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

type NavItem = { key: NavKey; label: string; href: string };

/**
 * 主导航：标签与 URL 一一对应，无二级浮层。
 * 顺序按业务权重：GPU 批发 → 整机 → 收购 → 公司。
 *
 * 为什么没有 Contact：右侧主按钮 `Get a quote` 指向的就是 `/contact`，
 * 再放一个 Contact 文字项等于同一目的地的第二个入口，反而让导航显得重复。
 * 联系页仍可从三处到达：主按钮、页脚 Company 栏的 Contact、各页的询价区块。
 */
const NAV: NavItem[] = [
  { key: "buy", label: "GPU Wholesale", href: "/buy" },
  { key: "systems", label: "Systems", href: "/systems" },
  { key: "purchasing", label: "Sell GPUs", href: "/purchasing" },
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
        <a href="/purchasing">Selling a GPU lot? Committed decision within 12 hours, business days</a>
      </div>
    </div>`;
}

function navLinks(current: NavKey, ariaCurrent = true): string {
  return NAV.map((item) => {
    const isCurrent = ariaCurrent && item.key === current;
    return `          <a href="${item.href}"${isCurrent ? ' aria-current="page"' : ""}>${item.label}</a>`;
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
${navLinks(current, false)}
        </nav>
        <div class="mobile-nav-extra">
          <a class="btn btn-primary" href="/contact">${PRIMARY_CTA_LABEL}</a>
          <ul class="mobile-nav-secondary">
            <li><a href="/programs">Programs</a></li>
            <li><a href="/local">Local builds &amp; trade-ins</a></li>
            <li><a href="/purchasing/kyc">Entity &amp; KYC pack</a></li>
            <li><a href="/purchasing/compliance">Compliance &amp; end-use</a></li>
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
            <li><a href="/buy">Buy GPUs</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Purchasing</h4>
          <ul class="footer-links">
            <li><a href="/purchasing">What we buy</a></li>
            <li><a href="/purchasing/kyc">Entity &amp; KYC pack</a></li>
            <li><a href="/purchasing/compliance">Compliance &amp; end-use</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Enterprise</h4>
          <ul class="footer-links">
            <li><a href="/systems">Reference systems</a></li>
            <li><a href="/programs">Programs</a></li>
            <li><a href="/purchasing/compliance#privacy">Privacy &amp; data handling</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="muted">&copy; 2026 ${BRAND}</span>
        <a class="muted" href="/">Home</a>
      </div>
    </footer>`;
}

/** 一次拼出公告条 ＋ 页头 ＋ 抽屉 ＋ 搜索面板。页面把它们放在 BODY_HTML 顶部。 */
export function siteChrome(current: NavKey, searchPlaceholder: string): string {
  return `${announcementBar()}
${siteHeader(current)}
${searchPanel(searchPlaceholder)}`;
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

/** 每页都要带上的 canonical 与三张样式表（修复层必须最后加载）。 */
export function routeLinks(
  canonicalPath: string,
  legacyCss: string,
  fixesCss: string,
): { rel: string; href: string }[] {
  return [
    { rel: "canonical", href: `https://seraya.systems${canonicalPath}` },
    { rel: "stylesheet", href: "/legacy/styles.css" },
    { rel: "stylesheet", href: legacyCss },
    { rel: "stylesheet", href: fixesCss },
  ];
}

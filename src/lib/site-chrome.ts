// 全站共享页面骨架（header / 导航 / 抽屉 / 搜索面板 / 页脚）。
//
// 依据《SERAYA 网站改版方案 v1.0》§2 与 §6 P0-6：
//   - 导航 5 项与 URL 一一对应：Purchasing · Systems · Programs · Company · Contact
//   - 品牌名全站统一为单数 `Seraya System Integration`（与注册名一致）
//   - 页脚三栏：Purchasing / Enterprise / Company，Local 入页脚
//   - 页脚**不放注册号／税号**（决定 3）
//
// 约束：script.js 依赖下列 id/class，改动会静默破坏交互 ——
//   #btnMenu #mobileDrawer #btnCloseMenu #btnSearch #searchPanel #btnCloseSearch #q
//   .mobile-drawer .overlay-panel .overlay-head .mobile-nav .search-input .icon-btn
// `#cartPanel` 已随商品层重做移除（原为死 UI：没有任何按钮能打开它）。

export const BRAND = "Seraya System Integration";

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

/** 主导航：标签与 URL 必须一一对应（§2） */
/** 主导航（2026-10-16 补充方案 §一）：Buy 与 Systems 合并为 Products 下拉。
 *  Sell GPU Lots 与 Contact 保持独立；移动端在汉堡内平铺展开同一层级。
 */
type NavChild = { label: string; href: string };
const NAV: { key: NavKey; label: string; href: string; children?: NavChild[] }[] = [
  {
    key: "systems",
    label: "Products",
    href: "/systems",
    children: [
      { label: "Wholesale GPUs", href: "/buy" },
      { label: "Systems", href: "/systems" },
      { label: "AI Servers", href: "/systems/ai-servers" },
      { label: "AI Workstations", href: "/systems/workstations" },
      { label: "Gaming Systems", href: "/systems/gaming" },
      { label: "Storage & Networking", href: "/systems/storage-networking" },
    ],
  },
  { key: "purchasing", label: "Sell GPU Lots", href: "/purchasing" },
  { key: "company", label: "Company", href: "/company" },
  { key: "contact", label: "Contact", href: "/contact" },
];

/** 公告条：两条线的响应承诺（§3 第 0 行） */
export function announcementBar(): string {
  return `
    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/contact">Response to complete RFQs within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/buy">Wholesale GPU supply &mdash; request a bulk quote</a>
      </div>
    </div>`;
}

function navLinks(current: NavKey, className: string, ariaCurrent = true): string {
  return NAV.map((item) => {
    const isCurrent = ariaCurrent && item.key === current;
    const self = `          <a href="${item.href}"${isCurrent ? ' aria-current="page"' : ""}>${item.label}</a>`;
    if (!item.children) return self;
    const kids = item.children
      .map((c) => `            <a href="${c.href}">${c.label}</a>`)
      .join("\n");
    return `          <div class="nav-dropdown">


${self}


            <div class="nav-dropdown-menu">


${kids}


            </div>


          </div>`;
  }).join("\n");
}

export function siteHeader(current: NavKey): string {
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="${BRAND}" /></a>
        <nav class="main-nav" aria-label="Primary">
${navLinks(current, "main-nav")}
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>
          <a class="icon-btn header-rfq-link" href="/buy" aria-label="Request a bulk quote">RFQ</a>
          <button type="button" class="icon-btn mobile-menu-btn" id="btnMenu" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer" id="mobileDrawer" hidden role="dialog" aria-modal="true" aria-label="Mobile menu">
      <div class="mobile-drawer-panel">
        <div class="overlay-head">
          <strong>Navigate</strong>
          <button type="button" class="icon-btn" id="btnCloseMenu" aria-label="Close menu">X</button>
        </div>
        <nav class="mobile-nav">
${navLinks(current, "mobile-nav", false)}
        </nav>
      </div>
    </div>`;
}

export function searchPanel(placeholder: string): string {
  return `
    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">
      <div class="overlay-sheet search-sheet">
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

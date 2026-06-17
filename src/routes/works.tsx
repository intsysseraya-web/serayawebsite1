import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";

type Sku = {
  code: string;
  tagline: string;
  cpu?: string;
  gpu?: string;
  ram?: string;
  storage?: string;
  fabric?: string;
  ports?: string;
  lead: string;
  badge?: string;
  img: string;
};

type Section = {
  id: string;
  title: string;
  blurb: string;
  skus: Sku[];
};

const IMG = {
  c220: "/static/sku/sr-c220.jpg",
  c450: "/static/sku/sr-c450.jpg",
  c880: "/static/sku/sr-c880.jpg",
  g410: "/static/sku/sr-g410.jpg",
  g780: "/static/sku/sr-g780.jpg",
  g990: "/static/sku/sr-g990.jpg",
  s240: "/static/sku/sr-s240.jpg",
  s560: "/static/sku/sr-s560.jpg",
  s980: "/static/sku/sr-s980.jpg",
  n100: "/static/sku/sr-n100.jpg",
  n400: "/static/sku/sr-n400.jpg",
  nib: "/static/sku/sr-n-ib.jpg",
  w310: "/static/sku/sr-w310.jpg",
  w620: "/static/sku/sr-w620.jpg",
  w180: "/static/sku/sr-w180.jpg",
};

const SECTIONS: Section[] = [
  {
    id: "compute",
    title: "Compute",
    blurb: "General-purpose rack nodes for virtualization, databases and mixed workloads.",
    skus: [
      { code: "SR-C220", tagline: "Dual-socket rack node", cpu: "2× Xeon Silver 4410Y (12C)", ram: "256 GB DDR5 ECC", storage: "2× 1.92 TB NVMe", lead: "3 weeks", img: IMG.c220 },
      { code: "SR-C450", tagline: "Virtualization host", cpu: "2× EPYC 9354 (32C)", ram: "768 GB DDR5 ECC", storage: "4× 3.84 TB NVMe", lead: "4 weeks", badge: "Popular", img: IMG.c450 },
      { code: "SR-C880", tagline: "High-density HPC node", cpu: "2× EPYC 9654 (96C)", ram: "1.5 TB DDR5 ECC", storage: "8× 7.68 TB NVMe", lead: "6 weeks", img: IMG.c880 },
    ],
  },
  {
    id: "gpu",
    title: "GPU / AI",
    blurb: "Inference, fine-tuning and large-model training, single-node to 8-way NVLink.",
    skus: [
      { code: "SR-G410", tagline: "Inference & fine-tune entry", cpu: "1× Xeon Gold 6448Y", gpu: "2× L40S 48 GB", ram: "256 GB DDR5", storage: "2× 3.84 TB NVMe", lead: "4 weeks", badge: "Quick ship", img: IMG.g410 },
      { code: "SR-G780", tagline: "Multi-GPU training tower", cpu: "2× EPYC 9474F", gpu: "4× H100 NVL 94 GB", ram: "1 TB DDR5 ECC", storage: "4× 7.68 TB NVMe", lead: "6 weeks", badge: "Popular", img: IMG.g780 },
      { code: "SR-G990", tagline: "Large-model training node", cpu: "2× EPYC 9654", gpu: "8× H200 SXM (NVLink)", ram: "2 TB DDR5 ECC", storage: "8× 7.68 TB NVMe + IB HDR", lead: "10 weeks", badge: "Flagship", img: IMG.g990 },
    ],
  },
  {
    id: "storage",
    title: "Storage",
    blurb: "All-flash pools, capacity tiers and backup targets, NVMe through SATA.",
    skus: [
      { code: "SR-S240", tagline: "NVMe shared pool", cpu: "1× Xeon Silver 4410Y", ram: "128 GB", storage: "24× 7.68 TB NVMe (~184 TB)", lead: "4 weeks", img: IMG.s240 },
      { code: "SR-S560", tagline: "All-flash archive + replica", cpu: "2× EPYC 9334", ram: "512 GB", storage: "36× 15.36 TB NVMe (~550 TB)", lead: "6 weeks", img: IMG.s560 },
      { code: "SR-S980", tagline: "High-density object / backup", cpu: "2× Xeon Gold 6438N", ram: "256 GB", storage: "60× 22 TB SATA (~1.3 PB)", lead: "8 weeks", badge: "Capacity", img: IMG.s980 },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    blurb: "25 / 100 / 400 GbE switching and InfiniBand fabric for AI clusters.",
    skus: [
      { code: "SR-N100", tagline: "25/100 G top-of-rack", ports: "32× 100 GbE QSFP28", fabric: "Cut-through, 6.4 Tb/s", lead: "3 weeks", img: IMG.n100 },
      { code: "SR-N400", tagline: "400 G spine switch", ports: "32× 400 GbE QSFP-DD", fabric: "25.6 Tb/s non-blocking", lead: "5 weeks", img: IMG.n400 },
      { code: "SR-N-IB", tagline: "InfiniBand HDR / NDR fabric", ports: "40× NDR 400 Gb/s", fabric: "SHARP in-network compute", lead: "6 weeks", badge: "AI fabric", img: IMG.nib },
    ],
  },
  {
    id: "workstation",
    title: "Workstation",
    blurb: "Engineering and content workstations, quiet enough for the office.",
    skus: [
      { code: "SR-W310", tagline: "Engineering workstation", cpu: "Threadripper 7960X (24C)", gpu: "RTX 5000 Ada 32 GB", ram: "128 GB DDR5", storage: "2× 2 TB NVMe", lead: "2 weeks", badge: "Quick ship", img: IMG.w310 },
      { code: "SR-W620", tagline: "Creation & simulation flagship", cpu: "Threadripper Pro 7995WX (96C)", gpu: "2× RTX 6000 Ada 48 GB", ram: "512 GB DDR5 ECC", storage: "4× 4 TB NVMe", lead: "3 weeks", img: IMG.w620 },
      { code: "SR-W180-EDGE", tagline: "Silent edge node", cpu: "Ryzen 9 7950X", gpu: "RTX 4000 SFF Ada 20 GB", ram: "64 GB DDR5", storage: "1× 4 TB NVMe", lead: "2 weeks", badge: "Edge", img: IMG.w180 },
    ],
  },
];


function specRows(s: Sku): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  if (s.cpu) rows.push(["CPU", s.cpu]);
  if (s.gpu) rows.push(["GPU", s.gpu]);
  if (s.ram) rows.push(["RAM", s.ram]);
  if (s.storage) rows.push(["Disk", s.storage]);
  if (s.ports) rows.push(["Ports", s.ports]);
  if (s.fabric) rows.push(["Fabric", s.fabric]);
  return rows;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCard(s: Sku) {
  const rows = specRows(s)
    .map(
      ([k, v]) =>
        `<div class="spec-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`,
    )
    .join("");
  return `
        <article class="product-card sku-card">
          <div class="product-card-media">
            ${s.badge ? `<span class="badge">${escapeHtml(s.badge)}</span>` : ""}
            <img src="${s.img}" alt="" loading="lazy" />
            <div class="media-tint" aria-hidden="true"></div>
          </div>
          <div class="product-card-body">
            <div class="sku-head">
              <span class="sku-code">${escapeHtml(s.code)}</span>
              <span class="sku-tagline">${escapeHtml(s.tagline)}</span>
            </div>
            <dl class="spec-table">${rows}</dl>
            <div class="sku-foot">
              <span class="muted">Lead time <strong>${escapeHtml(s.lead)}</strong></span>
              <a class="rfq-link" href="/about#contact">RFQ &rarr;</a>
            </div>
          </div>
        </article>`;
}

function renderSection(sec: Section) {
  return `
      <section id="${sec.id}" class="catalog-section">
        <header class="catalog-section-head">
          <h2>${escapeHtml(sec.title)}</h2>
          <p class="muted">${escapeHtml(sec.blurb)}</p>
        </header>
        <div class="product-grid">${sec.skus.map(renderCard).join("")}</div>
      </section>`;
}

const CATALOG_HTML = SECTIONS.map(renderSection).join("\n");

const CAT_NAV = SECTIONS.map(
  (s) => `<a class="cat-chip" href="#${s.id}">${escapeHtml(s.title)}</a>`,
).join("");

const BODY_HTML = `
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="announcement-bar" aria-label="Promotions">
      <div class="announcement-inner">
        <a href="/about#contact">RFQ response within one business day</a>
        <span class="muted" aria-hidden="true">|</span>
        <a href="/">Back to home</a>
      </div>
    </div>

    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="/"><img src="/brand/seraya-lockup-compact.svg" alt="Seraya Systems Integration" /></a>
        <nav class="main-nav" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/works" aria-current="page">Systems</a>
          <a href="/case-study">Programs</a>
          <a href="/about">Company</a>
          <a href="/about#contact">Contact</a>
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="btnSearch" aria-label="Open search">Search</button>
          <a class="icon-btn header-rfq-link" href="/about#contact" aria-label="Start an RFQ">RFQ</a>
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
          <a href="/">Home</a>
          <a href="/works">Systems</a>
          <a href="/case-study">Programs</a>
          <a href="/about">Company</a>
          <a href="/about#contact">Contact</a>
        </nav>
      </div>
    </div>

    <div class="overlay-panel" id="searchPanel" hidden role="dialog" aria-modal="true" aria-label="Search">
      <div class="overlay-sheet search-sheet">
        <div class="overlay-head">
          <strong>Search</strong>
          <button type="button" class="icon-btn" id="btnCloseSearch" aria-label="Close search">X</button>
        </div>
        <label class="muted" for="q">Keyword</label>
        <input class="search-input" id="q" type="search" placeholder="SR-G780, H100, 400 GbE..." autocomplete="off" />
      </div>
    </div>

    <div class="overlay-panel" id="cartPanel" hidden role="dialog" aria-modal="true" aria-label="Quote">
      <div class="overlay-sheet cart-sheet">
        <div class="overlay-head">
          <strong>Quote request</strong>
          <button type="button" class="icon-btn" id="btnCloseCart" aria-label="Close quote panel">X</button>
        </div>
        <p class="muted">All systems are quoted per program. Email your BOM, target lead time and destination &mdash; we respond within one business day.</p>
        <p style="margin-top: 1rem"><a class="btn btn-primary" href="mailto:hello@serayasystem.com">Email RFQ</a></p>
      </div>
    </div>

    <div class="page-hero catalog-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">System catalog</span>
        <h1>Reference systems, built to your BOM.</h1>
        <p class="muted">Compute, GPU, storage, networking and workstation lines &mdash; every configuration is a starting point, tuned per program. Lead time and BOM tailored on RFQ.</p>
        <nav class="cat-nav" aria-label="Categories">${CAT_NAV}</nav>
        <div class="toolbar">
          <span class="muted">15 reference configurations &middot; BOM &amp; lead time tailored per RFQ</span>
        </div>
      </div>
    </div>

    <main id="main" class="section product-section catalog-main" style="padding-top: 1.5rem">
${CATALOG_HTML}
    </main>

    <footer class="site-footer">
      <div class="footer-bottom" style="border-top: none; margin-top: 0; padding-top: 0">
        <a class="muted" href="/">Home</a>
        <span class="muted">Seraya System Integration</span>
      </div>
    </footer>
`;

export const Route = createFileRoute("/works")({
  head: () => ({
    meta: [
      { title: "Systems catalog | Seraya System Integration" },
      {
        name: "description",
        content:
          "Reference systems across compute, GPU, storage, networking and workstation lines. Configurations tailored per RFQ.",
      },
      { property: "og:title", content: "Systems catalog | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "Compute, GPU, storage, networking and workstation reference SKUs. BOM and lead time tailored per program.",
      },
    ],
    links: [
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

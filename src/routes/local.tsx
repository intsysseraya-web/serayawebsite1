import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { CONTACT_EMAIL } from "../lib/rfq";

// 依据《SERAYA 网站改版方案 v1.0》§4.9：原首页本地线内容下沉到独立页。
//
// 2026-11 线上检查项 6 对本页的三点修正：
//   1. **清楚说明本地服务范围与预约方式** —— 之前只有「不做批量 / 不做转售 / 不走出口」
//      三条边界，没说覆盖哪里、怎么约。
//   2. **明确自带配件情况下的责任划分** —— 客户自带件如何装配、测试，保修覆盖到哪一步，
//      必须写清楚，不能含糊成「一个保修」。
//   3. **不把本地服务限制写成全公司业务限制** —— 「不做批量、不做出口」只适用于本地线，
//      公司层面的 GPU 批发与出口在 /buy 与 /purchasing 上照常进行，页内显式说明。

const BODY_HTML = `
${skipLink()}
${siteChrome("local", "Tower, laptop, trade-in...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Local</span>
        <h1>Laptops, towers, and the server under your desk.</h1>
        <p class="muted">One machine or a small room &mdash; same bench, same care. Collection and delivery in Klang Valley.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#book">Book a build</a>
          <a class="btn btn-ghost" href="#scope">Coverage &amp; limits</a>
        </div>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-labelledby="local-lines-title">
        <div class="section-head">
          <h2 id="local-lines-title">Three ways to work with us</h2>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>Quick-config towers</h3>
            <p>For when you just want a machine that works. Pick from our pre-tested parts lists &mdash; we match batches, flash the same BIOS, and hand it over ready to run.</p>
          </article>
          <article class="program-type-card">
            <h3>Bring your own parts</h3>
            <p>Send us your RAM, SSDs, or that GPU you picked up on sale. We build them into our assembly and burn-in process and hand the machine over working.</p>
          </article>
          <article class="program-type-card">
            <h3>Trade-ins</h3>
            <p>Trade in a used PC, a server, or spare drives. We wipe the data, test what is salvageable, and recycle the rest properly.</p>
          </article>
        </div>
      </section>

      <section class="section company-band" id="scope" aria-labelledby="local-scope-title">
        <div class="section-head">
          <h2 id="local-scope-title">Coverage, booking and turnaround</h2>
          <p class="muted">What this line covers, where, and how to start.</p>
        </div>
        <div class="program-control-grid">
          <article>
            <h3>Where we work</h3>
            <p>
              Klang Valley: Kuala Lumpur, Petaling Jaya, Subang Jaya, Shah Alam, Puchong and Putrajaya
              &mdash; drop-off at our bench or collection by arrangement. Outside Klang Valley, ask:
              whether we can serve you, and what it costs, is confirmed per request rather than
              promised here.
            </p>
          </article>
          <article>
            <h3>How to book</h3>
            <p>
              Use the RFQ form with the requirement type set to the local line, or email
              <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. Tell us the machine, what you
              will run on it, your rough budget and anything you already own. We reply with a slot
              and a parts list to confirm.
            </p>
          </article>
          <article>
            <h3>Turnaround</h3>
            <p>
              A quick-config build is normally handed over within a few working days of parts being
              confirmed. Builds that depend on an order, or on customer-supplied parts, start when
              the parts arrive. We state the date in writing per job &mdash; there is no site-wide
              fixed number.
            </p>
          </article>
          <article>
            <h3>Payment and warranty scope</h3>
            <p>
              Local jobs are quoted before work starts. Warranty covers our assembly and
              configuration work; manufacturer warranty on each part is passed through as it stands.
              The split is written on the job sheet.
            </p>
          </article>
        </div>
      </section>

      <section class="section" aria-labelledby="local-byo-title">
        <div class="section-head">
          <h2 id="local-byo-title">If you bring your own parts</h2>
          <p class="muted">Clear responsibility split, so there is no argument later.</p>
        </div>
        <ul class="rfq-checklist">
          <li><strong>What we do:</strong> assemble, cable, update firmware and BIOS, install the operating system driver baseline, run a burn-in and stress test, and hand over a working machine with a job sheet.</li>
          <li><strong>What we test:</strong> the machine as assembled &mdash; POST, thermal behaviour under load, memory and storage health, GPU stability. The test scope is stated on the job sheet.</li>
          <li><strong>Parts you supply:</strong> we do not warrant parts we did not supply. If a customer-supplied part is dead on arrival or fails later, we help you establish that and you pursue the manufacturer or seller. We do not absorb that cost.</li>
          <li><strong>Parts we supply:</strong> covered as stated on the job sheet, with manufacturer warranty passed through. There is no single published warranty period for local jobs.</li>
          <li><strong>Compatibility:</strong> we check the parts list before accepting the job. If parts are incompatible we tell you before we start, not after.</li>
          <li><strong>Data:</strong> if you leave drives with us, tell us whether they hold data you need. See <a href="#local-data-heading">Data on trade-in devices</a> below.</li>
        </ul>
      </section>

      <section class="section company-band" aria-labelledby="local-limits-title">
        <div class="section-head">
          <h2 id="local-limits-title">Where this line stops</h2>
          <p class="muted">
            These limits apply to the local bench only. They are not limits on Seraya's business as a
            whole &mdash; the wholesale and export lines below run separately.
          </p>
        </div>
        <ul class="rfq-checklist">
          <li><strong>No bulk lots on this line</strong> &mdash; local work is one machine to a small room. Bulk GPU purchasing and selling are handled on <a href="/purchasing">Sell GPU lots</a> and <a href="/buy">GPU wholesale</a>.</li>
          <li><strong>No resale</strong> &mdash; we build and hand over; we do not resell units on.</li>
          <li><strong>No cross-border shipping from this line</strong> &mdash; local delivery only. Cross-border supply is a separate, fully supported line: see <a href="/buy">GPU wholesale</a> and <a href="/systems">Systems</a>.</li>
          <li><strong>Not a repair shop for third-party builds</strong> &mdash; we can take on a machine we built, or one we are rebuilding from a supplied parts list. Diagnostics on an unrelated third-party machine are quoted per job if we accept them at all.</li>
        </ul>
      </section>

      <section class="section" id="local-data-title" aria-labelledby="local-data-heading">
        <div class="section-head">
          <h2 id="local-data-heading">Data on trade-in devices</h2>
          <p>Storage media received through trade-ins is wiped to a documented standard before the hardware is reused or recycled. Ask us for the current handling position in writing.</p>
        </div>
      </section>

      <section class="section program-cta" id="book" aria-labelledby="local-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Local enquiries</p>
          <h2 id="local-cta-title">Tell us what you want to build</h2>
          <p class="muted">The machine, what you will run on it, your rough budget, and anything you already own.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact?kind=gpu&amp;from=local">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/systems">Reference systems</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/local")({
  head: () => ({
    meta: [
      { title: "Local builds and trade-ins | Seraya System Integration" },
      {
        name: "description",
        content:
          "Quick-config towers, bring-your-own-parts builds and trade-ins in the Klang Valley. Coverage, booking, turnaround and the warranty split between our assembly and your parts.",
      },
      { property: "og:title", content: "Local builds and trade-ins | Seraya System Integration" },
      {
        property: "og:description",
        content: "One machine or a small room — same bench, same care.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/local" },
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
      { rel: "stylesheet", href: fixesCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

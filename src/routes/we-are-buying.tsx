import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";
import { escapeHtml, renderRfqForm } from "../lib/rfq-form";
import { SELL_RFQ_SUBJECT_TAG, abbreviation } from "../lib/rfq";
import { CONTACT_EMAIL } from "../lib/rfq";

/**
 * 收购线落地页。2026-11-13 改版：
 *   - URL `/purchasing` → `/we-are-buying`（旧 URL 由 src/server.ts 301）
 *   - 导航标签 `Sell GPUs` → `We are buying`
 *   - 内容按 `we-buy-gpus.html` 的信息结构重排：
 *     首屏主张 → 我们收购什么（分组型号 + 条件带）→ 批次流程
 *     → 随批次提交的资料 / 不收购的批次 → 条款 → 提交表单
 *   - **视觉不复刻该参考文件**，全部复用本站既有组件：
 *     `.page-hero` / `.program-fact-strip` / `.cat-chip` / `.program-flow`
 *     / `.buy-grid` / `.program-control-grid` / `.rfq-wrap` / `.program-cta`
 *
 * 保留的合规口径（不因改版放宽）：
 *   - 「12 小时决定」写明适用条件：**收到完整批次清单后的工作时段内**（吉隆坡，
 *     UTC+8，周一至周五），不扩大为「随时 12 小时」。
 *   - CIF 香港/新加坡 与转运安排**不上公开页**；公开面只说「按笔书面约定交割方式」。
 *   - 不写假库存、假案例、假法律页。
 */

const BODY_HTML = `
${skipLink()}
${siteChrome("purchasing", "H100, H200, RTX PRO 6000...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Sell GPU lots &middot; Kuala Lumpur</span>
        <h1>You&rsquo;re a GPU wholesaler? Let&rsquo;s talk.</h1>
        <p class="muted catalog-lede">
          We buy graded accelerators in bulk against confirmed downstream demand. No speculative
          positions, and no renegotiation after commitment.
        </p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#sell-form">Submit a lot</a>
          <a class="btn btn-ghost" href="#what-we-buy">What we buy</a>
        </div>
        <ul class="program-fact-strip program-fact-strip--4" aria-label="Lot facts">
          <li><strong>20+ units</strong><span>Per lot, no maximum</span></li>
          <li><strong>12 business hours</strong><span>Decision from a complete lot list</span></li>
          <li><strong>T/T or staged</strong><span>Payment route agreed per lot</span></li>
          <li><strong>Back-to-back</strong><span>Funded once a buyer is confirmed</span></li>
        </ul>
      </div>
    </div>

    <main id="main">
      <section class="section" id="what-we-buy" aria-labelledby="what-we-buy-title">
        <div class="section-head">
          <h2 id="what-we-buy-title">What we buy</h2>
          <p class="muted">Graded, tested and documented.</p>
        </div>

        <div class="buy-what">
          <div class="chip-group">
            <p class="chip-label">Gaming GPUs</p>
            <div class="chips" role="list" aria-label="Gaming GPUs we buy">
              <span class="chip" role="listitem">RTX 5090</span>
              <span class="chip" role="listitem">RTX 5080</span>
              <span class="chip" role="listitem">RTX 5070 Ti</span>
              <span class="chip" role="listitem">RTX 5070</span>
              <span class="chip" role="listitem">RTX 5060 Ti</span>
              <span class="chip" role="listitem">RTX 5060</span>
            </div>
          </div>

          <div class="chip-group">
            <p class="chip-label">Professional GPUs</p>
            <div class="chips" role="list" aria-label="Professional GPUs we buy">
              <span class="chip" role="listitem">RTX PRO 6000 Blackwell 96 GB</span>
              <span class="chip" role="listitem">RTX 6000 Ada</span>
              <span class="chip" role="listitem">L40S</span>
              <span class="chip" role="listitem">L4</span>
            </div>
          </div>

          <div class="chip-group">
            <p class="chip-label">Server components</p>
            <div class="chips" role="list" aria-label="Server components we buy">
              <span class="chip" role="listitem">H100 SXM5</span>
              <span class="chip" role="listitem">H100 NVL</span>
              <span class="chip" role="listitem">H100 PCIe</span>
              <span class="chip" role="listitem">H200</span>
              <span class="chip" role="listitem">A100 80 GB</span>
              <span class="chip" role="listitem">More server parts</span>
            </div>
          </div>

          <p class="more-line">
            <strong>More for you to propose</strong> &mdash; the list is not a limit. Send what you
            have and we answer on the same 12-hour clock.
          </p>

          <div class="condition-band">
            <span class="k">Condition we buy</span>
            <b>Brand new</b>
            <span class="or">or</span>
            <b>A-grade against a test report</b>
          </div>

          <p class="closing-line">
            A-grade lots need the test report itself &mdash; the run, not a summary.
            <strong>20 units minimum per lot, no maximum.</strong>
          </p>
        </div>
      </section>

      <section class="section" id="how" aria-labelledby="how-title">
        <div class="section-head">
          <h2 id="how-title">How a lot runs</h2>
          <p class="muted">Five steps, one decision point, one price.</p>
        </div>
        <ol class="program-flow program-flow--5">
          <li><span>01</span><h3>Spot</h3><p>You send the lot list: models, quantity per line, condition, location.</p></li>
          <li><span>02</span><h3>Confirm demand</h3><p>We check the lot against demand we can fund and place.</p></li>
          <li><span>03</span><h3>Bid</h3><p>One written price per lot, inside 12 business hours of a complete list.</p></li>
          <li><span>04</span><h3>Fund</h3><p>Back-to-back. Nothing is funded before a buyer is confirmed.</p></li>
          <li><span>05</span><h3>Ship</h3><p>Collection, acceptance check, then handover.</p></li>
        </ol>
      </section>

      <section class="section" aria-labelledby="lot-package-title">
        <div class="section-head">
          <h2 id="lot-package-title">What to send with a lot</h2>
          <p class="muted">
            A complete lot list is what the decision is made on. Missing items slow it down rather
            than disqualify it.
          </p>
        </div>
        <div class="buy-grid">
          <article class="buy-col">
            <h3>What to send</h3>
            <ul class="rfq-checklist">
              <li><strong>Unit detail</strong> &mdash; model, part number, quantity per line</li>
              <li><strong>Quantity and condition</strong> &mdash; brand new, or A-grade</li>
              <li><strong>Test report</strong> &mdash; for A-grade lots, the run itself</li>
              <li><strong>Location and title</strong> &mdash; where the goods sit, who holds title</li>
              <li><strong>Export and end-use</strong> &mdash; licence position in that jurisdiction</li>
            </ul>
          </article>
          <article class="buy-col">
            <h3>What we do not buy</h3>
            <ul class="rfq-checklist">
              <li>A-grade lots without a test report</li>
              <li>Non-functional or for-parts-only units</li>
              <li>Units with unclear title or missing export documents</li>
              <li>Stock we cannot match to confirmed downstream demand</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section company-band" aria-labelledby="terms-title">
        <div class="section-head">
          <h2 id="terms-title">Terms</h2>
          <p class="muted">
            Everything below is stated in the written reply. It is not renegotiated after the bid.
          </p>
        </div>
        <div class="program-control-grid program-control-grid--4">
          <article>
            <h3>Decision</h3>
            <p>
              Committed decision within 12 business hours of receiving the <strong>complete</strong>
              lot list. The clock runs inside our business hours (Kuala Lumpur, UTC+8, Monday to
              Friday). A list missing the model, quantity, condition, location or test data starts
              the clock when it is complete.
            </p>
          </article>
          <article>
            <h3>Payment</h3>
            <p>
              T/T in full, or deposit plus balance &mdash; the payment route is agreed in writing
              per lot.
            </p>
          </article>
          <article>
            <h3>Documents</h3>
            <p>
              Entity and KYC pack, end-user information and licence position &mdash; see
              <a href="/we-are-buying/kyc">Entity &amp; KYC pack</a>.
            </p>
          </article>
          <article>
            <h3>Funding</h3>
            <p>Back-to-back: a lot is only funded once a buyer for it is confirmed.</p>
          </article>
        </div>
      </section>

      <section class="section" id="sell-form" aria-labelledby="sell-form-title">
        <div class="section-head">
          <h2 id="sell-form-title">Submit a lot</h2>
          <p class="muted">
            Required fields are marked. If you have a lot list file, submit the form and reply to the
            confirmation with the attachment &mdash; this form does not accept uploads.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "sell", source: "/we-are-buying" }, { formId: "rfq-sell" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with the subject tag
                <code>${SELL_RFQ_SUBJECT_TAG}</code> and the lot list attached.
              </p>
            </div>
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="buying-cta-title">
        <div>
          <p class="muted">Start with the lot</p>
          <h2 id="buying-cta-title">Send the lot list</h2>
          <p class="muted">
            Unit models, quantity, condition, location, and any test or grading documentation you
            already have.
          </p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="#sell-form">Submit a lot</a>
          <a class="btn btn-ghost" href="/we-are-buying/kyc">Entity &amp; KYC pack</a>
        </div>
      </section>
    </main>

    <div class="mobile-cta-bar">
      <a class="btn btn-primary" href="#sell-form">Submit a lot</a>
    </div>

${siteFooter()}
  `;

export const Route = createFileRoute("/we-are-buying")({
  head: () => ({
    meta: [
      { title: "We are buying GPU lots | Seraya System Integration" },
      {
        name: "description",
        content:
          "We buy graded GPU lots in bulk: brand new or A-grade against a test report, 20+ units per lot, no maximum. Committed decision within 12 business hours of a complete lot list.",
      },
      { property: "og:title", content: "We are buying GPU lots | Seraya System Integration" },
      {
        property: "og:description",
        content:
          "We buy graded GPU lots in bulk against confirmed downstream demand. No speculative positions, no renegotiation after commitment.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/we-are-buying" },
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

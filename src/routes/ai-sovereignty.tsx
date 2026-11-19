import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL, CONTACT_EMAIL } from "../lib/site-chrome";
import { renderRfqForm, escapeHtml } from "../lib/rfq-form";
import { abbreviation, RFQ_SUBJECT_TAG } from "../lib/rfq";

/**
 * AI Sovereignty 页（2026-11-19 新增，导航入口：SYSTEMS ▾ → AI Sovereignty）。
 *
 * 立场：我们不做“托管 AI 服务”，做的是把 AI 部署在**客户能控制的边界内**——
 * 客户自己的机房、自己的云账户、按客户自己的数据与权限规则运行。
 *
 * 写作约束（重要，别为了卖点放宽）：
 *   - 不声称任何认证（ISO / SOC2 / 等保等），一页销售稿不能替客户拿到合规结论。
 *   - 不承诺“绝对隔离”或“数据永不外流”——边界最终取决于客户的环境与配置，
 *     这一页只描述我们怎么划边界、怎么把控制项做成可验证的。
 *   - 不写具体客户案例、不写未经验证的性能数字。
 */

const BODY_HTML = `
${skipLink()}
${siteChrome("systems", "H100, RTX PRO 6000, private inference...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">AI sovereignty &middot; Kuala Lumpur</span>
        <h1>AI that stays inside your business.</h1>
        <p class="muted catalog-lede">
          We deploy AI on infrastructure you control &mdash; your premises or your cloud account &mdash;
          scoped to the systems, data and people you authorise. Nothing is trained on your data, and
          nothing leaves the boundary you set.
        </p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="#boundary">How the boundary works</a>
        </div>
        <ul class="program-fact-strip program-fact-strip--4" aria-label="Sovereignty facts">
          <li><strong>Your infrastructure</strong><span>On-prem, or your own cloud account</span></li>
          <li><strong>Your data</strong><span>Not used for training or resale</span></li>
          <li><strong>Scoped access</strong><span>Models and agents limited to what you authorise</span></li>
          <li><strong>Exit by design</strong><span>Weights, prompts and evals stay yours</span></li>
        </ul>
      </div>
    </div>

    <main id="main">
      <section class="section" id="boundary" aria-labelledby="boundary-title">
        <div class="section-head">
          <h2 id="boundary-title">Four boundaries we set with you</h2>
          <p class="muted">
            Sovereignty is not a product you install once. It is four decisions written down,
            configured, and checked before go-live.
          </p>
        </div>
        <div class="program-control-grid program-control-grid--4">
          <article>
            <h3>Deployment boundary</h3>
            <p>
              The model runs where you decide: your rack, a colocated cage, or your own cloud
              account. We do not require a shared tenancy to operate it.
            </p>
          </article>
          <article>
            <h3>Data boundary</h3>
            <p>
              Prompts, documents, embeddings and logs stay in your storage. Your data is not used
              to train our models or a vendor's, and retention is set by you, not by us.
            </p>
          </article>
          <article>
            <h3>Access boundary</h3>
            <p>
              Agents and assistants are limited to the systems you authorise &mdash; allowlists,
              per-role scopes, and an audit trail of what was asked and what was returned.
            </p>
          </article>
          <article>
            <h3>Exit boundary</h3>
            <p>
              We hand over weights, prompt libraries, evaluation sets and runbooks. No proprietary
              control plane is required to keep running what we deploy.
            </p>
          </article>
        </div>
      </section>

      <section class="section company-band" aria-labelledby="how-title">
        <div class="section-head">
          <h2 id="how-title">How a deployment runs</h2>
          <p class="muted">Five steps, each with something you can check before the next one starts.</p>
        </div>
        <ol class="program-flow program-flow--5">
          <li><span>01</span><h3>Assess</h3><p>Workload, data classes, who must be able to reach what, and which regulation applies to the data.</p></li>
          <li><span>02</span><h3>Draw the boundary</h3><p>Placement, network paths, storage location and the permission model, written down and signed off.</p></li>
          <li><span>03</span><h3>Deploy</h3><p>Accelerators, inference stack, model serving and retrieval, installed on the agreed infrastructure.</p></li>
          <li><span>04</span><h3>Prove the controls</h3><p>Test the path: what an agent can reach, what leaves the boundary, what the audit trail records.</p></li>
          <li><span>05</span><h3>Hand over</h3><p>Runbooks, credentials, evaluation sets and an exit procedure &mdash; operated by your team.</p></li>
        </ol>
      </section>

      <section class="section" aria-labelledby="fit-title">
        <div class="section-head">
          <h2 id="fit-title">Where this fits</h2>
          <p class="muted">
            The deployment uses the same hardware and system lines we already quote &mdash; the
            difference is the boundary and the handover, not a new product.
          </p>
        </div>
        <div class="entry-grid">
          <article class="entry-card">
            <h3>Complete systems</h3>
            <p class="muted">
              Servers, workstations, storage and networking sized for the model you actually run.
            </p>
            <a class="btn btn-ghost" href="/systems">Reference systems</a>
          </article>
          <article class="entry-card">
            <h3>Accelerators</h3>
            <p class="muted">
              The GPU models and versions available for private inference, quoted per requirement.
            </p>
            <a class="btn btn-ghost" href="/gpu">GPU range</a>
          </article>
          <article class="entry-card">
            <h3>Counterparty documents</h3>
            <p class="muted">
              Entity, KYC and end-use documents for the procurement and security review.
            </p>
            <a class="btn btn-ghost" href="/we-are-buying/kyc">Entity &amp; KYC pack</a>
          </article>
        </div>
      </section>

      <section class="section company-band" aria-labelledby="limits-title">
        <div class="section-head">
          <h2 id="limits-title">What we do not claim</h2>
          <p class="muted">
            This is a deployment and handover engagement, not a hosted AI service, and not a
            certification.
          </p>
        </div>
        <div class="buy-grid">
          <article class="buy-col">
            <h3>Not claimed</h3>
            <ul class="rfq-checklist">
              <li>We do not issue compliance certifications for your environment</li>
              <li>We do not guarantee absolute isolation regardless of configuration</li>
              <li>We do not run your prompts or data through our own systems by default</li>
              <li>We do not resell your data, or train on it</li>
            </ul>
          </article>
          <article class="buy-col">
            <h3>What you get instead</h3>
            <ul class="rfq-checklist">
              <li>A written boundary document you can put in front of security review</li>
              <li>Test evidence for the controls, before handover</li>
              <li>Runbooks your own team can operate</li>
              <li>An exit procedure, agreed at the start</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section" id="request-quote" aria-labelledby="sovereignty-quote-title">
        <div class="section-head">
          <h2 id="sovereignty-quote-title">${PRIMARY_CTA_LABEL}</h2>
          <p class="muted">
            Give us the workload, where the data must live, and who needs access. Those three are
            enough to scope a deployment &mdash; the rest is confirmed in the written reply.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "sovereignty", source: "/ai-sovereignty" }, { formId: "rfq-sovereignty" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>What to include</h3>
              <ul class="rfq-checklist">
                <li>What the AI has to do, and who uses it</li>
                <li>Where the data must live &mdash; country or site</li>
                <li>Which systems the AI may reach, and who approves access</li>
                <li>Any policy, residency or security constraints you already have</li>
              </ul>
            </div>
            <div class="rfq-alt-email">
              <h3>Prefer email?</h3>
              <p class="muted">
                Write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with the subject tag
                <code>${RFQ_SUBJECT_TAG}</code> and the same details.
              </p>
            </div>
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>BOM</dt><dd>${escapeHtml(abbreviation("BOM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>ITAD</dt><dd>${escapeHtml(abbreviation("ITAD") ?? "")}</dd></div>
                <div class="glossary-item"><dt>SXM</dt><dd>${escapeHtml(abbreviation("SXM") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>

${siteFooter()}
  `;

export const Route = createFileRoute("/ai-sovereignty")({
  head: () => ({
    meta: [
      { title: "AI Sovereignty — AI deployed inside your boundary | Seraya" },
      {
        name: "description",
        content:
          "Deploy AI on infrastructure you control: your premises or your own cloud account, scoped to authorised systems and data, with no training on your data and a handover plan. Kuala Lumpur.",
      },
      { property: "og:title", content: "AI that stays inside your business | Seraya" },
      {
        property: "og:description",
        content:
          "Four boundaries — deployment, data, access and exit — agreed, configured and tested before go-live.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/ai-sovereignty" },
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

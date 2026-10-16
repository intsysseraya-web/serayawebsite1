import { createFileRoute } from "@tanstack/react-router";
import legacyCss from "../legacy-shim.css?url";
import fixesCss from "../fixes.css?url";
import { siteChrome, siteFooter, skipLink, PRIMARY_CTA_LABEL } from "../lib/site-chrome";
import { abbreviation } from "../lib/rfq";
import { escapeHtml, renderRfqForm } from "../lib/rfq-form";

// Programs 页（线上检查项 6）：
//   1. **前置客户实际拿到的交付物**：BOM 对比、替代方案、交期计划、验收记录。
//      这一组放在最前面，而不是埋在流程描述里。
//   2. **减少重复流程文案** —— 原来 program types / program controls / how a program runs
//      三块讲同一件事。保留「怎么运行」四步，其余改为交付物与边界。
//   3. 保留示例标识，不把示例包装成真实客户案例。

const BODY_HTML = `
    ${skipLink()}
${siteChrome("programs", "BOM, program, destinations...")}<div class="page-hero program-hero">
      <div class="program-hero-layout">
        <div class="program-hero-copy">
          <p class="muted eyebrow" style="margin: 0 0 0.5rem">Programs</p>
          <h1>Got a BOM? Good. Let&rsquo;s make it make sense.</h1>
          <p class="muted">Send us your parts list. We&rsquo;ll check what fits, what&rsquo;s available, what can change, and what it&rsquo;ll take to get it where it needs to go.</p>
          <div class="btn-row">
            <a class="btn btn-primary" href="/contact">Send us your RFQ</a>
            <a class="btn btn-ghost" href="#program-flow-title">How we work &darr;</a>
          </div>
          <ul class="program-fact-strip" aria-label="Program facts">
            <li><strong>1 business day</strong><span>Response to complete RFQs</span></li>
            <li><strong>Kuala Lumpur</strong><span>SEA coverage</span></li>
            <li><strong>RFQ &rarr; RMA</strong><span>Start to finish</span></li>
          </ul>
        </div>
        <aside class="program-brief" aria-label="Illustrative program brief">
          <header class="program-brief-head">
            <span class="program-brief-tag">Example program brief</span>
            <span class="program-brief-status"><span class="dot" aria-hidden="true"></span>Illustrative &mdash; not a client engagement</span>
          </header>
          <div class="program-brief-id">
            <span>SRY-PRG-2026-0142</span>
            <span class="muted">Multi-site GPU rollout</span>
          </div>
          <dl class="program-brief-rows">
            <div><dt>Requirement</dt><dd>24&times; GPU workstation, matched config</dd></div>
            <div><dt>Destinations</dt><dd>Agreed per program</dd></div>
            <div><dt>Substitutions</dt><dd>GPU tier locked &middot; chassis flexible</dd></div>
          </dl>
          <footer class="program-brief-foot">
            <span class="muted">Illustrative example &mdash; not a client engagement</span>
          </footer>
        </aside>
      </div>
    </div>

    <main id="main">
      <section class="section program-section" aria-labelledby="program-deliverables-title">
        <div class="section-head">
          <h2 id="program-deliverables-title">What you get out of a program</h2>
          <p>
            Four written deliverables. They are the reason to run a request as a program instead of
            a product quote, and they are what you can hold us to.
          </p>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>BOM comparison</h3>
            <p>
              Your parts list next to the options we can actually supply: what matches, what differs,
              what is a like-for-like substitution and what is a step down. Written, line by line.
            </p>
          </article>
          <article class="program-type-card">
            <h3>Substitution alternatives</h3>
            <p>
              For each line we cannot fill as specified, the alternatives with the trade-off named
              &mdash; performance, power, physical fit, firmware, warranty path.
            </p>
          </article>
          <article class="program-type-card">
            <h3>Lead-time plan</h3>
            <p>
              Per line: stock, dispatch, or estimated arrival, and what that estimate runs from. If we
              do not know, it says so rather than showing a date we cannot hold.
            </p>
          </article>
          <article class="program-type-card">
            <h3>Acceptance record</h3>
            <p>
              What was agreed, what was checked, and what was handed over &mdash; kept against the
              original requirement so procurement, IT and operations read the same version.
            </p>
          </article>
        </div>
      </section>

      <section class="section program-section" aria-labelledby="program-matter-title">
        <div class="section-head">
          <h2 id="program-matter-title">Procurement, minus the spreadsheet ping-pong.</h2>
          <p>Some requests need more than a product quote. Seraya structures procurement work when requirements, timing, substitutions, and ownership need to stay visible.</p>
        </div>
        <div class="program-scenarios" aria-label="Program-fit situations">
          <span>Rolling out to 3+ sites?</span>
          <span>Existing BOM needs a sanity check?</span>
          <span>GPU availability uncertain?</span>
          <span>Planning a refresh or EOL replacement?</span>
          <span>Need a clear warranty + RMA path?</span>
          <span>Procurement, IT, engineering all in the thread?</span>
        </div>
      </section>

      <section class="section program-section program-band" aria-labelledby="program-types-title">
        <div class="section-head">
          <h2 id="program-types-title">Program types</h2>
          <p>Each program starts from a concrete procurement problem and ends with documented assumptions the buyer can act on.</p>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>Staged rollout</h3>
            <p class="program-card-kicker">For phased, multi-unit, or multi-site requirements.</p>
            <p>We coordinate the waves, destination needs, configuration consistency, and acceptance notes.</p>
          </article>
          <article class="program-type-card">
            <h3>BOM review and alignment</h3>
            <p class="program-card-kicker">For teams with an existing parts list or preferred stack.</p>
            <p>Compatibility, availability, substitutions, firmware, warranty limits, and lead-time risk are made explicit.</p>
          </article>
          <article class="program-type-card">
            <h3>Availability sourcing</h3>
            <p class="program-card-kicker">For constrained GPU, server, storage, or networking requests.</p>
            <p>Options are compared across sourcing route, lead time, warranty path, and acceptable substitutions.</p>
          </article>
          <article class="program-type-card">
            <h3>Lifecycle supply planning</h3>
            <p class="program-card-kicker">For expansion, refresh, EOL replacement, and repeat procurement.</p>
            <p>Seraya tracks continuity requirements so the next batch remains supportable and maintainable.</p>
          </article>
          <article class="program-type-card">
            <h3>Warranty and RMA coordination</h3>
            <p class="program-card-kicker">For support paths tied to a sourced program.</p>
            <p>Serials, sourcing assumptions, RMA route, and contact path stay connected to the original requirement.</p>
          </article>
          <article class="program-type-card">
            <h3>Validation and handoff support</h3>
            <p class="program-card-kicker">For IT, engineering, and procurement teams sharing ownership.</p>
            <p>Configuration assumptions, acceptance criteria, and handoff documentation are prepared before delivery.</p>
          </article>
        </div>
      </section>

      <section class="section program-section" aria-labelledby="program-flow-title">
        <div class="section-head">
          <h2 id="program-flow-title">How a program runs</h2>
          <p>The workflow is deliberately simple: make requirements clear, compare practical options, document tradeoffs, then coordinate delivery and support.</p>
        </div>
        <ol class="program-flow">
          <li>
            <span>01</span>
            <h3>Send us the requirement</h3>
            <p>Give us the quantity, workload, destination, target date, preferred brands, constraints, and your current BOM if you have one.</p>
          </li>
          <li>
            <span>02</span>
            <h3>We compare the options</h3>
            <p>We look at availability, pricing assumptions, lead time, warranty path, and what could be substituted.</p>
          </li>
          <li>
            <span>03</span>
            <h3>We align the configuration</h3>
            <p>Compatibility, firmware, validation scope, and deployment assumptions get reviewed together.</p>
          </li>
          <li>
            <span>04</span>
            <h3>We coordinate delivery and support</h3>
            <p>Delivery notes, acceptance criteria, handoff documents, and the RMA path stay tied to the program.</p>
          </li>
        </ol>
      </section>

      <section class="section program-section program-band" aria-labelledby="program-controls-title">
        <div class="section-head">
          <h2 id="program-controls-title">What we control, and what we do not</h2>
          <p>Stated up front so the deliverables above are read for what they are.</p>
        </div>
        <div class="program-control-grid">
          <article>
            <h3>We control</h3>
            <p>Option comparison, substitution proposals, the written assumptions, and keeping one thread from intake to handover.</p>
          </article>
          <article>
            <h3>We do not control</h3>
            <p>Allocation decisions upstream, carrier schedules, and destination customs. Where these move, we say so and re-state the plan rather than absorbing it silently.</p>
          </article>
          <article>
            <h3>What we will not do</h3>
            <p>We do not publish case studies for work that has not happened, and we do not put a lead-time or warranty number on this page that is not tied to a specific order.</p>
          </article>
          <article>
            <h3>What we need from you</h3>
            <p>The requirement, the destination, the target date, the constraints that cannot move, and who signs off the configuration.</p>
          </article>
        </div>
      </section>

      <section class="section program-section" aria-labelledby="program-examples-title">
        <div class="section-head">
          <h2 id="program-examples-title">Example scenarios</h2>
          <p>Illustrative examples &mdash; not client engagements. Real programs are scoped from your RFQ.</p>
        </div>
        <div class="program-card-grid program-example-grid">
          <article class="program-type-card">
            <h3>Multi-site GPU workstation sourcing</h3>
            <dl>
              <dt>Need</dt>
              <dd>Matched workstation configurations across rollout waves.</dd>
              <dt>Seraya role</dt>
              <dd>Compare GPU, chassis, storage, and warranty options while preserving workload constraints.</dd>
              <dt>Output</dt>
              <dd>Program BOM, substitution notes, delivery assumptions, and handoff record.</dd>
            </dl>
          </article>
          <article class="program-type-card">
            <h3>Storage expansion and replacement supply</h3>
            <dl>
              <dt>Need</dt>
              <dd>Expand capacity while managing continuity and EOL risk.</dd>
              <dt>Seraya role</dt>
              <dd>Review compatible options, lead times, and lifecycle risk before purchase.</dd>
              <dt>Output</dt>
              <dd>Comparable sourcing options and a documented refresh path.</dd>
            </dl>
          </article>
          <article class="program-type-card">
            <h3>Integration lab and handoff support</h3>
            <dl>
              <dt>Need</dt>
              <dd>Procurement, IT, and engineering need a shared acceptance record.</dd>
              <dt>Seraya role</dt>
              <dd>Document configuration assumptions, validation scope, and support handoff.</dd>
              <dt>Output</dt>
              <dd>Clear acceptance notes and an RMA path tied to the original RFQ.</dd>
            </dl>
          </article>
        </div>
      </section>

      <section class="section program-section program-band" aria-labelledby="private-deployment-title">
        <div class="section-head">
          <h2 id="private-deployment-title">Private deployment</h2>
          <p>Need dedicated compute for a team, site or workload? We&rsquo;ll scope the hardware, where it lives, how it gets installed and what handover looks like. No mystery boxes. No vague promises. Just a setup that&rsquo;s clear before anyone starts plugging things in.</p>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>Built around your workload</h3>
            <p>Hardware selected to meet the requirements we agree on.</p>
          </article>
          <article class="program-type-card">
            <h3>Pick the spot</h3>
            <p>Your premises or a facility you choose. We&rsquo;ll review site, power and cooling requirements before deployment.</p>
          </article>
          <article class="program-type-card">
            <h3>Your data. Your rules.</h3>
            <p>Data flows, remote access and support access are agreed and documented before deployment.</p>
          </article>
          <article class="program-type-card">
            <h3>Installed. Checked. Handed over.</h3>
            <p>Installation and testing follow the agreed scope. You get the handover documents and know who to contact for support.</p>
          </article>
        </div>
        <p class="muted program-deploy-note">Ownership, data handling and ongoing support are defined in the project scope.</p>
      </section>

      <section class="section program-section" id="request-quote" aria-labelledby="program-rfq-title">
        <div class="section-head">
          <h2 id="program-rfq-title">Send the requirement</h2>
          <p>
            Product or requirement, quantity and delivery destination are required. The BOM itself is
            optional here &mdash; paste what you have, or say you will send it by reply.
          </p>
        </div>
        <div class="rfq-wrap">
${renderRfqForm({ path: "system", source: "/programs" }, { formId: "rfq-programs" })}
          <aside class="rfq-side">
            <div class="rfq-alt-email">
              <h3>Abbreviations</h3>
              <div class="glossary">
                <div class="glossary-item"><dt>BOM</dt><dd>${escapeHtml(abbreviation("BOM") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RFQ</dt><dd>${escapeHtml(abbreviation("RFQ") ?? "")}</dd></div>
                <div class="glossary-item"><dt>RMA</dt><dd>${escapeHtml(abbreviation("RMA") ?? "")}</dd></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="program-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Start with the requirement</p>
          <h2 id="program-cta-title">Send us your next BOM</h2>
          <p class="muted">Send the parts list, workload, target date, and constraints. We respond to complete RFQs within one business day.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="#request-quote">${PRIMARY_CTA_LABEL}</a>
          <a class="btn btn-ghost" href="/systems">View reference systems</a>
        </div>
      </section>
    </main>

    ${siteFooter()}
`;

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "BOM review and sourcing programs | Seraya System Integration" },
      {
        name: "description",
        content:
          "We review your BOM, compare sourcing options, and keep substitutions, lead-time risk and the warranty path in one place. Response to complete RFQs within one business day.",
      },
      {
        property: "og:title",
        content: "BOM review and sourcing programs | Seraya System Integration",
      },
      {
        property: "og:description",
        content:
          "Send us your parts list. We'll check what fits, what's available, what can change, and what it takes to get it where it needs to go.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://seraya.systems/programs" },
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

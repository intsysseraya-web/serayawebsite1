import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

const BODY_HTML = `
    ${skipLink()}
${siteChrome("home", "H100, BOM, storage...")}<main id="main">
      <section class="hero" aria-labelledby="hero-title hero-subtitle">
        
                <div class="hero-inner">
          <p class="hero-kicker">Kuala Lumpur &middot; Enterprise compute sourcing</p>
          <h1 id="hero-title">We source, validate and deliver compute &mdash; and we buy GPUs in bulk.</h1>
          <p id="hero-subtitle" class="hero-subtitle">
            Two ways to work with us. Enterprise teams send a BOM; suppliers send a lot list.
          </p>
          <p>Both get documented assumptions, a named owner, and a date we hold to.</p>
          <div class="btn-row">
            <a class="btn btn-primary" href="/contact">Start an enterprise RFQ</a>
            <a class="btn btn-ghost" href="/purchasing">Offer us a GPU lot</a>
          </div>
        </div>

                </section>

      <section class="section" aria-labelledby="routes-title">
        <div class="section-head">
          <h2 id="routes-title">Two ways to work with us</h2>
        </div>
        <div class="company-grid">
          <article class="company-card">
            <p class="program-card-kicker">Enterprise procurement</p>
            <h3>Send the BOM. Get a structured program back.</h3>
            <ul class="rfq-checklist">
              <li>Servers, GPU nodes, storage, networking, workstations</li>
              <li>Availability, substitutions and lead-time risk made explicit</li>
              <li>Acceptance notes and a warranty / RMA path tied to the program</li>
            </ul>
            <a class="btn btn-primary" href="/contact">Start an enterprise RFQ</a>
          </article>
          <article class="company-card">
            <p class="program-card-kicker">Bulk GPU purchasing</p>
            <h3>Send your lot list. Get a committed decision.</h3>
            <ul class="rfq-checklist">
              <li>Graded, fully tested units &mdash; 20+ per lot, no maximum</li>
              <li>Datacenter and professional accelerators, plus gaming tiers</li>
              <li>Decision within 12 hours; we do not renegotiate after commitment</li>
            </ul>
            <a class="btn btn-primary" href="/purchasing">Offer us a GPU lot</a>
          </article>
        </div>
      </section>

      <section class="section product-section" aria-labelledby="built-title">
        <div class="section-head">
          <h2 id="built-title">How we work</h2>
        </div>
                <ol class="flow-line">
          <li><span class="flow-dot">1</span><span class="flow-label">Intake</span></li>
          <li><span class="flow-dot">2</span><span class="flow-label">Source &amp; compare</span></li>
          <li><span class="flow-dot">3</span><span class="flow-label">Align</span></li>
          <li><span class="flow-dot">4</span><span class="flow-label">Deliver &amp; support</span></li>
        </ol>
      </section>


      <section class="section values" aria-labelledby="evidence-title">
        <div class="section-head">
          <h2 id="evidence-title">What we can evidence</h2>
        </div>
        <div class="evidence-strip">
          <ul>
            <li><strong>Entity &amp; KYC pack</strong><span>Registration, tax identification and documents, released per counterparty.</span></li>
            <li><strong>Grading &amp; test reports</strong><span>Condition and test documentation for the units we buy or supply.</span></li>
            <li><strong>Acceptance records</strong><span>What was agreed, checked and handed over, kept on record.</span></li>
            <li><strong>Export &amp; end-use</strong><span>Licence position and end-user information stated before shipment.</span></li>
          </ul>
        </div>
      </section>

      <section class="section" aria-label="Get started">
        <div class="start-grid">
          <article class="start-card">
            <h3>Local builds &amp; trade-ins</h3>
            <a class="btn btn-ghost" href="/local">Local builds &amp; trade-ins</a>
          </article>
          <article class="start-card">
            <h3>Ready to start an RFQ?</h3>
            <p>Email the BOM, workload, and target lead time &mdash; we respond with sourcing assumptions and next steps.</p>
            <a class="btn btn-primary" href="mailto:felix.mm@seraya.systems">Email RFQ</a>
          </article>
        </div>
      </section>
    </main>

    ${siteFooter()}
  `;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seraya System Integration | Kuala Lumpur system integrator" },
      { name: "description", content: "Kuala Lumpur sourcing and system integration for compute infrastructure. We supply reference compute configurations and buy graded GPUs in bulk for confirmed demand." },
      {
        property: "og:title",
        content: "Seraya System Integration | Kuala Lumpur system integrator",
      },
      { property: "og:description", content: "We source, validate and deliver compute - and we buy GPUs in bulk." },
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
    // Hero style toggle: /?hero=plain disables the animated background
    // and restores the original whitespace-only hero for A/B comparison.
    try {
      const params = new URLSearchParams(window.location.search);
      const style = params.get("hero") === "plain" ? "plain" : "animated";
      const hero = document.querySelector(".hero");
      if (hero) hero.setAttribute("data-hero-style", style);
    } catch {
      // Ignore malformed query strings and keep the default animated hero.
    }

    const s = document.createElement("script");
    s.src = "/legacy/script.js";
    s.async = false;
    document.body.appendChild(s);

    // Hero 动效粒子网络（原本的装饰）。CY 2026-10-12 指示「只换回背景装饰」，
    // 故恢复本注入；静态网格装饰 .hero::after 已移除。
    // 该脚本自身处理 prefers-reduced-motion（只画单帧）与离屏/切 tab 暂停。
    const bg = document.createElement("script");
    bg.src = "/legacy/hero-bg.js";
    bg.async = false;
    document.body.appendChild(bg);

    return () => {
      s.remove();
      bg.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}
